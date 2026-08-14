import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Globe2, Orbit, Ruler, Search, Sparkles, Star, Thermometer, Weight } from "lucide-react";
import { useMemo, useState } from "react";
import { PageMasthead } from "@/components/PageMasthead";
import { Metric } from "@/components/Metric";
import {
  EXOPLANETS,
  esiScore,
  formatMass,
  formatRadius,
  habitabilityLabel,
  habitableZoneScore,
  type Exoplanet,
} from "@/lib/exoplanets";

export const Route = createFileRoute("/exoplanets")({
  head: () => ({
    meta: [
      { title: "Exoplanet Explorer — Cosmos OS" },
      {
        name: "description",
        content:
          "Browse a catalogue of real exoplanets with habitability scoring, Earth-similarity index and comparative metrics.",
      },
      { property: "og:title", content: "Exoplanet Explorer — Cosmos OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Exoplanets,
});

type SortKey = "esi" | "distance" | "period" | "name";

function Exoplanets() {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("esi");
  const [selectedId, setSelectedId] = useState<string>(EXOPLANETS[0]!.id);

  const classes = useMemo(() => [...new Set(EXOPLANETS.map((p) => p.clazz))], []);

  const visible = useMemo(() => {
    let list = EXOPLANETS.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        p.name.toLowerCase().includes(q) ||
        p.host.toLowerCase().includes(q) ||
        p.designation.toLowerCase().includes(q);
      const matchesClass = classFilter === "all" || p.clazz === classFilter;
      return matchesQuery && matchesClass;
    });
    list = [...list].sort((a, b) => {
      if (sort === "esi") return esiScore(b) - esiScore(a);
      if (sort === "distance") return a.distanceLy - b.distanceLy;
      if (sort === "period") return a.periodDays - b.periodDays;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [query, classFilter, sort]);

  const selected = EXOPLANETS.find((p) => p.id === selectedId) ?? EXOPLANETS[0]!;

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Exoplanet explorer"
        icon={<Globe2 className="h-4 w-4" />}
        title={
          <>
            Other worlds, <em className="text-editorial">ranked for Earth.</em>
          </>
        }
        description="A catalogue of confirmed exoplanets with measured mass, radius, orbit and temperature. The Earth Similarity Index (ESI) is computed from radius and equilibrium temperature."
        meta={[
          { label: "Catalogue", value: `${EXOPLANETS.length} worlds` },
          { label: "Closest", value: "Proxima Cen b · 4.2 ly" },
          { label: "Scope", value: "Confirmed only" },
          { label: "Metric", value: "ESI + habitability" },
        ]}
      />

      {/* Detail panel */}
      <div className="panel mt-8 overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                {selected.name}
              </h2>
              <span className="glass-chip rounded-full px-3 py-1 text-xs text-primary">
                {selected.clazz}
              </span>
              <span className="rounded-full border border-glass-edge bg-glass-fill px-3 py-1 font-mono text-[10px] text-muted-foreground">
                {selected.designation}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {selected.note}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label="ESI"
                value={`${esiScore(selected)} / 100`}
                tone="accent"
                sub={habitabilityLabel(selected)}
              />
              <Metric label="Distance" value={`${selected.distanceLy} ly`} sub="from Earth" />
              <Metric label="Mass" value={formatMass(selected.mass)} sub="Earth masses" />
              <Metric label="Radius" value={formatRadius(selected.radius)} sub="Earth radii" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label="Orbital period"
                value={`${selected.periodDays.toFixed(1)} d`}
                sub="host orbit"
              />
              <Metric
                label="Eq. temp"
                value={`${selected.eqTempK} K`}
                sub={`${Math.round(selected.eqTempK - 273.15)} °C`}
              />
              <Metric
                label="Detection"
                value={selected.method}
                sub={String(selected.discoveryYear)}
              />
              <Metric label="Host" value={selected.host} sub={selected.star} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-glass-edge bg-glass-fill p-6">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={esiColor(esiScore(selected))}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(esiScore(selected) / 100) * 264} 264`}
                />
              </svg>
              <div className="absolute text-center">
                <div className="font-mono text-2xl tabular-nums">{esiScore(selected)}</div>
                <div className="label-tele text-[8px]">ESI</div>
              </div>
            </div>
            <div className="label-tele text-[10px] text-muted-foreground">
              Habitable zone · {Math.round(habitableZoneScore(selected))}%
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <div className="flex min-w-56 flex-1 items-center gap-2 rounded-full border border-glass-edge bg-glass-fill px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search planets, hosts, designations…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="glass-chip rounded-full px-4 py-2 text-sm outline-none"
        >
          <option value="all">All classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="glass-chip rounded-full px-4 py-2 text-sm outline-none"
        >
          <option value="esi">Sort: Earth similarity</option>
          <option value="distance">Sort: distance</option>
          <option value="period">Sort: orbital period</option>
          <option value="name">Sort: name</option>
        </select>
      </div>

      {/* Ranking strip */}
      <div className="panel-flat mt-6 p-5">
        <div className="label-tele mb-3 flex items-center gap-2 text-primary">
          <Star className="h-3.5 w-3.5" />
          Earth similarity ranking
        </div>
        <div className="space-y-2">
          {EXOPLANETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="group flex w-full items-center gap-3 text-left"
            >
              <span className="w-40 shrink-0 truncate font-mono text-[11px] text-muted-foreground group-hover:text-foreground">
                {p.name}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-glass-fill">
                <span
                  className="block h-full rounded-full transition-all"
                  style={{ width: `${esiScore(p)}%`, background: esiColor(esiScore(p)) }}
                />
              </span>
              <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-foreground">
                {esiScore(p)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((p, i) => {
          const esi = esiScore(p);
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              onClick={() => setSelectedId(p.id)}
              className={`panel-flat lift p-5 text-left ${selectedId === p.id ? "border-primary/40" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate font-display text-[15px] font-semibold">
                      {p.name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{p.host}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{p.distanceLy} ly</span>
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px]"
                  style={{
                    color: esiColor(esi),
                    borderColor: `${esiColor(esi)}55`,
                    background: `${esiColor(esi)}18`,
                  }}
                >
                  ESI {esi}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div>
                  <div className="label-tele text-[8px]">Class</div>
                  <div className="mt-0.5 truncate font-mono text-[11px]">{p.clazz}</div>
                </div>
                <div>
                  <div className="label-tele text-[8px]">Radius</div>
                  <div className="mt-0.5 truncate font-mono text-[11px]">
                    {formatRadius(p.radius)}
                  </div>
                </div>
                <div>
                  <div className="label-tele text-[8px]">Temp</div>
                  <div className="mt-0.5 truncate font-mono text-[11px]">{p.eqTempK} K</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-glass-fill">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${esi}%`, background: esiColor(esi) }}
                  />
                </span>
                <span className="label-tele text-[8px] text-muted-foreground">
                  {habitabilityLabel(p)}
                </span>
              </div>
            </motion.button>
          );
        })}
        {visible.length === 0 && (
          <div className="panel-flat col-span-full p-10 text-center text-sm text-muted-foreground">
            No worlds match this filter.
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <span className="label-tele flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <Ruler className="h-3 w-3" /> Radius / Earth radii
        </span>
        <span className="label-tele flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <Weight className="h-3 w-3" /> Mass / Earth masses
        </span>
        <span className="label-tele flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <Thermometer className="h-3 w-3" /> Equilibrium temperature
        </span>
        <span className="label-tele flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <Orbit className="h-3 w-3" /> ESI is a simplified index — see documentation
        </span>
      </div>
    </div>
  );
}

function esiColor(esi: number): string {
  if (esi >= 80) return "#7EF9C6";
  if (esi >= 60) return "#4FD1FF";
  if (esi >= 40) return "#F5C542";
  return "#9B8CFF";
}
