import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Layers,
  Orbit,
  Radar,
  Radio,
  Satellite,
  X,
} from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { Cover } from "@/components/ui/cover";
import { TiltCard } from "@/components/motion/TiltCard";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MISSIONS, type Mission } from "@/data/missions";
import { bodyMap, type BodyId } from "@/data/bodies";
import { HERO_ORDER, RAIL_ORDER, RAIL_START } from "@/lib/hero-sequence";
import { dsnTargetName, fetchDsn, formatSignalRate, type DsnDish } from "@/lib/tracking";

const HeroScene = lazy(() => import("@/components/three/HeroScene"));
const EarthScene = lazy(() => import("@/components/three/EarthScene"));

/** One-line caption per planet, shown under the focused planet's name. */
const CAPTIONS: Record<string, string> = {
  mercury: "A cratered iron world racing closest to the Sun — extremes of fire and ice.",
  venus: "Earth's scorching twin, wrapped in golden clouds of sulphuric acid.",
  earth: "The only known living world — a blue marble of oceans, forests and life.",
  mars: "The red desert world of giant volcanoes, canyons and ancient rivers.",
  saturn: "The jewel of the solar system, crowned in rings of ice and dust.",
  jupiter: "King of the giants — a storm larger than Earth has raged for centuries.",
  uranus: "An ice giant rolling on its side through pale methane skies.",
  neptune: "The farthest giant — supersonic winds sweep its deep azure face.",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cosmos OS — AI Powered Planetary Intelligence Platform" },
      {
        name: "description",
        content:
          "Cosmos OS is a planetary intelligence platform: 3D exploration of nine worlds, AI terrain analysis, landing-site scoring and the full mission archive.",
      },
      { property: "og:title", content: "Cosmos OS — The Future of Planetary Exploration" },
      {
        property: "og:description",
        content:
          "Explore nine worlds in 3D, score landing sites with AI and compare planetary datasets in one mission-grade console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  // Dossier state lives here so both entry points can drive the very same
  // right-side portrait: "Get Started" (Earth) and every "Explore …" action
  // in the solar-system rail below.
  const [mode, setMode] = useState<"hero" | "dossier">("hero");
  const [focusId, setFocusId] = useState<BodyId>("earth");

  const explore = (id: BodyId) => {
    // The planetary canvas is pinned to the very top of the page — jump
    // there first so the glide-to-the-right plays on screen.
    window.scrollTo({ top: 0 });
    setFocusId(id);
    setMode("dossier");
  };

  return (
    <>
      <EarthHero mode={mode} setMode={setMode} focusId={focusId} setFocusId={setFocusId} />
      <PlanetRail onExplore={explore} />
      <MissionTicker />
      <Capabilities />
      <MissionFocus />
      <MissionsSweep />
      <FaqChangelog />
    </>
  );
}

/**
 * Section 1 — the pin-style hero: a giant photo-real Earth rising from the
 * bottom of the viewport with an enormous "EARTH" wordmark behind it. Pinned
 * for 260vh while the camera dollies slowly toward the planet.
 *
 * Pressing "Get Started" doesn't navigate — the very same Earth mesh glides
 * smoothly across into a full right-side portrait while its name and
 * description appear on the left. Arrows cycle through every planet.
 */
function EarthHero({
  mode,
  setMode,
  focusId,
  setFocusId,
}: {
  mode: "hero" | "dossier";
  setMode: (m: "hero" | "dossier") => void;
  focusId: BodyId;
  setFocusId: Dispatch<SetStateAction<BodyId>>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const wordmarkY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const wordmarkOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const earth = bodyMap["earth"];

  const open = mode === "dossier";
  const focusIdx = HERO_ORDER.indexOf(focusId);
  const body = bodyMap[HERO_ORDER[focusIdx] ?? "earth"];

  const go = useCallback(
    (dir: 1 | -1) => {
      setFocusId((cur) => {
        const i = HERO_ORDER.indexOf(cur);
        const next = Math.min(HERO_ORDER.length - 1, Math.max(0, i + dir));
        return HERO_ORDER[next] ?? cur;
      });
    },
    [setFocusId],
  );

  // lock page scroll while the dossier is open; the canvas stays put beneath it
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") setMode("hero");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, setMode]);

  return (
    <section ref={ref} className="relative h-[260vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* layer 1 — typography, rendered BEHIND the globe so the planet occludes it */}
        {!open && (
          <motion.div
            style={{ y: wordmarkY, opacity: wordmarkOpacity }}
            className="pointer-events-none absolute inset-x-0 top-[13vh] z-10 text-center"
          >
            <p className="label-tele text-primary">SOL-III · Terrestrial planet — habitable</p>
            <h1 className="wordmark mt-3 bg-gradient-to-b from-white via-white to-white/30 bg-clip-text font-display font-bold uppercase text-transparent">
              Earth
            </h1>
            <p className="mx-auto mt-5 max-w-xl px-6 text-balance text-sm text-muted-foreground sm:text-base">
              {CAPTIONS["earth"]}
            </p>
          </motion.div>
        )}

        {/* layer 2 — the planets themselves */}
        <div className="absolute inset-0 z-20">
          <ClientOnly>
            <EarthScene mode={mode} focusId={open ? focusId : "earth"} spin={scrollYProgress} />
          </ClientOnly>
        </div>

        {/* layer 3 — call to action floating over the planetary glow */}
        {!open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[15vh] z-40 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setFocusId("earth");
                setMode("dossier");
              }}
              className="pointer-events-auto inline-block"
            >
              <Cover className="px-7 py-3.5 text-sm font-semibold tracking-wide">Get Started</Cover>
            </button>
          </div>
        )}

        {/* bottom telemetry strip */}
        {!open && (
          <div className="absolute inset-x-0 bottom-0 z-40 border-t border-glass-edge bg-background/60 backdrop-blur-xl">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-2 px-6 py-3 sm:grid-cols-5">
              <Stat label="Radius" value={`${earth.metrics.radiusKm.toLocaleString()} km`} />
              <Stat label="Gravity" value={`${earth.metrics.gravity} m/s²`} />
              <Stat label="Day length" value={earth.metrics.dayLength} />
              <Stat label="Orbital period" value={earth.metrics.orbitalPeriod} />
              <Stat label="Moons" value={String(earth.metrics.moons)} />
            </div>
          </div>
        )}

        {/* dossier overlay — name + description on the left, planet on the right */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="dossier"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 z-[70]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10 lg:via-black/35" />

              <button
                type="button"
                onClick={() => setMode("hero")}
                aria-label="Back to hero"
                className="glass-chip press absolute right-6 top-24 z-10 flex h-11 w-11 items-center justify-center rounded-full text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative mx-auto flex h-full max-w-7xl items-end px-6 pb-24 pt-28 lg:items-center lg:pb-16">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={focusId}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 22 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full max-w-xl"
                  >
                    <p className="label-tele text-primary">
                      {String(focusIdx + 1).padStart(2, "0")} /{" "}
                      {String(HERO_ORDER.length).padStart(2, "0")} · {body.designation} ·{" "}
                      {body.system}
                    </p>
                    <h2 className="mt-3 font-display text-[clamp(2.4rem,4.6vw,4rem)] font-semibold leading-none tracking-[-0.04em]">
                      {body.name}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">{body.classification}</p>
                    <p className="mt-5 text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {body.summary}
                    </p>

                    <div className="mt-7 flex flex-wrap gap-2.5">
                      <Chip label="Gravity" value={`${body.metrics.gravity} m/s²`} />
                      <Chip label="Day" value={body.metrics.dayLength} />
                      <Chip label="Year" value={body.metrics.orbitalPeriod} />
                      <Chip label="Moons" value={String(body.metrics.moons)} />
                    </div>

                    <div className="mt-9 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => go(-1)}
                        disabled={focusIdx === 0}
                        aria-label="Previous planet"
                        className="glass-chip press flex h-11 w-11 items-center justify-center rounded-full text-foreground disabled:opacity-30"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => go(1)}
                        disabled={focusIdx === HERO_ORDER.length - 1}
                        aria-label="Next planet"
                        className="glass-chip press flex h-11 w-11 items-center justify-center rounded-full text-foreground disabled:opacity-30"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <Link
                        to="/explorer/$body"
                        params={{ body: focusId }}
                        className="group ml-2 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-foreground"
                      >
                        Open full profile
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="label-tele">{label}</span>
      <span className="mt-0.5 font-mono text-xs text-foreground/90 sm:text-sm">{value}</span>
    </div>
  );
}

