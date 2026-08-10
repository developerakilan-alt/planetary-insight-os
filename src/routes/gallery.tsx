import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCcw, Satellite, Sparkles } from "lucide-react";
import { BODIES } from "@/data/bodies";
import { MISSIONS } from "@/data/missions";
import { describeImage } from "@/lib/ai.functions";
import { searchNasaImages, type NasaCatalogItem } from "@/lib/nasa";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Imaging Library — Cosmos OS" },
      {
        name: "description",
        content:
          "A filterable imaging library of real NASA imagery from the NASA Image and Video Library, with scientific descriptions and mission provenance.",
      },
      { property: "og:title", content: "Imaging Library — Cosmos OS" },
      {
        property: "og:description",
        content: "Filter planetary imagery from NASA by body, mission, spacecraft and year.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gallery,
});

interface CatalogEntry {
  id: string;
  title: string;
  body: string;
  bodyId: string;
  palette: { low: string; mid: string; high: string };
  mission: string;
  spacecraft: string;
  year: number | null;
  description: string;
  image: string | null;
  source: string;
}

/** Fallback entries used when the NASA API is unreachable. */
function buildFallback(): CatalogEntry[] {
  return BODIES.flatMap((b, bi) =>
    b.landmarks.map((l, li) => {
      const mission = MISSIONS.find((m) => m.target === b.id);
      return {
        id: `${b.id}-${li}`,
        title: l.name,
        body: b.name,
        bodyId: b.id,
        palette: b.palette,
        mission: mission?.name ?? "Orbital survey",
        spacecraft: mission?.agency ?? "Multi-agency",
        year: (mission?.year ?? 2004) + li,
        description: `${l.note}. Imaging product reconstructed from ${b.name} orbital datasets; ${l.kind} morphology at ${l.lat}°, ${l.lon}°.`,
        image: null,
        source: "local",
      };
    }),
  );
}

function toEntry(item: NasaCatalogItem): CatalogEntry {
  const body = BODIES.find((b) => b.id === item.bodyId);
  return {
    id: `nasa-${item.nasaId}-${item.thumbnail}`,
    title: item.title,
    body: item.body,
    bodyId: item.bodyId ?? item.body,
    palette: body?.palette ?? { low: "#111827", mid: "#334155", high: "#64748b" },
    mission: item.mission,
    spacecraft: item.spacecraft,
    year: item.year,
    description: item.description.slice(0, 320),
    image: item.medium,
    source: "nasa",
  };
}

