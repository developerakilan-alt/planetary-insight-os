import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { lazy, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Map as MapIcon,
  Play,
  RefreshCcw,
  Satellite,
} from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { OnboardingTour } from "@/components/OnboardingTour";
import { BODIES, type BodyId } from "@/data/bodies";
import { useSpacecraftPositions } from "@/hooks/use-spacecraft-positions";

const SolarSystemScene = lazy(() => import("@/components/three/SolarSystemScene"));

export const Route = createFileRoute("/explorer/")({
  head: () => ({
    meta: [
      { title: "Planet Explorer — Cosmos OS" },
      {
        name: "description",
        content:
          "Navigate a live 3D solar system of nine bodies. Select any planet or moon to open its scientific dashboard.",
      },
      { property: "og:title", content: "Planet Explorer — Cosmos OS" },
      {
        property: "og:description",
        content:
          "A live 3D solar system with per-body scientific dashboards and AI terrain analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explorer,
});

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Explorer() {
  const navigate = useNavigate();
  const [focus, setFocus] = useState<BodyId | null>(null);
  const [mapView, setMapView] = useState(false);
  const [epoch, setEpoch] = useState<Date | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showSpacecraft, setShowSpacecraft] = useState(true);
  const { positions: spacecraftPositions } = useSpacecraftPositions(epoch);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as Element | null;
      if (t?.closest?.("input, textarea, select")) return;
      if (e.key === "m" && !e.metaKey && !e.ctrlKey && !e.altKey) setMapView((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const open = (id: BodyId) => navigate({ to: "/explorer/$body", params: { body: id } });

  const epochYear = epoch
    ? epoch.getFullYear() + (epoch.getMonth() + (epoch.getDate() - 1) / 31) / 12
    : null;

  const setEpochYear = (year: number) => {
    const y = Math.max(1900, Math.min(2100, Math.round(year * 100) / 100));
    setEpoch(new Date(`${Math.floor(y)}-01-01T12:00:00`));
  };

  // Animated epoch playback — scrubs through ~200 years in ~24s.
  useEffect(() => {
    if (!playing || !epoch) return;
    const t = setInterval(() => {
      setEpoch((e) => {
        if (!e) return e;
        const next = new Date(e);
        next.setFullYear(next.getFullYear(), next.getMonth() + 2, 1);
        if (next.getFullYear() > 2100) return e;
        return next;
      });
    }, 90);
    return () => clearInterval(t);
  }, [playing, epoch]);

  const togglePlay = () => {
    if (!epoch) setEpoch(new Date());
    setPlaying((p) => !p);
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
      <ClientOnly>
        <SolarSystemScene
          onSelect={open}
          focus={focus}
          epoch={epoch}
          mapView={mapView}
          spacecraft={showSpacecraft ? spacecraftPositions : null}
          onMissionSelect={(id) => navigate({ to: "/missions", search: { mission: id } })}
        />
      </ClientOnly>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,transparent_40%,var(--background)_100%)] opacity-70" />

      <div className="pointer-events-none absolute left-6 top-6 z-10 max-w-sm">
        <div className="label-tele">Orbital chart · Sol system</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Planet Explorer</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a body to open its dashboard, terrain analyzer and mission record.
        </p>
        <div className="label-tele mt-4 max-w-xs space-y-1 text-[9px] leading-relaxed text-muted-foreground">
          <div className="font-medium text-foreground">Missions</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {(
              [
                ["lander", "#F5C542"],
                ["orbiter", "#4FD1FF"],
                ["rover", "#7EF9C6"],
                ["flyby", "#9B8CFF"],
                ["crewed", "#6EE7B7"],
              ] as const
            ).map(([t, c]) => (
              <span key={t} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                {t}
              </span>
            ))}
          </div>
          <p>Dashed rings trace mission orbits. Click a marker to open its archive entry.</p>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-4 z-10 flex flex-col items-end gap-3 md:right-6 md:top-6">
        <button
          onClick={() => setMapView((v) => !v)}
          aria-pressed={mapView}
          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors ${
            mapView
              ? "border-primary/40 bg-primary/15 text-primary"
              : "glass-chip text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapIcon className="h-3.5 w-3.5" />
          {mapView ? "Planet view" : "Star map"}
          <kbd className="label-tele rounded border border-border px-1 text-[9px]">M</kbd>
        </button>
        <div className="panel p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="label-tele flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-primary" /> Time travel
              </div>
              <div className="label-tele mt-1 text-[9px]">
                {epoch ? "Real ephemeris · VSOP87" : "Animated model"}
              </div>
            </div>
            <button
              onClick={togglePlay}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                epoch
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "glass-chip text-muted-foreground hover:text-foreground"
              }`}
            >
              <Play className="h-3 w-3" />
              {epoch ? (playing ? "Pause" : "Play") : "Enable"}
            </button>
          </div>

          {epoch && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  title={playing ? "Pause time travel" : "Play through the years"}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                    playing
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {playing ? (
                    <RefreshCcw className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                </button>
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="date"
                  value={toLocalISODate(epoch)}
                  min="1900-01-01"
                  max="2100-12-31"
                  onChange={(e) => {
                    if (e.target.value) setEpoch(new Date(`${e.target.value}T12:00:00`));
                  }}
                  className="rounded-md border border-glass-edge bg-glass-fill px-2.5 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                />
                <button
                  onClick={() => {
                    setEpoch(new Date());
                    setPlaying(false);
                  }}
                  className="glass-chip rounded-full px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Now
                </button>
              </div>
              <input
                type="range"
                min={1900}
                max={2100}
                step={0.25}
                value={epochYear ?? 2026}
                onChange={(e) => setEpochYear(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
                aria-label="Timeline scrubber"
              />
              <div className="flex items-center justify-between">
                <span className="label-tele text-[9px]">1900</span>
                <span className="font-mono text-xs tabular-nums text-primary">
                  {epochYear?.toFixed(1)} CE
                </span>
                <span className="label-tele text-[9px]">2100</span>
              </div>
              <p className="label-tele text-[9px] leading-relaxed text-muted-foreground">
                Planets use real ephemeris (astronomy-engine). Satellite positions are illustrative.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => setShowSpacecraft((s) => !s)}
                  className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-[10px] transition-colors ${
                    showSpacecraft
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-glass-edge bg-glass-fill text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Satellite className={`h-3.5 w-3.5 ${showSpacecraft ? "text-primary" : ""}`} />
                  <span className="flex-1 font-medium">Spacecraft · JPL Horizons</span>
                  <span
                    className={`flex h-3.5 w-6 items-center rounded-full border transition-colors ${
                      showSpacecraft
                        ? "justify-end border-primary/50 bg-primary/40"
                        : "justify-start border-border bg-background"
                    }`}
                  >
                    <span className="mx-0.5 block h-2.5 w-2.5 rounded-full bg-foreground" />
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4"
      >
        <div className="panel mx-auto flex max-w-[1600px] gap-2 overflow-x-auto p-2">
          {BODIES.map((b) => (
            <button
              key={b.id}
              onMouseEnter={() => setFocus(b.id)}
              onMouseLeave={() => setFocus(null)}
              onClick={() => open(b.id)}
              className="group min-w-40 flex-1 rounded-xl border border-transparent px-4 py-3 text-left transition-all hover:border-glass-edge-strong hover:bg-glass-fill-strong"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{b.name}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="label-tele mt-1 text-[9px]">{b.designation}</div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
                <span
                  className="block h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, (b.radius / 1) * 100)}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      <OnboardingTour />
    </div>
  );
}
