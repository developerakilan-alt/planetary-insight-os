import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { FileDown, Printer } from "lucide-react";
import { BODIES, type BodyId } from "@/data/bodies";
import { SonifyToggle } from "@/components/SonifyToggle";
import { buildComparisonMarkdown, downloadTextFile } from "@/lib/report";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Console — Cosmos OS" },
      {
        name: "description",
        content:
          "Comparative planetology: gravity, thermal envelopes, escape velocity and atmospheric composition across nine bodies.",
      },
      { property: "og:title", content: "Research Console — Cosmos OS" },
      {
        property: "og:description",
        content:
          "Compare planetary datasets side by side with charts, radar profiles and a full metric table.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Research,
});

const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11 };

function Research() {
  const [selected, setSelected] = useState<BodyId[]>(["earth", "mars", "titan", "europa"]);
  const bodies = BODIES.filter((b) => selected.includes(b.id));

  const toggle = (id: BodyId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-5)));

  const sonifyValues = useMemo(
    () =>
      bodies.map((b) => ({
        label: b.name,
        value: b.metrics.gravity,
        range: [0, 26] as [number, number],
      })),
    [bodies],
  );

  const downloadReport = () => {
    if (bodies.length === 0) {
      toast.error("Select at least one body to export");
      return;
    }
    downloadTextFile(
      `cosmos-os-comparison-${new Date().toISOString().slice(0, 10)}.md`,
      buildComparisonMarkdown(bodies),
    );
    toast.success("Markdown brief downloaded");
  };

  const printReport = () => {
    window.print();
  };

  const gravity = bodies.map((b) => ({ name: b.name, value: b.metrics.gravity }));
  const temp = bodies.map((b) => ({
    name: b.name,
    min: b.metrics.tempC[0],
    max: b.metrics.tempC[1],
  }));
  const radar = ["Gravity", "Escape v", "Radius", "Water", "Atmosphere"].map((axis) => {
    const row: Record<string, string | number> = { axis };
    bodies.forEach((b) => {
      row[b.name] =
        axis === "Gravity"
          ? (b.metrics.gravity / 10) * 100
          : axis === "Escape v"
            ? (b.metrics.escapeVelocity / 12) * 100
            : axis === "Radius"
              ? (b.metrics.radiusKm / 6400) * 100
              : axis === "Water"
                ? b.metrics.water.includes("ocean")
                  ? 95
                  : b.metrics.water.includes("ice")
                    ? 60
                    : 15
                : Math.min(100, Math.log10(b.metrics.pressureBar + 1e-15) * 8 + 100);
    });
    return row;
  });

  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return (
    <div className="print-report mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <div className="label-tele">Research console</div>
      <h1 className="mt-3 text-[clamp(1.75rem,3.4vw,2.85rem)] font-semibold">
        Comparative planetology
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Select up to five bodies to compare physical, thermal and atmospheric parameters.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {BODIES.map((b) => (
          <button
            key={b.id}
            onClick={() => toggle(b.id)}
            aria-pressed={selected.includes(b.id)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              selected.includes(b.id)
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/15"
        >
          <FileDown className="h-4 w-4" /> Export brief (.md)
        </button>
        <button
          onClick={printReport}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Printer className="h-4 w-4" /> Print / PDF
        </button>
        <SonifyToggle label="Sonify gravity" values={sonifyValues} />
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <div className="panel p-6">
          <div className="label-tele mb-6">Surface gravity · m/s²</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gravity}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklab, var(--primary) 8%, transparent)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-6">
          <div className="label-tele mb-6">Thermal envelope · °C</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temp}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklab, var(--primary) 8%, transparent)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="min" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="max" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-6 xl:col-span-2">
          <div className="label-tele mb-6">Normalised parameter profile</div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="axis" tick={AXIS} />
                {bodies.map((b, i) => (
                  <Radar
                    key={b.id}
                    dataKey={b.name}
                    stroke={colors[i % colors.length]}
                    fill={colors[i % colors.length]}
                    fillOpacity={0.12}
                  />
                ))}
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="label-tele p-4 text-left">Parameter</th>
              {bodies.map((b) => (
                <th key={b.id} className="p-4 text-left font-medium">
                  {b.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                [
                  "Radius (km)",
                  (b: (typeof BODIES)[number]) => b.metrics.radiusKm.toLocaleString(),
                ],
                ["Gravity (m/s²)", (b: (typeof BODIES)[number]) => String(b.metrics.gravity)],
                ["Pressure (bar)", (b: (typeof BODIES)[number]) => String(b.metrics.pressureBar)],
                ["Atmosphere", (b: (typeof BODIES)[number]) => b.metrics.atmosphere],
                ["Water", (b: (typeof BODIES)[number]) => b.metrics.water],
                [
                  "Escape velocity (km/s)",
                  (b: (typeof BODIES)[number]) => String(b.metrics.escapeVelocity),
                ],
                ["Magnetic field", (b: (typeof BODIES)[number]) => b.metrics.magneticField],
                ["Orbital period", (b: (typeof BODIES)[number]) => b.metrics.orbitalPeriod],
              ] as const
            ).map(([label, fn]) => (
              <tr key={label} className="border-b border-border last:border-0">
                <td className="label-tele p-4">{label}</td>
                {bodies.map((b) => (
                  <td key={b.id} className="p-4 text-muted-foreground">
                    {fn(b)}
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
