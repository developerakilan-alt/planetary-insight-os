export type BodyId =
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "europa"
  | "titan"
  | "enceladus"
  | "ganymede";

export interface Landmark {
  name: string;
  lat: number;
  lon: number;
  kind: "volcano" | "crater" | "canyon" | "lake" | "pole" | "plain";
  note: string;
}

export interface Body {
  id: BodyId;
  name: string;
  designation: string;
  system: string;
  classification: string;
  summary: string;
  /** relative render radius */
  radius: number;
  orbitRadius: number;
  orbitPeriodDays: number;
  spinSeconds: number;
  tilt: number;
  /** shader palette */
  palette: {
    low: string;
    mid: string;
    high: string;
    atmosphere: string;
  };
  clouds: number;
  ice: number;
  roughness: number;
  metrics: {
    radiusKm: number;
    gravity: number;
    tempC: [number, number];
    pressureBar: number;
    atmosphere: string;
    surface: string;
    water: string;
    ageGyr: number;
    orbitalPeriod: string;
    escapeVelocity: number;
    magneticField: string;
    dayLength: string;
    moons: number;
  };
  landmarks: Landmark[];
}

export const BODIES: Body[] = [
  {
    id: "mercury",
    name: "Mercury",
    designation: "SOL-I",
    system: "Sol",
    classification: "Terrestrial planet",
    summary:
      "An airless, tidally-tortured world of extreme thermal gradients and a disproportionately large iron core.",
    radius: 0.62,
    orbitRadius: 7,
    orbitPeriodDays: 88,
    spinSeconds: 96,
    tilt: 0.03,
    palette: { low: "#4a4540", mid: "#8c837a", high: "#cfc6ba", atmosphere: "#8c8378" },
    clouds: 0,
    ice: 0.02,
    roughness: 1.0,
    metrics: {
      radiusKm: 2439.7,
      gravity: 3.7,
      tempC: [-173, 427],
      pressureBar: 1e-14,
      atmosphere: "Exosphere — O, Na, H, He, K",
      surface: "Silicate regolith, iron-rich",
      water: "Polar ice in permanent shadow",
      ageGyr: 4.5,
      orbitalPeriod: "88 days",
      escapeVelocity: 4.25,
      magneticField: "Global, ~1% of Earth",
      dayLength: "176 Earth days",
      moons: 0,
    },
    landmarks: [
      { name: "Caloris Planitia", lat: 30.5, lon: 189.8, kind: "plain", note: "1,550 km impact basin" },
      { name: "Rachmaninoff", lat: 27.6, lon: 302.1, kind: "crater", note: "Peak-ring basin, young volcanism" },
    ],
  },
  {
    id: "venus",
    name: "Venus",
    designation: "SOL-II",
    system: "Sol",
    classification: "Terrestrial planet",
    summary:
      "A runaway greenhouse laboratory: crushing CO₂ atmosphere, sulfuric acid decks and a young, resurfaced crust.",
    radius: 0.95,
    orbitRadius: 10,
    orbitPeriodDays: 225,
    spinSeconds: 220,
    tilt: 3.1,
    palette: { low: "#8a5a25", mid: "#d8a453", high: "#f6e2b4", atmosphere: "#f2c579" },
    clouds: 0.95,
    ice: 0,
    roughness: 0.45,
    metrics: {
      radiusKm: 6051.8,
      gravity: 8.87,
      tempC: [462, 471],
      pressureBar: 92,
      atmosphere: "96.5% CO₂, 3.5% N₂, H₂SO₄ cloud decks",
      surface: "Basaltic plains, tesserae highlands",
      water: "Trace vapour only",
      ageGyr: 4.5,
      orbitalPeriod: "225 days",
      escapeVelocity: 10.36,
      magneticField: "Induced only",
      dayLength: "243 Earth days (retrograde)",
      moons: 0,
    },
    landmarks: [
      { name: "Maxwell Montes", lat: 65.2, lon: 3.3, kind: "volcano", note: "11 km — highest point on Venus" },
      { name: "Aphrodite Terra", lat: -10, lon: 105, kind: "plain", note: "Continent-scale highland" },
    ],
  },
  {
    id: "earth",
    name: "Earth",
    designation: "SOL-III",
    system: "Sol",
    classification: "Terrestrial planet — habitable",
    summary:
      "The only confirmed biosphere. Active plate tectonics, a strong dynamo and a hydrological cycle in equilibrium.",
    radius: 1,
    orbitRadius: 13.5,
    orbitPeriodDays: 365,
    spinSeconds: 42,
    tilt: 23.4,
    palette: { low: "#0b3a6b", mid: "#2f7d4f", high: "#d8cfae", atmosphere: "#4FD1FF" },
    clouds: 0.62,
    ice: 0.2,
    roughness: 0.6,
    metrics: {
      radiusKm: 6371,
      gravity: 9.81,
      tempC: [-89, 57],
      pressureBar: 1.01,
      atmosphere: "78% N₂, 21% O₂, Ar, CO₂",
      surface: "Silicate crust, 71% liquid ocean",
      water: "Abundant — surface, ice, vapour",
      ageGyr: 4.54,
      orbitalPeriod: "365.25 days",
      escapeVelocity: 11.19,
      magneticField: "Global dipole, 25–65 µT",
      dayLength: "23h 56m",
      moons: 1,
    },
    landmarks: [
      { name: "Olympus Range", lat: -77.5, lon: 162, kind: "pole", note: "Antarctic dry valleys — Mars analogue" },
      { name: "Atacama Desert", lat: -24.5, lon: -69.3, kind: "plain", note: "Driest non-polar analogue site" },
    ],
  },
  {
    id: "moon",
    name: "Moon",
    designation: "SOL-III-a",
    system: "Earth",
    classification: "Natural satellite",
    summary:
      "Humanity's forward operating base. Volatile-rich permanently shadowed regions make the south pole the Artemis target.",
    radius: 0.27,
    orbitRadius: 16,
    orbitPeriodDays: 27.3,
    spinSeconds: 80,
    tilt: 6.7,
    palette: { low: "#2f2f33", mid: "#8f8d8a", high: "#e2ded6", atmosphere: "#8f8d8a" },
    clouds: 0,
    ice: 0.06,
    roughness: 1.0,
    metrics: {
      radiusKm: 1737.4,
      gravity: 1.62,
      tempC: [-173, 127],
      pressureBar: 3e-15,
      atmosphere: "Tenuous exosphere — Ar, He, Na",
      surface: "Anorthositic highlands, basaltic maria",
      water: "Confirmed ice in PSRs",
      ageGyr: 4.51,
      orbitalPeriod: "27.3 days",
      escapeVelocity: 2.38,
      magneticField: "Localised crustal anomalies",
      dayLength: "29.5 Earth days",
      moons: 0,
    },
    landmarks: [
      { name: "Tycho Crater", lat: -43.3, lon: -11.4, kind: "crater", note: "85 km ray crater, 108 Ma" },
      { name: "Shackleton (South Pole)", lat: -89.9, lon: 0, kind: "pole", note: "Artemis candidate — PSR ice" },
      { name: "Mare Tranquillitatis", lat: 8.5, lon: 31.4, kind: "plain", note: "Apollo 11 landing site" },
    ],
  },
  {
    id: "mars",
    name: "Mars",
    designation: "SOL-IV",
    system: "Sol",
    classification: "Terrestrial planet",
    summary:
      "The primary crewed-exploration target. Ancient fluvial networks, buried ice sheets and the largest volcano in the system.",
    radius: 0.53,
    orbitRadius: 19,
    orbitPeriodDays: 687,
    spinSeconds: 44,
    tilt: 25.2,
    palette: { low: "#5c2416", mid: "#b4552c", high: "#e3b183", atmosphere: "#e08a5a" },
    clouds: 0.12,
    ice: 0.14,
    roughness: 0.9,
    metrics: {
      radiusKm: 3389.5,
      gravity: 3.72,
      tempC: [-143, 35],
      pressureBar: 0.006,
      atmosphere: "95% CO₂, 2.8% N₂, 2% Ar",
      surface: "Basaltic regolith, iron oxide dust",
      water: "Polar caps, subsurface ice, brines",
      ageGyr: 4.6,
      orbitalPeriod: "687 days",
      escapeVelocity: 5.03,
      magneticField: "Crustal remanence only",
      dayLength: "24h 37m",
      moons: 2,
    },
    landmarks: [
      { name: "Olympus Mons", lat: 18.65, lon: -133.8, kind: "volcano", note: "21.9 km shield volcano" },
      { name: "Valles Marineris", lat: -13.9, lon: -59.2, kind: "canyon", note: "4,000 km rift system" },
      { name: "Jezero Crater", lat: 18.44, lon: 77.45, kind: "crater", note: "Perseverance — ancient delta" },
      { name: "Hellas Planitia", lat: -42.4, lon: 70.5, kind: "plain", note: "2,300 km impact basin" },
    ],
  },
  {
    id: "europa",
    name: "Europa",
    designation: "JUP-II",
    system: "Jupiter",
    classification: "Icy moon — ocean world",
    summary:
      "A tidally heated global saltwater ocean beneath a fractured ice shell. The highest-priority astrobiology target.",
    radius: 0.25,
    orbitRadius: 23,
    orbitPeriodDays: 3.55,
    spinSeconds: 70,
    tilt: 0.1,
    palette: { low: "#8a6a4f", mid: "#dfe6ec", high: "#ffffff", atmosphere: "#bfe7ff" },
    clouds: 0,
    ice: 0.92,
    roughness: 0.25,
    metrics: {
      radiusKm: 1560.8,
      gravity: 1.31,
      tempC: [-223, -148],
      pressureBar: 1e-12,
      atmosphere: "Tenuous O₂ exosphere",
      surface: "Water ice, chaos terrain, lineae",
      water: "Global subsurface ocean, 60–150 km deep",
      ageGyr: 4.5,
      orbitalPeriod: "3.55 days",
      escapeVelocity: 2.02,
      magneticField: "Induced from Jovian field",
      dayLength: "3.55 Earth days (synchronous)",
      moons: 0,
    },
    landmarks: [
      { name: "Conamara Chaos", lat: 9.5, lon: -87, kind: "plain", note: "Disrupted ice rafts" },
      { name: "Pwyll Crater", lat: -25, lon: -271, kind: "crater", note: "Young crater, bright ejecta" },
    ],
  },
  {
    id: "titan",
    name: "Titan",
    designation: "SAT-VI",
    system: "Saturn",
    classification: "Icy moon — dense atmosphere",
    summary:
      "The only moon with a substantial atmosphere and stable surface liquids — a cryogenic methane hydrological cycle.",
    radius: 0.4,
    orbitRadius: 27,
    orbitPeriodDays: 15.9,
    spinSeconds: 90,
    tilt: 0.3,
    palette: { low: "#5a3c14", mid: "#c68b32", high: "#f0cf88", atmosphere: "#f5c542" },
    clouds: 0.8,
    ice: 0.08,
    roughness: 0.5,
    metrics: {
      radiusKm: 2574.7,
      gravity: 1.35,
      tempC: [-180, -179],
      pressureBar: 1.45,
      atmosphere: "94% N₂, 5.6% CH₄, hydrocarbon haze",
      surface: "Water-ice bedrock, organic dunes",
      water: "Subsurface ocean; surface CH₄/C₂H₆ lakes",
      ageGyr: 4.5,
      orbitalPeriod: "15.9 days",
      escapeVelocity: 2.64,
      magneticField: "None intrinsic",
      dayLength: "15.9 Earth days (synchronous)",
      moons: 0,
    },
    landmarks: [
      { name: "Kraken Mare", lat: 68, lon: 310, kind: "lake", note: "Largest methane sea, 1,170 km" },
      { name: "Shangri-La", lat: -10, lon: 165, kind: "plain", note: "Dune field — Dragonfly region" },
    ],
  },
  {
    id: "enceladus",
    name: "Enceladus",
    designation: "SAT-II",
    system: "Saturn",
    classification: "Icy moon — active plumes",
    summary:
      "South-polar cryovolcanic jets vent ocean material directly to space — sampling the interior requires no landing.",
    radius: 0.16,
    orbitRadius: 30.5,
    orbitPeriodDays: 1.37,
    spinSeconds: 60,
    tilt: 0,
    palette: { low: "#b9c6cf", mid: "#eef4f8", high: "#ffffff", atmosphere: "#d8f2ff" },
    clouds: 0,
    ice: 1,
    roughness: 0.2,
    metrics: {
      radiusKm: 252.1,
      gravity: 0.113,
      tempC: [-240, -128],
      pressureBar: 1e-13,
      atmosphere: "Plume-sourced H₂O vapour",
      surface: "Fresh water ice, tiger stripe fractures",
      water: "Global subsurface ocean, active plumes",
      ageGyr: 4.5,
      orbitalPeriod: "1.37 days",
      escapeVelocity: 0.239,
      magneticField: "None",
      dayLength: "1.37 Earth days (synchronous)",
      moons: 0,
    },
    landmarks: [
      { name: "Damascus Sulcus", lat: -80, lon: 315, kind: "canyon", note: "Tiger stripe — plume source" },
    ],
  },
  {
    id: "ganymede",
    name: "Ganymede",
    designation: "JUP-III",
    system: "Jupiter",
    classification: "Icy moon — largest in system",
    summary:
      "The only moon with an intrinsic magnetosphere; layered ice-ocean interior and an ancient grooved crust.",
    radius: 0.41,
    orbitRadius: 34,
    orbitPeriodDays: 7.15,
    spinSeconds: 85,
    tilt: 0.16,
    palette: { low: "#4a423c", mid: "#9a938c", high: "#ded8d0", atmosphere: "#a9c4d8" },
    clouds: 0,
    ice: 0.55,
    roughness: 0.7,
    metrics: {
      radiusKm: 2634.1,
      gravity: 1.43,
      tempC: [-203, -121],
      pressureBar: 1e-12,
      atmosphere: "Thin O₂ exosphere",
      surface: "Dark cratered terrain, bright grooves",
      water: "Subsurface ocean between ice layers",
      ageGyr: 4.5,
      orbitalPeriod: "7.15 days",
      escapeVelocity: 2.74,
      magneticField: "Intrinsic dipole — unique for a moon",
      dayLength: "7.15 Earth days (synchronous)",
      moons: 0,
    },
    landmarks: [
      { name: "Galileo Regio", lat: 35, lon: 130, kind: "plain", note: "Ancient dark terrain" },
    ],
  },
];

export const bodyMap = Object.fromEntries(BODIES.map((b) => [b.id, b])) as Record<BodyId, Body>;

export function getBody(id: string): Body | undefined {
  return bodyMap[id as BodyId];
}
