import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, Thermometer } from "lucide-react";
import type { AtmosphereProfile } from "@/data/atmosphere";

function formatPressure(v: number): string {
  if (v >= 1) return `${v.toLocaleString()} bar`;
  if (v >= 0.001) return `${(v * 1000).toFixed(0)} mbar`;
  if (v >= 0.000001) return `${(v * 1_000_000).toFixed(0)} µbar`;
  return v.toExponential(1);
}

export function AtmosphereChart({ profile }: { profile: AtmosphereProfile }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="panel p-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="label-tele flex items-center gap-2">
          <Thermometer className="h-3.5 w-3.5 text-primary" /> Atmospheric profile
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>

      {open && (
        <div className="mt-4">
          <div className="label-tele text-[10px]">Temperature</div>
          <div className="mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profile.points} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="altKm"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => `${v} km`}
                  stroke="var(--border)"
                />
                <YAxis
                  dataKey="tempC"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => `${v}°`}
                  stroke="var(--border)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => `${profile.axisLabel}: ${v} km`}
                  formatter={(value) => [`${value} °C`, "Temperature"]}
                />
                <Area
                  type="monotone"
                  dataKey="tempC"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#tempGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="label-tele mt-4 text-[10px]">Pressure</div>
          <div className="mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profile.points} margin={{ top: 4, right: 4, bottom: 0, left: -6 }}>
                <defs>
                  <linearGradient id="presGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--secondary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="altKm"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => `${v} km`}
                  stroke="var(--border)"
                />
                <YAxis
                  dataKey="pressureBar"
                  scale="log"
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => (v >= 1 ? `${v} bar` : `${(v * 1000).toFixed(0)} mb`)}
                  stroke="var(--border)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => `${profile.axisLabel}: ${v} km`}
                  formatter={(value) => [formatPressure(Number(value)), "Pressure"]}
                />
                <Area
                  type="monotone"
                  dataKey="pressureBar"
                  stroke="var(--secondary)"
                  strokeWidth={2}
                  fill="url(#presGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="label-tele mt-4 border-t border-border pt-3 text-[9px] leading-relaxed">
            {profile.source}. {profile.note} Reference-model approximation — not in-situ
            measurements at every level.
          </p>
        </div>
      )}
    </div>
  );
}
