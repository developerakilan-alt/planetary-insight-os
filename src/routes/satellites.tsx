import { createFileRoute } from "@tanstack/react-router";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Pause, Play, Radio, Satellite as SatelliteIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ClientOnly } from "@/components/ClientOnly";
import { PageMasthead } from "@/components/PageMasthead";
import {
  EARTH_RADIUS_KM,
  SATELLITES,
  orbitPoints,
  satellitePosition,
  satelliteSpeedKmS,
  typeLabel,
  type Satellite,
} from "@/lib/satellites";

export const Route = createFileRoute("/satellites")({
  head: () => ({
    meta: [
      { title: "Satellite Constellations — Cosmos OS" },
      {
        name: "description",
        content:
          "A live 3D view of Earth-orbiting satellites — the ISS, Tiangong, Hubble, navigation and telecom constellations.",
      },
      { property: "og:title", content: "Satellite View — Cosmos OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Satellites,
});

const TYPES = [
  "crewed",
  "science",
  "navigation",
  "telecom",
  "weather",
  "earth-obs",
  "cubesat",
] as const;

function Satellites() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const simRef = useRef(Date.now());
  const [simTime, setSimTime] = useState(Date.now());

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastHud = 0;
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      if (playing) simRef.current += dt * speed * 60 * 1000;
      if (t - lastHud > 250) {
        lastHud = t;
        setSimTime(simRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const visible = useMemo(() => SATELLITES.filter((s) => !hidden.has(s.id)), [hidden]);

  const toggleType = (t: (typeof TYPES)[number]) => {
    const ids = SATELLITES.filter((s) => s.type === t).map((s) => s.id);
    const allHidden = ids.every((id) => hidden.has(id));
    setHidden((h) => {
      const next = new Set(h);
      ids.forEach((id) => (allHidden ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const isTypeVisible = (t: (typeof TYPES)[number]) =>
    SATELLITES.filter((s) => s.type === t).some((s) => !hidden.has(s.id));

  const simDate = new Date(simTime);

  return (
    <div className="mx-auto max-w-[1640px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Satellite constellation view"
        icon={<SatelliteIcon className="h-4 w-4" />}
        title={
          <>
            The orbital <em className="text-editorial">traffic lanes.</em>
          </>
        }
        description="A deterministic model of Earth-orbiting spacecraft — the ISS, Tiangong, Hubble, GPS, GEO telecoms and low-Earth constellations — propagated live against a rendered globe."
        meta={[
          { label: "Fleet", value: `${SATELLITES.length} spacecraft` },
          { label: "Sim speed", value: `${speed}×` },
          { label: "Altitude range", value: "390 → 35,786 km" },
          { label: "Model", value: "Circular two-body" },
        ]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Scene */}
        <div className="panel relative h-[620px] overflow-hidden">
          <ClientOnly>
            <Canvas
              frameloop={playing ? "always" : "demand"}
              dpr={[1, 1.6]}
              camera={{ position: [0, 2.6, 5.2], fov: 45 }}
              gl={{ antialias: true, alpha: true }}
              style={{ position: "absolute", inset: 0 }}
            >
              <ambientLight intensity={0.6} />
              <pointLight position={[10, 10, 10]} intensity={0.6} />
              <Stars radius={80} depth={40} count={1800} factor={3} fade speed={0.6} />

              {/* Earth */}
              <group>
                <mesh>
                  <sphereGeometry args={[1, 48, 48]} />
                  <meshPhongMaterial color="#0a1e3a" transparent opacity={0.9} shininess={10} />
                </mesh>
                <mesh>
                  <sphereGeometry args={[1.001, 48, 48]} />
                  <meshBasicMaterial color="#4FD1FF" wireframe transparent opacity={0.07} />
                </mesh>
                {/* equator + prime meridian */}
                <Equator />
              </group>

              {visible.map((sat) => (
                <SatelliteBody key={sat.id} sat={sat} simRef={simRef} />
              ))}

              <OrbitControls
                enablePan={false}
                minDistance={1.4}
                maxDistance={14}
                rotateSpeed={0.5}
                zoomSpeed={0.7}
                autoRotate={playing}
                autoRotateSpeed={0.5}
              />
            </Canvas>
          </ClientOnly>

          <div className="pointer-events-none absolute left-5 top-5 rounded-2xl border border-glass-edge bg-background/70 px-4 py-3 backdrop-blur-xl">
            <div className="label-tele text-[9px] text-primary">Simulated time (UTC)</div>
            <div className="mt-0.5 font-mono text-sm tabular-nums text-foreground">
              {simDate.toUTCString().slice(5, 16)}
            </div>
            <div className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
              {simDate.toUTCString().slice(0, 4)}
            </div>
          </div>
        </div>

        {/* Controls + manifest */}
        <div className="space-y-4">
          <div className="panel-flat p-4">
            <div className="label-tele mb-3 text-[9px] text-muted-foreground">Simulation</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {playing ? "Pause" : "Play"}
              </button>
              <div className="flex items-center gap-1 rounded-full border border-glass-edge bg-glass-fill p-1">
                {[1, 10, 60, 600].map((v) => (
                  <button
                    key={v}
                    onClick={() => setSpeed(v)}
                    className={`rounded-full px-3 py-1.5 font-mono text-[10px] transition-colors ${
                      speed === v ? "bg-primary/20 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {v === 1 ? "real" : `${v}×`}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Real time = 1×. Higher factors compress orbital motion so GEO arcs and LEO passes are
              easy to trace.
            </p>
          </div>

          <div className="panel-flat p-4">
            <div className="label-tele mb-3 flex items-center gap-2 text-primary">
              <Radio className="h-3.5 w-3.5" />
              Constellation layers
            </div>
            <div className="space-y-1.5">
              {TYPES.map((t) => (
                <label
                  key={t}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-glass-edge px-3 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: SATELLITES.find((s) => s.type === t)?.color }}
                    />
                    {typeLabel(t)}
                    <span className="label-tele text-[8px] text-muted-foreground/70">
                      {SATELLITES.filter((s) => s.type === t).length}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={isTypeVisible(t)}
                    onChange={() => toggleType(t)}
                    className="h-4 w-4 accent-[#4FD1FF]"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="panel-flat overflow-hidden">
            <div className="label-tele border-b border-glass-edge px-4 py-3 text-[9px] text-muted-foreground">
              Live manifest · sorted by altitude
            </div>
            <div className="max-h-64 divide-y divide-glass-edge overflow-y-auto">
              {[...SATELLITES]
                .filter((s) => !hidden.has(s.id))
                .sort((a, b) => a.altitudeKm - b.altitudeKm)
                .map((s) => {
                  const pos = satellitePosition(s, simDate);
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: s.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{s.name}</div>
                        <div className="label-tele text-[8px] text-muted-foreground/70">
                          {s.owner}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {Math.round(pos.lat)}° {Math.round(pos.lon)}°
                        </div>
                        <div className="font-mono text-[10px] tabular-nums text-secondary">
                          {s.altitudeKm.toLocaleString()} km
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Equator() {
  const geom = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  return (
    <primitive
      object={
        new THREE.Line(
          geom,
          new THREE.LineBasicMaterial({ color: "#4FD1FF", transparent: true, opacity: 0.25 }),
        )
      }
    />
  );
}

function SatelliteBody({ sat, simRef }: { sat: Satellite; simRef: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);

  const orbitLine = useMemo(() => {
    const pts = orbitPoints(sat, 1, 120);
    const geom = new THREE.BufferGeometry().setFromPoints(
      pts.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    );
    return new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({ color: sat.color, transparent: true, opacity: 0.18 }),
    );
  }, [sat]);

  useFrame(({ clock }) => {
    const pos = satellitePosition(sat, new Date(simRef.current));
    group.current?.position.set(pos.x, pos.y, pos.z);
    if (pulse.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 2.4 + sat.phaseRad) * 0.35;
      pulse.current.scale.setScalar(s);
    }
  });

  const showLabel = sat.type === "crewed" || sat.type === "science";

  return (
    <>
      <primitive object={orbitLine} />
      <group ref={group}>
        <mesh ref={pulse}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshBasicMaterial color={sat.color} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color={sat.color} transparent opacity={0.25} />
        </mesh>
        {showLabel && (
          <Html distanceFactor={16} center style={{ pointerEvents: "none" }}>
            <div className="label-tele whitespace-nowrap rounded-md border border-border bg-background/80 px-2 py-1 text-[9px] text-foreground backdrop-blur">
              {sat.name}
            </div>
          </Html>
        )}
      </group>
    </>
  );
}
