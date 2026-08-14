/**
 * Satellite constellation engine. Each satellite is modelled on a circular
 * orbit with real altitude / inclination / orbital elements (where public).
 * Positions are propagated deterministically in an Earth-centred inertial
 * frame, so the fleet moves live against the rendered globe.
 */

export interface Satellite {
  id: string;
  name: string;
  owner: string;
  type: "crewed" | "science" | "telecom" | "navigation" | "weather" | "earth-obs" | "cubesat";
  /** circular-orbit altitude in km */
  altitudeKm: number;
  inclinationDeg: number;
  raanDeg: number;
  periodMin: number;
  phaseRad: number;
  color: string;
}

export const EARTH_RADIUS_KM = 6371;

export const SATELLITES: Satellite[] = [
  {
    id: "iss",
    name: "ISS",
    owner: "International",
    type: "crewed",
    altitudeKm: 420,
    inclinationDeg: 51.6,
    raanDeg: 118,
    periodMin: 92.9,
    phaseRad: 0.2,
    color: "#4FD1FF",
  },
  {
    id: "tiangong",
    name: "Tiangong",
    owner: "CNSA",
    type: "crewed",
    altitudeKm: 390,
    inclinationDeg: 41.5,
    raanDeg: 220,
    periodMin: 92.2,
    phaseRad: 3.1,
    color: "#F5C542",
  },
  {
    id: "hubble",
    name: "Hubble",
    owner: "NASA / ESA",
    type: "science",
    altitudeKm: 535,
    inclinationDeg: 28.5,
    raanDeg: 15,
    periodMin: 95.4,
    phaseRad: 1.4,
    color: "#7EF9C6",
  },
  {
    id: "gps-1",
    name: "GPS IIF-2",
    owner: "USSF",
    type: "navigation",
    altitudeKm: 20200,
    inclinationDeg: 55,
    raanDeg: 40,
    periodMin: 718,
    phaseRad: 0.8,
    color: "#9B8CFF",
  },
  {
    id: "gps-2",
    name: "GPS IIF-7",
    owner: "USSF",
    type: "navigation",
    altitudeKm: 20200,
    inclinationDeg: 55,
    raanDeg: 160,
    periodMin: 718,
    phaseRad: 4.2,
    color: "#9B8CFF",
  },
  {
    id: "geo-1",
    name: "GEO-1 (comms)",
    owner: "Commercial",
    type: "telecom",
    altitudeKm: 35786,
    inclinationDeg: 0,
    raanDeg: 0,
    periodMin: 1436,
    phaseRad: 0.5,
    color: "#F5C542",
  },
  {
    id: "geo-2",
    name: "GEO-2 (comms)",
    owner: "Commercial",
    type: "telecom",
    altitudeKm: 35786,
    inclinationDeg: 0,
    raanDeg: 0,
    periodMin: 1436,
    phaseRad: 2.8,
    color: "#F5C542",
  },
  {
    id: "sentinel-2a",
    name: "Sentinel-2A",
    owner: "ESA",
    type: "earth-obs",
    altitudeKm: 786,
    inclinationDeg: 98.6,
    raanDeg: 300,
    periodMin: 100.6,
    phaseRad: 5.1,
    color: "#7EF9C6",
  },
  {
    id: "noaa-20",
    name: "NOAA-20",
    owner: "NOAA",
    type: "weather",
    altitudeKm: 824,
    inclinationDeg: 98.7,
    raanDeg: 260,
    periodMin: 101.5,
    phaseRad: 2.1,
    color: "#4FD1FF",
  },
  {
    id: "iridium-1",
    name: "Iridium-1",
    owner: "Iridium",
    type: "telecom",
    altitudeKm: 780,
    inclinationDeg: 86.4,
    raanDeg: 90,
    periodMin: 100.4,
    phaseRad: 3.8,
    color: "#9B8CFF",
  },
  {
    id: "starlink-a1",
    name: "Starlink shell-A",
    owner: "SpaceX",
    type: "telecom",
    altitudeKm: 550,
    inclinationDeg: 53,
    raanDeg: 45,
    periodMin: 95.9,
    phaseRad: 0.1,
    color: "#FF8FA3",
  },
  {
    id: "starlink-a2",
    name: "Starlink shell-A",
    owner: "SpaceX",
    type: "telecom",
    altitudeKm: 550,
    inclinationDeg: 53,
    raanDeg: 200,
    periodMin: 95.9,
    phaseRad: 1.9,
    color: "#FF8FA3",
  },
  {
    id: "starlink-a3",
    name: "Starlink shell-A",
    owner: "SpaceX",
    type: "telecom",
    altitudeKm: 550,
    inclinationDeg: 53,
    raanDeg: 320,
    periodMin: 95.9,
    phaseRad: 4.4,
    color: "#FF8FA3",
  },
  {
    id: "astro-cube",
    name: "Astro-1 (cubesat)",
    owner: "Student",
    type: "cubesat",
    altitudeKm: 420,
    inclinationDeg: 97,
    raanDeg: 140,
    periodMin: 92.9,
    phaseRad: 5.6,
    color: "#FF5A5F",
  },
];

