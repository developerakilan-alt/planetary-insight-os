import { createFileRoute } from "@tanstack/react-router";
import { GeoVector, Body as AstroBody } from "astronomy-engine";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Antenna, ArrowDownRight, ArrowUpRight, Orbit, Radio, Users } from "lucide-react";
import { BODIES, type BodyId } from "@/data/bodies";
import { PageMasthead } from "@/components/PageMasthead";
import { Metric } from "@/components/Metric";
import {
  dsnTargetName,
  fetchCrew,
  fetchDsn,
  fetchRoverShot,
  formatSignalRate,
  type CrewMember,
  type DsnDish,
  type RoverShot,
} from "@/lib/tracking";

export const Route = createFileRoute("/telemetry")({
  head: () => ({
    meta: [
      { title: "Live Telemetry — Cosmos OS" },
      {
        name: "description",
        content:
          "Live mission tracking: the International Space Station, Deep Space Network comms, Perseverance surface ops and current distances to every planet.",
      },
      { property: "og:title", content: "Live Telemetry — Cosmos OS" },
      {
        property: "og:description",
        content:
          "Real-time ISS tracking, DSN antenna links, rover downlinks and planetary distance readouts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Telemetry,
});

interface IssState {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: "daylight" | "eclipsed";
  timestamp: number;
}

interface PlanetDistance {
  bodyId: BodyId;
  name: string;
  distAu: number;
  nowKm: number;
  trend: "inbound" | "outbound" | "stationary";
  lightMinutes: number;
}

const ASTRO: Partial<Record<BodyId, AstroBody>> = {
  mercury: AstroBody.Mercury,
  venus: AstroBody.Venus,
  mars: AstroBody.Mars,
  jupiter: AstroBody.Jupiter,
  saturn: AstroBody.Saturn,
  uranus: AstroBody.Uranus,
  neptune: AstroBody.Neptune,
  pluto: AstroBody.Pluto,
  moon: AstroBody.Moon,
};

const AU_KM = 149_597_870.7;

function computeDistances(): PlanetDistance[] {
  const now = new Date();
  const later = new Date(now.getTime() + 24 * 3600_000);
  return BODIES.filter((b) => ASTRO[b.id])
    .map((b): PlanetDistance => {
      const body = ASTRO[b.id]!;
      const v = GeoVector(body, now, true);
      const v2 = GeoVector(body, later, true);
      const delta = v.Length() - v2.Length();
      return {
        bodyId: b.id,
        name: b.name,
        distAu: v.Length(),
        nowKm: v.Length() * AU_KM,
        trend: delta > 0.0002 ? "inbound" : delta < -0.0002 ? "outbound" : "stationary",
        lightMinutes: v.Length() * 8.316746,
      };
    })
    .sort((a, b) => a.distAu - b.distAu);
}

function Telemetry() {
  const [iss, setIss] = useState<IssState | null>(null);
  const [issError, setIssError] = useState(false);
  const [distances, setDistances] = useState<PlanetDistance[]>(() => computeDistances());
  const [dsn, setDsn] = useState<DsnDish[]>([]);
  const [dsnError, setDsnError] = useState(false);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [crewError, setCrewError] = useState(false);
  const [shot, setShot] = useState<RoverShot | null>(null);
  const [shotError, setShotError] = useState(false);
  const track = useRef<{ latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544", {
          signal: AbortSignal.timeout(12_000),
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as IssState;
        if (cancelled) return;
        setIss(json);
        setIssError(false);
        track.current = [
          ...track.current.slice(-260),
          { latitude: json.latitude, longitude: json.longitude },
        ];
      } catch {
        if (!cancelled) setIssError(true);
      }
    };

    void poll();
    const timer = setInterval(poll, 5000);
    const distTimer = setInterval(() => setDistances(computeDistances()), 60_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearInterval(distTimer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const pollDsn = async () => {
      try {
        const snap = await fetchDsn();
        if (cancelled) return;
        setDsn(snap.dishes);
        setDsnError(false);
      } catch {
        if (!cancelled) setDsnError(true);
      }
    };
    const pollCrew = async () => {
      try {
        const list = await fetchCrew();
        if (cancelled) return;
        setCrew(list);
        setCrewError(false);
      } catch {
        if (!cancelled) setCrewError(true);
      }
    };
    const pollRover = async () => {
      try {
        const next = await fetchRoverShot();
        if (cancelled) return;
        if (next) {
          setShot(next);
          setShotError(false);
        }
      } catch {
        if (!cancelled) setShotError(true);
      }
    };

    void pollDsn();
    void pollCrew();
    void pollRover();
    const dsnTimer = setInterval(pollDsn, 30_000);
    const crewTimer = setInterval(pollCrew, 300_000);
    const roverTimer = setInterval(pollRover, 60_000);

    return () => {
      cancelled = true;
      clearInterval(dsnTimer);
      clearInterval(crewTimer);
      clearInterval(roverTimer);
    };
  }, []);

  const closest = distances[0];

  const dsnTargets = useMemo(
    () => new Set(dsn.flatMap((d) => d.signals.map((s) => s.target))).size,
    [dsn],
  );
  const dsnUplinks = dsn.reduce((n, d) => n + d.signals.filter((s) => s.dir === "up").length, 0);
  const dsnDownlinks = dsn.reduce(
    (n, d) => n + d.signals.filter((s) => s.dir === "down").length,
    0,
  );

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Live telemetry"
        icon={<Activity className="h-3.5 w-3.5" />}
        title={
          <>
            Flight operations <em className="text-editorial">console.</em>
          </>
        }
        description="Live mission tracking from public feeds: the International Space Station (wheretheiss.at), Deep Space Network antenna links (DSN Now), the Perseverance surface downlink (NASA/JPL) and Earth-relative distances to every planet, computed live with astronomy-engine."
        meta={[
          { label: "Feeds", value: "DSN Now · ISS · JPL" },
          { label: "Refresh", value: "30 s" },
          { label: "Ephemeris", value: "astronomy-engine" },
          { label: "Status", value: issError ? "Signal lost" : "Nominal" },
        ]}
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <div className="label-tele">ISS · International Space Station</div>
            <span
              className={`label-tele flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
                iss?.visibility === "daylight"
                  ? "border-secondary/40 text-secondary"
                  : "border-primary/40 text-primary"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${iss?.visibility === "daylight" ? "bg-secondary" : "bg-primary"} animate-pulse-ring`}
              />
              {issError ? "signal lost" : iss ? iss.visibility : "acquiring…"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Latitude" value={iss ? `${iss.latitude.toFixed(3)}°` : "—"} />
            <Metric label="Longitude" value={iss ? `${iss.longitude.toFixed(3)}°` : "—"} />
            <Metric label="Altitude" value={iss ? `${Math.round(iss.altitude)} km` : "—"} />
            <Metric
              label="Velocity"
              value={iss ? `${Math.round(iss.velocity).toLocaleString()} km/h` : "—"}
            />
          </div>

          <div className="relative mt-5 aspect-[2/1] overflow-hidden rounded-2xl border border-glass-edge bg-glass-fill">
            <img
              src="/textures/earth/color_M.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
            <canvas
              ref={(node) => {
                if (!node || !iss) return;
                const ctx = node.getContext("2d");
                if (!ctx) return;
                const w = node.width;
                const h = node.height;
                ctx.clearRect(0, 0, w, h);
                ctx.strokeStyle = "rgba(79,209,255,0.6)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                track.current.forEach((p, i) => {
                  const x = ((p.longitude + 180) / 360) * w;
                  const y = ((90 - p.latitude) / 180) * h;
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                });
                ctx.stroke();
                if (track.current.length > 0) {
                  const last = track.current[track.current.length - 1]!;
                  const x = ((last.longitude + 180) / 360) * w;
                  const y = ((90 - last.latitude) / 180) * h;
                  ctx.beginPath();
                  ctx.fillStyle = "#4FD1FF";
                  ctx.shadowColor = "#4FD1FF";
                  ctx.shadowBlur = 12;
                  ctx.arc(x, y, 4, 0, Math.PI * 2);
                  ctx.fill();
                }
              }}
              width={1280}
              height={640}
              className="absolute inset-0 h-full w-full"
            />
            <span className="label-tele pointer-events-none absolute left-3 top-3 rounded-full border border-glass-edge bg-background/40 px-2 py-1 text-[9px] backdrop-blur-2xl">
              Ground track · last {track.current.length} samples
            </span>
          </div>
        </div>

        <div className="panel p-6">
          <div className="label-tele flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-primary" /> Earth-relative distances
          </div>
          <div className="mt-4 space-y-1">
            {distances.map((d) => (
              <motion.div
                key={d.bodyId}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-card/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-medium">{d.name}</span>
                  <span className="label-tele text-[9px]">
                    {d.lightMinutes.toFixed(1)} light-min
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {d.trend === "inbound" ? (
                    <ArrowDownRight className="h-3.5 w-3.5 text-secondary" />
                  ) : d.trend === "outbound" ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-warning" />
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  )}
                  <span className="font-mono text-sm tabular-nums">{d.distAu.toFixed(3)} AU</span>
                </div>
              </motion.div>
            ))}
          </div>

          {closest && (
            <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <div className="label-tele text-primary">Closest body right now</div>
              <div className="mt-1 font-display text-xl font-semibold">{closest.name}</div>
              <div className="label-tele mt-1 text-[9px]">
                {(closest.nowKm / 1_000_000).toFixed(2)} million km ·{" "}
                {closest.lightMinutes.toFixed(1)} light-minutes
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div className="label-tele flex items-center gap-2">
              <Antenna className="h-3.5 w-3.5 text-primary" /> Deep Space Network
            </div>
            <span
              className={`label-tele flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
                dsnError || dsn.length === 0
                  ? "border-warning/40 text-warning"
                  : "border-secondary/40 text-secondary"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full animate-pulse-ring ${
                  dsnError || dsn.length === 0 ? "bg-warning" : "bg-secondary"
                }`}
              />
              {dsnError || dsn.length === 0 ? "acquiring…" : `${dsn.length} active dishes`}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Active dishes" value={dsnError ? "—" : String(dsn.length)} />
            <Metric label="Spacecraft in link" value={dsnError ? "—" : String(dsnTargets)} />
            <Metric label="Uplink signals" value={dsnError ? "—" : String(dsnUplinks)} />
            <Metric label="Downlink signals" value={dsnError ? "—" : String(dsnDownlinks)} />
          </div>

          <div className="mt-5 space-y-2">
            {dsn.length === 0 && (
              <div className="rounded-lg border border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
                {dsnError
                  ? "No DSN data received. The network status feed is unreachable right now."
                  : "Acquiring antenna scheduling data from DSN Now…"}
              </div>
            )}
            {dsn.map((d) => (
              <motion.div
                key={d.name}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2 rounded-lg border border-border/60 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm font-semibold">{d.name}</span>
                  <span className="label-tele hidden text-[9px] sm:inline">{d.desc}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {d.signals.map((s, i) => (
                    <span key={i} className="label-tele flex items-center gap-1 text-[9px]">
                      {s.dir === "up" ? (
                        <ArrowUpRight className="h-3 w-3 text-secondary" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-warning" />
                      )}
                      {dsnTargetName(s.target)} · {s.band}-band {s.dir} ·{" "}
                      {formatSignalRate(s.rateBps)}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <div className="label-tele flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-primary" /> Crew complement
          </div>
          <div className="mt-4">
            <div className="font-display text-3xl font-semibold tabular-nums">
              {crewError ? "—" : crew.length}
            </div>
            <div className="label-tele mt-1 text-[9px]">humans in space right now</div>
          </div>
          <div className="mt-4 space-y-2">
            {crewError && (
              <div className="rounded-lg border border-border/60 px-3 py-5 text-center text-xs text-muted-foreground">
                Crew manifest unavailable.
              </div>
            )}
            {crew.map((m) => (
              <motion.div
                key={m.name}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-card/50"
              >
                <span className="truncate text-sm">{m.name}</span>
                <span className="label-tele shrink-0 rounded-full border border-border px-2 py-0.5 text-[9px]">
                  {m.craft}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel mt-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="label-tele flex items-center gap-2">
            <Orbit className="h-3.5 w-3.5 text-primary" /> Mars 2020 · Perseverance — Jezero Crater
          </div>
          <span
            className={`label-tele flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
              shotError || !shot
                ? "border-warning/40 text-warning"
                : "border-secondary/40 text-secondary"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full animate-pulse-ring ${
                shotError || !shot ? "bg-warning" : "bg-secondary"
              }`}
            />
            {shotError || !shot ? "acquiring…" : "live downlink"}
          </span>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-glass-edge bg-glass-fill">
            {shot?.medium ? (
              <img
                src={shot.medium}
                alt={shot.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_35%,#334155,#111827_60%,#05070A_100%)]" />
            )}
            <span className="label-tele pointer-events-none absolute left-3 top-3 rounded-full border border-glass-edge bg-background/40 px-2 py-1 text-[9px] backdrop-blur-2xl">
              Latest downlinked surface image
            </span>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Martian sol" value={shot?.sol != null ? `Sol ${shot.sol}` : "—"} />
              <Metric label="Drive" value={shot?.drive ?? "—"} />
              <Metric label="Camera" value={shot?.camera ?? "—"} />
              <Metric
                label="Captured (UTC)"
                value={shot?.dateUtc ? formatUtc(shot.dateUtc) : "—"}
              />
            </div>
            <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
              {shot?.caption ?? "Waiting for the next downlinked frame from the rover…"}
            </p>
            <div className="label-tele mt-3 text-[9px]">{shot?.credit ?? ""}</div>
          </div>
        </div>
      </div>

      <div className="label-tele mt-6 text-[9px] leading-relaxed text-muted-foreground">
        ISS telemetry: wheretheiss.at (public API). Deep Space Network: eyes.nasa.gov DSN Now,
        refreshed every 30 s. Surface ops: mars.nasa.gov raw-image feed, refreshed every 60 s. Crew
        manifest: open-notify.org. Planetary distances: astronomy-engine, computed in the browser
        and refreshed every minute.
      </div>
    </div>
  );
}

function formatUtc(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
