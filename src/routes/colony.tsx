import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CloudSun,
  Download,
  FlaskConical,
  Radiation,
  ShieldCheck,
  Sprout,
  Thermometer,
  TriangleAlert,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageMasthead } from "@/components/PageMasthead";
import { Slider } from "@/components/ui/slider";
import { BODIES, type BodyId } from "@/data/bodies";
import {
  buildColonyBlueprint,
  defaultParams,
  terraformSimulate,
  type TerraformParams,
} from "@/lib/colony";
import { downloadTextFile } from "@/lib/report";

export const Route = createFileRoute("/colony")({
  head: () => ({
    meta: [
      { title: "Colony & Terraforming Planner — Cosmos OS" },
      {
        name: "description",
        content:
          "Simulate terraforming across the solar system: tune atmosphere, reflectors, water and shielding to raise a world's habitability score.",
      },
      { property: "og:title", content: "Colony Planner — Cosmos OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Colony,
});

const SOLID_BODIES: BodyId[] = [
  "mercury",
  "venus",
  "moon",
  "mars",
  "pluto",
  "europa",
  "titan",
  "enceladus",
  "ganymede",
];

const SLIDERS: {
  key: keyof TerraformParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "co2Pct",
    label: "Atmospheric CO₂",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    icon: <CloudSun className="h-4 w-4" />,
  },
  {
    key: "reflectorsGw",
    label: "Orbital reflectors",
    min: 0,
    max: 200,
    step: 5,
    unit: "GW",
    icon: <Thermometer className="h-4 w-4" />,
  },
  {
    key: "waterGt",
    label: "Water delivery",
    min: 0,
    max: 5000,
    step: 50,
    unit: "Gt",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    key: "ghgPpm",
    label: "Greenhouse gases",
    min: 0,
    max: 10000,
    step: 100,
    unit: "ppm",
    icon: <FlaskConical className="h-4 w-4" />,
  },
  {
    key: "shieldPct",
    label: "Magnetosphere shield",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
];

function Colony() {
  const [bodyId, setBodyId] = useState<BodyId>("mars");
  const [params, setParams] = useState<TerraformParams>(() => defaultParams("mars"));

  const body = BODIES.find((b) => b.id === bodyId)!;
  const result = terraformSimulate(bodyId, params);

  useEffect(() => {
    setParams(defaultParams(bodyId));
  }, [bodyId]);

  const set = (key: keyof TerraformParams, value: number) =>
    setParams((p) => ({ ...p, [key]: value }));

  const download = () => {
    downloadTextFile(
      `cosmos-os-colony-${bodyId}-${new Date().toISOString().slice(0, 10)}.md`,
      buildColonyBlueprint(bodyId, params, result),
    );
    toast.success("Settlement blueprint downloaded");
  };

  const stagePct = (result.stageIndex / (STAGES_MAX - 1)) * 100;

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Colony & terraforming planner"
        icon={<Sprout className="h-4 w-4" />}
        title={
          <>
            Engineering a <em className="text-editorial">habitable world.</em>
          </>
        }
        description="Tune the levers of planetary engineering — atmosphere, insolation, water and shielding — and watch a deterministic habitability model respond in real time."
        meta={[
          { label: "Target", value: body.name },
          { label: "Stage", value: result.stage },
          { label: "Habitability", value: `${result.habitability}/100` },
          { label: "Timeline", value: `${result.timelineYears} years` },
        ]}
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {SOLID_BODIES.map((id) => {
          const b = BODIES.find((x) => x.id === id)!;
          return (
            <button
              key={id}
              onClick={() => setBodyId(id)}
              aria-pressed={bodyId === id}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                bodyId === id
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "glass-chip text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.name}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Controls */}
        <div className="panel p-6">
          <div className="label-tele mb-1 flex items-center gap-2 text-primary">
            <CloudSun className="h-3.5 w-3.5" />
            Terraforming levers
          </div>
          <p className="mb-6 text-[13px] leading-relaxed text-muted-foreground">
            Baseline: {body.name} — {body.metrics.tempC[0]}…{body.metrics.tempC[1]} °C ·{" "}
            {body.metrics.pressureBar} bar
          </p>

          <div className="space-y-7">
            {SLIDERS.map((s) => (
              <div key={s.key}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-foreground/90">
                    <span className="text-primary">{s.icon}</span>
                    {s.label}
                  </div>
                  <div className="font-mono text-sm tabular-nums text-primary">
                    {params[s.key]}
                    <span className="ml-1 text-[10px] text-muted-foreground">{s.unit}</span>
                  </div>
                </div>
                <Slider
                  value={[params[s.key]]}
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  onValueChange={(v) => set(s.key, v[0]!)}
                  className="mt-3"
                />
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-center gap-2">
            <button
              onClick={() => setParams(defaultParams(bodyId))}
              className="glass-chip rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Reset to baseline
            </button>
            <button
              onClick={download}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
            >
              <Download className="h-4 w-4" />
              Download blueprint
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="panel relative overflow-hidden p-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="label-tele text-[9px] text-muted-foreground">
                  Habitability index
                </div>
                <div className="mt-2 font-display text-5xl font-semibold tabular-nums tracking-tight">
                  {result.habitability}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <div
                  className="mt-1 font-mono text-sm"
                  style={{ color: stageColor(result.habitability) }}
                >
                  {result.stage}
                </div>
              </div>
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
                    stroke={stageColor(result.habitability)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.habitability / 100) * 264} 264`}
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="label-tele text-[8px]">stage</div>
                  <div className="font-mono text-lg tabular-nums">
                    {result.stageIndex + 1}/{STAGES_MAX}
                  </div>
                </div>
              </div>
            </div>

            {/* stage meter */}
            <div className="mt-5">
              <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
                <span>Dead rock</span>
                <span>Earth-like</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-glass-fill">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stagePct}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, #FF5A5F, #F5C542, #4FD1FF, #7EF9C6)`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResultMetric
                label="Mean temp"
                value={`${result.temperatureC} °C`}
                tone={tempTone(result.temperatureC)}
              />
              <ResultMetric label="Pressure" value={`${result.pressureBar} bar`} />
              <ResultMetric label="Water cover" value={`${result.surfaceWaterPct}%`} />
              <ResultMetric
                label="Radiation dose"
                value={`${result.radiationDose}%`}
                tone={result.radiationDose > 60 ? "danger" : "success"}
              />
            </div>
          </div>

          {result.infeasible && (
            <div className="flex items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              This parameter set cannot sustain the levers — the world remains frozen and airless.
            </div>
          )}

          <div className="panel-flat p-5">
            <div className="label-tele mb-3 flex items-center gap-2 text-primary">
              <TriangleAlert className="h-3.5 w-3.5" />
              Risk register
            </div>
            <div className="space-y-2">
              {result.risks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No major risks flagged for this configuration.
                </p>
              )}
              {result.risks.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center gap-3 rounded-xl border border-glass-edge bg-glass-fill px-3 py-2 text-sm"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      r.severity === "high"
                        ? "bg-danger"
                        : r.severity === "medium"
                          ? "bg-warning"
                          : "bg-secondary"
                    }`}
                  />
                  <span className="flex-1 text-foreground/90">{r.label}</span>
                  <span className="label-tele text-[8px] text-muted-foreground">{r.severity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-flat p-4">
            <div className="flex items-center gap-2">
              <Radiation className="h-4 w-4 text-primary" />
              <div className="label-tele text-[9px]">Model transparency</div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              This is a transparent, deterministic approximation for scenario exploration — not a
              validated climate model, and not an engineering design. See the blueprint for the full
              risk register.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const STAGES_MAX = 7;

function ResultMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "success" | undefined;
}) {
  const cls =
    tone === "danger" ? "text-danger" : tone === "success" ? "text-secondary" : "text-foreground";
  return (
    <div className="panel-flat p-3">
      <div className="label-tele text-[9px]">{label}</div>
      <div className={`mt-1 font-mono text-sm tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function stageColor(h: number): string {
  if (h >= 70) return "#7EF9C6";
  if (h >= 45) return "#4FD1FF";
  if (h >= 20) return "#F5C542";
  return "#9B8CFF";
}

function tempTone(t: number): "danger" | "success" | undefined {
  if (t > 60 || t < -120) return "danger";
  if (t > -20 && t < 40) return "success";
  return undefined;
}
