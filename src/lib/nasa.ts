import type { BodyId } from "@/data/bodies";

/**
 * NASA Image & Video Library client (images-api.nasa.gov).
 *
 * The search API is public and requires no API key, so imagery can be pulled
 * directly from the browser. Results are parsed into a uniform catalog shape
 * and enriched with body / mission / spacecraft / year facets for filtering.
 */

export interface NasaCatalogItem {
  nasaId: string;
  title: string;
  description: string;
  dateCreated: string;
  year: number | null;
  thumbnail: string | null;
  medium: string | null;
  large: string | null;
  body: string;
  bodyId: BodyId | null;
  mission: string;
  spacecraft: string;
  center: string;
  keywords: string[];
}

const NASA_SEARCH = "https://images-api.nasa.gov/search";

/** Which NASA search query maps to each body in the catalogue. */
const BODY_QUERIES: Record<BodyId, string> = {
  mercury: '"Mercury" MESSENGER surface',
  venus: 'Venus "Magellan" surface OR atmosphere',
  earth: '"Blue Marble" OR "Earth from space"',
  moon: '"Moon" lunar surface LRO',
  mars: '"Mars" surface OR terrain',
  jupiter: '"Jupiter" planet',
  saturn: '"Saturn" planet ring',
  uranus: "Uranus Voyager",
  neptune: "Neptune Voyager",
  pluto: 'Pluto "New Horizons"',
  europa: 'Europa moon "Galileo" OR "Europa Clipper"',
  titan: 'Titan "Cassini" OR "Huygens"',
  enceladus: "Enceladus Cassini",
  ganymede: "Ganymede moon",
};

/** Search query per body, with the body-agnostic "all bodies" query. */
export function queryForBody(bodyId: BodyId | "all"): string {
  if (bodyId === "all") return '"solar system" planet OR moon OR surface';
  return BODY_QUERIES[bodyId];
}

/** Facet terms mapped from image keywords / photographer fields. */
const MISSION_KEYWORDS: { mission: string; aliases: string[] }[] = [
  { mission: "Perseverance", aliases: ["perseverance", "mars 2020", "mars2020", "moxie"] },
  { mission: "Curiosity", aliases: ["curiosity", "msl", "mars science laboratory"] },
  { mission: "Cassini", aliases: ["cassini", "huygens", "saturn"] },
  { mission: "Voyager", aliases: ["voyager"] },
  { mission: "Apollo", aliases: ["apollo", "apollo 11", "apollo 17"] },
  { mission: "Artemis", aliases: ["artemis", "orion"] },
  { mission: "Europa Clipper", aliases: ["europa clipper"] },
  { mission: "InSight", aliases: ["insight", "seis"] },
  { mission: "Juno", aliases: ["juno"] },
  { mission: "New Horizons", aliases: ["new horizons", "lorri"] },
  { mission: "MESSENGER", aliases: ["messenger", "mercury"] },
  { mission: "James Webb", aliases: ["james webb", "jwst", "webb"] },
  { mission: "Hubble", aliases: ["hubble", "hst"] },
  { mission: "ISS", aliases: ["iss", "international space station"] },
  {
    mission: "Mars Reconnaissance Orbiter",
    aliases: ["mars reconnaissance orbiter", "mro", "hirise"],
  },
  {
    mission: "Lunar Reconnaissance Orbiter",
    aliases: ["lunar reconnaissance orbiter", "lro", "lola"],
  },
  { mission: "Viking", aliases: ["viking"] },
];

export function detectMission(keywords: string[]): string {
  const joined = keywords.map((k) => k.toLowerCase()).join(" ");
  for (const { mission, aliases } of MISSION_KEYWORDS) {
    if (aliases.some((a) => joined.includes(a))) return mission;
  }
  return "Orbital survey";
}

/** NASA centers + secondary creators frequently read like spacecraft names. */
const SPACECRAFT_PATTERNS = [
  "perseverance",
  "curiosity",
  "opportunity",
  "spirit",
  "cassini",
  "voyager",
  "juno",
  "hubble",
  "webb",
  "messenger",
  "orbiter",
  "insight",
  "huygens",
  "galileo",
];

export function detectSpacecraft(keywords: string[], photographer?: string): string {
  const joined = `${photographer ?? ""} ${keywords.join(" ")}`.toLowerCase();
  const hit = SPACECRAFT_PATTERNS.find((p) => joined.includes(p));
  return hit ? hit[0]!.toUpperCase() + hit.slice(1) : "Multiple spacecraft";
}

interface NasaRawItem {
  data?: {
    title?: string;
    description?: string;
    date_created?: string;
    keywords?: string[];
    center?: string;
    secondary_creator?: string;
  }[];
  links?: { href?: string }[];
}

interface NasaRawResponse {
  collection?: { items?: NasaRawItem[] };
}

const cache = new Map<string, Promise<NasaCatalogItem[]>>();

function pickHref(links: NasaRawItem["links"], kinds: string[]): string | null {
  if (!links) return null;
  for (const l of links) {
    const rel = l.href?.toLowerCase() ?? "";
    if (kinds.some((k) => rel.includes(k))) return l.href ?? null;
  }
  return links[0]?.href ?? null;
}

export async function searchNasaImages(
  bodyId: BodyId | "all",
  page = 1,
): Promise<NasaCatalogItem[]> {
  const key = `${bodyId}-${page}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const params = new URLSearchParams({
      q: queryForBody(bodyId),
      media_type: "image",
      page_size: "48",
      page: String(page),
    });
    const res = await fetch(`${NASA_SEARCH}?${params.toString()}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`NASA images API ${res.status}`);
    const json = (await res.json()) as NasaRawResponse;
    const items = (json.collection?.items ?? []).filter(
      (i): i is NasaRawItem & { data: NonNullable<NasaRawItem["data"]> } => !!i.data?.length,
    );
    return items
      .map((item): NasaCatalogItem | null => {
        const d = item.data[0]!;
        const thumbnail = pickHref(item.links, ["thumb"]);
        const medium = pickHref(item.links, ["medium"]) ?? thumbnail;
        const large = pickHref(item.links, ["large", "orig"]) ?? medium;
        if (!thumbnail) return null;
        const keywords = d.keywords ?? [];
        const dateCreated = d.date_created ?? "";
        const year = /^\d{4}/.test(dateCreated) ? Number(dateCreated.slice(0, 4)) : null;
        return {
          nasaId: d.title ?? "",
          title: d.title ?? "Untitled",
          description: d.description ?? "",
          dateCreated,
          year,
          thumbnail,
          medium,
          large,
          body: bodyId === "all" ? keywords.join(", ").slice(0, 80) : bodyId,
          bodyId: bodyId === "all" ? null : bodyId,
          mission: detectMission(keywords),
          spacecraft: detectSpacecraft(keywords, d.secondary_creator),
          center: d.center ?? "",
          keywords,
        };
      })
      .filter((i): i is NasaCatalogItem => !!i);
  })();

  cache.set(key, promise);
  return promise;
}
