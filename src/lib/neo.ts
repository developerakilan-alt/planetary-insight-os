import { Body, HelioVector } from "astronomy-engine";

/**
 * Near-Earth object radar engine.
 *
 * Each object stores real orbital elements (JPL SBDB) and is calibrated so its
 * heliocentric position matches Earth's direction on a real, known close
 * approach. Positions are then propagated with a Kepler solver, giving a
 * genuinely live (modeled) distance to Earth for every object.
 */

const GM_SUN = 0.0002959122082855911; // au³ / day²
const AU_KM = 149_597_870.7;
const DEG = Math.PI / 180;

export type NeoClass = "Apollo" | "Aten" | "Amor" | "Apollo" | "Impact";

export interface NeoObject {
  id: string;
  name: string;
  designation: string;
  clazz: NeoClass;
  diameterKm: number;
  discoveryYear: number;
  torino: number;
  /** semi-major axis (au), eccentricity, inclination / node / peri (deg) */
  a: number;
  e: number;
  i: number;
  node: number;
  peri: number;
  /** calibration epoch (ms) */
  epochMs: number;
  /** a real close approach used to calibrate the mean anomaly */
  approachDate: Date;
  approachDistAu: number;
  note: string;
}

export const NEO_CATALOGUE: NeoObject[] = [
  {
    id: "apophis",
    name: "99942 Apophis",
    designation: "2004 MN4",
    clazz: "Aten",
    diameterKm: 0.37,
    discoveryYear: 2004,
    torino: 4,
    a: 0.9224,
    e: 0.1911,
    i: 3.34,
    node: 204.45,
    peri: 126.42,
    epochMs: Date.UTC(2020, 0, 1),
    approachDate: new Date(Date.UTC(2029, 3, 13)),
    approachDistAu: 0.0002115,
    note: "Will pass within ~31,600 km of Earth — closer than geostationary orbit.",
  },
  {
    id: "yr4",
    name: "2024 YR4",
    designation: "2024 YR4",
    clazz: "Apollo",
    diameterKm: 0.06,
    discoveryYear: 2024,
    torino: 3,
    a: 2.49,
    e: 0.66,
    i: 3.4,
    node: 312.6,
    peri: 121.2,
    epochMs: Date.UTC(2025, 0, 1),
    approachDate: new Date(Date.UTC(2032, 11, 22)),
    approachDistAu: 0.00034,
    note: "Briefly peaked at Torino 3 in 2025 before risk was retired.",
  },
  {
    id: "bennu",
    name: "101955 Bennu",
    designation: "1999 RQ36",
    clazz: "Apollo",
    diameterKm: 0.49,
    discoveryYear: 1999,
    torino: 0,
    a: 1.1264,
    e: 0.2037,
    i: 6.03,
    node: 2.06,
    peri: 66.22,
    epochMs: Date.UTC(2020, 0, 1),
    approachDate: new Date(Date.UTC(2135, 8, 22)),
    approachDistAu: 0.0015,
    note: "OSIRIS-REx sample target. Gravity-study revealed small Yarkovsky drift.",
  },
  {
    id: "didymos",
    name: "65803 Didymos",
    designation: "1996 GT",
    clazz: "Apollo",
    diameterKm: 0.78,
    discoveryYear: 1996,
    torino: 0,
    a: 1.644,
    e: 0.383,
    i: 3.4,
    node: 73.2,
    peri: 319.3,
    epochMs: Date.UTC(2020, 0, 1),
    approachDate: new Date(Date.UTC(2022, 9, 4)),
    approachDistAu: 0.07,
    note: "DART impact target — the first asteroid deflection test.",
  },
  {
    id: "ryugu",
    name: "162173 Ryugu",
    designation: "1999 JU3",
    clazz: "Apollo",
    diameterKm: 0.87,
    discoveryYear: 1999,
    torino: 0,
    a: 1.1896,
    e: 0.1903,
    i: 5.88,
    node: 251.6,
    peri: 211.5,
    epochMs: Date.UTC(2020, 0, 1),
    approachDate: new Date(Date.UTC(2022, 1, 15)),
    approachDistAu: 0.028,
    note: "Hayabusa2 sample-return target; carbonaceous, water-bearing.",
  },
  {
    id: "es4",
    name: "2011 ES4",
    designation: "2011 ES4",
    clazz: "Apollo",
    diameterKm: 0.045,
    discoveryYear: 2011,
    torino: 0,
    a: 0.832,
    e: 0.594,
    i: 3.4,
    node: 289.4,
    peri: 276.5,
    epochMs: Date.UTC(2020, 0, 1),
    approachDate: new Date(Date.UTC(2020, 8, 1)),
    approachDistAu: 0.0008,
    note: "Passed within ~120,000 km in September 2020.",
  },
  {
    id: "dz2",
    name: "2023 DZ2",
    designation: "2023 DZ2",
    clazz: "Apollo",
    diameterKm: 0.06,
    discoveryYear: 2023,
    torino: 0,
    a: 1.51,
    e: 0.41,
    i: 2.0,
    node: 107.6,
    peri: 125.5,
    epochMs: Date.UTC(2023, 0, 1),
    approachDate: new Date(Date.UTC(2023, 2, 25)),
    approachDistAu: 0.0033,
    note: "Made a safe Earth pass in March 2023 inside the Moon's orbit.",
  },
  {
    id: "duende",
    name: "367943 Duende",
    designation: "2012 DA14",
    clazz: "Apollo",
    diameterKm: 0.045,
    discoveryYear: 2012,
    torino: 0,
    a: 1.0,
    e: 0.089,
    i: 11.6,
    node: 147.5,
    peri: 195.9,
    epochMs: Date.UTC(2013, 0, 1),
    approachDate: new Date(Date.UTC(2013, 1, 15)),
    approachDistAu: 0.00023,
    note: "Famously passed within 27,700 km the same day as the Chelyabinsk fireball.",
  },
  {
    id: "tc3",
    name: "2008 TC3",
    designation: "2008 TC3",
    clazz: "Impact",
    diameterKm: 0.004,
    discoveryYear: 2008,
    torino: 0,
    a: 1.39,
    e: 0.312,
    i: 2.54,
    node: 195.4,
    peri: 234.5,
    epochMs: Date.UTC(2008, 0, 1),
    approachDate: new Date(Date.UTC(2008, 9, 7)),
    approachDistAu: 0,
    note: "First asteroid detected before impacting Earth — 19 hours of warning.",
  },
];

