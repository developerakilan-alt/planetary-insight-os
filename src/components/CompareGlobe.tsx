import { lazy } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import { BODIES, getBody, type Body, type BodyId } from "@/data/bodies";
import { PLANET_CONFIGS } from "@/data/planets/configs";
import { useDeviceQuality } from "@/hooks/use-device-quality";

const ScientificGlobe = lazy(() => import("@/components/three/ScientificGlobe"));

const METRICS: {
  key: keyof Body["metrics"];
  label: string;
  unit: string;
  min: number;
  max: number;
  fmt: (v: number) => string;
}[] = [
  {
    key: "radiusKm",
    label: "Radius",
    unit: "km",
    min: 0,
    max: 72000,
    fmt: (v) => v.toLocaleString(),
  },
  { key: "gravity", label: "Gravity", unit: "m/s²", min: 0, max: 26, fmt: (v) => v.toFixed(2) },
  {
    key: "escapeVelocity",
    label: "Escape velocity",
    unit: "km/s",
    min: 0,
    max: 60,
    fmt: (v) => v.toFixed(1),
  },
  {
    key: "pressureBar",
    label: "Pressure",
    unit: "bar",
    min: 0,
    max: 1,
    fmt: (v) => (v > 10 ? v.toFixed(0) : v.toFixed(3)),
  },
];

/** Side-by-side scale comparison of two bodies on interactive 3D globes. */
export function CompareGlobe({ aId, bId }: { aId: BodyId; bId: BodyId }) {
  const a = getBody(aId);
  const b = getBody(bId);
  const { maxDpr } = useDeviceQuality();
  if (!a || !b) return null;

  return (
    <div className="panel p-6">
      <div className="label-tele mb-4">
        Scale comparison · {a.name} vs {b.name}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[a, b].map((body) => (
          <div key={body.id} className="space-y-3">
            <div className="relative h-[300px] overflow-hidden rounded-xl border border-border">
              <ClientOnly
                fallback={
                  <div className="absolute inset-0 grid place-items-center label-tele">
                    Initialising renderer…
                  </div>
                }
              >
                <ScientificGlobe
                  config={PLANET_CONFIGS[body.id]}
                  body={body}
                  options={{
                    quality: "auto",
                    mode: "natural",
                    rotation: "fast",
                    atmosphere: true,
                    clouds: true,
                  }}
                  maxDpr={maxDpr}
                />
              </ClientOnly>
              <div className="pointer-events-none absolute left-3 top-3">
                <div className="label-tele">{body.designation}</div>
                <div className="font-display text-xl font-semibold">{body.name}</div>
              </div>
            </div>

            <div className="space-y-2">
              {METRICS.map((m) => {
                const va = Number(a.metrics[m.key]);
                const vb = Number(b.metrics[m.key]);
                const span = m.max - m.min;
                return (
                  <div key={m.key}>
                    <div className="flex items-baseline justify-between">
                      <span className="label-tele">{m.label}</span>
                      <span className="font-mono text-xs tabular-nums">
                        {m.fmt(va)} vs {m.fmt(vb)} {m.unit}
                      </span>
                    </div>
                    <div className="mt-1.5 flex h-1.5 gap-1 overflow-hidden rounded-full bg-border">
                      <span
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${((va - m.min) / span) * 100}%` }}
                      />
                      <span
                        className="h-full rounded-full bg-secondary transition-all"
                        style={{ width: `${((vb - m.min) / span) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small picker used inside the dashboard to choose the comparison partner. */
export function ComparePicker({
  current,
  onSelect,
}: {
  current: BodyId;
  onSelect: (id: BodyId) => void;
}) {
  return (
    <select
      value=""
      onChange={(e) => e.target.value && onSelect(e.target.value as BodyId)}
      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
    >
      <option value="" className="bg-card">
        Compare with…
      </option>
      {BODIES.filter((b) => b.id !== current).map((b) => (
        <option key={b.id} value={b.id} className="bg-card">
          {b.name}
        </option>
      ))}
    </select>
  );
}
