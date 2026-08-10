import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* Compact procedural noise shared by all effect shaders. */
const GLSL_NOISE = /* glsl */ `
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
`;

/**
 * Depth-graded Milky Way background. A huge back-facing dome whose shader
 * concentrates soft nebula colour and star-speckle into a tilted galactic band.
 */
export function MilkyWay({ radius = 260 }: { radius?: number }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh rotation={[0.35, 0.6, 0.95]} scale={radius}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        vertexShader={
          /* glsl */ `
          varying vec3 vWorld;
          void main(){
            vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
          }
        `
        }
        fragmentShader={
          /* glsl */ `
          precision highp float;
          ${GLSL_NOISE}
          uniform float uTime;
          varying vec3 vWorld;
          void main(){
            vec3 dir = normalize(vWorld);
            float warp = snoise(dir * 0.8) * 0.16;
            float band = exp(-pow(abs(dir.y - warp) * 2.6, 2.0));
            float neb = fbm(dir * 2.2, 5) * 0.5 + 0.5;
            float star = step(0.996, snoise(dir * 160.0 + uTime * 0.5));
            float bright = step(0.992, snoise(dir * 60.0));
            vec3 tint = mix(vec3(0.16, 0.2, 0.34), vec3(0.5, 0.32, 0.42), neb);
            vec3 col = tint * band;
            col += vec3(0.95, 0.92, 1.0) * (star * band) * 0.9;
            col += vec3(0.8, 0.85, 1.0) * bright * band * 0.35;
            gl_FragColor = vec4(col, band * 0.5);
          }
        `
        }
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/**
 * Instanced asteroid belt between Mars and Jupiter: thousands of tumbling
 * rock fragments plus a faint dust ring.
 */
export function AsteroidBelt({ count = 1500 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      const r = 20.1 + Math.random() * 2.8;
      const a = Math.random() * Math.PI * 2;
      dummy.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 0.9, Math.sin(a) * r);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const s = 0.1 + Math.random() * 0.34;
      dummy.scale.set(s, s * (0.7 + Math.random() * 0.6), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, dummy]);

  const dust = useMemo(() => {
    const n = 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 20 + Math.random() * 3;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    return pos;
  }, []);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.05) * 0.012;
  });

  return (
    <group>
      <instancedMesh
        ref={ref}
        args={
          [undefined, undefined, count] as unknown as [THREE.BufferGeometry, THREE.Material, number]
        }
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#9c8d7c" roughness={1} metalness={0.15} />
      </instancedMesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#b9ac9c"
          size={0.12}
          transparent
          opacity={0.4}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/**
 * Living Sun: animated granulation surface, a flickering corona shell and
 * orbiting flare particles. Replaces the static billboard sun.
 */
export function LivingSun() {
  const core = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }, dt) => {
    uniforms.uTime.value += Math.min(dt, 0.05);
    if (core.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 0.8) * 0.015;
      core.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[2.2, 64, 32]} />
        <shaderMaterial
          vertexShader={
            /* glsl */ `
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
          `
          }
          fragmentShader={
            /* glsl */ `
            precision highp float;
            ${GLSL_NOISE}
            uniform float uTime;
            varying vec3 vPos;
            varying vec3 vNormal;
            varying vec3 vWorld;
            void main(){
              vec3 p = normalize(vPos);
              float g = fbm(p * 3.5 + vec3(0.0, uTime * 0.02, 0.0), 6) * 0.5 + 0.5;
              float cell = fbm(p * 12.0 - vec3(uTime * 0.05, 0.0, 0.0), 4) * 0.5 + 0.5;
              float hot = smoothstep(0.62, 0.95, g);
              vec3 c1 = vec3(1.0, 0.38, 0.05);
              vec3 c2 = vec3(1.0, 0.72, 0.28);
              vec3 c3 = vec3(1.0, 0.98, 0.86);
              vec3 col = mix(mix(c1, c2, g), c3, hot);
              col *= 0.75 + cell * 0.5;
              gl_FragColor = vec4(col, 1.0);
            }
          `
          }
          uniforms={uniforms}
        />
      </mesh>

      <mesh scale={3.6}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial
          vertexShader={
            /* glsl */ `
            varying vec3 vNormal;
            varying vec3 vView;
            varying vec3 vWorld;
            void main(){
              vNormal = normalize(normalMatrix * normal);
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vView = mv.xyz;
              vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
              gl_Position = projectionMatrix * mv;
            }
          `
          }
          fragmentShader={
            /* glsl */ `
            precision highp float;
            ${GLSL_NOISE}
            uniform float uTime;
            varying vec3 vNormal;
            varying vec3 vView;
            varying vec3 vWorld;
            void main(){
              vec3 V = normalize(-vView);
              float fres = pow(1.0 - abs(dot(normalize(vNormal), V)), 2.4);
              float flick = 0.55 + 0.45 * snoise(vWorld * 0.55 + uTime * 0.4);
              vec3 col = mix(vec3(1.0, 0.45, 0.1), vec3(1.0, 0.85, 0.5), flick);
              gl_FragColor = vec4(col, fres * flick * 0.75);
            }
          `
          }
          uniforms={uniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <SunFlares />
      <pointLight intensity={400} distance={120} color="#fff0d4" />
    </group>
  );
}

