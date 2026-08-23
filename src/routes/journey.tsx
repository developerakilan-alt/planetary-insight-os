import { createFileRoute, Link } from "@tanstack/react-router";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { BodyId } from "@/data/bodies";
import { bodyMap } from "@/data/bodies";
import { HERO_ORDER } from "@/lib/hero-sequence";
import { ClientOnly } from "@/components/ClientOnly";
import { RingSystem } from "@/components/three/SpaceEffects";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [{ title: "Planet Journey — Cosmos OS" }],
  }),
  component: JourneyPage,
});

function textureUrl(id: BodyId): string {
  return `/textures/${id}/color_H.jpg`;
}

HERO_ORDER.forEach((id) => {
  void useLoader.preload(THREE.TextureLoader, textureUrl(id));
});

const RIGHT_OFFSET = 1.9; // planets sit right-of-centre
const JOURNEY_GAP = 7.5; // neighbours wait fully off-frame

class BodyErrorBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

function JourneyBody({ bodyId }: { bodyId: BodyId }) {
  const body = bodyMap[bodyId];
  const map = useLoader(THREE.TextureLoader, textureUrl(bodyId));

  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.anisotropy = 8;
    map.needsUpdate = true;
  }, [map]);

  return (
    <group rotation={[0, 0, (body.tilt * Math.PI) / 180]}>
      <mesh>
        <sphereGeometry args={[1, 96, 48]} />
        <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
      </mesh>
      {bodyId === "saturn" && <RingSystem />}
    </group>
  );
}

/** All planets stay mounted; a damped index slides them through from the right. */
function JourneyScene({ index }: { index: number }) {
  const slots = useRef<(THREE.Group | null)[]>([]);
  const current = useRef(0);

  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05);
    current.current = THREE.MathUtils.damp(current.current, index, 5, t);
    for (let i = 0; i < HERO_ORDER.length; i++) {
      const g = slots.current[i];
      if (!g) continue;
      const d = i - current.current;
      g.position.x = RIGHT_OFFSET + d * JOURNEY_GAP;
      g.position.y = -0.1 - Math.min(Math.abs(d), 1) * 0.25;
      const s = 1.55 * Math.max(0.22, 1 - Math.max(0, Math.abs(d) - 0.15) * 0.3);
      g.scale.setScalar(Math.max(s, 0.0001));
      g.visible = s > 0.05 && Math.abs(d) < 1.15;
      g.rotation.y += t * 0.11;
    }
  });

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 2.5, 6]} intensity={2.5} color="#fff4e0" />
      <directionalLight position={[-4, -1, -3]} intensity={0.18} />
      {HERO_ORDER.map((id, i) => (
        <Suspense key={id} fallback={null}>
          <group
            ref={(el) => {
              slots.current[i] = el;
            }}
          >
            <BodyErrorBoundary>
              <JourneyBody bodyId={id} />
            </BodyErrorBoundary>
          </group>
        </Suspense>
      ))}
    </Canvas>
  );
}

function JourneyPage() {
  const [index, setIndex] = useState(() => Math.max(HERO_ORDER.indexOf("earth"), 0));
  const body = bodyMap[HERO_ORDER[index] ?? "earth"];

  const go = (dir: 1 | -1) =>
    setIndex((i) => Math.min(HERO_ORDER.length - 1, Math.max(0, i + dir)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative min-h-screen bg-black pt-24">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* left — name + description */}
        <div className="order-2 lg:order-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={body.id}
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
            >
              <p className="label-tele text-primary">
                {String(index + 1).padStart(2, "0")} / {String(HERO_ORDER.length).padStart(2, "0")}{" "}
                · {body.designation} · {body.system}
              </p>
              <h1 className="mt-3 font-display text-[clamp(2.6rem,5vw,4.4rem)] font-semibold leading-none tracking-[-0.04em]">
                {body.name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{body.classification}</p>
              <p className="mt-5 max-w-xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
                {body.summary}
              </p>

              <div className="mt-7 flex max-w-xl flex-wrap gap-2.5">
                <Chip label="Gravity" value={`${body.metrics.gravity} m/s²`} />
                <Chip label="Day" value={body.metrics.dayLength} />
                <Chip label="Year" value={body.metrics.orbitalPeriod} />
                <Chip label="Moons" value={String(body.metrics.moons)} />
              </div>

              <div className="pointer-events-auto mt-9 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => go(-1)}
                  disabled={index === 0}
                  aria-label="Previous planet"
                  className="glass-chip press flex h-11 w-11 items-center justify-center rounded-full text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => go(1)}
                  disabled={index === HERO_ORDER.length - 1}
                  aria-label="Next planet"
                  className="glass-chip press flex h-11 w-11 items-center justify-center rounded-full text-foreground disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <Link
                  to="/explorer/$body"
                  params={{ body: body.id }}
                  className="group ml-2 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-foreground"
                >
                  Open full profile
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/"
                  className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back home
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* right — the planet */}
        <div className="relative order-1 h-[42vh] lg:order-2 lg:h-[calc(100vh-10rem)]">
          <ClientOnly>
            <JourneyScene index={index} />
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="glass-chip inline-flex items-baseline gap-1.5 rounded-full px-3.5 py-1.5">
      <span className="label-tele">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </span>
  );
}
