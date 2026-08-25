/* Procedural planetary surface shaders — no external texture assets required. */

export const NOISE_GLSL = /* glsl */ `
vec3 hash3(vec3 p){
  p = vec3(dot(p,vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6)));
  return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}
float snoise(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p);
  vec3 u = f*f*(3.0-2.0*f);
  return mix(mix(mix(dot(hash3(i+vec3(0,0,0)), f-vec3(0,0,0)),
                     dot(hash3(i+vec3(1,0,0)), f-vec3(1,0,0)), u.x),
                 mix(dot(hash3(i+vec3(0,1,0)), f-vec3(0,1,0)),
                     dot(hash3(i+vec3(1,1,0)), f-vec3(1,1,0)), u.x), u.y),
             mix(mix(dot(hash3(i+vec3(0,0,1)), f-vec3(0,0,1)),
                     dot(hash3(i+vec3(1,0,1)), f-vec3(1,0,1)), u.x),
                 mix(dot(hash3(i+vec3(0,1,1)), f-vec3(0,1,1)),
                     dot(hash3(i+vec3(1,1,1)), f-vec3(1,1,1)), u.x), u.y), u.z);
}
float fbm(vec3 p, int oct){
  float a = 0.5; float s = 0.0; float n = 0.0;
  for(int i=0;i<8;i++){
    if(i>=oct) break;
    s += a * snoise(p); n += a; p *= 2.03; a *= 0.5;
  }
  return s / max(n, 0.0001);
}
float ridge(vec3 p, int oct){
  float a = 0.5; float s = 0.0; float n = 0.0;
  for(int i=0;i<8;i++){
    if(i>=oct) break;
    s += a * (1.0 - abs(snoise(p))); n += a; p *= 2.11; a *= 0.5;
  }
  return s / max(n, 0.0001);
}
`;

