import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BODIES, type Body, type BodyId } from "@/data/bodies";
import { MISSIONS, type Mission } from "@/data/missions";
import { solarSystemPositionsAt, type EpochPosition } from "@/lib/ephemeris";
import { chartRadius, formatSpacecraftDistance, type SpacecraftPosition } from "@/lib/spacecraft";
import { Planet } from "./Planet";
import { Starfield } from "./Starfield";
import { AsteroidBelt, Comet, LivingSun, MilkyWay, ShootingStars } from "./SpaceEffects";

const MISSION_COLORS: Record<Mission["type"], string> = {
  lander: "#F5C542",
  orbiter: "#4FD1FF",
  flyby: "#9B8CFF",
  rover: "#7EF9C6",
  crewed: "#6EE7B7",
  observatory: "#C084FC",
};

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
      object={
        new THREE.Line(
          geom,
          new THREE.LineBasicMaterial({ color: "#4FD1FF", transparent: true, opacity: 0.14 }),
        )
      }
    />
  );
}

function OrbitingBody({
  body,
  onSelect,
  onHover,
  selected,
  fixed,
}: {
  body: Body;
  onSelect: (id: BodyId) => void;
  onHover: (id: BodyId | null) => void;
  selected: boolean;
  fixed?: EpochPosition | null;
}) {
  const ref = useRef<THREE.Group>(null);
  const angle = useRef(Math.random() * Math.PI * 2);
  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05);
    if (ref.current) {
      if (fixed) {
        ref.current.position.set(fixed.x, 0, fixed.z);
      } else {
        angle.current += (t * 6) / Math.sqrt(body.orbitPeriodDays);
        ref.current.position.set(
          Math.cos(angle.current) * body.orbitRadius,
          Math.sin(angle.current * 0.6) * 0.4,
          Math.sin(angle.current) * body.orbitRadius,
        );
      }
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
        <Planet
          body={body}
          scale={Math.max(0.42, body.radius * 0.95)}
          options={{ quality: "low" }}
        />
        <mesh visible={false}>
          <sphereGeometry args={[Math.max(0.8, body.radius * 1.6), 12, 8]} />
          <meshBasicMaterial />
        </mesh>
      </group>
    </group>
  );
}

