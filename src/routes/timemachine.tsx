import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CalendarClock, ChevronLeft, ChevronRight, Pause, Play, Rocket, Timer } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import { PageMasthead } from "@/components/PageMasthead";
import { useSpacecraftPositions } from "@/hooks/use-spacecraft-positions";
import type { BodyId } from "@/data/bodies";

const SolarSystemScene = lazy(() => import("@/components/three/SolarSystemScene"));

export const Route = createFileRoute("/timemachine")({
  head: () => ({
    meta: [
      { title: "Time Machine — Cosmos OS" },
      {
        name: "description",
        content:
          "Replay the solar system at any epoch. Real ephemeris positions, mission presets and spacecraft trajectories through time.",
      },
      { property: "og:title", content: "Time Machine — Cosmos OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TimeMachine,
});

const MIN_MS = Date.UTC(1960, 0, 1);
const MAX_MS = Date.UTC(2050, 11, 31);
const DAY_MS = 86400000;

const PRESETS: { label: string; date: Date; note: string }[] = [
  {
    label: "Mariner 9 arrives",
    date: new Date(Date.UTC(1971, 10, 14)),
    note: "First spacecraft to orbit another planet.",
  },
  {
    label: "Voyager 2 launch",
    date: new Date(Date.UTC(1977, 7, 20)),
    note: "The Grand Tour begins.",
  },
  { label: "Apollo 11", date: new Date(Date.UTC(1969, 6, 20)), note: "First crewed Moon landing." },
  {
    label: "Perseverance lands",
    date: new Date(Date.UTC(2021, 1, 18)),
    note: "Jezero Crater — astrobiology rover.",
  },
  {
    label: "Mars opposition",
    date: new Date(Date.UTC(2026, 0, 16)),
    note: "Mars at closest approach to Earth.",
  },
  {
    label: "Europa Clipper arrives",
    date: new Date(Date.UTC(2030, 3, 11)),
    note: "First dedicated Europa ocean-world mission.",
  },
];

function TimeMachine() {
  const [epoch, setEpoch] = useState<Date>(() => new Date());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(7);
  const [focus, setFocus] = useState<BodyId | null>(null);
  const [showSpacecraft, setShowSpacecraft] = useState(true);
  const simEpoch = useRef(epoch.getTime());

  const { positions: spacecraftPositions } = useSpacecraftPositions(showSpacecraft ? epoch : null);

  useEffect(() => {
    simEpoch.current = epoch.getTime();
  }, [epoch]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let lastFlush = 0;
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      simEpoch.current += dt * speed * DAY_MS;
      if (simEpoch.current > MAX_MS) {
        simEpoch.current = MAX_MS;
        setPlaying(false);
        setEpoch(new Date(MAX_MS));
        return;
      }
      if (t - lastFlush > 65) {
        lastFlush = t;
        setEpoch(new Date(simEpoch.current));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const epochPct = useMemo(() => ((epoch.getTime() - MIN_MS) / (MAX_MS - MIN_MS)) * 100, [epoch]);

  const nudge = (days: number) => {
    setPlaying(false);
    const next = epoch.getTime() + days * DAY_MS;
    setEpoch(new Date(Math.max(MIN_MS, Math.min(MAX_MS, next))));
  };

  return (
    <div className="mx-auto max-w-[1640px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Time machine"
        icon={<CalendarClock className="h-4 w-4" />}
        title={
          <>
            Replay the system at <em className="text-editorial">any epoch.</em>
          </>
        }
        description="Bodies are placed at their true heliocentric positions from VSOP87 ephemeris for the chosen date. Step through history — or let the system orbit while you watch."
        meta={[
          { label: "Ephemeris", value: "VSOP87 / Pluto-P" },
          { label: "Range", value: "1960 → 2050" },
          { label: "Spacecraft", value: "JPL Horizons (live)" },
          { label: "Current", value: epoch.toUTCString().slice(5, 16) },
        ]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Scene */}
        <div className="panel relative h-[560px] overflow-hidden">
          <ClientOnly>
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Building ephemeris…
                </div>
              }
            >
              <SolarSystemScene
                epoch={epoch}
                focus={focus}
                onSelect={(id) => setFocus((f) => (f === id ? null : id))}
                spacecraft={showSpacecraft ? spacecraftPositions : null}
                frameloop={playing ? "always" : "demand"}
              />
            </Suspense>
          </ClientOnly>

          {/* Epoch readout */}
          <div className="pointer-events-none absolute left-5 top-5 rounded-2xl border border-glass-edge bg-background/70 px-4 py-3 backdrop-blur-xl">
            <div className="label-tele text-[9px] text-primary">Epoch</div>
            <div className="mt-0.5 font-mono text-sm tabular-nums text-foreground">
              {epoch.toUTCString().slice(5, 16)}
            </div>
            <div className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
              {epoch.toUTCString().slice(0, 4)}
            </div>
          </div>

          {focus && (
            <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full border border-glass-edge bg-background/70 px-4 py-2 text-xs text-muted-foreground backdrop-blur-xl">
              Focused on {BODY_LABEL(focus)} · click again to release
            </div>
          )}

          {/* Transport */}
          <div className="absolute inset-x-4 bottom-4">
            <div className="rounded-2xl border border-glass-edge bg-background/75 p-4 backdrop-blur-xl">
              <input
                type="range"
                min={MIN_MS}
                max={MAX_MS}
                step={DAY_MS}
                value={epoch.getTime()}
                onChange={(e) => {
                  setPlaying(false);
                  setEpoch(new Date(Number(e.target.value)));
                }}
                className="w-full accent-[#4FD1FF]"
                aria-label="Epoch"
              />
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => nudge(-speed * 2)}
                  className="glass-chip flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="Back 14 days"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  onClick={() => nudge(speed * 2)}
                  className="glass-chip flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="Forward 14 days"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1 rounded-full border border-glass-edge bg-glass-fill p-1">
                  {[
                    [1, "1d/s"],
                    [7, "7d/s"],
                    [30, "30d/s"],
                  ].map(([v, label]) => (
                    <button
                      key={String(v)}
                      onClick={() => setSpeed(Number(v))}
                      className={`rounded-full px-3 py-1.5 font-mono text-[10px] transition-colors ${
                        speed === v ? "bg-primary/20 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setPlaying(false);
                    setEpoch(new Date());
                  }}
                  className="glass-chip flex items-center gap-2 rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Timer className="h-3.5 w-3.5" />
                  Now
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="label-tele text-[8px] text-muted-foreground">1960</div>
                <div className="h-1 flex-1 mx-4 overflow-hidden rounded-full bg-glass-fill">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${epochPct}%` }}
                  />
                </div>
                <div className="label-tele text-[8px] text-muted-foreground">2050</div>
              </div>
            </div>
          </div>
        </div>

        {/* Presets + layer toggles */}
        <div className="space-y-4">
          <div className="panel-flat p-4">
            <div className="label-tele mb-3 flex items-center gap-2 text-primary">
              <Rocket className="h-3.5 w-3.5" />
              Historical moments
            </div>
            <div className="space-y-2">
              {PRESETS.map((p) => {
                const active = epoch.getTime() === p.date.getTime();
                return (
                  <button
                    key={p.label}
                    onClick={() => {
                      setPlaying(false);
                      setEpoch(p.date);
                      setFocus(null);
                    }}
                    className={`panel-flat lift w-full p-3 text-left ${active ? "border-primary/40" : ""}`}
                  >
                    <div className="font-display text-[13px] font-semibold">{p.label}</div>
                    <div className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                      {p.date.toUTCString().slice(5, 16)}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {p.note}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel-flat p-4">
            <div className="label-tele mb-3 text-[9px] text-muted-foreground">Layers</div>
            <label className="flex cursor-pointer items-center justify-between gap-3 py-2">
              <span className="text-sm text-foreground/90">Spacecraft trajectories</span>
              <input
                type="checkbox"
                checked={showSpacecraft}
                onChange={(e) => setShowSpacecraft(e.target.checked)}
                className="h-4 w-4 accent-[#4FD1FF]"
              />
            </label>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Real positions from JPL Horizons are fetched when available for the selected epoch.
            </p>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel-flat p-4">
            <div className="label-tele text-[9px] text-muted-foreground">Signal latency</div>
            <div className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
              {epoch.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Click any world in the scene to focus the camera on it.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function BODY_LABEL(id: BodyId): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