function normalize2pi(a: number): number {
  let v = a % (2 * Math.PI);
  if (v < 0) v += 2 * Math.PI;
  return v;
}

function solveKepler(M: number, e: number): number {
  let E = M;
  for (let k = 0; k < 100; k++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

interface OrbitState {
  a: number;
  e: number;
  meanMotion: number;
  m0: number;
}

const calibrationCache = new WeakMap<NeoObject, OrbitState>();

function calibrate(obj: NeoObject): OrbitState {
  const cached = calibrationCache.get(obj);
  if (cached) return cached;
  const i = obj.i * DEG;
  const node = obj.node * DEG;
  const peri = obj.peri * DEG;
  const cosO = Math.cos(node);
  const sinO = Math.sin(node);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const cosW = Math.cos(peri);
  const sinW = Math.sin(peri);

  const rE = HelioVector(Body.Earth, obj.approachDate);
  const rEAbs = Math.sqrt(rE.x * rE.x + rE.y * rE.y + rE.z * rE.z);
  const ux = rE.x / rEAbs;
  const uy = rE.y / rEAbs;
  const uz = rE.z / rEAbs;

  // inverse rotation (transpose of the orbital→ecliptic matrix) into the
  // orbital plane: X along periapsis, Y in the orbital plane.
  const c0x = cosO * cosW - sinO * sinW * cosI;
  const c0y = sinO * cosW + cosO * sinW * cosI;
  const c0z = sinW * sinI;
  const c1x = -cosO * sinW - sinO * cosW * cosI;
  const c1y = -sinO * sinW + cosO * cosW * cosI;
  const c1z = cosW * sinI;
  const X = ux * c0x + uy * c0y + uz * c0z;
  const Y = ux * c1x + uy * c1y + uz * c1z;
  let nu = Math.atan2(Y, X);
  if (nu < 0) nu += 2 * Math.PI;

  const denom = 1 + obj.e * Math.cos(nu);
  const cosE = (obj.e + Math.cos(nu)) / denom;
  const sinE = (Math.sqrt(1 - obj.e * obj.e) * Math.sin(nu)) / denom;
  let E = Math.atan2(sinE, cosE);
  if (E < 0) E += 2 * Math.PI;
  const M = E - obj.e * Math.sin(E);

  const meanMotion = Math.sqrt(GM_SUN / (obj.a * obj.a * obj.a));
  const dDays = (obj.approachDate.getTime() - obj.epochMs) / 86400000;
  const m0 = normalize2pi(M - meanMotion * dDays);
  const state: OrbitState = { a: obj.a, e: obj.e, meanMotion, m0 };
  calibrationCache.set(obj, state);
  return state;
}

function orbitPosition(obj: NeoObject, date: Date): { x: number; y: number; z: number } {
  const i = obj.i * DEG;
  const node = obj.node * DEG;
  const peri = obj.peri * DEG;
  const { meanMotion, m0 } = calibrate(obj);
  const M = normalize2pi(m0 + (meanMotion * (date.getTime() - obj.epochMs)) / 86400000);
  const E = solveKepler(M, obj.e);
  const xp = obj.a * (Math.cos(E) - obj.e);
  const yp = obj.a * Math.sqrt(1 - obj.e * obj.e) * Math.sin(E);

  const cosO = Math.cos(node);
  const sinO = Math.sin(node);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const cosW = Math.cos(peri);
  const sinW = Math.sin(peri);

  return {
    x: (cosO * cosW - sinO * sinW * cosI) * xp + (-cosO * sinW - sinO * cosW * cosI) * yp,
    y: (sinO * cosW + cosO * sinW * cosI) * xp + (-sinO * sinW + cosO * cosW * cosI) * yp,
    z: sinW * sinI * xp + cosW * sinI * yp,
  };
}

function distanceAu(obj: NeoObject, date: Date): number {
  return neoOffsetVector(obj, date).distAu;
}

export function neoOffsetVector(
  obj: NeoObject,
  date = new Date(),
): { x: number; y: number; z: number; distAu: number } {
  const p = orbitPosition(obj, date);
  const e = HelioVector(Body.Earth, date);
  const dx = p.x - e.x;
  const dy = p.y - e.y;
  const dz = p.z - e.z;
  return { x: dx, y: dy, z: dz, distAu: Math.sqrt(dx * dx + dy * dy + dz * dz) };
}

export interface NeoLiveState {
  distAu: number;
  distKm: number;
  lightMinutes: number;
  velocityKmS: number;
  approaching: boolean;
  nextApproach: { date: Date; distAu: number } | null;
}

export function neoLiveState(obj: NeoObject, now = new Date()): NeoLiveState {
  const distAu = distanceAu(obj, now);
  const tomorrow = new Date(now.getTime() + 86400000);
  const distAuTomorrow = distanceAu(obj, tomorrow);
  const approaching = distAuTomorrow < distAu;

  const r = orbitPosition(obj, now);
  const rAbs = Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z);
  const velAuDay = Math.sqrt(GM_SUN * (2 / rAbs - 1 / obj.a));
  const velocityKmS = (velAuDay * AU_KM) / 86400;

  // scan forward for the next local minimum in Earth distance (≤ 3 years)
  let best: { date: Date; distAu: number } | null = null;
  const stepDays = 0.5;
  const windowDays = 1095;
  let prev = distanceAu(obj, now);
  for (let d = stepDays; d <= windowDays; d += stepDays) {
    const t = new Date(now.getTime() + d * 86400000);
    const dist = distanceAu(obj, t);
    if (dist < prev) {
      if (best === null || dist < best.distAu) best = { date: t, distAu: dist };
    }
    prev = dist;
  }
  if (best && best.distAu > obj.approachDistAu * 20) best = null;

  return {
    distAu,
    distKm: distAu * AU_KM,
    lightMinutes: (distAu * 8.316746) / 1,
    velocityKmS,
    approaching,
    nextApproach: best,
  };
}

export function formatAu(au: number): string {
  if (au < 0.002) return `${Math.round(au * 384_400).toLocaleString()} km`;
  return `${au.toFixed(4)} AU`;
}

export function formatDistKm(km: number): string {
  if (km >= 1_000_000) return `${(km / 1_000_000).toFixed(2)} M km`;
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${Math.round(km).toLocaleString()} km`;
}

export function neoClassColor(clazz: NeoClass): string {
  switch (clazz) {
    case "Aten":
      return "#4FD1FF";
    case "Apollo":
      return "#F5C542";
    case "Amor":
      return "#7EF9C6";
    default:
      return "#FF5A5F";
  }
}
