import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Globe2, Route as RouteIcon } from "lucide-react";
import { MISSIONS, type Mission } from "@/data/missions";
import { z } from "zod";

const searchSchema = z.object({ mission: z.string().optional() });

export const Route = createFileRoute("/missions")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Mission Archive — Cosmos OS" },
      {
        name: "description",
        content:
          "An interactive timeline of planetary missions from Apollo to Europa Clipper, with landing sites, payloads and confirmed discoveries.",
      },
      { property: "og:title", content: "Mission Archive — Cosmos OS" },
      {
        property: "og:description",
        content:
          "Apollo, Voyager, Cassini, Curiosity, Perseverance, Artemis and Europa Clipper in one timeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Missions,
});

function Missions() {
  const sorted = [...MISSIONS].sort((a, b) => a.year - b.year);
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [active, setActive] = useState<Mission>(sorted[0]!);

  useEffect(() => {
    if (!search.mission) return;
    const m = MISSIONS.find((x) => x.id === search.mission);
    if (m) setActive(m);
  }, [search.mission]);

  const select = (m: Mission) => {
    setActive(m);
    navigate({ to: "/missions", search: { mission: m.id }, replace: true });
  };

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <div className="label-tele">Mission archive</div>
      <h1 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold">
        Six decades of planetary operations
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Select a mission to inspect its target, landing coordinates, surface traverse and the
        science it returned.
      </p>

      <div className="mt-12 overflow-x-auto pb-4">
        <div className="relative flex min-w-[900px] items-end gap-2">
          <div className="absolute inset-x-0 bottom-9 h-px accent-rule" />
          {sorted.map((m) => (
            <button
              key={m.id}
              onClick={() => select(m)}
              className="group relative flex flex-1 flex-col items-center gap-3"
            >
              <span
                className={`text-center text-xs transition-colors ${
                  active.id === m.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {m.name.split("—")[0]}
              </span>
              <span
                className={`h-3 w-3 rounded-full border transition-all ${
                  active.id === m.id
                    ? "scale-125 border-primary bg-primary"
                    : "border-border-strong bg-background group-hover:border-primary"
                }`}
                style={active.id === m.id ? { boxShadow: "var(--shadow-glow)" } : undefined}
              />
              <span className="label-tele">{m.year}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={active.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="panel p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="label-tele rounded-full border border-border px-2.5 py-1">
              {active.agency}
            </span>
            <span
              className="label-tele rounded-full px-2.5 py-1"
              style={{
                background:
                  active.status === "active"
                    ? "color-mix(in oklab, var(--secondary) 18%, transparent)"
                    : "color-mix(in oklab, var(--muted-foreground) 18%, transparent)",
                color: active.status === "active" ? "var(--secondary)" : "var(--muted-foreground)",
              }}
            >
              {active.status}
            </span>
            <span className="label-tele">{active.type}</span>
          </div>
          <h2 className="mt-5 text-3xl font-semibold">{active.name}</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{active.summary}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Target" value={active.targetLabel} />
            <Stat label="Operational" value={`${active.year} – ${active.endYear ?? "present"}`} />
            <Stat
              label="Landing site"
              value={active.site ? active.site.name : "No surface element"}
            />
          </div>

          <div className="mt-8">
            <div className="label-tele mb-4">Confirmed scientific return</div>
            <ul className="space-y-3">
              {active.discoveries.map((d) => (
                <li key={d} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          {active.traverse && (
            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="label-tele flex items-center gap-2 text-primary">
                <RouteIcon className="h-3.5 w-3.5" /> Surface traverse
              </div>
              <div className="mt-2 text-sm font-medium">{active.traverse.label}</div>
              <p className="mt-1 text-xs text-muted-foreground">{active.traverse.note}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {active.traverse.points.map((p, i) => (
                  <span
                    key={i}
                    className="label-tele rounded-full border border-border bg-background/60 px-2 py-1 text-[9px]"
                  >
                    {i === 0 ? "landing" : `WP${i}`} · {p.lat.toFixed(2)}°, {p.lon.toFixed(2)}°
                  </span>
                ))}
              </div>
              {active.target !== "outer-system" && active.target !== "deep-field" && (
                <Link
                  to="/explorer/$body"
                  params={{ body: active.target }}
                  search={{ traverse: active.id }}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Globe2 className="h-4 w-4" /> Trace this path on the 3D globe
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="panel relative overflow-hidden p-8">
          <div className="label-tele">Trajectory profile</div>
          <div className="relative mt-6 aspect-square">
            <div className="absolute inset-0 rounded-full border border-border" />
            <div className="absolute inset-[14%] rounded-full border border-border" />
            <div className="absolute inset-[30%] rounded-full border border-dashed border-primary/40" />
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute left-1/2 top-[30%] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_14px_3px_color-mix(in_oklab,var(--primary)_50%,transparent)]" />
            </motion.div>
            <div className="absolute inset-[42%] rounded-full bg-[radial-gradient(circle_at_35%_35%,var(--muted-foreground),transparent_70%)] opacity-60" />
          </div>
          {active.site && (
            <div className="mt-6 space-y-2">
              <div className="label-tele">Surface coordinates</div>
              <div className="font-mono text-sm">
                {active.site.lat}° , {active.site.lon}°
              </div>
              {active.target !== "outer-system" && active.target !== "deep-field" && (
                <Link
                  to="/explorer/$body"
                  params={{ body: active.target }}
                  search={{ lat: String(active.site.lat), lon: String(active.site.lon) }}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Globe2 className="h-4 w-4" /> Open landing site on globe
                </Link>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-flat p-4">
      <div className="label-tele">{label}</div>
      <div className="mt-1.5 text-sm">{value}</div>
    </div>
  );
}
