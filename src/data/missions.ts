import type { BodyId } from "./bodies";

export interface Mission {
  id: string;
  name: string;
  agency: string;
  year: number;
  endYear: number | null;
  target: BodyId | "outer-system" | "deep-field";
  targetLabel: string;
  status: "active" | "complete" | "planned";
  type: "rover" | "orbiter" | "flyby" | "crewed" | "observatory" | "lander";
  site?: { name: string; lat: number; lon: number };
  summary: string;
  discoveries: string[];
}

export const MISSIONS: Mission[] = [
  {
    id: "apollo",
    name: "Apollo Program",
    agency: "NASA",
    year: 1961,
    endYear: 1972,
    target: "moon",
    targetLabel: "Moon",
    status: "complete",
    type: "crewed",
    site: { name: "Mare Tranquillitatis", lat: 8.5, lon: 31.4 },
    summary:
      "Six crewed lunar surface expeditions returned 382 kg of samples and deployed long-lived geophysical stations.",
    discoveries: [
      "Giant-impact origin of the Moon supported by isotopic sample data",
      "Lunar seismic network revealed a layered interior and partial melt zone",
      "Regolith maturity and space-weathering processes characterised",
    ],
  },
  {
    id: "voyager",
    name: "Voyager 1 & 2",
    agency: "NASA / JPL",
    year: 1977,
    endYear: null,
    target: "outer-system",
    targetLabel: "Outer System / Interstellar",
    status: "active",
    type: "flyby",
    summary:
      "The grand tour. Two spacecraft surveyed the four giant planets and are now returning interstellar plasma data.",
    discoveries: [
      "Active volcanism on Io — first beyond Earth",
      "Evidence for a subsurface ocean on Europa",
      "Heliopause crossing and interstellar medium measurements",
    ],
  },
  {
    id: "spirit",
    name: "MER-A Spirit",
    agency: "NASA / JPL",
    year: 2004,
    endYear: 2010,
    target: "mars",
    targetLabel: "Mars — Gusev Crater",
    status: "complete",
    type: "rover",
    site: { name: "Gusev Crater", lat: -14.57, lon: 175.47 },
    summary:
      "Designed for 90 sols, Spirit operated for 2,208 and uncovered evidence of ancient hydrothermal systems.",
    discoveries: [
      "Opaline silica deposits indicating hot-spring activity",
      "Columbia Hills bedrock altered by water",
    ],
  },
  {
    id: "opportunity",
    name: "MER-B Opportunity",
    agency: "NASA / JPL",
    year: 2004,
    endYear: 2018,
    target: "mars",
    targetLabel: "Mars — Meridiani Planum",
    status: "complete",
    type: "rover",
    site: { name: "Meridiani Planum", lat: -1.95, lon: -5.53 },
    summary:
      "45 km traversed over 14 years. Confirmed episodic surface water in Mars' distant past.",
    discoveries: [
      "Hematite 'blueberries' formed in acidic groundwater",
      "Cross-bedded sandstones from flowing surface water",
    ],
  },
  {
    id: "cassini",
    name: "Cassini–Huygens",
    agency: "NASA / ESA / ASI",
    year: 1997,
    endYear: 2017,
    target: "titan",
    targetLabel: "Saturn System",
    status: "complete",
    type: "orbiter",
    site: { name: "Huygens landing site", lat: -10.3, lon: 192.3 },
    summary:
      "Thirteen years in the Saturn system, plus the first and only landing in the outer solar system.",
    discoveries: [
      "Enceladus plumes venting salty ocean water and organics",
      "Titan's methane lakes, rivers and seasonal weather",
      "Ring particle dynamics and moonlet formation",
    ],
  },
  {
    id: "curiosity",
    name: "Mars Science Laboratory — Curiosity",
    agency: "NASA / JPL",
    year: 2012,
    endYear: null,
    target: "mars",
    targetLabel: "Mars — Gale Crater",
    status: "active",
    type: "rover",
    site: { name: "Gale Crater", lat: -5.4, lon: 137.8 },
    summary:
      "A nuclear-powered mobile laboratory climbing Mount Sharp through a stratigraphic record of Martian climate.",
    discoveries: [
      "Ancient habitable lacustrine environment confirmed",
      "Seasonal methane variability in the atmosphere",
      "Complex organic molecules preserved in mudstone",
    ],
  },
  {
    id: "jwst",
    name: "James Webb Space Telescope",
    agency: "NASA / ESA / CSA",
    year: 2021,
    endYear: null,
    target: "deep-field",
    targetLabel: "L2 — Deep Field & Exoplanets",
    status: "active",
    type: "observatory",
    summary:
      "A 6.5 m segmented infrared observatory at Sun–Earth L2 resolving the first galaxies and exoplanet atmospheres.",
    discoveries: [
      "CO₂ detected in an exoplanet atmosphere",
      "Galaxies confirmed at z > 13",
      "CO₂ and H₂O₂ mapped on Europa's surface",
    ],
  },
  {
    id: "perseverance",
    name: "Mars 2020 — Perseverance",
    agency: "NASA / JPL",
    year: 2021,
    endYear: null,
    target: "mars",
    targetLabel: "Mars — Jezero Crater",
    status: "active",
    type: "rover",
    site: { name: "Jezero Crater", lat: 18.44, lon: 77.45 },
    summary:
      "Astrobiology and sample caching at an ancient river delta, with the first powered flight on another world.",
    discoveries: [
      "Igneous crater floor with aqueous alteration",
      "Organic matter detected in delta sediments",
      "MOXIE produced oxygen from atmospheric CO₂",
    ],
  },
  {
    id: "artemis",
    name: "Artemis Program",
    agency: "NASA + international partners",
    year: 2022,
    endYear: null,
    target: "moon",
    targetLabel: "Moon — South Pole",
    status: "active",
    type: "crewed",
    site: { name: "Shackleton rim", lat: -89.9, lon: 0 },
    summary:
      "A sustained return to the lunar surface targeting volatile-rich permanently shadowed regions near the south pole.",
    discoveries: [
      "Artemis I validated Orion deep-space re-entry",
      "Candidate landing regions mapped for PSR ice access",
    ],
  },
  {
    id: "europa-clipper",
    name: "Europa Clipper",
    agency: "NASA / JPL",
    year: 2024,
    endYear: null,
    target: "europa",
    targetLabel: "Europa",
    status: "active",
    type: "orbiter",
    site: { name: "Conamara Chaos", lat: 9.5, lon: -87 },
    summary:
      "Nearly 50 close flybys to assess the habitability of Europa's ocean via ice-penetrating radar and plume sampling.",
    discoveries: [
      "Ice shell thickness profiling planned via REASON radar",
      "Direct plume composition sampling with SUDA and MASPEX",
    ],
  },
];