/**
 * Section 2 — the pinned scroll rail through the rest of the solar system
 * (every world except Earth), with depth-based cinematic parallax.
 */
function PlanetRail({ onExplore }: { onExplore: (id: BodyId) => void }) {
  const [focusIdx, setFocusIdx] = useState(RAIL_START);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const maxV = RAIL_ORDER.length - 1 - RAIL_START;
      const i = Math.min(
        RAIL_ORDER.length - 1,
        Math.max(RAIL_START, Math.round(RAIL_START + v * maxV)),
      );
      setFocusIdx(i);
    });
    return () => unsub();
  }, [scrollYProgress]);

  const body = bodyMap[RAIL_ORDER[focusIdx] ?? "mars"];

  return (
    <section>
      <div ref={ref} className="relative h-[480vh] border-t border-glass-edge/60">
        <div className="sticky top-0 h-screen overflow-hidden bg-black">
          <div className="absolute inset-0">
            <ClientOnly>
              <HeroScene spin={scrollYProgress} />
            </ClientOnly>
          </div>

          {/* focused planet name + caption */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center pt-[10vh] text-center">
            <p className="label-tele">
              {String(focusIdx + 1).padStart(2, "0")} / {String(RAIL_ORDER.length).padStart(2, "0")}{" "}
              · The solar system
            </p>
            <h2 className="text-gradient mt-2 font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-semibold leading-none tracking-[-0.03em]">
              {body.name}
            </h2>
            <p className="mt-3 max-w-xl px-6 text-balance text-sm text-muted-foreground sm:text-base">
              {CAPTIONS[body.id]}
            </p>
            <button
              type="button"
              onClick={() => onExplore(body.id)}
              className="label-tele pointer-events-auto mt-5 inline-flex items-center gap-1.5 text-[10px] text-primary transition-colors hover:text-foreground"
            >
              Explore {body.name} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionTicker() {
  const strip = MISSIONS.map((m) => `${m.name} · ${m.agency} · ${m.year}`);
  return (
    <div className="relative z-10 border-b border-glass-edge bg-glass-fill backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-background to-transparent" />
      <div className="overflow-hidden py-3">
        <div className="ticker-track flex w-max items-center gap-10 whitespace-nowrap">
          {[...strip, ...strip].map((s, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="label-tele">{s}</span>
              <span className="h-1 w-1 rounded-full bg-border-strong" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const CAPABILITIES = [
  {
    icon: Orbit,
    title: "Planet Explorer",
    body: "A live solar-system model with nine bodies, cinematic camera transitions and per-body dashboards.",
    to: "/explorer",
  },
  {
    icon: Radar,
    title: "Landing Site Analyzer",
    body: "Click any surface coordinate to score terrain safety, slope, ice probability and radiation risk.",
    to: "/explorer/$body",
    params: { body: "mars" },
  },
  {
    icon: Layers,
    title: "Mission Archive",
    body: "Apollo through Europa Clipper — landing coordinates, instrument payloads and confirmed discoveries.",
    to: "/missions",
  },
  {
    icon: Gauge,
    title: "Research Console",
    body: "Comparative planetology: gravity, thermal envelopes, atmospheric composition and orbital dynamics.",
    to: "/research",
  },
] as const;

function Capabilities() {
  return (
    <section className="relative z-10 border-t border-glass-edge bg-background/60">
      <div className="mx-auto max-w-[1600px] px-6 py-28">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="label-tele text-primary">01</span>
            <span className="label-tele">Capabilities</span>
          </div>
          <h2 className="mt-4 text-[clamp(1.7rem,3.4vw,2.8rem)] font-semibold leading-[1.05]">
            One console for exploration, analysis and{" "}
            <em className="text-editorial">mission planning.</em>
          </h2>
          <p className="mt-5 text-muted-foreground">
            Cosmos OS unifies scientific visualisation, published planetary datasets and an AI
            analysis engine into a single operating environment for research teams.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.07} y={28}>
              <TiltCard max={6}>
                <Link
                  to={c.to}
                  {...("params" in c ? { params: c.params } : {})}
                  className="panel lift scan-panel relative block h-full p-6"
                >
                  <span className="label-tele absolute right-6 top-6 text-[10px] text-muted-foreground">
                    0{i + 1}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-primary/10 text-primary">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-medium">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        <div className="mt-20 flex items-center gap-3">
          <span className="label-tele text-primary">01.1</span>
          <span className="label-tele">Instrument coverage</span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {(
            [
              [9, "Bodies modelled", "Terrestrial planets, ocean worlds and icy moons"],
              [10, "Missions archived", "Apollo · Voyager · Cassini · Artemis · Clipper"],
              [12, "Metrics per body", "Sourced from published planetary science literature"],
            ] as const
          ).map(([n, t, s], i) => (
            <Reveal key={t} delay={i * 0.08} y={20}>
              <div className="panel-flat p-8">
                <div className="font-display text-5xl font-semibold tracking-tight text-primary">
                  <CountUp to={n} />
                </div>
                <div className="mt-3 text-sm font-medium">{t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const MISSION_TYPE_COLORS: Record<Mission["type"], string> = {
  lander: "#F5C542",
  orbiter: "#4FD1FF",
  flyby: "#9B8CFF",
  rover: "#7EF9C6",
  crewed: "#6EE7B7",
  observatory: "#C084FC",
};

/** 02 — live mission focus: Europa Clipper countdown plus a real DSN readout. */
function MissionFocus() {
  const clipper = MISSIONS.find((m) => m.id === "europa-clipper") ?? MISSIONS[0]!;
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const target = Date.parse("2030-04-11T00:00:00Z");
    setDays(Math.max(0, Math.ceil((target - Date.now()) / 86_400_000)));
  }, []);

  return (
    <section className="relative z-10 border-t border-glass-edge bg-background/60">
      <div className="mx-auto max-w-[1600px] px-6 py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="label-tele text-primary">02</span>
              <span className="label-tele">Mission focus · live DSN</span>
            </div>
            <h2 className="mt-4 text-[clamp(1.7rem,3.4vw,2.6rem)] font-semibold leading-[1.05]">
              In transit, <em className="text-editorial">right now.</em>
            </h2>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <div className="panel lift scan-panel relative overflow-hidden p-8 lg:col-span-2">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="label-tele flex items-center gap-2 text-primary">
                  <Satellite className="h-3.5 w-3.5" /> ACTIVE MISSION
                </div>
                <h3 className="mt-3 font-display text-3xl font-semibold">{clipper.name}</h3>
                <div className="label-tele mt-1 text-[9px]">
                  {clipper.agency} · {clipper.year} · {clipper.type}
                </div>
              </div>
              <span className="label-tele flex items-center gap-1.5 rounded-full border border-glass-edge bg-glass-fill px-2.5 py-1 text-[9px] backdrop-blur-xl">
                <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-secondary" />
                {clipper.status.toUpperCase()}
              </span>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {clipper.summary}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-glass-edge bg-glass-fill p-4 backdrop-blur-xl">
                <div className="label-tele text-[9px]">TIME TO JOVIAN ARRIVAL</div>
                <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-primary">
                  {days === null ? "—" : `T−${days.toLocaleString()}d`}
                </div>
                <div className="label-tele mt-1 text-[9px]">2030 · Jupiter system insertion</div>
              </div>
              <div className="rounded-2xl border border-glass-edge bg-glass-fill p-4 backdrop-blur-xl">
                <div className="label-tele text-[9px]">PAYLOAD · SENSORS ONLINE</div>
                <div className="mt-2.5 space-y-1.5">
                  {["COMMS", "IMAGING", "RADAR", "MAGNETOMETER"].map((s) => (
                    <div key={s} className="label-tele flex items-center gap-2 text-[9px]">
                      <span className="h-1 w-1 animate-pulse-ring rounded-full bg-secondary" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/missions"
              search={{ mission: clipper.id }}
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Open archive entry <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <DsnPanel />
        </div>
      </div>
    </section>
  );
}

function DsnPanel() {
  const [dishes, setDishes] = useState<DsnDish[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchDsn()
      .then((snap) => {
        if (!cancelled) setDishes(snap.dishes);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const top = dishes?.slice(0, 4) ?? [];

  return (
    <div className="panel scan-panel relative flex flex-col overflow-hidden p-8">
      <div className="label-tele flex items-center gap-2 text-primary">
        <Radio className="h-3.5 w-3.5" /> Deep Space Network
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-semibold tabular-nums">
          {dishes ? dishes.length : "—"}
        </span>
        <span className="label-tele text-[9px]">ACTIVE DISHES</span>
      </div>

      <div className="mt-5 flex-1 space-y-3">
        {error ? (
          <p className="label-tele text-[9px] leading-relaxed text-muted-foreground">
            DSN feed unreachable. Standby for nominal data.
          </p>
        ) : dishes === null ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-border/40" />
            ))}
          </div>
        ) : top.length === 0 ? (
          <p className="label-tele text-[9px] leading-relaxed text-muted-foreground">
            No active uplinks reported.
          </p>
        ) : (
          top.map((d) => {
            const s = d.signals[0];
            return (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <div className="font-mono text-xs font-medium">{d.name}</div>
                  <div className="label-tele mt-0.5 text-[9px] text-muted-foreground">
                    {s ? dsnTargetName(s.target) : d.desc}
                  </div>
                </div>
                <span className="label-tele flex items-center gap-1.5 text-[9px]">
                  <span className="h-1 w-1 rounded-full bg-secondary" />
                  {s ? `${s.band} · ${formatSignalRate(s.rateBps)}` : "IDLE"}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="label-tele mt-5 flex items-center gap-2 border-t border-border pt-3 text-[9px]">
        <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-secondary" />
        LIVE FEED · eyes.nasa.gov
      </div>
    </div>
  );
}

/** 03 — pinned horizontal sweep through the mission timeline. */
function MissionsSweep() {
  const ref = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useEffect(() => {
    const measure = () => {
      const row = ref.current?.querySelector<HTMLElement>("[data-row]");
      if (row) setRange(Math.max(0, row.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const x = useTransform(scrollYProgress, [0, 1], [0, -range]);

  return (
    <section
      ref={ref}
      className="relative z-10 h-[280vh] border-t border-glass-edge bg-background/60"
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1600px] px-6 pt-20">
          <div className="flex items-center gap-3">
            <span className="label-tele text-primary">03</span>
            <span className="label-tele">Mission timeline · scroll to sweep</span>
          </div>
          <h2 className="mt-4 max-w-2xl text-[clamp(1.7rem,3.4vw,2.6rem)] font-semibold leading-[1.05]">
            Sixty years of exploration in a <em className="text-editorial">single sweep.</em>
          </h2>
        </div>

        <motion.div data-row style={{ x }} className="mt-10 flex w-max gap-4 px-6 pb-2">
          {MISSIONS.map((m, i) => (
            <Link
              key={m.id}
              to="/missions"
              search={{ mission: m.id }}
              className="panel lift scan-panel relative block w-72 shrink-0 overflow-hidden p-6"
            >
              <span className="label-tele absolute right-6 top-6 text-[10px] text-muted-foreground">
                {String(m.year).padStart(4, "0")}
              </span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl border text-[11px] font-semibold"
                style={{
                  borderColor: "var(--border)",
                  background: `color-mix(in oklab, ${MISSION_TYPE_COLORS[m.type]} 14%, transparent)`,
                  color: MISSION_TYPE_COLORS[m.type],
                }}
              >
                {m.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="mt-4 text-base font-medium leading-tight">{m.name}</div>
              <div className="label-tele mt-1 text-[9px]">
                {m.agency} · {m.type}
              </div>
              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {m.summary}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="label-tele flex items-center gap-1.5 text-[9px]">
                  <span
                    className={`h-1 w-1 rounded-full ${
                      m.status === "active"
                        ? "bg-secondary"
                        : m.status === "planned"
                          ? "bg-warning"
                          : "bg-border-strong"
                    }`}
                  />
                  {m.status.toUpperCase()}
                </span>
                <span className="label-tele text-[9px] text-primary">OPEN →</span>
              </div>
            </Link>
          ))}
        </motion.div>

        <div className="mx-auto mt-10 w-full max-w-[1600px] px-6">
          <div className="label-tele flex items-center gap-3 text-[9px]">
            <span>Sweep</span>
            <span className="h-px flex-1 bg-border" />
            <span>{MISSIONS.length} missions</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "Where does the data come from?",
    a: "Bodies use published planetary-science literature for physical metrics. Ephemeris positions are computed live with the astronomy-engine VSOP87 model, and live feeds (ISS, Deep Space Network, Perseverance) come from public NASA APIs.",
  },
  {
    q: "Is the 3D rendering pre-rendered?",
    a: "No. Every surface is synthesized on the GPU in real time — fractal terrain fields, cloud advection and atmospheric rim scattering — so no texture downloads are needed.",
  },
  {
    q: "What can the AI analysis engine do?",
    a: "It scores landing sites on terrain safety, slope, ice probability and radiation risk, compares bodies across twelve metrics, and can sonify datasets like surface gravity.",
  },
  {
    q: "Can I export the research?",
    a: "Yes. The Research Console exports a Markdown brief, a CSV dataset, or a print-to-PDF report of any comparison or site analysis.",
  },
];

const CHANGELOG = [
  {
    v: "4.2.1",
    date: "Aug 2026",
    notes: ["Command-center hero split", "Live DSN strip on home", "Mission timeline sweep"],
  },
  {
    v: "4.1.0",
    date: "Jun 2026",
    notes: [
      "Time-travel ephemeris in Explorer",
      "Real spacecraft positions (JPL Horizons)",
      "CSV export in Research Console",
    ],
  },
  {
    v: "4.0.0",
    date: "Mar 2026",
    notes: ["Nine-body solar system", "Landing-site AI scoring", "Command palette (⌘K)"],
  },
];

function FaqChangelog() {
  return (
    <section className="relative z-10 border-t border-glass-edge bg-background/60">
      <div className="mx-auto grid max-w-[1600px] gap-16 px-6 py-28 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-3">
            <span className="label-tele text-primary">04</span>
            <span className="label-tele">Frequently asked</span>
          </div>
          <h2 className="mt-4 text-[clamp(1.6rem,3vw,2.4rem)] font-semibold leading-[1.05]">
            Ground control <em className="text-editorial">questions.</em>
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="label-tele text-primary">05</span>
            <span className="label-tele">Changelog</span>
          </div>
          <h2 className="mt-4 text-[clamp(1.6rem,3vw,2.4rem)] font-semibold leading-[1.05]">
            Flight log.
          </h2>
          <div className="mt-8 space-y-8">
            {CHANGELOG.map((v) => (
              <Reveal key={v.v} y={16}>
                <div className="relative border-l border-border pl-6">
                  <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-sm font-semibold text-primary">v{v.v}</span>
                    <span className="label-tele text-[9px]">{v.date}</span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {v.notes.map((n) => (
                      <li key={n} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-border-strong" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
