import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Body } from "@/data/bodies";
import { ATMO_FRAG, CLOUD_FRAG, SURFACE_FRAG, SURFACE_VERT } from "./shaders";
import { RingSystem } from "./SpaceEffects";

export interface PlanetOptions {
  elevation?: boolean;
  geology?: boolean;
  atmosphere?: boolean;
  quality?: "low" | "high" | "ultra";
  lighting?: "sun" | "studio" | "terminator";
  spin?: boolean;
}

const SEG = { low: 48, high: 96, ultra: 160 } as const;

export function Planet({
  body,
  scale = 1,
  options = {},
  children,
}: {
  body: Body;
  scale?: number;
  options?: PlanetOptions;
  children?: React.ReactNode;
}) {
  const {
    elevation = false,
    geology = false,
    atmosphere = true,
    quality = "high",
    lighting = "sun",
    spin = true,
  } = options;

  const group = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const surfaceUniforms = useMemo(
    () => ({
      uLow: { value: new THREE.Color(body.palette.low) },
      uMid: { value: new THREE.Color(body.palette.mid) },
      uHigh: { value: new THREE.Color(body.palette.high) },
      uIce: { value: body.ice },
      uRough: { value: body.roughness },
      uTime: { value: 0 },
      uDetail: { value: 0.8 },
      uLightDir: { value: new THREE.Vector3(1, 0.35, 0.6) },
      uElevation: { value: 0 },
      uGeology: { value: 0 },
      uLightMode: { value: 0 },
    }),
    [body],
  );

  const cloudUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDensity: { value: body.clouds },
      uColor: { value: new THREE.Color("#ffffff") },
      uLightDir: { value: new THREE.Vector3(1, 0.35, 0.6) },
    }),
    [body],
  );

  const atmoUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(body.palette.atmosphere) },
      uIntensity: { value: body.clouds > 0.5 ? 1.5 : 0.9 },
      uLightDir: { value: new THREE.Vector3(1, 0.35, 0.6) },
    }),
    [body],
  );

  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05);
    surfaceUniforms.uTime.value += t;
    cloudUniforms.uTime.value += t;
    surfaceUniforms.uElevation.value = THREE.MathUtils.lerp(
      surfaceUniforms.uElevation.value,
      elevation ? 0.85 : 0,
      t * 4,
    );
    surfaceUniforms.uGeology.value = THREE.MathUtils.lerp(
      surfaceUniforms.uGeology.value,
      geology ? 1 : 0,
      t * 4,
    );
    surfaceUniforms.uLightMode.value = lighting === "sun" ? 0 : lighting === "studio" ? 1 : 2;
    const dir =
      lighting === "terminator"
        ? new THREE.Vector3(-0.15, 0.2, 1)
        : new THREE.Vector3(1, 0.35, 0.6);
    surfaceUniforms.uLightDir.value.copy(dir);
    cloudUniforms.uLightDir.value.copy(dir);
    atmoUniforms.uLightDir.value.copy(dir);

    if (spin && group.current) group.current.rotation.y += (t * Math.PI * 2) / body.spinSeconds;
    if (cloudRef.current) cloudRef.current.rotation.y += t * 0.014;
  });

  const seg = SEG[quality];

  return (
    <group ref={group} rotation={[0, 0, (body.tilt * Math.PI) / 180]} scale={scale}>
      <mesh>
        <sphereGeometry args={[1, seg, seg / 2]} />
        <shaderMaterial
          vertexShader={SURFACE_VERT}
          fragmentShader={SURFACE_FRAG}
          uniforms={surfaceUniforms}
        />
      </mesh>

      {body.clouds > 0.02 && (
        <mesh ref={cloudRef} scale={1.018}>
          <sphereGeometry args={[1, seg, seg / 2]} />
          <shaderMaterial
            vertexShader={SURFACE_VERT}
            fragmentShader={CLOUD_FRAG}
            uniforms={cloudUniforms}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}

      {atmosphere && (
        <mesh scale={1.14}>
          <sphereGeometry args={[1, 64, 32]} />
          <shaderMaterial
            vertexShader={SURFACE_VERT}
            fragmentShader={ATMO_FRAG}
            uniforms={atmoUniforms}
            transparent
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {body.id === "saturn" && <RingSystem />}
      {children}
    </group>
  );
}
