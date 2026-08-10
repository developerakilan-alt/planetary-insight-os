import type { ReactNode } from "react";

/**
 * Unified instrument metric chip: mono label + tabular-nums value in a flat
 * panel. Used across telemetry, research and explorer readouts.
 */
export function Metric({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "success" | "warn" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "text-secondary"
      : tone === "warn"
        ? "text-warning"
        : tone === "accent"
          ? "text-primary"
          : "";
  return (
    <div className="panel-flat p-3">
      <div className="label-tele">{label}</div>
      <div className={`mt-1 truncate font-mono text-sm tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="label-tele mt-0.5 text-[9px]">{sub}</div>}
    </div>
  );
}
