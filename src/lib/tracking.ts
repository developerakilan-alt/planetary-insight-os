/**
 * Live mission-tracking feeds used by the Flight Operations console.
 * All sources are public APIs with CORS enabled; every fetch is best-effort
 * and returns a clean shape so the UI can degrade gracefully offline.
 *
 * Sources:
 * - Deep Space Network Now   (https://eyes.nasa.gov/dsn/data/dsn.json)
 * - People in space          (http://api.open-notify.org/astros.json)
 * - Mars 2020 raw images     (https://mars.nasa.gov/rss/api/?feed=raw_images)
 */

export interface DsnSignal {
  band: string;
  dir: "up" | "down";
  rateBps: number | null;
  target: string;
}

export interface DsnDish {
  id: string;
  name: string;
  azimuth: number | null;
  elevation: number | null;
  activity: string;
  desc: string;
  user: string;
  signals: DsnSignal[];
}

export interface DsnSnapshot {
  time: number;
  dishes: DsnDish[];
}

export interface CrewMember {
  name: string;
  craft: string;
}

export interface RoverShot {
  sol: number | null;
  drive: string | null;
  title: string;
  caption: string;
  credit: string;
  camera: string;
  dateUtc: string | null;
  thumbnail: string | null;
  medium: string | null;
  link: string | null;
}

const SC_TARGETS: Record<string, string> = {
  VGR1: "Voyager 1",
  VGR2: "Voyager 2",
  MRO: "Mars Reconnaissance Orbiter",
  MSL: "Curiosity",
  M2020: "Perseverance",
  NSYT: "InSight",
  ODY: "Mars Odyssey",
  MEX: "Mars Express",
  TGO: "ExoMars Trace Gas Orbiter",
  JUNO: "Juno",
  JUICE: "Jupiter Icy Moons Explorer",
  PKS: "Psyche",
  ECO: "Europa Clipper",
  HST: "Hubble Space Telescope",
  WST: "James Webb Space Telescope",
  AST: "Asteroid / planetary defense",
};

export function dsnTargetName(code: string): string {
  return SC_TARGETS[code] ?? code;
}

export function formatSignalRate(rateBps: number | null): string {
  if (rateBps === null || Number.isNaN(rateBps)) return "—";
  if (rateBps >= 1000) return `${(rateBps / 1000).toFixed(1)} kbps`;
  return `${Math.round(rateBps)} bps`;
}

export async function fetchDsn(signal?: AbortSignal): Promise<DsnSnapshot> {
  const res = await fetch("https://eyes.nasa.gov/dsn/data/dsn.json", {
    signal: signal ?? AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(String(res.status));

  const json = (await res.json()) as {
    time?: number;
    dishes?: Record<
      string,
      {
        az?: string;
        el?: string;
        sigs?: {
          band?: string;
          dir?: string;
          rate?: string | number;
          pwr?: string | number;
          tgt?: string;
        }[];
        act?: string;
        desc?: string;
        user?: string;
      }
    >;
  };

  const dishes = Object.entries(json.dishes ?? {})
    .map(([id, d]) => {
      const az = Number.parseFloat(String(d.az));
      const el = Number.parseFloat(String(d.el));
      return {
        id,
        name: `DSS-${id}`,
        azimuth: Number.isFinite(az) ? az : null,
        elevation: Number.isFinite(el) ? el : null,
        activity: d.act ?? "",
        desc: d.desc ?? "",
        user: d.user ?? "",
        signals: (d.sigs ?? [])
          .filter((s) => s.tgt)
          .map((s) => {
            const rate = Number(s.rate);
            return {
              band: s.band ?? "X",
              dir: (s.dir ?? "down") as "up" | "down",
              rateBps: Number.isFinite(rate) ? rate : null,
              target: s.tgt!,
            };
          }),
      };
    })
    .filter((d) => d.signals.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { time: json.time ?? Date.now(), dishes };
}

export async function fetchCrew(signal?: AbortSignal): Promise<CrewMember[]> {
  const res = await fetch("http://api.open-notify.org/astros.json", {
    signal: signal ?? AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(String(res.status));

  const json = (await res.json()) as {
    number?: number;
    people?: { name?: string; craft?: string }[];
  };

  return (json.people ?? []).map((p) => ({ name: p.name ?? "Unknown", craft: p.craft ?? "ISS" }));
}

export async function fetchRoverShot(signal?: AbortSignal): Promise<RoverShot | null> {
  const url =
    "https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&page=0&num=1&order=sol%20desc";
  const res = await fetch(url, { signal: signal ?? AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(String(res.status));

  const json = (await res.json()) as {
    images?: {
      sol?: string | number;
      drive?: string | number;
      title?: string;
      caption?: string;
      credit?: string;
      date_taken_utc?: string;
      camera?: { instrument?: string };
      image_files?: { small?: string | null; medium?: string | null };
      link?: string;
    }[];
  };

  const shot = json.images?.[0];
  if (!shot) return null;

  const sol = Number(shot.sol);
  const drive = shot.drive != null ? String(shot.drive) : null;
  return {
    sol: Number.isFinite(sol) ? sol : null,
    drive,
    title: shot.title ?? "Mars Perseverance raw image",
    caption: shot.caption ?? "",
    credit: shot.credit ?? "NASA/JPL-Caltech",
    camera: shot.camera?.instrument ?? "—",
    dateUtc: shot.date_taken_utc ?? null,
    thumbnail: shot.image_files?.small ?? null,
    medium: shot.image_files?.medium ?? null,
    link: shot.link ?? null,
  };
}
