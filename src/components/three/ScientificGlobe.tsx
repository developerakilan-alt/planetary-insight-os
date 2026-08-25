import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Body, Landmark } from "@/data/bodies";
import type { PlanetVisualConfig } from "@/data/planets/types";
import { latLonToVec3, vec3ToLatLon } from "@/lib/geo";
import { Starfield } from "./Starfield";
import { MilkyWay } from "./SpaceEffects";
import { TerrainPatch } from "./TerrainPatch";
import { ScientificPlanet, type ScientificOptions } from "./ScientificPlanet";

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
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <MilkyWay />
        <Starfield count={1400} radius={60} />
        {/* Lighting rig — tuned so the albedo texture reads with its true NASA
            colours: a restrained ambient base keeps the night limb from going
            fully black while the key "sun" carries contrast and shading. */}
        <ambientLight
          intensity={lighting === "studio" ? 1.05 : lighting === "terminator" ? 0.5 : 0.38}
        />
        <directionalLight
          position={lighting === "terminator" ? [0.15, -0.2, 1.6] : [5, 3, 8]}
          intensity={lighting === "studio" ? 0.7 : lighting === "terminator" ? 1.6 : 2.4}
        />
        {lighting !== "studio" && (
          <directionalLight position={[-6, -2, -4]} intensity={0.28} color="#dfe7f0" />
        )}
        <hemisphereLight args={["#a8bdd8", "#141018", 0.22]} />
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
            {pick && (
              <Marker
                position={latLonToVec3(pick.lat, pick.lon, 1.02)}
                label="Selected point"
                color="#F5C542"
              />
            )}
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
