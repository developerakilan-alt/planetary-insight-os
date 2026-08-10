import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { lazy, useEffect, useRef, useState } from "react";
import { ArrowRight, Play, Radar, Layers, Orbit, Gauge } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { Nebula } from "@/components/Nebula";
import { HeroHud } from "@/components/HeroHud";
import { TiltCard } from "@/components/motion/TiltCard";
import { Magnetic } from "@/components/motion/Magnetic";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { bodyMap, type BodyId } from "@/data/bodies";

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

  const body = bodyMap[SEQUENCE[index] ?? "earth"];

  return (
    <>
      <div ref={ref} className="relative h-[500vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <Nebula />
          <HeroHud />
          <div className="absolute inset-0">
            <ClientOnly>
              <HeroScene bodyId={SEQUENCE[index] ?? "earth"} />
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

          <motion.div
            style={{ opacity: titleOpacity, y: titleY }}
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6"
          >
            <div className="mx-auto max-w-[1600px] text-center">
              <div className="label-tele mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-secondary" />
                Planetary Intelligence · Build 4.2.1
              </div>
              <h1 className="text-gradient font-display text-[clamp(2.9rem,8.5vw,8rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
                COSMOS OS
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
                AI Powered Planetary Intelligence Platform — The Future of Planetary Exploration.
              </p>
              <div className="pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-3">
                <Magnetic strength={0.18}>
                  <Link
                    to="/explorer"
                    className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
                    style={{ boxShadow: "var(--shadow-glow)" }}
                  >
                    Launch Explorer
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Magnetic>
                <Magnetic strength={0.18}>
                  <Link
                    to="/missions"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-border-strong bg-card/60 px-6 text-sm font-medium backdrop-blur-xl transition-colors hover:bg-card"
                  >
                    <Play className="h-4 w-4" />
                    Watch Mission
                  </Link>
                </Magnetic>
                <Magnetic strength={0.18}>
                  <Link
                    to="/research"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                  >
                    Open Research Console
                  </Link>
                </Magnetic>
              </div>
            </div>
          </motion.div>

          {/* live telemetry rail */}
          <div className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-background/50 backdrop-blur-xl">
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

      <Capabilities />
    </>
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
          <div className="label-tele">Platform capabilities</div>
          <h2 className="mt-4 text-[clamp(1.7rem,3.4vw,2.8rem)] font-semibold leading-[1.05]">
            One console for exploration, analysis and mission planning.
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
                  className="panel lift block h-full p-6"
                >
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

        <div className="mt-24 grid gap-4 lg:grid-cols-3">
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