function CameraRig({ focus, mapView }: { focus: BodyId | null; mapView?: boolean | undefined }) {
  const { camera } = useThree();
  const intro = useRef(0);
  const orbit = useRef(Math.random() * Math.PI * 2);
  const lastFocus = useRef<BodyId | null>(null);
  const swoop = useRef(0);

  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05);
    if (focus !== lastFocus.current) {
      lastFocus.current = focus;
      swoop.current = 1;
    }
    intro.current = Math.min(1, intro.current + t * 0.5);
    swoop.current = Math.max(0, swoop.current - t * 1.3);
    const ease = 1 - Math.pow(1 - intro.current, 3);
    const damp = 1 - Math.exp(-2.1 * t);

    if (mapView) {
      // star-map view: pull far back to frame the whole system
      const far = new THREE.Vector3(0, 84, 148).multiplyScalar(1 + (1 - ease) * 0.5);
      camera.position.lerp(far, damp);
      camera.lookAt(0, 0, 0);
      return;
    }

    const body = BODIES.find((b) => b.id === focus);
    const dist = body ? body.orbitRadius + 9 : 52;
    const height = body ? 7 : 22;
    orbit.current += t * (focus ? 0.07 : 0.02);

    const desired = new THREE.Vector3(
      Math.sin(orbit.current) * dist * 0.3,
      height + Math.sin(orbit.current * 1.7) * 2.2,
      Math.cos(orbit.current) * dist * 0.3 + dist * 0.72,
    );

    desired.multiplyScalar(1 + (1 - ease) * 1.6);
    desired.y += (1 - ease) * 46;

    if (swoop.current > 0) {
      const s = Math.sin(swoop.current * Math.PI);
      camera.position.multiplyScalar(1 - 0.14 * s);
    }

    const lambda = focus ? 2.1 : 1.15;
    const dampFocus = 1 - Math.exp(-lambda * t);
    camera.position.lerp(desired, dampFocus);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SolarSystemScene({
  onSelect,
  focus,
  epoch,
  onMissionSelect,
  spacecraft,
  mapView,
  frameloop,
}: {
  onSelect: (id: BodyId) => void;
  focus: BodyId | null;
  /** when set, bodies are placed at their real ephemeris position (time-travel) */
  epoch?: Date | null | undefined;
  /** callback fired when a mission marker is clicked in the mission layer */
  onMissionSelect?: ((id: string) => void) | undefined;
  /** real spacecraft positions (JPL Horizons) for the current epoch, if any */
  spacecraft?: SpacecraftPosition[] | null | undefined;
  /** star-map framing: pull the camera far back to view the whole system */
  mapView?: boolean | undefined;
  /** canvas render loop mode — "demand" pauses rendering while paused */
  frameloop?: "always" | "demand" | "never" | undefined;
}) {
  const [hovered, setHovered] = useState<BodyId | null>(null);

  const positions = useMemo(() => (epoch ? solarSystemPositionsAt(epoch) : null), [epoch]);

  return (
    <Canvas
      frameloop={frameloop ?? "always"}
      dpr={[1, 1.6]}
      camera={{ position: [0, 22, 52], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.25} />
        <MilkyWay />
        <Starfield count={2000} radius={110} />
        <LivingSun />
        <AsteroidBelt />
        <ShootingStars />
        <Comet />
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
            fixed={positions ? (positions[b.id] ?? null) : null}
          />
        ))}
        <MissionLayer epoch={epoch} positions={positions} onMissionSelect={onMissionSelect} />
        <SpacecraftLayer positions={spacecraft ?? null} />
        <ProbeLayer focus={focus} />
        <CameraRig focus={focus} mapView={mapView} />
      </Suspense>
    </Canvas>
  );
}

