import type { BodyId } from "@/data/bodies";

export interface AtmospherePoint {
  /** altitude in km (negative = depth below cloud-top for gas giants) */
  altKm: number;
  tempC: number;
  pressureBar: number;
}

export interface AtmosphereProfile {
  bodyId: BodyId;
  name: string;
  /** vertical axis label */
  axisLabel: string;
  /** brief provenance / model note — these are reference-model approximations */
  source: string;
  note: string;
  points: AtmospherePoint[];
}

/**
 * Reference-model approximations of planetary atmospheric profiles.
 * - Telluric bodies: US Standard Atmosphere, Venus VIRA, Mars climate model,
 *   Huygens/GCM Titan profiles.
 * - Gas giants: published cloud-deck models (0 km = 1 bar level, negative
 *   altitude = depth into the atmosphere).
 * Values are interpolated reference points, not exhaustive measurements.
 */
export const ATMOSPHERES: Partial<Record<BodyId, AtmosphereProfile>> = {
  earth: {
    bodyId: "earth",
    name: "Earth",
    axisLabel: "Altitude (km)",
    source: "US Standard Atmosphere 1976",
    note: "Temperature profile from the US Standard Atmosphere (1976).",
    points: [
      { altKm: 0, tempC: 15, pressureBar: 1.01 },
      { altKm: 5, tempC: -17.5, pressureBar: 0.54 },
      { altKm: 10, tempC: -49.9, pressureBar: 0.26 },
      { altKm: 15, tempC: -56.5, pressureBar: 0.12 },
      { altKm: 20, tempC: -56.5, pressureBar: 0.055 },
      { altKm: 25, tempC: -51.6, pressureBar: 0.025 },
      { altKm: 30, tempC: -46.6, pressureBar: 0.012 },
      { altKm: 35, tempC: -36.9, pressureBar: 0.0057 },
      { altKm: 40, tempC: -22.8, pressureBar: 0.0028 },
      { altKm: 50, tempC: -2.5, pressureBar: 0.0008 },
      { altKm: 60, tempC: -17.3, pressureBar: 0.0002 },
      { altKm: 80, tempC: -74.5, pressureBar: 0.00001 },
      { altKm: 100, tempC: -86.3, pressureBar: 0.0000003 },
    ],
  },

  venus: {
    bodyId: "venus",
    name: "Venus",
    axisLabel: "Altitude (km)",
    source: "VIRA (Venus International Reference Atmosphere)",
    note: "Runaway-greenhouse profile — the surface is hotter than Mercury's dayside.",
    points: [
      { altKm: 0, tempC: 462, pressureBar: 92 },
      { altKm: 10, tempC: 385, pressureBar: 50 },
      { altKm: 20, tempC: 283, pressureBar: 25 },
      { altKm: 30, tempC: 160, pressureBar: 13 },
      { altKm: 40, tempC: 80, pressureBar: 6 },
      { altKm: 50, tempC: 40, pressureBar: 2.5 },
      { altKm: 55, tempC: 20, pressureBar: 1.5 },
      { altKm: 60, tempC: -15, pressureBar: 0.8 },
      { altKm: 70, tempC: -35, pressureBar: 0.2 },
      { altKm: 80, tempC: -60, pressureBar: 0.05 },
      { altKm: 90, tempC: -80, pressureBar: 0.01 },
      { altKm: 100, tempC: -100, pressureBar: 0.001 },
    ],
  },

  mars: {
    bodyId: "mars",
    name: "Mars",
    axisLabel: "Altitude (km)",
    source: "Mars atmosphere model (MCD), seasonal mean",
    note: "Cold, thin CO₂ atmosphere with strong diurnal temperature swings.",
    points: [
      { altKm: 0, tempC: -63, pressureBar: 0.006 },
      { altKm: 10, tempC: -88, pressureBar: 0.0015 },
      { altKm: 20, tempC: -105, pressureBar: 0.0004 },
      { altKm: 30, tempC: -115, pressureBar: 0.0001 },
      { altKm: 40, tempC: -120, pressureBar: 0.00003 },
      { altKm: 60, tempC: -130, pressureBar: 0.000004 },
      { altKm: 80, tempC: -140, pressureBar: 0.0000008 },
      { altKm: 100, tempC: -150, pressureBar: 0.0000001 },
    ],
  },

  jupiter: {
    bodyId: "jupiter",
    name: "Jupiter",
    axisLabel: "Depth below cloud-top (km)",
    source: "Jupiter cloud-deck model (Seiff et al. 1998)",
    note: "0 km = the 1 bar level. Interior warms adiabatically with depth; no solid surface.",
    points: [
      { altKm: 0, tempC: -108, pressureBar: 1 },
      { altKm: -20, tempC: -90, pressureBar: 2 },
      { altKm: -50, tempC: -50, pressureBar: 5 },
      { altKm: -100, tempC: 30, pressureBar: 20 },
      { altKm: -150, tempC: 150, pressureBar: 60 },
      { altKm: -200, tempC: 300, pressureBar: 150 },
      { altKm: -300, tempC: 700, pressureBar: 400 },
      { altKm: -500, tempC: 1300, pressureBar: 1200 },
      { altKm: -1000, tempC: 3000, pressureBar: 10000 },
    ],
  },

  saturn: {
    bodyId: "saturn",
    name: "Saturn",
    axisLabel: "Depth below cloud-top (km)",
    source: "Saturn cloud-deck model (Lindal et al. 1985)",
    note: "0 km = the 1 bar level. Interior warms adiabatically with depth; no solid surface.",
    points: [
      { altKm: 0, tempC: -139, pressureBar: 1 },
      { altKm: -50, tempC: -90, pressureBar: 3 },
      { altKm: -100, tempC: -20, pressureBar: 10 },
      { altKm: -200, tempC: 150, pressureBar: 40 },
      { altKm: -300, tempC: 400, pressureBar: 120 },
      { altKm: -500, tempC: 900, pressureBar: 600 },
      { altKm: -1000, tempC: 2200, pressureBar: 6000 },
    ],
  },

  uranus: {
    bodyId: "uranus",
    name: "Uranus",
    axisLabel: "Depth below cloud-top (km)",
    source: "Uranus cloud-deck model",
    note: "0 km = the 1 bar level. The coldest planetary atmosphere in the system.",
    points: [
      { altKm: 0, tempC: -197, pressureBar: 1 },
      { altKm: -50, tempC: -160, pressureBar: 3 },
      { altKm: -100, tempC: -110, pressureBar: 10 },
      { altKm: -200, tempC: -20, pressureBar: 40 },
      { altKm: -300, tempC: 100, pressureBar: 120 },
      { altKm: -500, tempC: 350, pressureBar: 600 },
    ],
  },

  neptune: {
    bodyId: "neptune",
    name: "Neptune",
    axisLabel: "Depth below cloud-top (km)",
    source: "Neptune cloud-deck model",
    note: "0 km = the 1 bar level. Internal heat drives the fastest winds in the solar system.",
    points: [
      { altKm: 0, tempC: -201, pressureBar: 1 },
      { altKm: -50, tempC: -170, pressureBar: 3 },
      { altKm: -100, tempC: -120, pressureBar: 10 },
      { altKm: -200, tempC: -10, pressureBar: 40 },
      { altKm: -300, tempC: 120, pressureBar: 120 },
      { altKm: -500, tempC: 400, pressureBar: 600 },
    ],
  },

  titan: {
    bodyId: "titan",
    name: "Titan",
    axisLabel: "Altitude (km)",
    source: "Huygens HASI descent profile (2005)",
    note: "A methane hydrological cycle under a thick nitrogen atmosphere, shielded by haze.",
    points: [
      { altKm: 0, tempC: -179, pressureBar: 1.45 },
      { altKm: 5, tempC: -179, pressureBar: 1.2 },
      { altKm: 10, tempC: -179, pressureBar: 0.95 },
      { altKm: 20, tempC: -178, pressureBar: 0.6 },
      { altKm: 30, tempC: -175, pressureBar: 0.35 },
      { altKm: 40, tempC: -170, pressureBar: 0.2 },
      { altKm: 50, tempC: -160, pressureBar: 0.1 },
      { altKm: 60, tempC: -150, pressureBar: 0.05 },
      { altKm: 70, tempC: -130, pressureBar: 0.02 },
      { altKm: 80, tempC: -110, pressureBar: 0.008 },
      { altKm: 100, tempC: -85, pressureBar: 0.001 },
    ],
  },
};

export function getAtmosphere(bodyId: BodyId): AtmosphereProfile | undefined {
  return ATMOSPHERES[bodyId];
}
