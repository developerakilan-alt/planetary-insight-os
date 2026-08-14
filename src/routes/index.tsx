import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { lazy, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Gauge,
  Layers,
  Orbit,
  Play,
  Radar,
  Radio,
  Satellite,
} from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { Nebula } from "@/components/Nebula";
import { HeroHud } from "@/components/HeroHud";
import { TiltCard } from "@/components/motion/TiltCard";
import { Magnetic } from "@/components/motion/Magnetic";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { bodyMap, type BodyId } from "@/data/bodies";
import { MISSIONS, type Mission } from "@/data/missions";
import { dsnTargetName, fetchDsn, formatSignalRate, type DsnDish } from "@/lib/tracking";

const HeroScene = lazy(() => import("@/components/three/HeroScene"));

const SEQUENCE: BodyId[] = ["earth", "mars", "moon", "europa", "titan"];

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
  const [index, setIndex] = useState(0);
  const [spin, setSpin] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const titleOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.2], [0, -80]);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const i = Math.min(SEQUENCE.length - 1, Math.floor(v * SEQUENCE.length * 1.02));
      setIndex(i);
    });
    return () => unsub();
  }, [scrollYProgress]);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", setSpin);
    return () => unsub();
  }, [scrollYProgress]);

  const body = bodyMap[SEQUENCE[index] ?? "earth"];

  return (
    <>
      <div ref={ref} className="relative h-[500vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <Nebula />
          <HeroHud />
          <div className="absolute inset-0">
            <ClientOnly>
              <HeroScene bodyId={SEQUENCE[index] ?? "earth"} spin={spin} />
            </ClientOnly>
          </div>

          {/* vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, var(--background) 100%)",
              opacity: 0.85,
            }}
          />

          {/* time-of-day tint */}
          <TimeOfDayOverlay />

          {/* command-center split: left copy + right instrument readout */}
          <motion.div
            style={{ opacity: titleOpacity, y: titleY }}
            className="pointer-events-none absolute inset-0 z-10"
          >
            <div className="mx-auto flex h-full max-w-[1600px] items-center justify-center gap-12 px-6 xl:justify-between">
              <div className="pointer-events-auto max-w-xl text-center xl:mx-0 xl:text-left">
                <div className="label-tele mb-6 inline-flex items-center gap-2 rounded-full border border-glass-edge bg-glass-fill px-3 py-1.5 backdrop-blur-xl">
                  <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-secondary" />
                  Planetary Intelligence · Build 4.3.0
                </div>
                <h1 className="text-gradient font-display text-[clamp(2.9rem,7.5vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
                  COSMOS OS
                </h1>
                <p className="mx-auto mt-6 max-w-md text-balance text-base text-muted-foreground sm:text-lg xl:mx-0">
                  AI Powered Planetary Intelligence Platform —{" "}
                  <em className="text-editorial">the future of planetary exploration.</em>
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3 xl:justify-start">
                  <Magnetic strength={0.18}>
                    <Link
                      to="/explorer"
                      className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
                      style={{ boxShadow: "var(--shadow-glow)" }}
                    >
                      Launch Explorer
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Magnetic>
                  <Magnetic strength={0.18}>
                    <Link
                      to="/missions"
                      className="glass-chip inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-sm font-medium text-foreground"
                    >
                      <Play className="h-4 w-4" />
                      Watch Mission
                    </Link>
                  </Magnetic>
                  <Magnetic strength={0.18}>
                    <Link
                      to="/research"
                      className="glass-chip inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      Open Research Console
                    </Link>
                  </Magnetic>
                </div>
              </div>

              {/* permanent right-hand instrument panel */}
              <HeroReadout body={body} />
            </div>
          </motion.div>

          {/* scroll progress rail */}
          <ProgressRail index={index} />

          {/* live telemetry rail */}
          <div className="absolute inset-x-0 bottom-0 z-10 border-t border-glass-edge bg-background/40 backdrop-blur-2xl">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-10 gap-y-3 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="label-tele">Target</span>
                <span className="font-display text-sm">{body.name}</span>
                <span className="label-tele">{body.designation}</span>
              </div>
              <Tele label="Radius" value={`${body.metrics.radiusKm.toLocaleString()} km`} />
              <Tele label="Gravity" value={`${body.metrics.gravity} m/s²`} />
              <Tele
                label="Surface T"
                value={`${body.metrics.tempC[0]}…${body.metrics.tempC[1]} °C`}
              />
              <Tele label="Pressure" value={`${body.metrics.pressureBar} bar`} />
              <div className="ml-auto flex items-center gap-1.5">
                {SEQUENCE.map((id, i) => (
                  <span
                    key={id}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === index ? "w-8 bg-primary" : "w-3 bg-border-strong"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MissionTicker />
      <Capabilities />
      <MissionFocus />
      <MissionsSweep />
      <FaqChangelog />
    </>
  );
}

function TimeOfDayOverlay() {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => setHour(new Date().getHours()), []);
  const tint = useMemo(() => {
    if (hour === null) return "transparent";
    if (hour >= 5 && hour < 10) return "rgba(96,140,255,0.06)";
    if (hour >= 10 && hour < 17) return "rgba(120,180,255,0.05)";
    if (hour >= 17 && hour < 21) return "rgba(255,150,90,0.06)";
    return "rgba(16,12,58,0.14)";
  }, [hour]);
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(ellipse 90% 70% at 50% 45%, transparent 45%, ${tint} 100%)`,
      }}
    />
  );
}

function ProgressRail({ index }: { index: number }) {
  return (
    <div className="pointer-events-none absolute bottom-36 left-3 top-32 z-10 hidden flex-col items-center lg:flex">
      <span className="label-tele text-[9px] tracking-widest text-muted-foreground">MISSION</span>
      <div className="relative my-3 w-px flex-1 overflow-hidden bg-border-strong">
        <div
          className="absolute inset-x-0 top-0 bg-primary transition-all duration-500"
          style={{ height: `${((index + 1) / SEQUENCE.length) * 100}%` }}
        />
      </div>
      <div className="flex flex-col gap-3">
        {SEQUENCE.map((id, i) => (
          <span
            key={id}
            className={`label-tele text-[9px] transition-colors ${
              i === index ? "text-primary" : "text-muted-foreground/40"
            }`}
          >
            0{i + 1}
          </span>
        ))}
      </div>
      <span className="label-tele mt-3 text-[9px] tracking-widest text-muted-foreground">
        ROUTE
      </span>
    </div>
  );
}

function HeroReadout({ body }: { body: (typeof bodyMap)[keyof typeof bodyMap] }) {
  return (
    <div className="pointer-events-auto hidden w-80 xl:block">
      <div className="panel p-5">
        <div className="label-tele flex items-center justify-between">
          <span>Target readout</span>
          <span className="text-primary">{body.designation}</span>
        </div>
        <div className="mt-1 font-display text-2xl font-semibold">{body.name}</div>
        <dl className="mt-4 space-y-2.5">
          <ReadoutRow label="Radius" value={`${body.metrics.radiusKm.toLocaleString()} km`} />
          <ReadoutRow label="Gravity" value={`${body.metrics.gravity} m/s²`} />
          <ReadoutRow
            label="Surface T"
            value={`${body.metrics.tempC[0]}…${body.metrics.tempC[1]} °C`}
          />
          <ReadoutRow label="Pressure" value={`${body.metrics.pressureBar} bar`} />
          <ReadoutRow label="Escape v" value={`${body.metrics.escapeVelocity} km/s`} />
          <ReadoutRow label="Atmosphere" value={body.metrics.atmosphere} />
        </dl>
        <div className="mt-4 border-t border-border pt-3">
          <Link
            to="/explorer/$body"
            params={{ body: body.id }}
            className="label-tele flex items-center justify-between text-[9px] text-primary hover:underline"
          >
            <span className="text-muted-foreground">AI analysis</span>
            <span>OPEN INSTRUMENT →</span>
          </Link>
        </div>
        <div className="label-tele mt-4 flex items-center gap-2 border-t border-border pt-3 text-[9px]">
          <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-secondary" />
          <span>Systems online</span>
          <span className="ml-auto text-primary">DSP-4</span>
        </div>
      </div>
    </div>
  );
}

function ReadoutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0">
      <span className="label-tele">{label}</span>
      <span className="font-mono text-xs tabular-nums">{value}</span>
    </div>
  );
}

function Tele({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="label-tele">{label}</span>
      <span className="font-mono text-sm tabular-nums">{value}</span>
    </div>
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
    <section className="relative z-10 border-t border-border bg-background">
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
    <section className="relative z-10 border-t border-border bg-background">
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
    <section ref={ref} className="relative z-10 h-[280vh] border-t border-border bg-background">
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
    <section className="relative z-10 border-t border-border bg-background">
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
