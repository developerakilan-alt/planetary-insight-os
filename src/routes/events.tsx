import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CloudLightning,
  Eclipse,
  Moon,
  Orbit,
  Radio,
  RefreshCcw,
  Sun,
  Telescope,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageMasthead } from "@/components/PageMasthead";
import {
  computeCelestialEvents,
  timeUntil,
  type CelestialEvent,
  type EventKind,
} from "@/lib/events";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Celestial Events Calendar — Cosmos OS" },
      {
        name: "description",
        content:
          "Real upcoming eclipses, moon phases, equinoxes, planetary oppositions and meteor showers — computed live from ephemeris.",
      },
      { property: "og:title", content: "Celestial Events — Cosmos OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Events,
});

const FILTERS: { kind: EventKind | "all"; label: string }[] = [
  { kind: "all", label: "All events" },
  { kind: "solar-eclipse", label: "Solar eclipses" },
  { kind: "lunar-eclipse", label: "Lunar eclipses" },
  { kind: "moon-phase", label: "Moon phases" },
  { kind: "season", label: "Seasons" },
  { kind: "opposition", label: "Oppositions" },
  { kind: "conjunction", label: "Conjunctions" },
  { kind: "meteor-shower", label: "Meteor showers" },
];

const WATCH_KEY = "cosmos-os.events.watch.v1";

function kindIcon(kind: EventKind, size = 16) {
  switch (kind) {
    case "solar-eclipse":
      return <Sun className="h-4 w-4" />;
    case "lunar-eclipse":
      return <Eclipse className="h-4 w-4" />;
    case "moon-phase":
      return <Moon className="h-4 w-4" />;
    case "season":
      return <Telescope className="h-4 w-4" />;
    case "opposition":
      return <Orbit className="h-4 w-4" />;
    case "conjunction":
      return <Radio className="h-4 w-4" />;
    case "meteor-shower":
      return <CloudLightning className="h-4 w-4" />;
    default:
      return <Zap className="h-4 w-4" />;
  }
}

function kindColor(kind: EventKind): string {
  switch (kind) {
    case "solar-eclipse":
    case "lunar-eclipse":
      return "text-warning";
    case "moon-phase":
      return "text-primary";
    case "season":
      return "text-secondary";
    case "opposition":
      return "text-editorial";
    case "meteor-shower":
      return "text-[#9B8CFF]";
    default:
      return "text-muted-foreground";
  }
}

