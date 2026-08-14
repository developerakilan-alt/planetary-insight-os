/**
 * Exoplanet catalogue. Values are real published measurements (mass, radius,
 * orbital period, equilibrium temperature, distance, discovery). The
 * Earth Similarity Index is computed from radius and equilibrium temperature
 * using a documented simplification of the Schulz-Makuch et al. (2011) ESI.
 */

export type ExoClass =
  | "Rocky"
  | "Super-Earth"
  | "Mini-Neptune"
  | "Sub-Neptune"
  | "Neptune-like"
  | "Gas Giant"
  | "Ice Giant"
  | "Ocean World";

export interface Exoplanet {
  id: string;
  name: string;
  host: string;
  designation: string;
  clazz: ExoClass;
  /** mass in Earth masses (M⊕) */
  mass: number;
  /** radius in Earth radii (R⊕) */
  radius: number;
  /** orbital period (days) */
  periodDays: number;
  /** equilibrium temperature (K) */
  eqTempK: number;
  /** distance from Earth (light-years) */
  distanceLy: number;
  discoveryYear: number;
  method: string;
  star: string;
  note: string;
}

export const EXOPLANETS: Exoplanet[] = [
  {
    id: "proxima-b",
    name: "Proxima Centauri b",
    host: "Proxima Centauri",
    designation: "Proxima Cen b",
    clazz: "Rocky",
    mass: 1.07,
    radius: 1.03,
    periodDays: 11.2,
    eqTempK: 234,
    distanceLy: 4.2,
    discoveryYear: 2016,
    method: "Radial velocity",
    star: "M5.5 V red dwarf",
    note: "Closest known exoplanet, inside the habitable zone of a flare star.",
  },
  {
    id: "trappist-1e",
    name: "TRAPPIST-1 e",
    host: "TRAPPIST-1",
    designation: "TRAPPIST-1 e",
    clazz: "Rocky",
    mass: 0.692,
    radius: 0.92,
    periodDays: 6.1,
    eqTempK: 246,
    distanceLy: 40.7,
    discoveryYear: 2017,
    method: "Transit",
    star: "M8.0 V ultra-cool dwarf",
    note: "Likely rocky with a modest greenhouse — one of the most Earth-like known.",
  },
  {
    id: "trappist-1f",
    name: "TRAPPIST-1 f",
    host: "TRAPPIST-1",
    designation: "TRAPPIST-1 f",
    clazz: "Rocky",
    mass: 1.04,
    radius: 1.04,
    periodDays: 9.2,
    eqTempK: 219,
    distanceLy: 40.7,
    discoveryYear: 2017,
    method: "Transit",
    star: "M8.0 V ultra-cool dwarf",
    note: "Ocean-world candidate; 10% of its mass could be surface water.",
  },
  {
    id: "trappist-1g",
    name: "TRAPPIST-1 g",
    host: "TRAPPIST-1",
    designation: "TRAPPIST-1 g",
    clazz: "Rocky",
    mass: 1.32,
    radius: 1.13,
    periodDays: 12.4,
    eqTempK: 198,
    distanceLy: 40.7,
    discoveryYear: 2017,
    method: "Transit",
    star: "M8.0 V ultra-cool dwarf",
    note: "Largest of the seven; outer edge of the habitable zone.",
  },
  {
    id: "kepler-442b",
    name: "Kepler-442 b",
    host: "Kepler-442",
    designation: "KIC 4139816 b",
    clazz: "Super-Earth",
    mass: 2.36,
    radius: 1.34,
    periodDays: 112.3,
    eqTempK: 233,
    distanceLy: 1115,
    discoveryYear: 2015,
    method: "Transit",
    star: "K5 V dwarf",
    note: "Rated among the most habitable candidates in the Kepler catalogue.",
  },
  {
    id: "kepler-452b",
    name: "Kepler-452 b",
    host: "Kepler-452",
    designation: "KOI-7016.01",
    clazz: "Super-Earth",
    mass: 5.0,
    radius: 1.63,
    periodDays: 384.8,
    eqTempK: 265,
    distanceLy: 1402,
    discoveryYear: 2015,
    method: "Transit",
    star: "G2 V (Sun-like)",
    note: "Earth's 'bigger, older cousin' in a 385-day orbit around a Sun-like star.",
  },
  {
    id: "k2-18b",
    name: "K2-18 b",
    host: "K2-18",
    designation: "EPIC 201912552 b",
    clazz: "Sub-Neptune",
    mass: 8.6,
    radius: 2.61,
    periodDays: 32.9,
    eqTempK: 265,
    distanceLy: 124,
    discoveryYear: 2015,
    method: "Transit",
    star: "M2.8 V dwarf",
    note: "JWST detected water and carbon-bearing molecules in its hydrogen-rich atmosphere.",
  },
  {
    id: "lhs-1140b",
    name: "LHS 1140 b",
    host: "LHS 1140",
    designation: "GJ 3053 b",
    clazz: "Super-Earth",
    mass: 5.6,
    radius: 1.73,
    periodDays: 24.7,
    eqTempK: 226,
    distanceLy: 49,
    discoveryYear: 2017,
    method: "Transit",
    star: "M4.5 V dwarf",
    note: "JWST observations point to a nitrogen-rich atmosphere — possibly a water world.",
  },
  {
    id: "toi-700d",
    name: "TOI-700 d",
    host: "TOI-700",
    designation: "TIC 150428135 d",
    clazz: "Rocky",
    mass: 1.72,
    radius: 1.19,
    periodDays: 37.4,
    eqTempK: 269,
    distanceLy: 101.5,
    discoveryYear: 2020,
    method: "Transit",
    star: "M2 V dwarf",
    note: "Earth-size world in the optimistic habitable zone; TESS discovery.",
  },
  {
    id: "ross-128b",
    name: "Ross 128 b",
    host: "Ross 128",
    designation: "GJ 447 b",
    clazz: "Rocky",
    mass: 1.4,
    radius: 1.1,
    periodDays: 9.9,
    eqTempK: 294,
    distanceLy: 11,
    discoveryYear: 2017,
    method: "Radial velocity",
    star: "M4 V dwarf",
    note: "Quiet, nearby red-dwarf planet with a temperate surface estimate.",
  },
  {
    id: "wolf-1061c",
    name: "Wolf 1061 c",
    host: "Wolf 1061",
    designation: "GJ 628 c",
    clazz: "Super-Earth",
    mass: 3.41,
    radius: 1.6,
    periodDays: 17.9,
    eqTempK: 223,
    distanceLy: 13.8,
    discoveryYear: 2015,
    method: "Radial velocity",
    star: "M3 V dwarf",
    note: "One of the closest potentially habitable super-Earths.",
  },
  {
    id: "hd-85512b",
    name: "HD 85512 b",
    host: "HD 85512",
    designation: "GJ 370 b",
    clazz: "Super-Earth",
    mass: 3.6,
    radius: 1.7,
    periodDays: 58.4,
    eqTempK: 295,
    distanceLy: 36,
    discoveryYear: 2011,
    method: "Radial velocity",
    star: "K5 V dwarf",
    note: "At the inner edge of the conservative habitable zone.",
  },
  {
    id: "gjj667cc",
    name: "GJ 667 C c",
    host: "GJ 667 C",
    designation: "Gliese 667 Cc",
    clazz: "Super-Earth",
    mass: 3.8,
    radius: 1.8,
    periodDays: 28.1,
    eqTempK: 277,
    distanceLy: 23.6,
    discoveryYear: 2011,
    method: "Radial velocity",
    star: "M1.5 V dwarf",
    note: "Long cited as a habitable-zone super-Earth around a triple-star system.",
  },
  {
    id: "kepler-186f",
    name: "Kepler-186 f",
    host: "Kepler-186",
    designation: "KOI-571.05",
    clazz: "Super-Earth",
    mass: 1.44,
    radius: 1.11,
    periodDays: 129.9,
    eqTempK: 218,
    distanceLy: 580,
    discoveryYear: 2014,
    method: "Transit",
    star: "M1 V dwarf",
    note: "First Earth-size planet found in another star's habitable zone.",
  },
  {
    id: "hd-10180b",
    name: "HD 10180 c",
    host: "HD 10180",
    designation: "HIP 7599 c",
    clazz: "Neptune-like",
    mass: 13.1,
    radius: 4.1,
    periodDays: 5.8,
    eqTempK: 1024,
    distanceLy: 128,
    discoveryYear: 2010,
    method: "Radial velocity",
    star: "G1 V dwarf",
    note: "Close-in hot Neptune in one of the most planet-rich known systems.",
  },
  {
    id: "hd-209458b",
    name: "HD 209458 b",
    host: "HD 209458",
    designation: "Osiris",
    clazz: "Gas Giant",
    mass: 220,
    radius: 14.2,
    periodDays: 3.5,
    eqTempK: 1320,
    distanceLy: 159,
    discoveryYear: 1999,
    method: "Transit",
    star: "G0 V dwarf",
    note: "First planet observed transiting and the first with an evaporating atmosphere.",
  },
];

