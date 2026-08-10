import { useMemo } from "react";
import * as THREE from "three";
import type { PlanetVisualConfig } from "@/data/planets/types";
import { textureUrl } from "@/data/planets/configs";
import { latLonToVec3 } from "@/lib/geo";
import { usePlanetTextures } from "@/hooks/use-planet-textures";

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Real 3D terrain: a high-resolution spherical patch centred on the picked
 * coordinate whose vertices are displaced by the real elevation map, with a
 * soft gaussian falloff so the surface blends into the un-displaced globe.
 * The fragment shader shades it and draws contour lines.
 */
export function TerrainPatch({
  config,
  center,
  radiusKm,
  exaggeration = 1,
  angularSpan = 0.6,
}: {
  config: PlanetVisualConfig;
  center: { lat: number; lon: number } | null;
  radiusKm: number;
  exaggeration?: number;
  angularSpan?: number;
}) {
  const elevUrl = useMemo(() => {
    if (!config.surfaceElevation) return null;
    return textureUrl(config, config.surfaceElevation.stem, "M", config.surfaceElevation);
  }, [config]);
  const colorUrl = useMemo(() => {
    if (!config.surfaceColor) return null;
    return textureUrl(config, config.surfaceColor.stem, "M", config.surfaceColor);
  }, [config]);

  const { textures } = usePlanetTextures(
    useMemo(
      () => ({
        ...(elevUrl ? { elev: elevUrl } : {}),
        ...(colorUrl ? { color: colorUrl } : {}),
      }),
      [elevUrl, colorUrl],
    ),
    ["elev"],
  );

  const elevTex = textures.elev ?? null;

  const range = config.elevation ? (config.elevation.maxM - config.elevation.minM) / 1000 : 0;
  const dispScale = (range / radiusKm) * exaggeration;
  const dispBias = config.elevation ? -(config.elevation.minM / 1000 / radiusKm) * exaggeration : 0;

  const { geometry, centerDir } = useMemo(() => {
    const seg = 64;
    const c = center ? latLonToVec3(center.lat, center.lon, 1) : new THREE.Vector3(1, 0, 0);
    const t1 = new THREE.Vector3().crossVectors(c, UP).normalize();
    const t2 = new THREE.Vector3().crossVectors(c, t1).normalize();
    const positions = new Float32Array((seg + 1) * (seg + 1) * 3);
    const uvs = new Float32Array((seg + 1) * (seg + 1) * 2);
    const indices: number[] = [];
    const half = angularSpan / 2;
    for (let i = 0; i <= seg; i++) {
      for (let j = 0; j <= seg; j++) {
        const a = (i / seg - 0.5) * half;
        const b = (j / seg - 0.5) * half;
        const p = c.clone().applyAxisAngle(t2, a).applyAxisAngle(t1, b).normalize();
        const idx = i * (seg + 1) + j;
        positions[idx * 3] = p.x;
        positions[idx * 3 + 1] = p.y;
        positions[idx * 3 + 2] = p.z;
        const lat = Math.asin(Math.max(-1, Math.min(1, p.y)));
        const lon = Math.atan2(p.z, p.x);
        uvs[idx * 2] = lon / (2 * Math.PI) + 0.5;
        uvs[idx * 2 + 1] = lat / Math.PI + 0.5;
        if (i < seg && j < seg) {
          const a0 = idx;
          const a1 = idx + 1;
          const b0 = idx + seg + 1;
          const b1 = idx + seg + 2;
          indices.push(a0, b0, a1, a1, b0, b1);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return { geometry: geo, centerDir: c };
  }, [center, angularSpan]);

  const uniforms = useMemo(
    () => ({
      uElev: { value: elevTex },
      uColor: { value: textures.color ?? null },
      uCenter: { value: centerDir },
      uHalf: { value: angularSpan / 2 },
      uRange: { value: dispScale },
      uBias: { value: dispBias },
      uSunDir: { value: new THREE.Vector3(5, 3, 8).normalize() },
    }),
    [elevTex, textures.color, centerDir, angularSpan, dispScale, dispBias],
  );

  if (!center || !elevTex || !geometry) return null;

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={3}>
      <shaderMaterial
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
        vertexShader={
          /* glsl */ `
          uniform sampler2D uElev;
          uniform vec3 uCenter;
          uniform float uHalf;
          uniform float uRange;
          uniform float uBias;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying float vElev;
          varying float vFall;
          void main(){
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec3 dir = normalize(position);
            float ang = acos(clamp(dot(dir, normalize(uCenter)), -1.0, 1.0));
            float fall = pow(cos((ang / uHalf) * 1.5708), 3.0);
            vFall = fall;
            float elev = texture2D(uElev, uv).r;
            vElev = elev;
            vec3 p = dir * (1.002 + (elev * uRange + uBias) * fall * 0.75);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `
        }
        fragmentShader={
          /* glsl */ `
          uniform sampler2D uColor;
          uniform vec3 uSunDir;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying float vElev;
          varying float vFall;
          void main(){
            vec3 col = texture2D(uColor, vUv).rgb;
            vec3 n = normalize(vNormal);
            float lit = max(dot(n, normalize(uSunDir)), 0.0);
            col *= 0.38 + 0.62 * lit;
            float band = abs(fract(vElev * 38.0) - 0.5);
            float contour = smoothstep(0.03, 0.09, band);
            col = mix(col * 0.45, col, contour);
            float alpha = smoothstep(0.18, 0.6, vFall);
            gl_FragColor = vec4(col, alpha);
          }
        `
        }
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
