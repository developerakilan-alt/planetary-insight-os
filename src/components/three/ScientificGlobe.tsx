import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Body, Landmark } from "@/data/bodies";
import type { PlanetVisualConfig } from "@/data/planets/types";
import type { Mission } from "@/data/missions";
import { latLonToVec3, vec3ToLatLon } from "@/lib/geo";
import { Starfield } from "./Starfield";
import { MilkyWay } from "./SpaceEffects";
import { TerrainPatch } from "./TerrainPatch";
import { ScientificPlanet, type ScientificOptions } from "./ScientificPlanet";

const MISSION_COLORS: Record<Mission["type"], string> = {
  lander: "#F5C542",
  orbiter: "#4FD1FF",
  flyby: "#9B8CFF",
  rover: "#F5C542",
  crewed: "#6EE7B7",
  observatory: "#C084FC",
};

function Marker({
  position,
  label,
  color,
}: {
  position: THREE.Vector3;
  label?: string;
  color: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.014, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.024, 0.032, 32]} />
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

export interface ScientificGlobeProps {
  config: PlanetVisualConfig;
  body: Body;
  options: ScientificOptions & { lighting?: "sun" | "studio" | "terminator" };
  landmarks?: Landmark[];
  missions?: Mission[];
  /** surface traverse polylines (e.g. real rover paths) rendered on the globe */
  traverses?: {
    id: string;
    label: string;
    color: string;
    points: { lat: number; lon: number }[];
  }[];
  pick?: { lat: number; lon: number } | null;
  onPick?: (lat: number, lon: number) => void;
  focus?: { lat: number; lon: number } | null;
  /** double-tap / double-click a point to focus the camera there */
  onDoubleTap?: (lat: number, lon: number) => void;
  /** long-press a point (mobile) or long-click to copy its coordinates */
  onLongPress?: (lat: number, lon: number) => void;
  /** maximum device-pixel-ratio target (memory budget) */
  maxDpr?: number;
}

