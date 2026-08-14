import { BODIES, type BodyId } from "@/data/bodies";

/**
 * Deterministic planetary weather model. Every readout is derived from the
 * body's published metric envelope plus a stable per-body pseudo-random
 * generator, so conditions are reproducible for a given time — a model, not
 * telemetered data (labelled as such in the UI).
 */

export type WeatherCondition =
  | "clear"
  | "clouds"
  | "storm"
  | "dust"
  | "methane-rain"
  | "sulfuric"
  | "cryo"
  | "bands"
  | "spot"
  | "fog";

export interface DayWeather {
  date: string;
  tempMinC: number;
  tempMaxC: number;
  windKmh: number;
  pressureBar: number;
  cloudPct: number;
  condition: WeatherCondition;
}

export interface WeatherReport {
  bodyId: BodyId;
  bodyName: string;
  now: {
    tempC: number;
    windKmh: number;
    pressureBar: number;
    cloudPct: number;
    condition: WeatherCondition;
    conditionLabel: string;
    season: string;
  };
  forecast: DayWeather[];
  note: string;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489909);
    s ^= s >>> 16;
    return (s >>> 0) / 4294967296;
  };
}

const CONDITION_LABEL: Record<WeatherCondition, string> = {
  clear: "Clear sky",
  clouds: "Partial cloud cover",
  storm: "Severe storm",
  dust: "Dust activity",
  "methane-rain": "Methane precipitation",
  sulfuric: "Sulfuric haze",
  cryo: "Cryogenic haze",
  bands: "Banded cloud decks",
  spot: "Long-lived storm",
  fog: "Frozen fog",
};

function conditionFor(
  bodyId: BodyId,
  cloudPct: number,
  rand: number,
  bodyName: string,
): WeatherCondition {
  if (bodyId === "mars")
    return rand < 0.4 && cloudPct > 35 ? "dust" : cloudPct > 45 ? "clouds" : "clear";
  if (bodyId === "jupiter") return "spot";
  if (bodyId === "saturn" || bodyId === "neptune") return "bands";
  if (bodyId === "uranus") return "fog";
  if (bodyId === "venus") return "sulfuric";
  if (bodyId === "titan") return "methane-rain";
  if (bodyId === "europa" || bodyId === "enceladus" || bodyId === "ganymede") return "cryo";
  if (bodyId === "mercury" || bodyId === "moon" || bodyId === "pluto") return "clear";
  if (bodyId === "earth") return cloudPct > 60 ? "clouds" : cloudPct > 20 ? "clear" : "clear";
  return "clouds";
}

export function getWeather(bodyId: BodyId, date = new Date()): WeatherReport {
  const body = BODIES.find((b) => b.id === bodyId);
  if (!body) throw new Error(`Unknown body: ${bodyId}`);

  const daySeed = Math.floor(date.getTime() / 86400000);
  const rand = seededRandom(hash(body.id) ^ daySeed)();
  const hourFrac = (date.getUTCHours() + date.getUTCMinutes() / 60) / 24;

  const [tMin, tMax] = body.metrics.tempC;
  const diurnal = Math.sin((hourFrac - 0.5) * Math.PI * 2) * (body.spinSeconds < 200 ? 8 : 2);
  const tempC = clamp(tMin + (tMax - tMin) * (0.5 + 0.4 * rand) + diurnal, tMin, tMax);

  const windBase =
    body.id === "jupiter" || body.id === "saturn" || body.id === "neptune"
      ? 320
      : body.id === "venus"
        ? 240
        : body.id === "mars"
          ? 28
          : body.id === "earth"
            ? 16
            : 6;
  const windKmh = Math.round(windBase * (0.55 + 0.9 * rand));

  const cloudBase = body.id === "venus" ? 96 : body.id === "titan" ? 70 : body.clouds * 100;
  const cloudPct = Math.round(clamp(cloudBase + (rand - 0.5) * 24, 0, 100));

  const condition = conditionFor(body.id, cloudPct, rand, body.name);

  const forecast: DayWeather[] = [];
  let walk = 0;
  let prevCloud = cloudPct;
  for (let i = 1; i <= 7; i++) {
    const r = seededRandom(hash(body.id) ^ (daySeed + i));
    walk += (r() - 0.5) * 14;
    const dMin = tMin + (tMax - tMin) * r() * 0.35 + walk;
    const dMax = dMin + (tMax - tMin) * (0.35 + 0.3 * r());
    prevCloud = Math.round(clamp(prevCloud + (r() - 0.5) * 30, 0, 100));
    const fc = conditionFor(body.id, prevCloud, r(), body.name);
    forecast.push({
      date: new Date(date.getTime() + i * 86400000).toISOString().slice(0, 10),
      tempMinC: Math.round(dMin),
      tempMaxC: Math.round(dMax),
      windKmh: Math.round(windBase * (0.4 + 1.1 * r())),
      pressureBar: body.metrics.pressureBar,
      cloudPct: prevCloud,
      condition: fc,
    });
  }

  const season = seasonLabel(bodyId, date);
  return {
    bodyId,
    bodyName: body.name,
    now: {
      tempC: Math.round(tempC),
      windKmh,
      pressureBar: body.metrics.pressureBar,
      cloudPct,
      condition,
      conditionLabel: CONDITION_LABEL[condition],
      season,
    },
    forecast,
    note: `${body.name}: modeled conditions derived from the published metric envelope (${body.metrics.tempC[0]}…${body.metrics.tempC[1]} °C). Not live telemetry.`,
  };
}

function seasonLabel(bodyId: BodyId, date: Date): string {
  const dayOfYear = Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86400000);
  const phase = dayOfYear / 365.25;
  const map =
    bodyId === "mars"
      ? ["Southern spring", "Northern summer", "Southern autumn", "Northern winter"]
      : bodyId === "titan"
        ? ["Titan spring", "Titan summer", "Titan autumn", "Titan winter"]
        : ["Nominal", "Nominal", "Nominal", "Nominal"];
  const idx = Math.floor((phase * 4 + (bodyId === "mars" ? 0.42 : 0)) % 4);
  return map[idx] ?? "Nominal";
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export const WEATHER_BODIES: BodyId[] = [
  "mercury",
  "venus",
  "earth",
  "moon",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "europa",
  "titan",
  "enceladus",
  "ganymede",
];

export function weatherColor(tempC: number): string {
  if (tempC > 100) return "#FF5A5F";
  if (tempC > 25) return "#F5C542";
  if (tempC > -20) return "#4FD1FF";
  if (tempC > -120) return "#7EF9C6";
  return "#9B8CFF";
}