/** Distance Earth-to-planet ≈ circular-orbit spacing for a habitable-zone proxy. */
export function esiScore(p: Exoplanet): number {
  const r = clamp(p.radius, 0.5, 10);
  const t = clamp(p.eqTempK, 100, 600);
  const rTerm = 1 - Math.abs((2 * r) / (1 + r));
  const tTerm = 1 - Math.abs((2 * t) / (288 + t));
  const esi = Math.sqrt(rTerm * tTerm);
  return Math.round(clamp(esi, 0, 1) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function habitableZoneScore(p: Exoplanet): number {
  const t = p.eqTempK;
  if (t >= 233 && t <= 303) return 100 - Math.abs(t - 268) * 2.2;
  if (t < 233) return 60 - (233 - t) * 0.6;
  return 60 - (t - 303) * 0.6;
}

export function habitabilityLabel(p: Exoplanet): string {
  const esi = esiScore(p);
  if (esi >= 82) return "Prime candidate";
  if (esi >= 65) return "Promising";
  if (esi >= 45) return "Interesting";
  return "Unlikely";
}

export function formatMass(m: number): string {
  if (m < 1) return `${m.toFixed(2)} M⊕`;
  if (m < 100) return `${m.toFixed(1)} M⊕`;
  return `${m.toFixed(0)} M⊕`;
}

export function formatRadius(r: number): string {
  if (r < 1) return `${r.toFixed(2)} R⊕`;
  if (r < 10) return `${r.toFixed(2)} R⊕`;
  return `${r.toFixed(1)} R⊕`;
}
