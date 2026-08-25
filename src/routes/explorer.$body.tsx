import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Bookmark,
  Columns2,
  Crosshair,
  Database,
  Download,
  ExternalLink,
  FlaskConical,
  MapPin,
  Share2,
  Sparkles,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sidebar, type SidebarLinkItem } from "@/components/ui/animated-sidebar";
import { ClientOnly } from "@/components/ClientOnly";
import { Shimmer } from "@/components/motion/Shimmer";
import { AtmosphereChart } from "@/components/AtmosphereChart";
import { GlobeControlPanel, MobileGlobeControls } from "@/components/globe/GlobeControls";
import { BODIES, getBody, type Body, type BodyId, type Landmark } from "@/data/bodies";
import { getAtmosphere } from "@/data/atmosphere";
import { PLANET_CONFIGS, textureUrl } from "@/data/planets/configs";
import type {
  PlanetVisualConfig,
  Quality,
  RotationMode,
  TextureSource,
  VisualizationMode,
} from "@/data/planets/types";
import { analyseSite } from "@/lib/analysis";
import { getElevationSampler } from "@/lib/elevation";
import { formatLat, formatLon, nearestFeature } from "@/lib/geo";
import { cacheTexturePack, haptic, preloadImages, whenIdle } from "@/lib/offline";
import { useDeviceQuality } from "@/hooks/use-device-quality";
import { AiSiteReview } from "@/components/AiSiteReview";
import { SavedLibrary } from "@/components/SavedLibrary";
import { addItem, getItems, hasItem, removeItem } from "@/lib/saved";
import { buildSiteAnalysisMarkdown, downloadTextFile } from "@/lib/report";

const ScientificGlobe = lazy(() => import("@/components/three/ScientificGlobe"));

const searchSchema = z.object({
  lat: z.string().optional(),
  lon: z.string().optional(),
});