export interface SatellitePos {
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
  altKm: number;
}

/** ECI position in units of Earth radii (r = 1 at the surface). */
export function satellitePosition(
  sat: Satellite,
  date = new Date(),
  scale = EARTH_RADIUS_KM,
): SatellitePos {
  const i = sat.inclinationDeg * (Math.PI / 180);
  const node = sat.raanDeg * (Math.PI / 180);
  const n = (2 * Math.PI) / sat.periodMin;
  const tMin = date.getTime() / 60000;
  const u = n * tMin + sat.phaseRad;
  const r = (scale + sat.altitudeKm) / scale;

  const x = r * (Math.cos(node) * Math.cos(u) - Math.sin(node) * Math.sin(u) * Math.cos(i));
  const y = r * (Math.sin(node) * Math.cos(u) + Math.cos(node) * Math.sin(u) * Math.cos(i));
  const z = r * (Math.sin(u) * Math.sin(i));

  const lat = (Math.asin(z / r) * 180) / Math.PI;
  const lon = (Math.atan2(y, x) * 180) / Math.PI;

  return { x, y, z, lat, lon, altKm: sat.altitudeKm };
}

export function satelliteSpeedKmS(sat: Satellite): number {
  const mu = 398600.4418;
  const r = EARTH_RADIUS_KM + sat.altitudeKm;
  return Math.sqrt(mu / r);
}

export function orbitPoints(
  sat: Satellite,
  scale = EARTH_RADIUS_KM,
  segments = 96,
): { x: number; y: number; z: number }[] {
  const i = sat.inclinationDeg * (Math.PI / 180);
  const node = sat.raanDeg * (Math.PI / 180);
  const r = (scale + sat.altitudeKm) / scale;
  const pts: { x: number; y: number; z: number }[] = [];
  for (let k = 0; k <= segments; k++) {
    const u = (k / segments) * 2 * Math.PI;
    pts.push({
      x: r * (Math.cos(node) * Math.cos(u) - Math.sin(node) * Math.sin(u) * Math.cos(i)),
      y: r * (Math.sin(node) * Math.cos(u) + Math.cos(node) * Math.sin(u) * Math.cos(i)),
      z: r * (Math.sin(u) * Math.sin(i)),
    });
  }
  return pts;
}

export function typeLabel(type: Satellite["type"]): string {
  switch (type) {
    case "crewed":
      return "Crewed station";
    case "science":
      return "Science observatory";
    case "telecom":
      return "Communications";
    case "navigation":
      return "Navigation";
    case "weather":
      return "Weather";
    case "earth-obs":
      return "Earth observation";
    case "cubesat":
      return "Cubesat";
  }
}