function Gallery() {
  const [body, setBody] = useState<string>("all");
  const [mission, setMission] = useState<string>("all");
  const [spacecraft, setSpacecraft] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [entries, setEntries] = useState<CatalogEntry[]>(buildFallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [realData, setRealData] = useState(false);
  const [page, setPage] = useState(1);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [pendingCaption, setPendingCaption] = useState<string | null>(null);
  const fn = useServerFn(describeImage);

  const captionMutation = useMutation({
    mutationFn: async (item: CatalogEntry) => {
      const res = await fn({
        data: {
          title: item.title,
          body: item.body,
          mission: item.mission,
          spacecraft: item.spacecraft,
          year: item.year,
          description: item.description,
          nasaId: item.id,
        },
      });
      return res.content;
    },
    onSuccess: (content, item) => setCaptions((c) => ({ ...c, [item.id]: content })),
    onSettled: () => setPendingCaption(null),
  });

  const generateCaption = (item: CatalogEntry) => {
    if (captions[item.id] || pendingCaption) return;
    setPendingCaption(item.id);
    captionMutation.mutate(item);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const bodyId = (body as "all") || "all";
    searchNasaImages(bodyId as never, 1)
      .then((items) => {
        if (cancelled) return;
        if (items.length === 0) {
          setEntries(buildFallback());
          setRealData(false);
          return;
        }
        setEntries(items.map(toEntry));
        setRealData(true);
        setPage(1);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setEntries(buildFallback());
        setRealData(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [body]);

  const loadMore = () => {
    const next = page + 1;
    searchNasaImages((body as "all") || "all", next)
      .then((items) => {
        if (items.length === 0) return;
        setEntries((e) => [...e, ...items.map(toEntry)]);
        setPage(next);
      })
      .catch(() => {
        /* end of results or offline */
      });
  };

  const missions = useMemo(() => [...new Set(MISSIONS.map((m) => m.name))], []);
  const spacecrafts = useMemo(
    () => [...new Set(entries.map((e) => e.spacecraft))].sort(),
    [entries],
  );
  const years = useMemo(
    () =>
      [...new Set(entries.map((e) => e.year).filter((y): y is number => !!y))].sort(
        (a, b) => b - a,
      ),
    [entries],
  );

  const filtered = entries.filter(
    (i) =>
      (body === "all" || i.bodyId === body) &&
      (mission === "all" || i.mission === mission) &&
      (spacecraft === "all" || i.spacecraft === spacecraft) &&
      (year === "all" || String(i.year) === year),
  );

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <div className="label-tele flex items-center gap-2">
        <Satellite className="h-3.5 w-3.5 text-primary" /> Imaging library
      </div>
      <h1 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold">
        Surface observation archive
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Live imagery pulled from the NASA Image and Video Library. Filter by body, mission,
        spacecraft or year, and hover any image to ask the AI imaging analyst for a scientific
        caption.
      </p>

      <div className="mt-8 grid gap-3 lg:grid-cols-4">
        <Filter
          label="Body"
          value={body}
          onChange={setBody}
          options={[
            ["all", "All bodies"],
            ...BODIES.map((b) => [b.id, b.name] as [string, string]),
          ]}
        />
        <Filter
          label="Mission"
          value={mission}
          onChange={setMission}
          options={[["all", "All missions"], ...missions.map((m) => [m, m] as [string, string])]}
        />
        <Filter
          label="Spacecraft"
          value={spacecraft}
          onChange={setSpacecraft}
          options={[
            ["all", "All spacecraft"],
            ...spacecrafts.map((s) => [s, s] as [string, string]),
          ]}
        />
        <Filter
          label="Year"
          value={year}
          onChange={setYear}
          options={[
            ["all", "All years"],
            ...years.map((y) => [String(y), String(y)] as [string, string]),
          ]}
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="label-tele text-[9px]">
          {loading
            ? "Contacting NASA Image and Video Library…"
            : realData
              ? `${filtered.length} items · sourced from images-api.nasa.gov`
              : error
                ? "NASA API unavailable — showing local reconstruction fallback"
                : `${filtered.length} local records`}
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>

      <div className="mt-4 grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item, i) => (
          <motion.figure
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (i % 8) * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="panel lift group relative overflow-hidden"
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle at 30% 25%, ${item.palette.high}, ${item.palette.mid} 45%, ${item.palette.low} 100%)`,
                  opacity: 0.85,
                }}
              />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--background),transparent_65%)]" />
            {item.source === "nasa" && (
              <span className="label-tele absolute right-3 top-3 rounded-full border border-border bg-background/80 px-2 py-1 text-[9px] text-foreground backdrop-blur">
                NASA
              </span>
            )}
            <button
              onClick={() => generateCaption(item)}
              disabled={!!pendingCaption && pendingCaption !== item.id}
              aria-label={`Generate an AI scientific caption for ${item.title}`}
              className="absolute left-3 top-3 flex h-8 items-center gap-1.5 rounded-full border border-border bg-background/80 px-2.5 text-[10px] text-primary opacity-0 backdrop-blur transition-all duration-300 hover:border-primary/50 hover:bg-primary/15 group-hover:opacity-100 focus-visible:opacity-100 disabled:cursor-default disabled:opacity-70"
            >
              {pendingCaption === item.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {pendingCaption === item.id ? "Analyzing" : "AI caption"}
            </button>
            <figcaption className="absolute inset-x-0 bottom-0 p-5">
              <div className="label-tele">
                {item.body} · {item.year ?? "—"} · {item.spacecraft}
              </div>
              <div className="mt-1 line-clamp-2 font-display text-lg font-medium">{item.title}</div>
              <p className="mt-2 max-h-0 overflow-hidden text-xs leading-relaxed text-muted-foreground opacity-0 transition-all duration-500 group-hover:max-h-80 group-hover:opacity-100">
                {captions[item.id] ? (
                  <>
                    <span className="mb-1.5 flex items-center gap-1.5 font-semibold text-primary">
                      <Sparkles className="h-3 w-3" /> AI imaging analyst
                    </span>
                    {captions[item.id]}
                  </>
                ) : (
                  item.description
                )}
              </p>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      {realData && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={loadMore}
            className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Load more imagery
          </button>
        </div>
      )}
    </div>
  );
}

function Filter({
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
    <label className="panel-flat flex items-center gap-3 px-4 py-3">
      <span className="label-tele shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v} className="bg-card text-foreground">
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
