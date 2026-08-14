import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Crosshair,
  Gauge,
  Orbit,
  Radar as RadarIcon,
  Satellite,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageMasthead } from "@/components/PageMasthead";
import { Metric } from "@/components/Metric";
import {
  NEO_CATALOGUE,
  formatDistKm,
  neoClassColor,
  neoLiveState,
  neoOffsetVector,
  type NeoObject,
} from "@/lib/neo";

export const Route = createFileRoute("/neo")({
  head: () => ({
    meta: [
      { title: "NEO Asteroid Radar — Cosmos OS" },
      {
        name: "description",
        content:
          "Live near-Earth object tracking: real orbital elements propagated in real time with current distance, velocity and next close approach.",
      },
      { property: "og:title", content: "NEO Radar — Cosmos OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NeoRadar,
});

const VIEW = 420;
const CENTER = VIEW / 2;
const GEO_AU = 0.00025;
const MOON_AU = 0.00257;
const SCALE_MAX = 0.006;

function NeoRadar() {
  const [now, setNow] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string>(NEO_CATALOGUE[0]!.id);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(t);
  }, []);

  const states = useMemo(
    () => NEO_CATALOGUE.map((o) => ({ obj: o, state: neoLiveState(o, now) })),
    [now],
  );
  const sorted = useMemo(
    () => [...states].sort((a, b) => a.state.distAu - b.state.distAu),
    [states],
  );
  const offsets = useMemo(
    () => NEO_CATALOGUE.map((o) => ({ obj: o, off: neoOffsetVector(o, now) })),
    [now],
  );
  const selected = NEO_CATALOGUE.find((o) => o.id === selectedId);
  const selectedState = states.find((s) => s.obj.id === selectedId)?.state;
  const selectedOff = offsets.find((o) => o.obj.id === selectedId)?.off;

  const closest = sorted[0];

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Near-Earth object radar"
        icon={<RadarIcon className="h-4 w-4" />}
        title={
          <>
            Watching for <em className="text-editorial">close approaches.</em>
          </>
        }
        description="Real orbital elements propagated in real time. Every blip is a tracked asteroid — its distance to Earth is recomputed from the equations of motion, not a lookup table."
        meta={[
          { label: "Tracked objects", value: NEO_CATALOGUE.length },
          {
            label: "Closest now",
            value: closest ? `${closest.obj.name} · ${formatDistKm(closest.state.distKm)}` : "—",
          },
          { label: "Refresh", value: "5 s" },
          { label: "Model", value: "Kepler propagation" },
        ]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Radar screen */}
        <div className="panel relative overflow-hidden p-6">
          <div className="flex items-center justify-between">
            <div className="label-tele flex items-center gap-2 text-primary">
              <Activity className="h-3.5 w-3.5" />
              Deep-space radar · viewplane ecliptic
            </div>
            <div className="label-tele flex items-center gap-2 text-[9px]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
              Sweeping
            </div>
          </div>

          <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="mt-2 w-full max-w-[520px] select-none">
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4FD1FF" stopOpacity="0.16" />
                <stop offset="60%" stopColor="#4FD1FF" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#4FD1FF" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4FD1FF" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4FD1FF" stopOpacity="0" />
              </linearGradient>
            </defs>

            <circle cx={CENTER} cy={CENTER} r={CENTER - 8} fill="url(#radarGlow)" />
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <circle
                key={f}
                cx={CENTER}
                cy={CENTER}
                r={(CENTER - 8) * f}
                fill="none"
                stroke="rgba(79,209,255,0.18)"
                strokeDasharray="3 5"
              />
            ))}
            <line x1={CENTER} y1={6} x2={CENTER} y2={VIEW - 6} stroke="rgba(79,209,255,0.12)" />
            <line x1={6} y1={CENTER} x2={VIEW - 6} y2={CENTER} stroke="rgba(79,209,255,0.12)" />

            {/* GEO ring */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={radarR(GEO_AU)}
              fill="none"
              stroke="#9B8CFF"
              strokeOpacity="0.4"
              strokeDasharray="2 4"
            />
            {/* Moon orbit ring */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={radarR(MOON_AU)}
              fill="none"
              stroke="#7EF9C6"
              strokeOpacity="0.5"
              strokeDasharray="2 4"
            />

            {/* Earth */}
            <circle cx={CENTER} cy={CENTER} r={6} fill="#4FD1FF">
              <animate attributeName="r" values="5;6.5;5" dur="3s" repeatCount="indefinite" />
            </circle>
            <text
              x={CENTER + 10}
              y={CENTER - 10}
              fill="#4FD1FF"
              fontSize="9"
              fontFamily="monospace"
            >
              EARTH
            </text>

            {offsets.map(({ obj, off }) => {
              const angle = Math.atan2(off.y, off.x);
              const r = radarR(off.distAu);
              const x = CENTER + Math.cos(angle) * r;
              const y = CENTER + Math.sin(angle) * r;
              const color = neoClassColor(obj.clazz);
              const isSelected = obj.id === selectedId;
              return (
                <g key={obj.id} onClick={() => setSelectedId(obj.id)} className="cursor-pointer">
                  <circle cx={x} cy={y} r={isSelected ? 9 : 7} fill={color} fillOpacity="0.18">
                    <animate
                      attributeName="r"
                      values={isSelected ? "7;11;7" : "5;9;5"}
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx={x} cy={y} r={isSelected ? 3.2 : 2.6} fill={color} />
                  <text
                    x={x + 9}
                    y={y + 3}
                    fill={color}
                    fontSize="8.5"
                    fontFamily="monospace"
                    opacity={isSelected ? 1 : 0.75}
                  >
                    {obj.name.replace(/^\d+\s*/, "")}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            {[
              ["#4FD1FF", "Aten"],
              ["#F5C542", "Apollo"],
              ["#FF5A5F", "Impact class"],
              ["#9B8CFF", "GEO belt"],
              ["#7EF9C6", "Lunar orbit"],
            ].map(([c, label]) => (
              <span key={label} className="label-tele flex items-center gap-1.5 text-[9px]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                {label}
              </span>
            ))}
          </div>

          {selected && selectedState && selectedOff && (
            <div className="panel-flat mt-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-semibold">{selected.name}</div>
                  <div className="label-tele mt-0.5 text-[9px]">
                    {selected.designation} · {selected.clazz}-class · {selected.discoveryYear}{" "}
                    discovery
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1 font-mono text-[10px] text-background"
                  style={{ background: neoClassColor(selected.clazz) }}
                >
                  {selected.clazz}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric
                  label="Range"
                  value={formatDistKm(selectedState.distKm)}
                  sub={selectedState.distAu.toFixed(4) + " AU"}
                  tone="accent"
                />
                <Metric
                  label="Velocity"
                  value={selectedState.velocityKmS.toFixed(2) + " km/s"}
                  sub={selectedState.approaching ? "inbound" : "outbound"}
                  tone={selectedState.approaching ? "success" : "default"}
                />
                <Metric
                  label="Diameter"
                  value={selected.diameterKm.toFixed(3) + " km"}
                  sub={selected.diameterKm < 0.05 ? "small object" : "watching"}
                />
                <Metric
                  label="Next approach"
                  value={
                    selectedState.nextApproach
                      ? selectedState.nextApproach.date.toLocaleDateString()
                      : "—"
                  }
                  sub={
                    selectedState.nextApproach
                      ? formatDistKm(selectedState.nextApproach.distAu * 149597870.7)
                      : "not soon"
                  }
                />
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
                {selected.note}{" "}
                {selectedState.nextApproach
                  ? `Modeled closest pass: ${selectedState.nextApproach.date.toLocaleDateString()}.`
                  : ""}
              </p>
            </div>
          )}
        </div>

        {/* Watchlist */}
        <div className="space-y-3">
          <div className="label-tele flex items-center justify-between px-1">
            <span className="flex items-center gap-2 text-primary">
              <Satellite className="h-3.5 w-3.5" />
              Watchlist · sorted by range
            </span>
            <span>{sorted.length} objects</span>
          </div>
          {sorted.map(({ obj, state }, i) => {
            const color = neoClassColor(obj.clazz);
            return (
              <motion.button
                key={obj.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                onClick={() => setSelectedId(obj.id)}
                className={`panel-flat lift flex w-full items-center gap-4 p-4 text-left ${
                  selectedId === obj.id ? "border-primary/40" : ""
                }`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${color}22`, color }}
                >
                  <Orbit className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display text-[13px] font-semibold">
                      {obj.name}
                    </span>
                    <span className="label-tele text-[8px] text-muted-foreground/70">
                      {obj.clazz}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 font-mono text-[11px] tabular-nums text-muted-foreground">
                    <span>{formatDistKm(state.distKm)}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{state.velocityKmS.toFixed(1)} km/s</span>
                    {state.approaching && (
                      <span className="flex items-center gap-1 text-secondary">
                        <Zap className="h-3 w-3" /> inbound
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs tabular-nums" style={{ color }}>
                    {state.nextApproach ? state.nextApproach.date.toLocaleDateString() : "—"}
                  </div>
                  <div className="label-tele mt-0.5 text-[8px] text-muted-foreground/60">
                    next pass
                  </div>
                </div>
              </motion.button>
            );
          })}

          <div className="panel-flat mt-2 p-4">
            <div className="label-tele flex items-center gap-2 text-[9px] text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              Torino scale
            </div>
            <div className="mt-2 flex items-center gap-2">
              {[0, 1, 2, 3, 4].map((t) => (
                <div
                  key={t}
                  className={`flex-1 rounded-md px-2 py-1 text-center font-mono text-[10px] ${
                    t === 0
                      ? "bg-glass-fill text-secondary"
                      : t <= 2
                        ? "bg-glass-fill text-warning"
                        : "bg-glass-fill text-danger"
                  }`}
                >
                  {t}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Current catalogue maxima are historic ratings (0–4). No known object poses a credible
              near-term impact threat.
            </p>
          </div>

          <div className="panel-flat p-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <div className="label-tele text-[9px]">Model transparency</div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Elements are real JPL SBDB values; live positions use two-body Kepler propagation
              (Earth from VSOP87). Readouts are model-derived and approximate — always verify
              against JPL Horizons.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Crosshair className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="label-tele text-[9px] text-muted-foreground">
          Sweep interval 5 s · viewplane projected from ecliptic coordinates
        </span>
      </div>
    </div>
  );
}

function radarR(distAu: number): number {
  const f = Math.min(1, distAu / SCALE_MAX);
  return 10 + (CENTER - 20) * Math.pow(f, 0.6);
}
