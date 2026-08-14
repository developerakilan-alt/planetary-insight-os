import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Cloud, Droplets, Gauge, Thermometer, Wind as WindIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageMasthead } from "@/components/PageMasthead";
import { Metric } from "@/components/Metric";
import { getWeather, weatherColor, WEATHER_BODIES } from "@/lib/weather";
import { bodyMap } from "@/data/bodies";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Planetary Weather Station — Cosmos OS" },
      {
        name: "description",
        content:
          "Modeled surface conditions and forecasts across the solar system — temperature, wind, pressure and cloud decks.",
      },
      { property: "og:title", content: "Weather Station — Cosmos OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Weather,
});

function Weather() {
  const [bodyId, setBodyId] = useState<keyof typeof bodyMap>("mars");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const report = useMemo(() => getWeather(bodyId, now), [bodyId, now]);
  const body = bodyMap[bodyId];

  const chartData = report.forecast.map((d) => ({
    day: d.date.slice(5),
    min: d.tempMinC,
    max: d.tempMaxC,
    wind: d.windKmh,
  }));

  const gradient = body.palette;

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Planetary weather station"
        icon={<Cloud className="h-4 w-4" />}
        title={
          <>
            Forecasts from <em className="text-editorial">another world.</em>
          </>
        }
        description="Deterministic surface-condition models for every body, derived from its published physical envelope. Conditions are modeled, not telemetered."
        meta={[
          { label: "Now", value: `${report.now.tempC} °C @ ${body.name}` },
          { label: "Condition", value: report.now.conditionLabel },
          { label: "Wind", value: `${report.now.windKmh} km/h` },
          { label: "Season", value: report.now.season },
        ]}
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {WEATHER_BODIES.map((id) => {
          const b = bodyMap[id];
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Current conditions */}
        <div className="panel relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full blur-3xl"
            style={{ background: `${gradient.high}30` }}
          />
          <div className="relative p-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="label-tele flex items-center gap-2 text-primary">
                  <Cloud className="h-3.5 w-3.5" />
                  Current conditions · {body.name}
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <span
                    className="font-mono text-[clamp(3rem,7vw,5rem)] leading-none tabular-nums"
                    style={{ color: weatherColor(report.now.tempC) }}
                  >
                    {report.now.tempC}°
                  </span>
                  <span className="pb-2 font-mono text-sm text-muted-foreground">C</span>
                </div>
                <div className="mt-2 font-display text-lg font-medium">
                  {report.now.conditionLabel}
                </div>
                <div className="label-tele mt-1 text-[9px]">{report.now.season}</div>
              </div>
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-glass-edge bg-glass-fill">
                <div
                  className="h-24 w-24 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 30% 28%, ${gradient.high}, ${gradient.low})`,
                    boxShadow: `0 0 40px ${gradient.atmosphere}40`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label="Wind"
                value={`${report.now.windKmh} km/h`}
                sub={body.name === "jupiter" || body.name === "neptune" ? "jet stream" : "surface"}
              />
              <Metric label="Pressure" value={`${report.now.pressureBar} bar`} sub="surface" />
              <Metric label="Cloud cover" value={`${report.now.cloudPct}%`} sub="modeled deck" />
              <Metric
                label="Local time"
                value={now.toUTCString().slice(17, 25)}
                sub="UTC"
                tone="accent"
              />
            </div>

            <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground">{report.note}</p>
          </div>
        </div>

        {/* Forecast chart */}
        <div className="panel p-6">
          <div className="label-tele mb-4 flex items-center gap-2 text-primary">
            <Thermometer className="h-3.5 w-3.5" />
            7-day temperature envelope
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4FD1FF" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#4FD1FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={TOOLTIP} />
                <Area
                  type="monotone"
                  dataKey="max"
                  stroke="#4FD1FF"
                  strokeWidth={2}
                  fill="url(#tempFill)"
                  name="Max °C"
                />
                <Area
                  type="monotone"
                  dataKey="min"
                  stroke="#7EF9C6"
                  strokeWidth={2}
                  fill="transparent"
                  name="Min °C"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {report.forecast.map((d, i) => (
              <div key={d.date} className="panel-flat p-2 text-center">
                <div className="label-tele text-[8px]">{d.date.slice(5)}</div>
                <div
                  className="mt-1 font-mono text-[11px] tabular-nums"
                  style={{ color: weatherColor(d.tempMaxC) }}
                >
                  {d.tempMaxC}°
                </div>
                <div className="font-mono text-[9px] tabular-nums text-muted-foreground">
                  {d.tempMinC}°
                </div>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <WindIcon className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="font-mono text-[8px] tabular-nums text-muted-foreground">
                    {d.windKmh}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {report.forecast.map((d, i) => (
          <motion.div
            key={d.date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="panel-flat lift p-4"
          >
            <div className="label-tele text-[9px]">
              {new Date(d.date + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "short" })}
            </div>
            <div className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
              {d.date.slice(5)}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-glass-edge bg-glass-fill text-muted-foreground">
                {i === 0 ? <Gauge className="h-3.5 w-3.5" /> : <Droplets className="h-3.5 w-3.5" />}
              </span>
              <div>
                <div
                  className="font-mono text-sm tabular-nums"
                  style={{ color: weatherColor(d.tempMaxC) }}
                >
                  {d.tempMaxC}° / {d.tempMinC}°
                </div>
                <div className="label-tele text-[8px] text-muted-foreground/70">
                  {d.condition.replace(/-/g, " ")}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const AXIS = { stroke: "var(--muted-foreground)", fontSize: 10 };
const TOOLTIP = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--glass-edge)",
  borderRadius: 12,
  color: "var(--foreground)",
  fontSize: 12,
};
