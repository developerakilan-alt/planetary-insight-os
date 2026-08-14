import { createFileRoute } from "@tanstack/react-router";
import { Reorder } from "framer-motion";
import {
  Activity,
  AlarmClock,
  GripVertical,
  LayoutDashboard,
  Plus,
  Satellite,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageMasthead } from "@/components/PageMasthead";
import { Metric } from "@/components/Metric";
import { BODIES, type BodyId } from "@/data/bodies";
import {
  DEFAULT_WIDGETS,
  addWidget,
  loadWidgets,
  removeWidget,
  reorderWidgets,
  updateWidgetPayload,
  WIDGET_LIBRARY,
  type WidgetConfig,
  type WidgetKind,
} from "@/lib/command";
import { computeCelestialEvents } from "@/lib/events";
import { EXOPLANETS, esiScore } from "@/lib/exoplanets";
import { NEO_CATALOGUE, formatDistKm, neoLiveState } from "@/lib/neo";
import { getWeather, weatherColor } from "@/lib/weather";
import { useSavedLibrary } from "@/lib/saved";

export const Route = createFileRoute("/command")({
  head: () => ({
    meta: [
      { title: "Command Center — Cosmos OS" },
      {
        name: "description",
        content:
          "Assemble a personal mission-control dashboard: clocks, celestial events, NEO watch, world weather and saved discoveries.",
      },
      { property: "og:title", content: "Command Center — Cosmos OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandCenter,
});

function CommandCenter() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => loadWidgets());
  const [showLibrary, setShowLibrary] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const onReorder = (next: WidgetConfig[]) => {
    setWidgets(next);
    reorderWidgets(next.map((w) => w.id));
  };

  const remove = (id: string) => {
    removeWidget(id);
    setWidgets(loadWidgets());
  };

  const add = (kind: WidgetKind) => {
    addWidget(kind);
    setWidgets(loadWidgets());
  };

  const setPayload = (id: string, payload: string) => {
    updateWidgetPayload(id, payload);
    setWidgets(loadWidgets());
  };

  return (
    <div className="mx-auto max-w-[1640px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Personal command center"
        icon={<LayoutDashboard className="h-4 w-4" />}
        title={
          <>
            Your mission <em className="text-editorial">control desk.</em>
          </>
        }
        description="Pin the instruments you care about — clocks, events, NEO ranges, world weather, saved discoveries — then drag them into your preferred layout. Everything persists on this device."
        meta={[
          { label: "Pinned instruments", value: String(widgets.length) },
          { label: "Available", value: `${WIDGET_LIBRARY.length} types` },
          { label: "Persistence", value: "Local · device only" },
          { label: "Layout", value: "Drag to reorder" },
        ]}
      />

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowLibrary((s) => !s)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Add instrument
        </button>
        {widgets.length > 0 && (
          <span className="label-tele text-[9px] text-muted-foreground">
            Drag cards to reorder · changes save automatically
          </span>
        )}
      </div>

      {showLibrary && (
        <div className="panel-flat mt-4 grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {WIDGET_LIBRARY.map((w) => (
            <button
              key={w.kind}
              onClick={() => {
                add(w.kind);
                setShowLibrary(false);
              }}
              className="glass-chip lift rounded-xl p-3 text-left"
            >
              <div className="font-display text-sm font-semibold">{w.title}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {w.description}
              </p>
            </button>
          ))}
        </div>
      )}

      {widgets.length === 0 && (
        <div className="panel-flat mt-6 p-12 text-center">
          <div className="label-tele text-[10px] text-muted-foreground">Empty desk</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Add instruments from the library above to build your command center.
          </p>
        </div>
      )}

      <Reorder.Group
        axis="y"
        values={widgets}
        onReorder={onReorder}
        className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {widgets.map((w) => (
          <Reorder.Item key={w.id} value={w} className="group/panel">
            <WidgetCard
              config={w}
              now={now}
              onRemove={() => remove(w.id)}
              onPayload={(p) => setPayload(w.id, p)}
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

function WidgetCard({
  config,
  now,
  onRemove,
  onPayload,
}: {
  config: WidgetConfig;
  now: Date;
  onRemove: () => void;
  onPayload: (payload: string) => void;
}) {
  return (
    <div className="panel-flat relative h-full overflow-hidden p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="label-tele text-[9px] text-primary">{config.title}</div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/panel:opacity-100">
          <GripVertical className="h-3.5 w-3.5 cursor-grab text-muted-foreground" />
          <button
            onClick={onRemove}
            aria-label={`Remove ${config.title}`}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-danger"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        {config.kind === "utc-clock" && <UtcClock now={now} />}
        {config.kind === "next-events" && <NextEvents />}
        {config.kind === "body-metrics" && (
          <BodyMetrics payload={config.payload} onPayload={onPayload} />
        )}
        {config.kind === "neo-watch" && <NeoWatch />}
        {config.kind === "exo-highlight" && <ExoHighlight />}
        {config.kind === "weather" && (
          <WeatherWidget payload={config.payload} onPayload={onPayload} />
        )}{" "}
        {config.kind === "system-status" && <SystemStatus />}
        {config.kind === "saved-recent" && <SavedRecent />}
      </div>
    </div>
  );
}

function UtcClock({ now }: { now: Date }) {
  const total = now.getTime() / 1000;
  return (
    <div>
      <div className="font-mono text-4xl tabular-nums text-foreground">
        {now.toUTCString().slice(17, 25)}
      </div>
      <div className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
        {now.toUTCString().slice(5, 16)}
      </div>
      <div className="mt-3">
        <div className="h-1 overflow-hidden rounded-full bg-glass-fill">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${((total % 86400) / 86400) * 100}%` }}
          />
        </div>
        <div className="label-tele mt-1 text-[8px] text-muted-foreground">
          Mission elapsed · {Math.floor((total % 86400) / 3600)}h {Math.floor((total % 3600) / 60)}m
        </div>
      </div>
    </div>
  );
}

function NextEvents() {
  const events = useMemo(() => computeCelestialEvents(new Date(), 120).slice(0, 4), []);
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <div
          key={e.id}
          className="flex items-center gap-3 rounded-xl border border-glass-edge bg-glass-fill px-3 py-2"
        >
          <Activity className="h-3.5 w-3.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{e.title}</div>
            <div className="label-tele text-[8px] text-muted-foreground">
              {e.date.toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BodyMetrics({
  payload,
  onPayload,
}: {
  payload?: string | undefined;
  onPayload: (p: string) => void;
}) {
  const body = BODIES.find((b) => b.id === (payload as BodyId)) ?? BODIES[3]!;
  return (
    <div>
      <BodySelect value={body.id} onChange={onPayload} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Metric label="Radius" value={`${body.metrics.radiusKm.toLocaleString()} km`} />
        <Metric label="Gravity" value={`${body.metrics.gravity} m/s²`} />
        <Metric label="Temp" value={`${body.metrics.tempC[0]}…${body.metrics.tempC[1]} °C`} />
        <Metric label="Escape v" value={`${body.metrics.escapeVelocity} km/s`} />
      </div>
    </div>
  );
}

function NeoWatch() {
  const now = useMemo(() => new Date(), []);
  const top = useMemo(
    () =>
      [...NEO_CATALOGUE]
        .map((o) => ({ obj: o, state: neoLiveState(o, now) }))
        .sort((a, b) => a.state.distAu - b.state.distAu)
        .slice(0, 4),
    [now],
  );
  return (
    <div className="space-y-2">
      {top.map(({ obj, state }) => (
        <div
          key={obj.id}
          className="flex items-center gap-3 rounded-xl border border-glass-edge bg-glass-fill px-3 py-2"
        >
          <Satellite className="h-3.5 w-3.5 shrink-0 text-warning" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{obj.name}</div>
            <div className="label-tele text-[8px] text-muted-foreground">{obj.clazz}</div>
          </div>
          <div className="font-mono text-xs tabular-nums text-secondary">
            {formatDistKm(state.distKm)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExoHighlight() {
  const top = useMemo(
    () => [...EXOPLANETS].sort((a, b) => esiScore(b) - esiScore(a)).slice(0, 3),
    [],
  );
  return (
    <div className="space-y-2">
      {top.map((p, i) => (
        <div
          key={p.id}
          className="flex items-center gap-3 rounded-xl border border-glass-edge bg-glass-fill px-3 py-2"
        >
          <Star
            className={`h-3.5 w-3.5 shrink-0 ${i === 0 ? "text-warning" : "text-muted-foreground"}`}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{p.name}</div>
            <div className="label-tele text-[8px] text-muted-foreground">{p.distanceLy} ly</div>
          </div>
          <span className="rounded-full border border-glass-edge bg-glass-fill px-2 py-0.5 font-mono text-[10px] text-primary">
            ESI {esiScore(p)}
          </span>
        </div>
      ))}
    </div>
  );
}

function WeatherWidget({
  payload,
  onPayload,
}: {
  payload?: string | undefined;
  onPayload: (p: string) => void;
}) {
  const bodyId = (payload as BodyId) ?? "mars";
  const report = useMemo(() => getWeather(bodyId), [bodyId]);
  return (
    <div>
      <BodySelect value={bodyId} onChange={onPayload} />
      <div className="mt-3 flex items-end gap-3">
        <span
          className="font-mono text-5xl leading-none tabular-nums"
          style={{ color: weatherColor(report.now.tempC) }}
        >
          {report.now.tempC}°
        </span>
        <span className="pb-1 font-mono text-xs text-muted-foreground">C</span>
      </div>
      <div className="mt-1 text-sm text-foreground/90">{report.now.conditionLabel}</div>
      <div className="label-tele mt-1 text-[8px] text-muted-foreground">
        wind {report.now.windKmh} km/h · {report.now.cloudPct}% cloud · {report.now.season}
      </div>
    </div>
  );
}

function SystemStatus() {
  const rows: [string, "ok" | "warn"][] = [
    ["Ephemeris engine", "ok"],
    ["AI Scientist gateway", "ok"],
    ["JPL Horizons link", "ok"],
    ["NASA image archive", "warn"],
  ];
  return (
    <div className="space-y-2">
      {rows.map(([label, status]) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-glass-edge bg-glass-fill px-3 py-2"
        >
          <span
            className={`h-2 w-2 rounded-full ${status === "ok" ? "bg-secondary" : "animate-pulse bg-warning"}`}
          />
          <span className="text-[13px] text-foreground/90">{label}</span>
          <span className="ml-auto label-tele text-[8px] text-muted-foreground">{status}</span>
        </div>
      ))}
    </div>
  );
}

function SavedRecent() {
  const { items } = useSavedLibrary();
  const recent = items.slice(0, 4);
  if (recent.length === 0) {
    return (
      <p className="rounded-xl border border-glass-edge bg-glass-fill px-3 py-4 text-[12px] leading-relaxed text-muted-foreground">
        Nothing saved yet. Save a landing-site analysis or landmark from the Explorer to see it
        here.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {recent.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-xl border border-glass-edge bg-glass-fill px-3 py-2"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">
              {item.kind === "analysis"
                ? `${item.bodyName} · site ${item.score}`
                : item.landmarkName}
            </div>
            <div className="label-tele text-[8px] text-muted-foreground">
              {item.kind === "analysis" ? item.verdict : item.bodyName} ·{" "}
              {item.kind === "analysis"
                ? `${item.lat.toFixed(1)}°, ${item.lon.toFixed(1)}°`
                : `${item.lat.toFixed(1)}°, ${item.lon.toFixed(1)}°`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BodySelect({ value, onChange }: { value: string; onChange: (p: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="glass-chip w-full rounded-full px-3 py-1.5 text-xs outline-none"
    >
      {BODIES.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}

void AlarmClock;
void Trash2;
