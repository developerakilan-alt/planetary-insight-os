import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import type { Body, Landmark } from "@/data/bodies";
import { Planet, type PlanetOptions } from "./Planet";
import { Starfield } from "./Starfield";

export function latLonToVec3(lat: number, lon: number, r = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

export function vec3ToLatLon(v: THREE.Vector3) {
  const n = v.clone().normalize();
  const lat = 90 - (Math.acos(n.y) * 180) / Math.PI;
  let lon = ((Math.atan2(n.z, -n.x) * 180) / Math.PI) - 180;
  if (lon < -180) lon += 360;
  return { lat, lon };
}

function Marker({
  position,
  label,
  tone = "primary",
}: {
  position: THREE.Vector3;
  label?: string;
  tone?: "primary" | "warning";
}) {
  const color = tone === "warning" ? "#F5C542" : "#4FD1FF";
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.038, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      {label && (
        <Html distanceFactor={4} style={{ pointerEvents: "none" }}>
          <div className="label-tele whitespace-nowrap rounded-md border border-border bg-background/80 px-2 py-1 text-[10px] text-foreground backdrop-blur">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function GlobeScene({
  body,
  options,
  landmarks = [],
  pick,
  onPick,
  focus,
}: {
  body: Body;
  options: PlanetOptions;
  landmarks?: Landmark[];
  pick?: { lat: number; lon: number } | null;
  onPick?: (lat: number, lon: number) => void;
  focus?: { lat: number; lon: number } | null;
}) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.6, 3.2], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <Starfield count={1400} radius={60} />
        <group
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (!onPick) return;
            e.stopPropagation();
            const local = e.object.worldToLocal(e.point.clone());
            const { lat, lon } = vec3ToLatLon(local);
            onPick(lat, lon);
          }}
        >
          <Planet body={body} scale={1} options={{ ...options, spin: false }}>
            {landmarks.map((l) => (
              <Marker key={l.name} position={latLonToVec3(l.lat, l.lon, 1.02)} label={l.name} />
            ))}
            {pick && (
              <Marker position={latLonToVec3(pick.lat, pick.lon, 1.02)} tone="warning" label="Candidate site" />
            )}
          </Planet>
        </group>
        <OrbitControls
          enablePan={false}
          minDistance={1.6}
          maxDistance={6}
          rotateSpeed={0.5}
          zoomSpeed={0.7}
          autoRotate={options.spin !== false}
          autoRotateSpeed={0.35}
        />
        <FocusTarget focus={focus ?? null} />
      </Suspense>
    </Canvas>
  );
}

function FocusTarget({ focus }: { focus: { lat: number; lon: number } | null }) {
  const active = useRef<{ lat: number; lon: number } | null>(null);
  const time = useRef(0);
  useEffect(() => {
    if (focus) {
      active.current = focus;
      time.current = 0;
    }
  }, [focus]);
  useFrame(({ camera }, dt) => {
    if (!active.current) return;
    time.current += dt;
    if (time.current > 2.2) {
      active.current = null;
      return;
    }
    const dir = latLonToVec3(active.current.lat, active.current.lon, 2.6);
    camera.position.lerp(dir, Math.min(dt, 0.05) * 2.2);
    camera.lookAt(0, 0, 0);
  });
  return null;
}
