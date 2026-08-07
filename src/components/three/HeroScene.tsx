import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { BODIES, type BodyId, bodyMap } from "@/data/bodies";
import { Planet } from "./Planet";
import { Starfield } from "./Starfield";

function Rig({ bodyId }: { bodyId: BodyId }) {
  const group = useRef<THREE.Group>(null);
  const [shown, setShown] = useState<BodyId>(bodyId);
  const phase = useRef(1); // 1 = fully in

  useEffect(() => {
    if (bodyId !== shown) phase.current = -1; // start exit
  }, [bodyId, shown]);

  useFrame((state, dt) => {
    const t = Math.min(dt, 0.05);
    if (!group.current) return;
    if (phase.current < 0) {
      phase.current += t * 2.4;
      if (phase.current >= 0) {
        setShown(bodyId);
        phase.current = 0.001;
      }
    } else if (phase.current < 1) {
      phase.current = Math.min(1, phase.current + t * 1.4);
    }
    const p = Math.abs(phase.current);
    const eased = 1 - Math.pow(1 - p, 3);
    group.current.scale.setScalar(0.55 + eased * 0.45);
    group.current.position.x = (1 - eased) * (phase.current < 0 ? -1.6 : 1.6);
    const mx = state.pointer.x * 0.12;
    const my = state.pointer.y * 0.08;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -my, t * 2);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, mx * 0.3, t * 2);
  });

  const body = bodyMap[shown];

  return (
    <group ref={group}>
      <Planet key={shown} body={body} scale={2.35} options={{ quality: "high" }} />
    </group>
  );
}

export default function HeroScene({ bodyId }: { bodyId: BodyId }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 7.2], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <Starfield count={2400} radius={70} />
        <Rig bodyId={bodyId} />
      </Suspense>
    </Canvas>
  );
}

export const HERO_SEQUENCE: BodyId[] = ["earth", "mars", "moon", "europa", "titan"];
export const HERO_BODIES = BODIES;