export const SURFACE_VERT = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vWorld;
void main(){
  vPos = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const SURFACE_FRAG = /* glsl */ `
precision highp float;
${NOISE_GLSL}
uniform vec3 uLow;
uniform vec3 uMid;
uniform vec3 uHigh;
uniform float uIce;
uniform float uRough;
uniform float uTime;
uniform float uDetail;
uniform vec3 uLightDir;
uniform float uElevation;   // 0..1 elevation overlay
uniform float uGeology;     // 0..1 geology overlay
uniform float uLightMode;   // 0 = sun, 1 = studio, 2 = terminator
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vWorld;

vec3 heat(float t){
  vec3 c1 = vec3(0.02,0.05,0.18);
  vec3 c2 = vec3(0.10,0.55,0.85);
  vec3 c3 = vec3(0.50,0.95,0.75);
  vec3 c4 = vec3(0.96,0.77,0.26);
  vec3 c5 = vec3(1.00,0.35,0.37);
  if(t<0.25) return mix(c1,c2,t/0.25);
  if(t<0.5) return mix(c2,c3,(t-0.25)/0.25);
  if(t<0.75) return mix(c3,c4,(t-0.5)/0.25);
  return mix(c4,c5,(t-0.75)/0.25);
}

void main(){
  vec3 p = normalize(vPos);
  float continents = fbm(p * (1.6 + uDetail), 6);
  float detail = ridge(p * (6.0 + uDetail * 3.0), 5);
  float h = continents * 0.72 + detail * 0.28;
  h = clamp(h * 0.5 + 0.5, 0.0, 1.0);

  vec3 col;
  float sea = 0.5 - uRough * 0.12;
  if(h < sea){
    col = mix(uLow * 0.65, uLow, smoothstep(0.0, sea, h));
  } else {
    float t = smoothstep(sea, 1.0, h);
    col = mix(uMid, uHigh, pow(t, 0.85));
  }

  // polar caps
  float lat = abs(p.y);
  float cap = smoothstep(0.72 - uIce * 0.45, 0.92 - uIce * 0.45, lat + fbm(p*7.0,3)*0.06);
  col = mix(col, vec3(0.94,0.97,1.0), cap * clamp(uIce * 1.4, 0.0, 1.0));

  // fracture lineae for ice worlds
  float lin = smoothstep(0.86, 0.99, ridge(p * vec3(3.0, 9.0, 3.0), 4));
  col = mix(col, mix(col, vec3(0.45,0.3,0.22), 0.7), lin * uIce * 0.75);

  // overlays
  if(uElevation > 0.001){
    col = mix(col, heat(h), uElevation);
  }
  if(uGeology > 0.001){
    float g = fbm(p * 3.4 + 11.0, 4) * 0.5 + 0.5;
    vec3 geo = mix(vec3(0.25,0.35,0.55), vec3(0.95,0.55,0.25), step(0.5, g));
    geo = mix(geo, vec3(0.55,0.9,0.65), step(0.72, g));
    col = mix(col, geo, uGeology * 0.7);
  }

  // shading — derive normal perturbation from height field
  float e = 0.015;
  float hx = fbm((p + vec3(e,0.0,0.0)) * (1.6 + uDetail), 5);
  float hy = fbm((p + vec3(0.0,e,0.0)) * (1.6 + uDetail), 5);
  vec3 n = normalize(vNormal + vec3(hx - continents, hy - continents, 0.0) * uRough * 2.2);

  vec3 L = normalize(uLightDir);
  float ndl = dot(n, L);
  float lambert = max(ndl, 0.0);
  float wrap = clamp((ndl + 0.35) / 1.35, 0.0, 1.0);
  float diff = mix(lambert, wrap, 0.35);

  float ambient = uLightMode > 1.5 ? 0.22 : (uLightMode > 0.5 ? 0.5 : 0.24);
  float gain = uLightMode > 1.5 ? 1.35 : 1.0;
  vec3 lit = col * (ambient + diff * 1.25 * gain);

  // specular sheen on smooth/ocean areas
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(n, H), 0.0), 48.0) * (1.0 - uRough) * step(h, sea + 0.02);
  lit += vec3(0.55,0.75,0.95) * spec * 0.9;

  // limb darkening / rim light
  float rim = pow(1.0 - max(dot(normalize(vNormal), V), 0.0), 3.0);
  lit += uHigh * rim * 0.10;

  gl_FragColor = vec4(lit, 1.0);
}
`;

export const CLOUD_FRAG = /* glsl */ `
precision highp float;
${NOISE_GLSL}
uniform float uTime;
uniform float uDensity;
uniform vec3 uColor;
uniform vec3 uLightDir;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vWorld;
void main(){
  vec3 p = normalize(vPos);
  vec3 q = p * 2.4 + vec3(uTime * 0.012, 0.0, uTime * 0.006);
  float c = fbm(q, 6) * 0.5 + 0.5;
  float bands = 0.5 + 0.5 * sin(p.y * 12.0 + fbm(q * 1.4, 3) * 4.0);
  c = mix(c, c * 0.55 + bands * 0.45, 0.35);
  float a = smoothstep(0.52, 0.86, c) * uDensity;
  float diff = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  vec3 col = uColor * (0.18 + diff * 1.1);
  gl_FragColor = vec4(col, a);
}
`;

export const ATMO_VERT = SURFACE_VERT;

export const ATMO_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uIntensity;
uniform vec3 uLightDir;
varying vec3 vNormal;
varying vec3 vWorld;
void main(){
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir);
  // two-lobe fresnel: tight rim for the terminator edge, broad haze for the limb
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.4);
  float rim = pow(1.0 - abs(dot(N, V)), 3.4);
  float lit = clamp(dot(N, L) * 0.5 + 0.55, 0.0, 1.0);
  float day = smoothstep(0.15, 0.65, dot(N, L));
  vec3 scatter = mix(uColor * 0.55, uColor, 0.3 + 0.7 * day);
  gl_FragColor = vec4(scatter, (fres * 0.6 + rim * 0.4) * uIntensity * lit);
}
`;
