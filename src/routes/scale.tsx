import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Globe2, Ruler, Scale as ScaleIcon, Timer, Wind } from "lucide-react";
import { useMemo, useState } from "react";
import { PageMasthead } from "@/components/PageMasthead";
import { BODIES, type Body, type BodyId } from "@/data/bodies";

export const Route = createFileRoute("/scale")({
  head: () => ({
    meta: [
      { title: "Planet Scale Comparison — Cosmos OS" },
      {
        name: "description",
        content:
          "Compare planet and moon size, gravity, day length and escape velocity side by side with live relative scaling.",
      },
      { property: "og:title", content: "Scale Lab — Cosmos OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScaleLab,
});

type MetricKey = "radius" | "gravity" | "day" | "escape";
type ScaleMode = "linear" | "log";

const METRICS: { key: MetricKey; label: string; icon: React.ReactNode; unit: string }[] = [
  { key: "radius", label: "Radius", icon: <Ruler className="h-3.5 w-3.5" />, unit: "km" },
  { key: "gravity", label: "Gravity", icon: <Wind className="h-3.5 w-3.5" />, unit: "m/s²" },
  { key: "day", label: "Day length", icon: <Timer className="h-3.5 w-3.5" />, unit: "h" },
  {
    key: "escape",
    label: "Escape velocity",
    icon: <ScaleIcon className="h-3.5 w-3.5" />,
    unit: "km/s",
  },
];

function metricValue(b: Body, key: MetricKey): number {
  switch (key) {
    case "radius":
      return b.metrics.radiusKm;
    case "gravity":
      return b.metrics.gravity;
    case "day":
      return parseDayHours(b.metrics.dayLength);
    case "escape":
      return b.metrics.escapeVelocity;
  }
}

function parseDayHours(s: string): number {
  const m = s.match(/([\d.]+)\s*(h|hrs?|hours?)/i);
  if (m) return parseFloat(m[1]!);
  const d = s.match(/([\d.]+)\s*(Earth )?days?/i);
  if (d) return parseFloat(d[1]!) * 24;
  return 0;
}

function formatMetric(b: Body, key: MetricKey): string {
  if (key === "radius") return `${b.metrics.radiusKm.toLocaleString()} km`;
  if (key === "gravity") return `${b.metrics.gravity} m/s²`;
  if (key === "day") return b.metrics.dayLength;
  return `${b.metrics.escapeVelocity} km/s`;
}

function ScaleLab() {
  const [selected, setSelected] = useState<BodyId[]>(["earth", "mars", "jupiter", "moon"]);
  const [metric, setMetric] = useState<MetricKey>("radius");
  const [mode, setMode] = useState<ScaleMode>("linear");

  const toggle = (id: BodyId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-5)));

  const bodies = BODIES.filter((b) => selected.includes(b.id));
  const values = useMemo(
    () => bodies.map((b) => ({ body: b, value: metricValue(b, metric) })),
    [bodies, metric],
  );
  const maxValue = Math.max(1, ...values.map((v) => v.value));

  const display = (value: number) => {
    if (mode === "log") {
      const log = (x: number) => Math.log10(x);
      const lo = Math.min(...values.map((v) => log(Math.max(0.001, v.value))));
      const hi = log(maxValue);
      return 0.12 + ((log(Math.max(0.001, value)) - lo) / Math.max(1e-6, hi - lo)) * 0.88;
    }
    return Math.max(0.04, value / maxValue);
  };

  const sorted = useMemo(() => [...values].sort((a, b) => b.value - a.value), [values]);

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Scale lab"
        icon={<Globe2 className="h-4 w-4" />}
        title={
          <>
            Worlds, <em className="text-editorial">measured against each other.</em>
          </>
        }
        description="Drag planets in and out of the comparison bay and switch the yardstick — physical radius, surface gravity, day length or escape velocity. Scale is exact; display size uses an area-preserving ratio."
        meta={[
          { label: "Catalogue", value: "14 bodies" },
          { label: "Bay capacity", value: "5 worlds" },
          { label: "Mode", value: mode === "linear" ? "Linear" : "Logarithmic" },
          { label: "Metric", value: METRICS.find((m) => m.key === metric)?.label ?? "—" },
        ]}
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {BODIES.map((b) => (
          <button
            key={b.id}
            onClick={() => toggle(b.id)}
            aria-pressed={selected.includes(b.id)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              selected.includes(b.id)
                ? "border-primary/50 bg-primary/15 text-primary"
                : "glass-chip text-muted-foreground hover:text-foreground"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            aria-pressed={metric === m.key}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              metric === m.key
                ? "border-primary/50 bg-primary/15 text-primary"
                : "glass-chip text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 rounded-full border border-glass-edge bg-glass-fill p-1">
          {(["linear", "log"] as ScaleMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
                mode === m ? "bg-primary/20 text-primary" : "text-muted-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Visual bay */}
      <div className="panel mt-6 overflow-hidden">
        <div className="label-tele flex items-center justify-between border-b border-glass-edge px-6 py-3 text-[9px]">
          <span className="text-primary">
            Comparison bay · {METRICS.find((m) => m.key === metric)?.label}
          </span>
          <span>{mode === "linear" ? "linear scale" : "log scale"}</span>
        </div>
        <div className="flex min-h-[340px] items-end justify-around gap-4 px-6 py-10">
          {bodies.map((b, i) => {
            const v = metricValue(b, metric);
            const frac = display(v);
            const isEarth = b.id === "earth";
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-1 flex-col items-center"
              >
                <div className="flex h-56 w-full items-end justify-center">
                  <div
                    className="rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(18, frac * 180)}px`,
                      height: `${Math.max(18, frac * 180)}px`,
                      background: `radial-gradient(circle at 30% 28%, ${b.palette.high}, ${b.palette.low})`,
                      boxShadow: `0 0 40px ${b.palette.atmosphere}40, inset -12px -16px 40px rgba(0,0,0,0.5)`,
                    }}
                  />
                </div>
                <div className="mt-4 text-center">
                  <div className="font-display text-sm font-semibold">{b.name}</div>
                  <div className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {formatMetric(b, metric)}
                  </div>
                  {isEarth && (
                    <div className="label-tele mt-1 text-[8px] text-primary">reference</div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {bodies.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Select at least one body to populate the bay.
            </div>
          )}
        </div>
      </div>

      {/* Ranking table */}
      {sorted.length > 0 && (
        <div className="panel-flat mt-6 overflow-hidden">
          <div className="border-b border-glass-edge px-6 py-3">
            <div className="label-tele text-[9px] text-primary">
              Ranked · {METRICS.find((m) => m.key === metric)?.label} (
              {METRICS.find((m) => m.key === metric)?.unit})
            </div>
          </div>
          <div className="divide-y divide-glass-edge">
            {sorted.map(({ body, value }, i) => (
              <div key={body.id} className="flex items-center gap-4 px-6 py-3">
                <span className="w-6 font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                <span className="w-40 shrink-0 truncate font-display text-sm font-medium">
                  {body.name}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-glass-fill">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / maxValue) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${body.palette.low}, ${body.palette.high})`,
                    }}
                  />
                </div>
                <span className="w-40 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {formatMetric(body, metric)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-metric table */}
      <div className="panel-flat mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-glass-edge">
              <th className="px-6 py-3 label-tele text-[9px]">Body</th>
              {METRICS.map((m) => (
                <th key={m.key} className="px-6 py-3 label-tele text-[9px]">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodies.map((b) => (
              <tr key={b.id} className="border-b border-glass-edge/60 last:border-0">
                <td className="px-6 py-3 font-display font-medium">{b.name}</td>
                {METRICS.map((m) => (
                  <td
                    key={m.key}
                    className="px-6 py-3 font-mono text-xs tabular-nums text-muted-foreground"
                  >
                    {formatMetric(b, m.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