/** Low-poly inspection probe that slowly circles the focused body. */
function ProbeLayer({ focus }: { focus: BodyId | null }) {
  const group = useRef<THREE.Group>(null);
  const angle = useRef(0);

  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05);
    const g = group.current;
    if (!g) return;
    const body = BODIES.find((b) => b.id === focus);
    if (!body) {
      g.visible = false;
      return;
    }
    g.visible = true;
    angle.current += t * 0.4;
    const r = body.orbitRadius + 3.4;
    g.position.set(
      Math.cos(angle.current) * r,
      Math.sin(angle.current * 1.3) * 0.7 + 1.4,
      Math.sin(angle.current) * r,
    );
    g.rotation.y += t * 0.5;
    g.rotation.z = 0.45;
  });

  if (!focus) return null;

  return (
    <group ref={group} scale={0.9}>
      <mesh>
        <boxGeometry args={[0.62, 0.34, 0.5]} />
        <meshStandardMaterial color="#d5dce8" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.05, 0.6]}>
        <cylinderGeometry args={[0.34, 0.5, 0.07, 8]} />
        <meshStandardMaterial color="#4fd1ff" metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position={[-0.92, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.58, 1.15, 0.04]} />
        <meshStandardMaterial color="#1e2a4a" metalness={0.45} roughness={0.5} />
      </mesh>
      <mesh position={[0.92, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.58, 1.15, 0.04]} />
        <meshStandardMaterial color="#1e2a4a" metalness={0.45} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.1, -0.35]} rotation={[0.5, 0, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#0b1626" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** Mission trajectory overlay: highlights each mission's target orbit in the
 * mission's type color and tracks a marker on the current planet position. */
function MissionLayer({
  epoch,
  positions,
  onMissionSelect,
}: {
  /** when set, bodies are placed at their real ephemeris position (time-travel) */
  epoch?: Date | null | undefined;
  positions: Record<BodyId, EpochPosition> | null;
  onMissionSelect?: ((id: string) => void) | undefined;
}) {
  const visibleMissions = useMemo(
    () =>
      MISSIONS.filter(
        (m): m is Mission & { target: BodyId } =>
          m.target !== "outer-system" && m.target !== "deep-field",
      ),
    [],
  );
  const angleRefs = useRef<Record<string, number>>({});

  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05);
    for (const m of visibleMissions) {
      const b = BODIES.find((x) => x.id === m.target);
      if (!b) continue;
      angleRefs.current[m.id] ??= Math.random() * Math.PI * 2;
      angleRefs.current[m.id] =
        (angleRefs.current[m.id]! + (t * 6) / Math.sqrt(b.orbitPeriodDays)) % (Math.PI * 2);
    }
  });

  return (
    <group>
      {visibleMissions.map((m) => {
        const b = BODIES.find((x) => x.id === m.target);
        if (!b) return null;
        const color = MISSION_COLORS[m.type] ?? "#4FD1FF";
        const fixed = positions?.[m.target];
        let pos = { x: 0, z: 0 };
        if (epoch && fixed) {
          pos = fixed;
        } else {
          const a = angleRefs.current[m.id] ?? 0;
          pos = { x: Math.cos(a) * b.orbitRadius, z: Math.sin(a) * b.orbitRadius };
        }
        return (
          <group key={m.id}>
            <OrbitDashed radius={b.orbitRadius} color={color} />
            <group position={[pos.x, 0, pos.z]}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  onMissionSelect?.(m.id);
                }}
              >
                <sphereGeometry args={[0.32, 12, 12]} />
                <meshBasicMaterial color={color} transparent opacity={0.9} />
              </mesh>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  onMissionSelect?.(m.id);
                }}
              >
                <ringGeometry args={[0.45, 0.58, 24]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={0.35}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <Html distanceFactor={60} center>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMissionSelect?.(m.id);
                  }}
                  className="label-tele whitespace-nowrap rounded-md border border-border bg-background/80 px-2 py-1 text-[10px] text-foreground backdrop-blur"
                >
                  {m.name.split("—")[0]}
                </button>
              </Html>
            </group>
          </group>
        );
      })}
    </group>
  );
}

/** Real spacecraft markers (JPL Horizons): glowing probe markers with a
 * distance readout. Only rendered when the time-travel ephemeris is active. */
function SpacecraftLayer({ positions }: { positions: SpacecraftPosition[] | null }) {
  if (!positions || positions.length === 0) return null;
  return (
    <group>
      {positions.map((p) => (
        <SpacecraftMarker key={p.spacecraft.id} position={p} />
      ))}
    </group>
  );
}

function SpacecraftMarker({ position }: { position: SpacecraftPosition }) {
  const ref = useRef<THREE.Mesh>(null);
  const scale = Math.max(0.3, Math.min(0.6, chartRadius(position.x, position.z) / 90));
  useFrame(({ clock }) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.18;
      ref.current.scale.setScalar(scale * pulse);
    }
  });
  const color = position.spacecraft.color;
  return (
    <group position={[position.x, 0, position.z]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.46, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <Html distanceFactor={60} center>
        <div
          className="label-tele flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background/80 px-2 py-1 text-[10px] text-foreground backdrop-blur"
          style={{ pointerEvents: "none" }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          <span>
            {position.spacecraft.name} · {formatSpacecraftDistance(position)}
          </span>
        </div>
      </Html>
    </group>
  );
}

function OrbitDashed({ radius, color }: { radius: number; color: string }) {
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(
      geom,
      new THREE.LineDashedMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        dashSize: 0.9,
        gapSize: 0.7,
      }),
    );
    line.computeLineDistances();
    return line;
  }, [radius, color]);
  return <primitive object={line} />;
}