function SunFlares({ count = 60 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const radius = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * 1.5;
      base[i * 3] = Math.cos(th) * Math.cos(ph);
      base[i * 3 + 1] = Math.sin(ph);
      base[i * 3 + 2] = Math.sin(th) * Math.cos(ph);
      phase[i] = Math.random() * Math.PI * 2;
      speed[i] = 0.4 + Math.random();
      radius[i] = 2.6 + Math.random() * 1.7;
      size[i] = 0.7 + Math.random() * 1.1;
      pos[i * 3] = base[i * 3]! * radius[i]!;
      pos[i * 3 + 1] = base[i * 3 + 1]! * radius[i]!;
      pos[i * 3 + 2] = base[i * 3 + 2]! * radius[i]!;
    }
    return { pos, base, phase, speed, radius, size };
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const { pos, base, phase, speed, radius } = data;
    for (let i = 0; i < count; i++) {
      const wobble = 1 + Math.sin(t * speed[i]! + phase[i]!) * 0.14;
      const rad = radius[i]! * wobble;
      pos[i * 3] = base[i * 3]! * rad;
      pos[i * 3 + 1] = base[i * 3 + 1]! * rad;
      pos[i * 3 + 2] = base[i * 3 + 2]! * rad;
    }
    const attr = ref.current?.geometry.attributes["position"];
    if (attr) attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-size" args={[data.size, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={
          /* glsl */ `
          attribute float size;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (42.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `
        }
        fragmentShader={
          /* glsl */ `
          void main(){
            float d = length(gl_PointCoord - vec2(0.5));
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(vec3(1.0, 0.75, 0.4), a * a);
          }
        `
        }
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface Meteor {
  line: THREE.Line;
  active: boolean;
  t: number;
  dur: number;
  start: THREE.Vector3;
  dir: THREE.Vector3;
}

/** Occasional meteor streaks — accelerating lines that flash across the sky. */
export function ShootingStars({ count = 4 }: { count?: number }) {
  const meteors = useMemo(() => {
    const list: Meteor[] = [];
    const segments = 10;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segments * 3), 3));
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(segments * 3), 3));
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      list.push({
        line: new THREE.Line(geo, mat),
        active: false,
        t: 0,
        dur: 1.1,
        start: new THREE.Vector3(),
        dir: new THREE.Vector3(),
      });
    }
    return list;
  }, [count]);

  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05);
    for (const m of meteors) {
      if (!m.active) {
        const r = 55 + Math.random() * 55;
        const theta = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * 30;
        m.start.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
        m.dir
          .set(
            Math.cos(theta + Math.PI / 2 + (Math.random() - 0.5) * 0.8),
            (Math.random() - 0.5) * 0.7,
            Math.sin(theta + Math.PI / 2 + (Math.random() - 0.5) * 0.8),
          )
          .normalize();
        m.active = true;
        m.t = 0;
        m.dur = 0.7 + Math.random() * 1.1;
        continue;
      }
      m.t += t;
      if (m.t > m.dur) {
        m.active = false;
        continue;
      }
      const head = m.start.clone().addScaledVector(m.dir, m.t * 95);
      const pos = m.line.geometry.attributes["position"] as THREE.BufferAttribute;
      const col = m.line.geometry.attributes["color"] as THREE.BufferAttribute;
      for (let k = 0; k < pos.count; k++) {
        const f = k / pos.count;
        const p = head.clone().addScaledVector(m.dir, -f * 30);
        pos.setXYZ(k, p.x, p.y, p.z);
        const b = (1 - f) * (0.4 + m.t * 1.2);
        col.setXYZ(k, b, b, 1);
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
    }
  });

  return (
    <group>
      {meteors.map((m) => (
        <primitive key={m.line.uuid} object={m.line} />
      ))}
    </group>
  );
}

