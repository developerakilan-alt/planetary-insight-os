/**
 * Personal Command Center — a persisted grid of pinned widgets. Widget config
 * is stored in localStorage; order is controlled by the user (reorderable).
 */

export type WidgetKind =
  | "utc-clock"
  | "next-events"
  | "body-metrics"
  | "neo-watch"
  | "exo-highlight"
  | "weather"
  | "system-status"
  | "saved-recent";

export interface WidgetConfig {
  id: string;
  kind: WidgetKind;
  title: string;
  /** bodyId or other optional payload */
  payload?: string;
}

export const WIDGET_LIBRARY: { kind: WidgetKind; title: string; description: string }[] = [
  {
    kind: "utc-clock",
    title: "UTC mission clock",
    description: "Live coordinated universal time.",
  },
  {
    kind: "next-events",
    title: "Next celestial events",
    description: "Upcoming eclipses, phases, oppositions.",
  },
  { kind: "body-metrics", title: "Body readout", description: "Key metrics for a selected world." },
  {
    kind: "neo-watch",
    title: "NEO watchlist",
    description: "Live distance to tracked near-Earth objects.",
  },
  {
    kind: "exo-highlight",
    title: "Exoplanet highlight",
    description: "Habitability ranking of the catalogue.",
  },
  {
    kind: "weather",
    title: "World weather",
    description: "Modeled conditions for a selected body.",
  },
  { kind: "system-status", title: "System status", description: "Cosmos OS subsystem health." },
  { kind: "saved-recent", title: "Saved library", description: "Recently saved discoveries." },
];

const KEY = "cosmos-os.command.v1";

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "cmd-utc", kind: "utc-clock", title: "UTC mission clock" },
  { id: "cmd-events", kind: "next-events", title: "Next celestial events" },
  { id: "cmd-body", kind: "body-metrics", title: "Body readout", payload: "mars" },
  { id: "cmd-neo", kind: "neo-watch", title: "NEO watchlist" },
  { id: "cmd-weather", kind: "weather", title: "World weather", payload: "mars" },
];

export function loadWidgets(): WidgetConfig[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const parsed = JSON.parse(raw) as WidgetConfig[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WIDGETS;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export function saveWidgets(widgets: WidgetConfig[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(widgets));
}

export function addWidget(kind: WidgetKind): WidgetConfig {
  const widgets = loadWidgets();
  const meta = WIDGET_LIBRARY.find((w) => w.kind === kind);
  const wc: WidgetConfig = {
    id: `cmd-${kind}-${Date.now().toString(36)}`,
    kind,
    title: meta?.title ?? kind,
    ...(kind === "body-metrics" || kind === "weather" ? { payload: "mars" } : {}),
  };
  saveWidgets([...widgets, wc]);
  return wc;
}

export function removeWidget(id: string): void {
  saveWidgets(loadWidgets().filter((w) => w.id !== id));
}

export function updateWidgetPayload(id: string, payload: string): void {
  saveWidgets(loadWidgets().map((w) => (w.id === id ? { ...w, payload } : w)));
}

export function reorderWidgets(ids: string[]): void {
  const byId = new Map(loadWidgets().map((w) => [w.id, w]));
  const next: WidgetConfig[] = [];
  for (const id of ids) {
    const w = byId.get(id);
    if (w) next.push(w);
  }
  for (const w of byId.values()) {
    if (!next.some((x) => x.id === w.id)) next.push(w);
  }
  saveWidgets(next);
}
