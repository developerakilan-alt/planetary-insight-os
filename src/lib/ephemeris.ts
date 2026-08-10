import { Body, EclipticLongitude } from "astronomy-engine";
import { BODIES, type BodyId } from "@/data/bodies";

/**
 * Real ephemeris positions for the orbital chart using astronomy-engine
 * (VSOP87/Pluto-P theory). Planets are placed by their true heliocentric
 * ecliptic longitude for the chosen epoch; the chart renders the position in
 * the x–z plane. Satellites (Moon, Europa, …) have no VSOP entry, so they are
 * grouped near their parent planet with a phase derived from their orbital
 * period — labelled as illustrative in the UI.
 */

const EPHEMERIS_BODY: Partial<Record<BodyId, Body>> = {
  mercury: Body.Mercury,
  venus: Body.Venus,
  earth: Body.Earth,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
};

const MOON_PARENT: Partial<Record<BodyId, BodyId>> = {
  moon: "earth",
  europa: "jupiter",
  ganymede: "jupiter",
  titan: "saturn",
  enceladus: "saturn",
};

/** Distance in chart units a satellite sits from its parent in ephemeris mode. */
const MOON_OFFSET = 1.4;

export interface EpochPosition {
  x: number;
  z: number;
}

export function heliocentricLongitudeRad(bodyId: BodyId, date: Date): number | null {
  const body = EPHEMERIS_BODY[bodyId];
  if (!body) return null;
  const deg = EclipticLongitude(body, date);
  return (deg * Math.PI) / 180;
}

export function epochJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function positiveFraction(n: number): number {
  return n - Math.floor(n);
}

/** Compute chart-space (x, z) positions for every body at a given epoch. */
export function solarSystemPositionsAt(date: Date): Record<BodyId, EpochPosition> {
  const out = {} as Record<BodyId, EpochPosition>;
  const jd = epochJulianDay(date);

  for (const b of BODIES) {
    const body = EPHEMERIS_BODY[b.id];
    if (body) {
      const lon = heliocentricLongitudeRad(b.id, date);
      if (lon != null) {
        out[b.id] = { x: Math.cos(lon) * b.orbitRadius, z: Math.sin(lon) * b.orbitRadius };
      }
    }
  }

  for (const b of BODIES) {
    if (EPHEMERIS_BODY[b.id]) continue;
    const parent = MOON_PARENT[b.id];
    const pp = parent ? out[parent] : null;
    const phase = positiveFraction(jd / b.orbitPeriodDays) * Math.PI * 2;
    const px = pp ? pp.x : 0;
    const pz = pp ? pp.z : 0;
    out[b.id] = {
      x: px + Math.cos(phase) * MOON_OFFSET,
      z: pz + Math.sin(phase) * MOON_OFFSET,
    };
  }

  return out;
}
