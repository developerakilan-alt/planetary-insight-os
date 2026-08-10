import type { BodyId } from "@/data/bodies";
import { epochJulianDay } from "./ephemeris";

/**
 * Real spacecraft positions from NASA JPL Horizons.
 *
 * Positions are heliocentric ecliptic Cartesian states (J2000, km). They are
 * fetched server-side through `spacecraft.functions.ts` (the public Horizons
 * API sends no CORS headers) and mapped onto the orbital chart's radial scale,
 * so each spacecraft sits at its real heliocentric longitude at the correct
 * chart radius relative to the planets.
 */

export const AU_KM = 149_597_870.7;
const LIGHT_KM_S = 299_792.458;

export interface SpacecraftDef {
  id: string;
  name: string;
  naif: number;
  /** First date with ephemeris (one day after launch). ISO yyyy-mm-dd. */
  launch: string;
  /** Last date with ephemeris (Horizons valid range). ISO yyyy-mm-dd. */
  windowEnd: string;
  target: BodyId;
  color: string;
  note: string;
}

export const SPACECRAFT: SpacecraftDef[] = [
  {
    id: "voyager-1",
    name: "Voyager 1",
    naif: -31,
    launch: "1977-09-06",
    windowEnd: "2035-12-31",
    target: "pluto",
    color: "#9B8CFF",
    note: "Interstellar probe",
  },
  {
    id: "voyager-2",
    name: "Voyager 2",
    naif: -32,
    launch: "1977-08-21",
    windowEnd: "2035-12-31",
    target: "pluto",
    color: "#C084FC",
    note: "Interstellar probe",
  },
  {
    id: "juno",
    name: "Juno",
    naif: -61,
    launch: "2011-08-06",
    windowEnd: "2028-09-30",
    target: "jupiter",
    color: "#4FD1FF",
    note: "Jupiter orbiter",
  },
  {
    id: "europa-clipper",
    name: "Europa Clipper",
    naif: -159,
    launch: "2024-10-15",
    windowEnd: "2034-09-01",
    target: "europa",
    color: "#F5C542",
    note: "Europa flyby mission",
  },
  {
    id: "new-horizons",
    name: "New Horizons",
    naif: -98,
    launch: "2006-01-20",
    windowEnd: "2035-12-31",
    target: "pluto",
    color: "#7EF9C6",
    note: "Kuiper belt flyby",
  },
  {
    id: "psyche",
    name: "Psyche",
    naif: -255,
    launch: "2023-10-14",
    windowEnd: "2029-02-01",
    target: "mars",
    color: "#6EE7B7",
    note: "Metallic asteroid orbiter",
  },
];

/** One ephemeris row: barycentric dynamical time (JD) + heliocentric ecliptic state (km). */
export interface HorizonsSample {
  jd: number;
  x: number;
  y: number;
  z: number;
}

/** Projected chart position of a spacecraft at a given epoch. */
export interface SpacecraftPosition {
  spacecraft: SpacecraftDef;
  /** scene x coordinate (chart units) */
  x: number;
  /** scene z coordinate (chart units) */
  z: number;
  /** true 3-D heliocentric distance, km */
  distanceKm: number;
  /** true 3-D heliocentric distance, AU */
  distanceAu: number;
  /** one-way light time, minutes */
  lightMinutes: number;
}

/** Parse the `result` text block returned by the Horizons JSON API. */
export function parseHorizonsResult(result: string): HorizonsSample[] {
  const samples: HorizonsSample[] = [];
  let inData = false;
  for (const raw of result.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "$$SOE") {
      inData = true;
      continue;
    }
    if (line === "$$EOE") break;
    if (!inData) continue;
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 5) continue;
    const jd = Number(parts[0]);
    const x = Number(parts[2]);
    const y = Number(parts[3]);
    const z = Number(parts[4]);
    if (!Number.isFinite(jd) || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
      continue;
    samples.push({ jd, x, y, z });
  }
  return samples;
}

/**
 * (real heliocentric distance AU → chart radius units), anchored on the chart's
 * planet orbits so spacecraft appear at the correct radius relative to planets.
 * Extrapolates past Neptune with the outer-orbit slope (Voyager 1 & 2 sit
 * beyond every orbit — accurate, and the camera can zoom out to find them).
 */
const RADIAL_ANCHORS: Array<[au: number, units: number]> = [
  [0.39, 7], // Mercury
  [0.72, 10], // Venus
  [1.0, 13.5], // Earth
  [1.52, 19], // Mars
  [5.2, 24], // Jupiter
  [9.58, 28], // Saturn
  [19.2, 32], // Uranus
  [30.1, 36], // Neptune
  [39.5, 40], // Pluto
];

export function auToChartRadius(au: number): number {
  const first = RADIAL_ANCHORS[0]!;
  if (au <= first[0]) return first[1];
  for (let i = 1; i < RADIAL_ANCHORS.length; i++) {
    const [x1, y1] = RADIAL_ANCHORS[i]!;
    const [x0, y0] = RADIAL_ANCHORS[i - 1]!;
    if (au <= x1) return y0 + ((au - x0) * (y1 - y0)) / (x1 - x0);
  }
  const [x0, y0] = RADIAL_ANCHORS[RADIAL_ANCHORS.length - 2]!;
  const [x1, y1] = RADIAL_ANCHORS[RADIAL_ANCHORS.length - 1]!;
  const slope = (y1 - y0) / (x1 - x0);
  return y1 + (au - x1) * slope;
}

/** Linear interpolation between the two nearest ephemeris samples. */
export function interpolatePosition(
  def: SpacecraftDef,
  samples: HorizonsSample[],
  date: Date,
): SpacecraftPosition | null {
  if (samples.length === 0) return null;
  const jd = epochJulianDay(date);
  if (jd < samples[0]!.jd || jd > samples[samples.length - 1]!.jd) return null;

  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid]!.jd <= jd) lo = mid;
    else hi = mid;
  }
  const a = samples[lo]!;
  const b = samples[hi]!;
  const t = b.jd === a.jd ? 0 : (jd - a.jd) / (b.jd - a.jd);
  const x = a.x + (b.x - a.x) * t;
  const y = a.y + (b.y - a.y) * t;
  const z = a.z + (b.z - a.z) * t;

  const distanceKm = Math.hypot(x, y, z);
  const distanceAu = distanceKm / AU_KM;
  const r = auToChartRadius(Math.hypot(x, y) / AU_KM);
  const angle = Math.atan2(y, x);

  return {
    spacecraft: def,
    x: Math.cos(angle) * r,
    z: Math.sin(angle) * r,
    distanceKm,
    distanceAu,
    lightMinutes: distanceKm / LIGHT_KM_S / 60,
  };
}

export function formatSpacecraftDistance(p: SpacecraftPosition): string {
  const au = `${p.distanceAu.toFixed(1)} AU`;
  const light =
    p.lightMinutes >= 60
      ? `${(p.lightMinutes / 60).toFixed(1)} lh`
      : `${p.lightMinutes.toFixed(1)} lm`;
  return `${au} · ${light}`;
}

/** Chart-space (x, z) → polar chart radius used to size the marker. */
export function chartRadius(x: number, z: number): number {
  return Math.hypot(x, z);
}