/**
 * A comet on a wide elliptical orbit with a soft tail that always streams
 * away from the Sun, plus a faint orbit path.
 */
export function Comet() {
  const group = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const theta = useRef(Math.random() * Math.PI * 2);
  const a = 17;
  const e = 0.66;
  const p = a * (1 - e * e);

  const orbitPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 180; i++) {
      const th = (i / 180) * Math.PI * 2;
      const r = p / (1 + e * Math.cos(th));
      pts.push(
        new THREE.Vector3(Math.cos(th) * r, Math.sin(th * 2) * 1.6, Math.sin(th) * r * 1.35),
      );
    }
    return pts;
  }, [e, p]);

  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05);
    theta.current += t * 0.055;
    const th = theta.current;
    const r = p / (1 + e * Math.cos(th));
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r * 1.35;
    const y = Math.sin(th * 2) * 1.6;
    if (group.current) group.current.position.set(x, y, z);
    if (tail.current) {
      const away = new THREE.Vector3(x, y, z).normalize().negate();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), away);
      tail.current.quaternion.copy(quat);
    }
  });

  const tailGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.85, 11, 14, 1, true);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);

  return (
    <group>
      <primitive
        object={
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(orbitPoints),
            new THREE.LineBasicMaterial({ color: "#8fb8ff", transparent: true, opacity: 0.18 }),
          )
        }
      />
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#cfe4ff" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.5, 12, 12]} />
          <meshBasicMaterial
            color="#9fc8ff"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={tail} position={[0, 0, 5.5]} geometry={tailGeo}>
          <shaderMaterial
            vertexShader={
              /* glsl */ `
              varying vec3 vLocal;
              void main(){
                vLocal = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `
            }
            fragmentShader={
              /* glsl */ `
              varying vec3 vLocal;
              void main(){
                float s = clamp(vLocal.z / 5.5 + 0.5, 0.0, 1.0);
                float a = pow(1.0 - s, 1.8);
                gl_FragColor = vec4(vec3(0.55, 0.72, 1.0), a * 0.65);
              }
            `
            }
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Procedural planetary ring system with the classic band structure: faint
 * C ring, bright B ring, the dark Cassini division and the A ring. Renders
 * as a shader on a flat ring so it needs no texture assets.
 */
export function RingSystem({ inner = 1.24, outer = 2.28 }: { inner?: number; outer?: number }) {
  const uniforms = useMemo(
    () => ({
      uInner: { value: inner },
      uOuter: { value: outer },
      uSunDir: { value: new THREE.Vector3(1, 0.35, 0.6).normalize() },
    }),
    [inner, outer],
  );

  return (
    <mesh>
      <ringGeometry args={[inner, outer, 224, 1]} />
      <shaderMaterial
        vertexShader={
          /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vWorld;
          varying float vRad;
          void main(){
            vRad = length(position.xy);
            vNormal = normalize(normalMatrix * normal);
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorld = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `
        }
        fragmentShader={
          /* glsl */ `
          precision highp float;
          ${GLSL_NOISE}
          uniform float uInner;
          uniform float uOuter;
          uniform vec3 uSunDir;
          varying vec3 vNormal;
          varying vec3 vWorld;
          varying float vRad;
          void main(){
            float t = clamp((vRad - uInner) / (uOuter - uInner), 0.0, 1.0);
            float a = 0.0;
            a += mix(0.3, 0.14, t / 0.32) * smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.28, 0.32, t));
            a += 0.95 * smoothstep(0.32, 0.36, t) * (1.0 - smoothstep(0.7, 0.71, t));
            a += 0.03 * smoothstep(0.71, 0.73, t) * (1.0 - smoothstep(0.78, 0.79, t));
            a += 0.78 * smoothstep(0.79, 0.82, t) * (1.0 - smoothstep(0.98, 1.0, t));
            float striate = 0.72 + 0.28 * (0.5 + 0.5 * snoise(vec3(vRad * 6.0, 0.0, t * 3.0)));
            a *= striate;
            vec3 n = normalize(vNormal);
            float lit = 0.5 + 0.5 * max(dot(n, normalize(uSunDir)), 0.0);
            vec3 col = mix(vec3(0.72, 0.66, 0.55), vec3(0.9, 0.87, 0.78), striate);
            gl_FragColor = vec4(col, a * lit);
          }
        `
        }
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
