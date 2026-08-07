import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BODIES, type Body, type BodyId } from "@/data/bodies";
import { Planet } from "./Planet";
import { Starfield } from "./Starfield";

function Orbit({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);
  const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return (
    <primitive
      object={new THREE.Line(geom, new THREE.LineBasicMaterial({ color: "#4FD1FF", transparent: true, opacity: 0.14 }))}
    />
  );
}

function OrbitingBody({
  body,
  onSelect,
  onHover,
  selected,
}: {
  body: Body;
  onSelect: (id: BodyId) => void;
  onHover: (id: BodyId | null) => void;
  selected: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const angle = useRef(Math.random() * Math.PI * 2);
  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05);
    angle.current += (t * 6) / Math.sqrt(body.orbitPeriodDays);
    if (ref.current) {
      ref.current.position.set(
        Math.cos(angle.current) * body.orbitRadius,
        Math.sin(angle.current * 0.6) * 0.4,
        Math.sin(angle.current) * body.orbitRadius,
      );
      const target = selected ? 1.35 : 1;
      ref.current.scale.lerp(new THREE.Vector3(target, target, target), t * 4);
    }
  });

  return (
    <group ref={ref}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelect(body.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(body.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = "auto";
        }}
      >
        <Planet body={body} scale={Math.max(0.42, body.radius * 0.95)} options={{ quality: "low" }} />
        <mesh visible={false}>
          <sphereGeometry args={[Math.max(0.8, body.radius * 1.6), 12, 8]} />
          <meshBasicMaterial />
        </mesh>
      </group>
    </group>
  );
}

function Sun() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 0.8) * 0.015;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[2.2, 48, 24]} />
        <meshBasicMaterial color="#ffd9a0" />
      </mesh>
      <mesh scale={1.55}>
        <sphereGeometry args={[2.2, 32, 16]} />
        <meshBasicMaterial color="#ff9d3c" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      <pointLight intensity={400} distance={120} color="#fff0d4" />
    </group>
  );
}

function CameraRig({ focus }: { focus: BodyId | null }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));
  useFrame((state, dt) => {
    const t = Math.min(dt, 0.05);
    const body = BODIES.find((b) => b.id === focus);
    const dist = body ? body.orbitRadius + 10 : 52;
    const height = body ? 8 : 22;
    const desired = new THREE.Vector3(
      Math.sin(state.clock.elapsedTime * 0.02) * dist * 0.25,
      height,
      dist,
    );
    camera.position.lerp(desired, t * 1.1);
    camera.lookAt(target.current);
  });
  return null;
}

export default function SolarSystemScene({
  onSelect,
  focus,
}: {
  onSelect: (id: BodyId) => void;
  focus: BodyId | null;
}) {
  const [hovered, setHovered] = useState<BodyId | null>(null);
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 22, 52], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.25} />
        <Starfield count={2000} radius={110} />
        <Sun />
        {BODIES.map((b) => (
          <Orbit key={`o-${b.id}`} radius={b.orbitRadius} />
        ))}
        {BODIES.map((b) => (
          <OrbitingBody
            key={b.id}
            body={b}
            onSelect={onSelect}
            onHover={setHovered}
            selected={hovered === b.id || focus === b.id}
          />
        ))}
        <CameraRig focus={focus} />
      </Suspense>
    </Canvas>
  );
}