export default function ScientificGlobe({
  config,
  body,
  options,
  landmarks = [],
  missions = [],
  traverses = [],
  pick,
  onPick,
  focus,
  onDoubleTap,
  onLongPress,
  maxDpr = 1.8,
}: ScientificGlobeProps) {
  const lighting = options.lighting ?? "sun";
  const pressRef = useRef<{
    x: number;
    y: number;
    lat: number;
    lon: number;
    timer: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  const pointAt = (e: ThreeEvent<MouseEvent | PointerEvent>) => {
    const local = e.object.worldToLocal(e.point.clone());
    return vec3ToLatLon(local);
  };

  return (
    <Canvas
      dpr={[1, Math.min(maxDpr, 1.8)]}
      camera={{ position: [0, 0.6, 3.2], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <MilkyWay />
        <Starfield count={1400} radius={60} />
        {lighting === "studio" ? (
          <ambientLight intensity={0.95} />
        ) : (
          <ambientLight intensity={0.35} />
        )}
        <directionalLight
          position={lighting === "terminator" ? [0.15, -0.2, 1.6] : [5, 3, 8]}
          intensity={lighting === "studio" ? 0.6 : 1.7}
        />
        <group
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (!onPick) return;
            e.stopPropagation();
            const { lat, lon } = pointAt(e);
            if (e.detail >= 2 && onDoubleTap) {
              onDoubleTap(lat, lon);
            } else {
              onPick(lat, lon);
            }
          }}
          onPointerDown={(e: ThreeEvent<PointerEvent>) => {
            if (!onLongPress) return;
            e.stopPropagation();
            const { lat, lon } = pointAt(e);
            const timer = setTimeout(() => {
              if (pressRef.current?.timer === timer) {
                pressRef.current = null;
                onLongPress(lat, lon);
              }
            }, 650);
            pressRef.current = {
              x: e.nativeEvent.clientX,
              y: e.nativeEvent.clientY,
              lat,
              lon,
              timer,
            };
          }}
          onPointerMove={(e: ThreeEvent<PointerEvent>) => {
            const p = pressRef.current;
            if (!p) return;
            const dx = e.nativeEvent.clientX - p.x;
            const dy = e.nativeEvent.clientY - p.y;
            if (Math.hypot(dx, dy) > 12) {
              if (p.timer) clearTimeout(p.timer);
              pressRef.current = null;
            }
          }}
          onPointerUp={() => {
            if (pressRef.current?.timer) clearTimeout(pressRef.current.timer);
            pressRef.current = null;
          }}
          onPointerLeave={() => {
            if (pressRef.current?.timer) clearTimeout(pressRef.current.timer);
            pressRef.current = null;
          }}
        >
          <ScientificPlanet
            config={config}
            tiltDeg={body.tilt}
            radiusKm={body.metrics.radiusKm}
            options={options}
          >
            {landmarks.map((l) => (
              <Marker
                key={l.name}
                position={latLonToVec3(l.lat, l.lon, 1.02)}
                label={l.name}
                color="#4FD1FF"
              />
            ))}
            {missions
              .filter((m) => m.site)
              .map((m) => (
                <Marker
                  key={m.id}
                  position={latLonToVec3(m.site!.lat, m.site!.lon, 1.02)}
                  label={`${m.name} · ${m.year}`}
                  color={MISSION_COLORS[m.type] ?? "#4FD1FF"}
                />
              ))}
            {pick && (
              <Marker
                position={latLonToVec3(pick.lat, pick.lon, 1.02)}
                label="Selected point"
                color="#F5C542"
              />
            )}
            {traverses.map((t) => (
              <Traverse key={t.id} label={t.label} color={t.color} points={t.points} />
            ))}
            <TerrainPatch
              config={config}
              center={pick ?? null}
              radiusKm={body.metrics.radiusKm}
              exaggeration={options.exaggeration ?? 1}
            />
          </ScientificPlanet>
        </group>
        <OrbitControls
          enablePan={false}
          minDistance={1.6}
          maxDistance={7}
          rotateSpeed={0.5}
          zoomSpeed={0.7}
        />
        <FocusTarget focus={focus ?? null} />
      </Suspense>
    </Canvas>
  );
}

function Traverse({
  label,
  color,
  points,
}: {
  label: string;
  color: string;
  points: { lat: number; lon: number }[];
}) {
  const line = useMemo(() => {
    const pts = points.map((p) => latLonToVec3(p.lat, p.lon, 1.008));
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }),
    );
  }, [points, color]);

  return (
    <group>
      <primitive object={line} />
      {points.map((p, i) => (
        <mesh key={i} position={latLonToVec3(p.lat, p.lon, 1.008)}>
          <sphereGeometry args={[0.007, 8, 8]} />
          <meshBasicMaterial color={i === 0 ? "#7EF9C6" : color} />
        </mesh>
      ))}
      <Html position={latLonToVec3(points[0]!.lat, points[0]!.lon, 1.03)} distanceFactor={5} center>
        <div
          className="label-tele whitespace-nowrap rounded-md border border-border bg-background/80 px-2 py-1 text-[9px] text-foreground backdrop-blur"
          style={{ pointerEvents: "none" }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

/** Cinematic fly-over: approach the target from a higher altitude with a slight
 * azimuth swing, then settle into a close view with the site kept on-axis. */
function FocusTarget({ focus }: { focus: { lat: number; lon: number } | null }) {
  const active = useRef<{ lat: number; lon: number } | null>(null);
  const time = useRef(0);
  const duration = 3;
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    if (focus) {
      active.current = focus;
      time.current = 0;
    }
  }, [focus]);

  useFrame(({ camera }, dt) => {
    if (!active.current) return;
    time.current += dt;
    if (time.current > duration) {
      active.current = null;
      return;
    }
    const p = Math.min(1, time.current / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const dir = latLonToVec3(active.current.lat, active.current.lon, 1);
    const approach = dir.clone().applyAxisAngle(up, 0.45).multiplyScalar(5.2);
    const settle = dir.clone().applyAxisAngle(up, -0.22).multiplyScalar(2.3);
    const target = approach.clone().lerp(settle, eased);
    camera.position.lerp(target, Math.min(dt, 0.05) * 2.5);
    camera.lookAt(dir);
  });
  return null;
}
