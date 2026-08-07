import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function Starfield({ count = 2600, radius = 90 }: { count?: number; radius?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const tints = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#cfe6ff"),
      new THREE.Color("#ffe9c9"),
      new THREE.Color("#9fd8ff"),
    ];
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.65 + Math.random() * 0.35);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const c = tints[Math.floor(Math.random() * tints.length)] ?? tints[0]!;
      const b = 0.35 + Math.random() * 0.65;
      colors[i * 3] = c.r * b;
      colors[i * 3 + 1] = c.g * b;
      colors[i * 3 + 2] = c.b * b;
      sizes[i] = Math.random() < 0.06 ? 2.6 : 0.9 + Math.random() * 0.8;
    }
    return { positions, colors, sizes };
  }, [count, radius]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.006;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float size;
          varying vec3 vColor;
          void main(){
            vColor = color;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main(){
            float d = length(gl_PointCoord - vec2(0.5));
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(vColor, a * a);
          }
        `}
        vertexColors
      />
    </points>
  );
}