export const Route = createFileRoute("/explorer/$body")({
  validateSearch: searchSchema,
  loader: ({ params }): { body: Body } => {
    const body = getBody(params.body);
    if (!body) throw notFound();
    return { body };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Body not found — Cosmos OS" }, { name: "robots", content: "noindex" }],
      };
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

function PlanetDashboard() {
  const { body } = Route.useLoaderData() as { body: Body };
  const search = Route.useSearch();
  const navigate = useNavigate();

  const config = PLANET_CONFIGS[body.id];
  const availableModes = config.modes;
  const { tier: autoTier, maxDpr } = useDeviceQuality();

  const [mode, setMode] = useState<VisualizationMode>(availableModes[0] ?? "natural");
  const [rotation, setRotation] = useState<RotationMode>("fast");
  const [atmosphere, setAtmosphere] = useState(!!config.atmosphere);
  const [clouds, setClouds] = useState(!!config.clouds);
  const [quality, setQuality] = useState<Quality>("auto");
  const [exaggeration, setExaggeration] = useState(config.defaultExaggeration);
  const [lighting, setLighting] = useState<"sun" | "studio" | "terminator">("sun");
  const [pick, setPick] = useState<{ lat: number; lon: number } | null>(null);
  const [gestureFocus, setGestureFocus] = useState<{ lat: number; lon: number } | null>(null);
  const [downloadingPack, setDownloadingPack] = useState(false);
  const [section, setSection] = useState<SectionId | null>(null);
  const [railOpen, setRailOpen] = useState(false);

  const effectiveQuality: Quality = quality === "auto" ? autoTier : quality;

  const handleRailClick = (link: SidebarLinkItem) => {
    const id = link.href.slice(1) as SectionId;
    if (id === "compare") {
      void navigate({ to: "/compare", search: { a: body.id } });
      return;
    }
    setSection((cur) => (cur === id ? null : id));
  };

  useEffect(() => {
    if (!availableModes.includes(mode)) setMode(availableModes[0] ?? "natural");
  }, [availableModes, mode]);

  // Warm the HTTP cache for the next/previous planet's M-tier textures while idle.
  useEffect(() => {
    whenIdle(() => {
      const idx = BODIES.findIndex((b) => b.id === body.id);
      if (idx < 0) return;
      const neighbors = [
        BODIES[(idx - 1 + BODIES.length) % BODIES.length],
        BODIES[(idx + 1) % BODIES.length],
      ].filter((b): b is Body => !!b);
      const urls: string[] = [];
      for (const b of neighbors) {
        const c = PLANET_CONFIGS[b.id];
        const srcs: TextureSource[] = [
          c.surfaceColor,
          c.surfaceElevation,
          c.surfaceTerrain,
          c.surfaceScientific,
          c.surfaceNormal,
          c.nightLights,
        ].filter((s): s is TextureSource => !!s);
        if (c.clouds) srcs.push(c.clouds.source);
        if (c.rings) srcs.push(c.rings.source);
        for (const s of srcs) urls.push(textureUrl(c, s.stem, "M", s));
      }
      preloadImages(urls);
    });
  }, [body.id]);

  useEffect(() => {
    setGestureFocus(null);
    setPick(null);
    setSection(null);
  }, [body.id]);

  const focus = useMemo(() => {
    if (search.lat && search.lon) return { lat: Number(search.lat), lon: Number(search.lon) };
    return gestureFocus;
  }, [search.lat, search.lon, gestureFocus]);

  const analysis = pick ? analyseSite(body, pick.lat, pick.lon) : null;
  const atmosphereProfile = getAtmosphere(body.id);

  const saveAnalysis = () => {
    if (!analysis) return;
    const key = `${body.id}:${analysis.lat.toFixed(2)},${analysis.lon.toFixed(2)}`;
    if (hasItem("analysis", key)) {
      toast("Already in your library");
      return;
    }
    addItem({
      kind: "analysis",
      bodyId: body.id,
      bodyName: body.name,
      lat: analysis.lat,
      lon: analysis.lon,
      score: analysis.score,
      verdict: analysis.verdict,
    });
    toast.success("Analysis saved to library");
  };

  const downloadAnalysis = () => {
    if (!analysis) return;
    downloadTextFile(
      `${body.id}-landing-${analysis.lat.toFixed(2)}_${analysis.lon.toFixed(2)}.md`,
      buildSiteAnalysisMarkdown(body, analysis),
    );
    toast.success("Report downloaded");
  };

  const toggleLandmark = (l: Landmark) => {
    const key = `${body.id}:${l.name}`;
    if (hasItem("landmark", key)) {
      const existing = getItems().find(
        (i) => i.kind === "landmark" && `${i.bodyId}:${i.landmarkName}` === key,
      );
      if (existing) removeItem(existing.id);
      toast("Bookmark removed");
    } else {
      addItem({
        kind: "landmark",
        bodyId: body.id,
        bodyName: body.name,
        landmarkName: l.name,
        lat: l.lat,
        lon: l.lon,
      });
      toast.success("Landmark bookmarked");
    }
  };

  const handlePick = (lat: number, lon: number) => {
    haptic(6);
    setPick({ lat, lon });
    setGestureFocus({ lat, lon });
    setSection("location");
  };

  const handleDoubleTap = (lat: number, lon: number) => {
    haptic(18);
    setPick({ lat, lon });
    setGestureFocus({ lat, lon });
  };

  const handleLongPress = async (lat: number, lon: number) => {
    haptic([0, 40, 30, 40]);
    setPick({ lat, lon });
    const text = `${body.name} — ${formatLat(lat)} ${formatLon(lon)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast("Coordinates copied", { description: text });
    } catch {
      toast.error("Could not copy coordinates");
    }
  };

  const shareView = async () => {
    const url = new URL(window.location.href);
    if (pick) {
      url.searchParams.set("lat", pick.lat.toFixed(4));
      url.searchParams.set("lon", pick.lon.toFixed(4));
    }
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (typeof nav.share === "function") {
      try {
        await nav.share({
          title: document.title,
          text: `${body.name} (${body.designation}) dashboard — Cosmos OS`,
          url: url.href,
        });
        return;
      } catch {
        /* user cancelled the share sheet — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url.href);
      toast.success("Link copied", { description: "Share this exact view with anyone." });
    } catch {
      toast.error("Could not copy link");
    }
  };

  const downloadHdPack = async () => {
    if (downloadingPack) return;
    setDownloadingPack(true);
    try {
      const srcs: TextureSource[] = [
        config.surfaceColor,
        config.surfaceElevation,
        config.surfaceTerrain,
        config.surfaceScientific,
        config.surfaceNormal,
        config.nightLights,
      ].filter((s): s is TextureSource => !!s);
      if (config.clouds) srcs.push(config.clouds.source);
      if (config.rings) srcs.push(config.rings.source);
      const urls = srcs.map((s) => textureUrl(config, s.stem, "H", s));
      const res = await cacheTexturePack(urls);
      toast.success(`HD pack cached (${res.cached} files)`, {
        description: res.mode === "sw" ? "Saved for offline use." : "Pre-fetched for this session.",
      });
    } catch {
      toast.error("HD pack download failed");
    } finally {
      setDownloadingPack(false);
    }
  };

  const globeControls = {
    config,
    mode,
    onMode: setMode,
    rotation,
    onRotation: setRotation,
    lighting,
    onLighting: setLighting,
    quality,
    onQuality: setQuality,
    atmosphere,
    onAtmosphere: setAtmosphere,
    clouds,
    onClouds: setClouds,
    exaggeration,
    onExaggeration: setExaggeration,
    hdPack: { downloading: downloadingPack, onDownload: downloadHdPack },
  };

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
    <div className="mx-auto flex w-full max-w-[1720px] items-start gap-5 px-4 pb-16 pt-24 lg:px-6">
      {/* Navigation rail — left side */}
      <Sidebar
        open={railOpen}
        setOpen={setRailOpen}
        links={RAIL_LINKS}
        activeLabel={section ?? undefined}
        onLinkClick={handleRailClick}
        logo={<RailLogo expanded={railOpen} />}
      />

      <div className="min-w-0 flex-1">
        {/* Sol-system view — full page */}
        <div className="panel relative h-[72vh] min-h-[520px] overflow-hidden">
          <ClientOnly
            fallback={
              <div className="absolute inset-0">
                <Shimmer className="absolute inset-0 rounded-none" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="label-tele">Initialising renderer…</div>
                </div>
              </div>
            }
          >
            <ScientificGlobe
              config={config}
              body={body}
              options={{
                quality: effectiveQuality,
                mode,
                rotation,
                atmosphere,
                clouds,
                exaggeration,
                lighting,
              }}
              landmarks={body.landmarks}
              pick={pick}
              onPick={handlePick}
              focus={focus}
              onDoubleTap={handleDoubleTap}
              onLongPress={handleLongPress}
              maxDpr={maxDpr}
            />
          </ClientOnly>

          <div className="pointer-events-none absolute left-5 top-5">
            <div className="label-tele">
              {body.designation} · {body.system} system
            </div>
            <h1 className="font-display text-4xl font-semibold">{body.name}</h1>
          </div>

          <div className="pointer-events-none absolute right-5 top-5 hidden items-center gap-2 md:flex">
            <Crosshair className="h-3.5 w-3.5 text-primary" />
            <span className="label-tele">
              Click to inspect · double-click to focus · long-press to copy
            </span>
          </div>

          <div className="pointer-events-auto absolute right-5 top-5 md:right-5 md:top-16">
            <button
              onClick={shareView}
              title="Copy link to this view"
              className="glass-chip flex h-9 items-center gap-2 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share view</span>
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 hidden flex-wrap gap-2 md:flex">
            <GlobeControlPanel {...globeControls} />
          </div>

          <MobileGlobeControls {...globeControls} />

          {mode === "infrared" && (
            <div className="pointer-events-none absolute bottom-20 left-4 hidden max-w-xs md:block">
              <p className="label-tele rounded-lg border border-glass-edge bg-glass-fill p-2 text-[9px] leading-relaxed text-muted-foreground backdrop-blur-xl">
                Infrared is a modeled thermal view derived from real elevation / radar data — not a
                direct thermal-IR photograph.
              </p>
            </div>
          )}
        </div>

        {/* Detail sections — revealed one at a time from the Dashboard menu */}
        <div className="mt-4 space-y-4">
          {section === "scientific" && (
            <div className="panel p-6">
              <div className="label-tele flex items-center gap-2">
                <FlaskConical className="h-3.5 w-3.5 text-primary" /> Scientific record
              </div>
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
          )}

          {section === "points" && (
            <div className="panel p-6">
              <div className="label-tele mb-4">Selected points · named surface features</div>
              <div className="grid gap-2 md:grid-cols-2">
                {body.landmarks.map((l: Landmark) => (
                  <div key={l.name} className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        navigate({
                          to: "/explorer/$body",
                          params: { body: body.id },
                          search: { lat: String(l.lat), lon: String(l.lon) },
                        })
                      }
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-xl border border-glass-edge bg-glass-fill p-3 text-left transition-colors hover:border-glass-edge-strong"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>
                        <span className="block text-sm font-medium">{l.name}</span>
                        <span className="block text-xs text-muted-foreground">{l.note}</span>
                        <span className="label-tele mt-1 block text-[9px]">
                          {formatLat(l.lat)} · {formatLon(l.lon)}
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => toggleLandmark(l)}
                      aria-label={`Bookmark ${l.name}`}
                      className="shrink-0 rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "location" && (
            <AnimatePresence mode="wait">
              {pick ? (
                <motion.div
                  key={`loc-${pick.lat.toFixed(2)}-${pick.lon.toFixed(2)}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="panel p-6"
                >
                  <LocationPanel
                    body={body}
                    config={config}
                    lat={pick.lat}
                    lon={pick.lon}
                    onClose={() => setPick(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="loc-empty"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="panel p-6"
                >
                  <div className="label-tele flex items-center gap-2">
                    <Crosshair className="h-3.5 w-3.5 text-primary" /> Location inspector
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Select any coordinate on the globe to read sampled surface elevation and the
                    nearest named feature.
                    {config.elevation
                      ? ` Elevation is sampled from ${config.elevation.dataset}.`
                      : ""}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {section === "analyzer" &&
            (analysis ? (
              <motion.div
                key={`analysis-${analysis.lat.toFixed(2)}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
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

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={saveAnalysis}
                    className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/15"
                  >
                    <Bookmark className="h-3.5 w-3.5" /> Save to library
                  </button>
                  <button
                    onClick={downloadAnalysis}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" /> Report
                  </button>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {analysis.recommendation}
                </p>

                <AiSiteReview body={body} analysis={analysis} />

                <p className="label-tele mt-3 text-[9px]">
                  The landing-score model is an illustrative approximation, not a mission-planning
                  tool.
                </p>
              </motion.div>
            ) : (
              <div className="panel p-6">
                <div className="label-tele flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Landing site analyzer
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Select any coordinate on the globe to score terrain safety, slope, ice probability
                  and radiation risk for a soft landing.
                </p>
              </div>
            ))}

          {section === "provenance" && (
            <ProvenancePanel
              title={config.provenance.title}
              rows={config.provenance.rows}
              viewSourceUrl={config.provenance.viewSourceUrl}
              disclaimer={config.provenance.disclaimer}
              notes={config.notes}
            />
          )}

          {section === "library" && <SavedLibrary />}

          {section === "atmosphere" && atmosphereProfile && (
            <AtmosphereChart profile={atmosphereProfile} />
          )}
        </div>
      </div>
    </div>
  );
}

type SectionId =
  | "scientific"
  | "points"
  | "location"
  | "analyzer"
  | "provenance"
  | "library"
  | "compare"
  | "atmosphere";

const RAIL_SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "scientific", label: "Scientific record", icon: FlaskConical },
  { id: "points", label: "Selected points", icon: MapPin },
  { id: "location", label: "Location inspector", icon: Crosshair },
  { id: "analyzer", label: "Landing site analyzer", icon: Sparkles },
  { id: "atmosphere", label: "Atmospheric profile", icon: Wind },
  { id: "compare", label: "Planet comparison", icon: Columns2 },
  { id: "provenance", label: "Data provenance", icon: Database },
  { id: "library", label: "Saved library", icon: Bookmark },
];

const RAIL_LINKS: SidebarLinkItem[] = RAIL_SECTIONS.map((s) => ({
  label: s.label,
  href: `#${s.id}`,
  icon: <s.icon className="h-4.5 w-4.5" />,
}));

function RailLogo({ expanded }: { expanded: boolean }) {
  return (
    <span className="flex items-center gap-2.5 overflow-hidden px-1 py-1">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10">
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_2px_color-mix(in_oklab,var(--primary)_60%,transparent)]" />
      </span>
      {expanded && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="label-tele whitespace-nowrap text-[10px]"
        >
          Mission console
        </motion.span>
      )}
    </span>
  );
}

function LocationPanel({
  body,
  config,
  lat,
  lon,
  onClose,
}: {
  body: Body;
  config: PlanetVisualConfig;
  lat: number;
  lon: number;
  onClose: () => void;
}) {
  const [elevation, setElevation] = useState<{ value: number; approx: boolean } | null>(null);
  const [sampling, setSampling] = useState(false);

  const feature = useMemo(
    () => nearestFeature(lat, lon, body.landmarks, 14),
    [body.landmarks, lat, lon],
  );

  useEffect(() => {
    let cancelled = false;
    setSampling(true);
    setElevation(null);
    const elev = config.surfaceElevation && config.elevation;
    if (elev) {
      const url = textureUrlH(config);
      getElevationSampler(url, config.elevation!)
        .then((sampler) => {
          if (cancelled || !sampler) return;
          setElevation({ value: sampler.sample(lat, lon), approx: true });
        })
        .finally(() => {
          if (!cancelled) setSampling(false);
        });
    } else {
      setSampling(false);
    }
    return () => {
      cancelled = true;
    };
  }, [config, lat, lon]);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label-tele">Selected point</div>
          <div className="mt-1 font-mono text-sm text-primary">
            {formatLat(lat)} · {formatLon(lon)}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="panel-flat p-3">
          <div className="label-tele">Sampled elevation</div>
          <div className="mt-1 font-mono text-sm">
            {sampling
              ? "reading DEM…"
              : elevation
                ? `${Math.round(elevation.value).toLocaleString()} m`
                : "—"}
          </div>
          {elevation?.approx && config.elevation && (
            <div className="label-tele mt-1 text-[9px]">approx. · {config.elevation.dataset}</div>
          )}
        </div>
        <div className="panel-flat p-3">
          <div className="label-tele">Surface elevation range</div>
          <div className="mt-1 font-mono text-sm">
            {config.elevation
              ? `${config.elevation.minM.toLocaleString()} … ${config.elevation.maxM.toLocaleString()} m`
              : "not mapped"}
          </div>
          {config.elevation && (
            <div className="label-tele mt-1 text-[9px]">{config.elevation.source}</div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="label-tele mb-2">Nearest named feature</div>
        {feature ? (
          <div className="rounded-xl border border-glass-edge bg-glass-fill p-3">
            <div className="text-sm font-medium">{feature.name}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{feature.note}</div>
            <div className="label-tele mt-1 text-[9px]">
              {feature.distanceDeg.toFixed(1)}° away · {feature.kind}
            </div>
          </div>
        ) : (
          <div className="label-tele">No named feature within 14° of this point.</div>
        )}
      </div>
    </>
  );
}

function textureUrlH(config: PlanetVisualConfig): string {
  const src = config.surfaceElevation!;
  return src.single
    ? `/textures/${config.planetId}/${src.stem}.${src.ext ?? "jpg"}`
    : `/textures/${config.planetId}/${src.stem}_H.jpg`;
}

function ProvenancePanel({
  title,
  rows,
  viewSourceUrl,
  disclaimer,
  notes,
}: {
  title: string;
  rows: { label: string; value: string }[];
  viewSourceUrl: string;
  disclaimer: string;
  notes?: string | undefined;
}) {
  return (
    <div className="panel p-6">
      <div className="label-tele flex items-center gap-2">
        <Database className="h-3.5 w-3.5 text-primary" /> Data provenance
      </div>
      <div className="label-tele mt-3 text-[10px]">{title}</div>
      <dl className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4">
            <dt className="label-tele shrink-0 text-[9px]">{r.label}</dt>
            <dd className="text-right font-mono text-[11px] leading-snug text-muted-foreground">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
      {notes && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{notes}</p>}
      <a
        href={viewSourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        View source dataset <ExternalLink className="h-3 w-3" />
      </a>
      <p className="label-tele mt-4 border-t border-border pt-3 text-[9px] leading-relaxed">
        {disclaimer}
      </p>
    </div>
  );
}

function Bar({ label, v, invert = false }: { label: string; v: number; invert?: boolean }) {
  const good = invert ? 1 - v : v;
  const color =
    good > 0.66 ? "var(--secondary)" : good > 0.4 ? "var(--primary)" : "var(--destructive)";
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