function loadWatch(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WATCH_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function Events() {
  const [now, setNow] = useState(() => new Date());
  const [filter, setFilter] = useState<EventKind | "all">("all");
  const [watch, setWatch] = useState<string[]>(loadWatch);
  const [generated, setGenerated] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const events = useMemo(() => computeCelestialEvents(generated, 365), [generated]);
  const visible = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.kind === filter)),
    [events, filter],
  );

  const next = useMemo(
    () => events.find((e) => e.date.getTime() > Date.now() - 5 * 60000) ?? null,
    [events],
  );

  useEffect(() => {
    // fire a notification for any watched event that is imminent
    const t = setInterval(() => {
      for (const e of events) {
        if (!watch.includes(e.id)) continue;
        const d = e.date.getTime() - Date.now();
        if (d > 0 && d < 60000) {
          try {
            new Notification(`Cosmos OS · ${e.title}`, {
              body: e.date.toLocaleString(),
              tag: e.id,
            });
          } catch {
            /* notifications unavailable */
          }
        }
      }
    }, 30000);
    return () => clearInterval(t);
  }, [events, watch]);

  const remind = (e: CelestialEvent) => {
    const nextWatch = watch.includes(e.id) ? watch.filter((x) => x !== e.id) : [...watch, e.id];
    setWatch(nextWatch);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WATCH_KEY, JSON.stringify(nextWatch));
    }
    if (nextWatch.includes(e.id)) {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
      }
      toast.success("Reminder armed — you'll be notified near the event.");
    } else {
      toast("Reminder cleared.");
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, CelestialEvent[]>();
    for (const e of visible) {
      const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [visible]);

  const countdown = next ? timeUntil(next.date) : null;

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Celestial events"
        icon={<CalendarDays className="h-4 w-4" />}
        title={
          <>
            The sky's <em className="text-editorial">operating schedule.</em>
          </>
        }
        description="Real upcoming solar and lunar eclipses, moon phases, equinoxes, planetary oppositions and meteor showers — computed live from VSOP87 ephemeris. Arm a reminder and Cosmos OS will ping you near showtime."
        meta={[
          { label: "Events computed", value: events.length },
          { label: "Horizon", value: "365 days" },
          { label: "Source", value: "astronomy-engine" },
          { label: "Next", value: next ? next.title : "—" },
        ]}
      />

      {next && countdown && (
        <div className="panel mt-8 overflow-hidden p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-glass-edge bg-glass-fill ${kindColor(next.kind)}`}
              >
                {kindIcon(next.kind, 20)}
              </span>
              <div>
                <div className="label-tele text-primary">Next event</div>
                <div className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  {next.title}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {next.date.toLocaleString()} · {next.description}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {[
                  ["D", countdown.days],
                  ["H", countdown.hours],
                  ["M", countdown.minutes],
                  ["S", countdown.seconds],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="w-16 rounded-2xl border border-glass-edge bg-glass-fill px-2 py-3 text-center"
                  >
                    <div className="font-mono text-2xl tabular-nums text-foreground">
                      {String(value).padStart(2, "0")}
                    </div>
                    <div className="label-tele mt-1 text-[9px]">{label}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => remind(next)}
                className={`glass-chip rounded-full px-4 py-2 text-sm ${
                  watch.includes(next.id)
                    ? "border-primary/50 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {watch.includes(next.id) ? "Reminder armed" : "Remind me"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.kind}
            onClick={() => setFilter(f.kind)}
            aria-pressed={filter === f.kind}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              filter === f.kind
                ? "border-primary/50 bg-primary/15 text-primary"
                : "glass-chip text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => {
            setGenerated(new Date());
            toast.success("Events recomputed");
          }}
          className="ml-auto flex items-center gap-2 rounded-full border border-glass-edge bg-glass-fill px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Recompute
        </button>
      </div>

      <div className="mt-8 space-y-10">
        {groups.map(([key, list]) => {
          const [y, m] = key.split("-").map(Number);
          const label = new Date(Date.UTC(y!, m!)).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          });
          return (
            <section key={key}>
              <div className="label-tele flex items-center gap-3 text-primary">
                <span>{label.toUpperCase()}</span>
                <span className="h-px flex-1 bg-glass-edge" />
                <span className="text-muted-foreground/60">{list.length} events</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {list.map((e, i) => {
                  const watched = watch.includes(e.id);
                  const past = e.date.getTime() < now.getTime();
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.5) }}
                      className={`panel-flat lift relative p-5 ${past ? "opacity-55" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-glass-edge bg-glass-fill ${kindColor(e.kind)}`}
                        >
                          {kindIcon(e.kind)}
                        </span>
                        <button
                          onClick={() => remind(e)}
                          aria-label={watched ? "Clear reminder" : "Arm reminder"}
                          className={`flex h-8 w-8 items-center justify-center rounded-full border border-glass-edge transition-colors ${
                            watched
                              ? "border-primary/50 text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {watched ? <Moon className="h-3.5 w-3.5" /> : <BellIcon />}
                        </button>
                      </div>
                      <div className="mt-4 font-display text-[15px] font-semibold leading-tight">
                        {e.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 font-mono text-xs tabular-nums text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {e.date.toLocaleString()}
                      </div>
                      {e.magnitude !== undefined && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-glass-edge bg-glass-fill px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                          <Zap className="h-3 w-3" />
                          {e.kind === "meteor-shower"
                            ? `ZHR ≈ ${e.magnitude}/hr`
                            : `Mag ${e.magnitude.toFixed(2)}`}
                        </div>
                      )}
                      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                        {e.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {groups.length === 0 && (
          <div className="panel-flat p-10 text-center text-sm text-muted-foreground">
            No events match this filter in the next 365 days.
          </div>
        )}
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-3.5 w-3.5"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
