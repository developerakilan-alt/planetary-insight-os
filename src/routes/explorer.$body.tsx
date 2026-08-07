import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Crosshair, MapPin, Sun, Sparkles } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { BODIES, getBody, type Landmark } from "@/data/bodies";
import { MISSIONS } from "@/data/missions";
import { analyseSite } from "@/lib/analysis";

const GlobeScene = lazy(() => import("@/components/three/GlobeScene"));

const searchSchema = z.object({
  lat: z.string().optional(),
  lon: z.string().optional(),
});

export const Route = createFileRoute("/explorer/$body")({
  validateSearch: searchSchema,
  loader: ({ params }) => {
    const body = getBody(params.body);
    if (!body) throw notFound();
    return { body };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Body not found — Cosmos OS" }, { name: "robots", content: "noindex" }] };
    }
    const b = loaderData.body;
    return {
      meta: [
        { title: `${b.name} Dashboard — Cosmos OS` },
        { name: "description", content: `${b.name} (${b.designation}): ${b.summary}` },
        { property: "og:title", content: `${b.name} — Planetary Dashboard | Cosmos OS` },
        { property: "og:description", content: b.summary },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PlanetDashboard,
});

type Overlay = "none" | "elevation" | "geology";

function PlanetDashboard() {
  const { body } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [overlay, setOverlay] = useState<Overlay>("none");
  const [atmosphere, setAtmosphere] = useState(true);
  const [quality, setQuality] = useState<"low" | "high" | "ultra">("high");
  const [lighting, setLighting] = useState<"sun" | "studio" | "terminator">("sun");
  const [spin, setSpin] = useState(true);
  const [pick, setPick] = useState<{ lat: number; lon: number } | null>(null);

  const focus = useMemo(() => {
    if (search.lat && search.lon) return { lat: Number(search.lat), lon: Number(search.lon) };
    return null;
  }, [search.lat, search.lon]);

  const analysis = pick ? analyseSite(body, pick.lat, pick.lon) : null;
  const missions = MISSIONS.filter((m) => m.target === body.id);

  const metrics: [string, string][] = [
    ["Classification", body.classification],
    ["Mean radius", `${body.metrics.radiusKm.toLocaleString()} km`],
    ["Surface gravity", `${body.metrics.gravity} m/s²`],
    ["Temperature", `${body.metrics.tempC[0]} … ${body.metrics.tempC[1]} °C`],
    ["Surface pressure", `${body.metrics.pressureBar} bar`],
    ["Atmosphere", body.metrics.atmosphere],
    ["Surface material", body.metrics.surface],
    ["Water presence", body.metrics.water],
    ["Age", `${body.metrics.ageGyr} Gyr`],
    ["Orbital period", body.metrics.orbitalPeriod],
    ["Escape velocity", `${body.metrics.escapeVelocity} km/s`],
    ["Magnetic field", body.metrics.magneticField],
    ["Rotation period", body.metrics.dayLength],
    ["Natural satellites", String(body.metrics.moons)],
  ];

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 lg:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/explorer"
          className="flex h-9 items-center gap-2 rounded-full border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Orbital chart
        </Link>
        <div className="flex gap-1 overflow-x-auto">
          {BODIES.map((b) => (
            <Link
              key={b.id}
              to="/explorer/$body"
              params={{ body: b.id }}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-card data-[status=active]:text-foreground"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Globe */}
        <div className="panel relative h-[64vh] min-h-[460px] overflow-hidden">
          <ClientOnly
            fallback={<div className="absolute inset-0 grid place-items-center label-tele">Initialising renderer…</div>}
          >
            <GlobeScene
              body={body}
              options={{
                elevation: overlay === "elevation",
                geology: overlay === "geology",
                atmosphere,
                quality,
                lighting,
                spin,
              }}
              landmarks={body.landmarks}
              pick={pick}
              onPick={(lat, lon) => setPick({ lat, lon })}
              focus={focus}
            />
          </ClientOnly>

          <div className="pointer-events-none absolute left-5 top-5">
            <div className="label-tele">{body.designation} · {body.system} system</div>
            <h1 className="font-display text-4xl font-semibold">{body.name}</h1>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            <Segmented
              label="Overlay"
              value={overlay}
              onChange={(v) => setOverlay(v as Overlay)}
              options={[
                ["none", "Natural"],
                ["elevation", "Elevation"],
                ["geology", "Geology"],
              ]}
            />
            <Segmented
              label="Lighting"
              value={lighting}
              onChange={(v) => setLighting(v as typeof lighting)}
              options={[
                ["sun", "Solar"],
                ["studio", "Studio"],
                ["terminator", "Terminator"],
              ]}
            />
            <Segmented
              label="Quality"
              value={quality}
              onChange={(v) => setQuality(v as typeof quality)}
              options={[
                ["low", "Low"],
                ["high", "High"],
                ["ultra", "Ultra"],
              ]}
            />
            <Toggle label="Atmosphere" on={atmosphere} onClick={() => setAtmosphere((v) => !v)} />
            <Toggle label="Auto-rotate" on={spin} onClick={() => setSpin((v) => !v)} />
          </div>

          <div className="label-tele pointer-events-none absolute right-5 top-5 flex items-center gap-2">
            <Crosshair className="h-3.5 w-3.5 text-primary" />
            Click the surface to analyse a landing site
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="panel p-6">
            <div className="label-tele">Scientific record</div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body.summary}</p>
            <dl className="mt-5 divide-y divide-border">
              {metrics.map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-6 py-2.5">
                  <dt className="label-tele shrink-0">{k}</dt>
                  <dd className="text-right font-mono text-[13px] leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <AnimatePresence mode="wait">
            {analysis && (
              <motion.div
                key={`${analysis.lat}-${analysis.lon}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="panel p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="label-tele">Landing site analyzer</div>
                    <div className="mt-1 font-mono text-sm">
                      {analysis.lat.toFixed(2)}° , {analysis.lon.toFixed(2)}°
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-display text-4xl font-semibold tabular-nums"
                      style={{
                        color:
                          analysis.score >= 78
                            ? "var(--secondary)"
                            : analysis.score >= 62
                              ? "var(--primary)"
                              : analysis.score >= 45
                                ? "var(--warning)"
                                : "var(--destructive)",
                      }}
                    >
                      {analysis.score}
                    </div>
                    <div className="label-tele">{analysis.verdict}</div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <Bar label="Terrain safety" v={analysis.terrainSafety} />
                  <Bar label="Rock density" v={analysis.rockDensity} invert />
                  <Bar label="Water-ice probability" v={analysis.iceProbability} />
                  <Bar label="Scientific importance" v={analysis.scientificValue} />
                  <Bar label="Landing difficulty" v={analysis.landingDifficulty} invert />
                  <Bar label="Radiation risk" v={analysis.radiationRisk} invert />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="panel-flat p-3">
                    <div className="label-tele">Elevation</div>
                    <div className="mt-1 font-mono text-sm">{analysis.elevationM} m</div>
                  </div>
                  <div className="panel-flat p-3">
                    <div className="label-tele">Mean slope</div>
                    <div className="mt-1 font-mono text-sm">{analysis.slopeDeg}°</div>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {analysis.recommendation}
                </p>

                <div className="mt-5">
                  <div className="label-tele mb-3">Suggested rover traverse</div>
                  <ol className="space-y-3">
                    {analysis.roverPath.map((leg, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border font-mono text-[10px]">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-mono text-xs text-primary">
                            {leg.d} km · heading {leg.heading}
                          </div>
                          <div className="text-sm text-muted-foreground">{leg.objective}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <button
                  onClick={() => setPick(null)}
                  className="mt-6 w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear candidate site
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!analysis && (
            <div className="panel p-6">
              <div className="label-tele flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Landing site analyzer
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Select any coordinate on the globe. Cosmos OS models terrain safety, slope, rock abundance,
                volatile probability and radiation exposure, then returns a landing score with a suggested
                rover traverse.
              </p>
            </div>
          )}

          <div className="panel p-6">
            <div className="label-tele mb-4">Named surface features</div>
            <div className="space-y-2">
              {body.landmarks.map((l: Landmark) => (
                <button
                  key={l.name}
                  onClick={() =>
                    navigate({
                      to: "/explorer/$body",
                      params: { body: body.id },
                      search: { lat: String(l.lat), lon: String(l.lon) },
                    })
                  }
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-card/40 p-3 text-left transition-colors hover:border-border-strong"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm font-medium">{l.name}</span>
                    <span className="block text-xs text-muted-foreground">{l.note}</span>
                    <span className="label-tele mt-1 block text-[9px]">
                      {l.lat}° , {l.lon}°
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {missions.length > 0 && (
            <div className="panel p-6">
              <div className="label-tele mb-4">Missions at this body</div>
              <div className="space-y-3">
                {missions.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="label-tele text-[9px]">{m.agency}</div>
                    </div>
                    <span className="label-tele shrink-0">{m.year}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/missions"
                className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                Open mission archive
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background/70 p-1 backdrop-blur-xl">
      <span className="label-tele pl-2 text-[9px]">{label}</span>
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            value === v ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs backdrop-blur-xl transition-colors ${
        on ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <Sun className={`h-3.5 w-3.5 ${on ? "text-primary" : ""}`} />
      {label}
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-secondary" : "bg-border-strong"}`} />
    </button>
  );
}

function Bar({ label, v, invert = false }: { label: string; v: number; invert?: boolean }) {
  const good = invert ? 1 - v : v;
  const color = good > 0.66 ? "var(--secondary)" : good > 0.4 ? "var(--primary)" : "var(--destructive)";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label-tele">{label}</span>
        <span className="font-mono text-xs tabular-nums">{(v * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
        <motion.span
          className="block h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${v * 100}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
