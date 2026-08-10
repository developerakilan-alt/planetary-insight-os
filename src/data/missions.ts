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
  /** approximate surface traverse waypoints (real mission path where available) */
  traverse?: { label: string; note?: string; points: { lat: number; lon: number }[] };
  summary: string;
  discoveries: string[];
}

export const MISSIONS: Mission[] = [
  {
    id: "viking1",
    name: "Viking 1",
    agency: "NASA / JPL",
    year: 1975,
    endYear: 1982,
    target: "mars",
    targetLabel: "Mars — Chryse Planitia",
    status: "complete",
    type: "lander",
    site: { name: "Chryse Planitia", lat: 22.48, lon: -49.97 },
    summary:
      "The first successful soft landing on Mars and the first (1976) robotic search for life signals on another world.",
    discoveries: [
      "First high-resolution surface imagery from Mars",
      "Life-detection experiments returned ambiguous results",
      "Martian weather and seismic monitoring for 6 years",
    ],
  },
  {
    id: "viking2",
    name: "Viking 2",
    agency: "NASA / JPL",
    year: 1975,
    endYear: 1980,
    target: "mars",
    targetLabel: "Mars — Utopia Planitia",
    status: "complete",
    type: "lander",
    site: { name: "Utopia Planitia", lat: 47.67, lon: 225.74 },
    summary:
      "Viking 2 touched down in Utopia Planitia (1976) and studied the northern plains for over three years.",
    discoveries: [
      "Water-ice frost observed on the surface",
      "Extended seismology and meteorology record",
    ],
  },
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
    id: "apollo11",
    name: "Apollo 11",
    agency: "NASA",
    year: 1969,
    endYear: 1969,
    target: "moon",
    targetLabel: "Moon — Mare Tranquillitatis",
    status: "complete",
    type: "crewed",
    site: { name: "Tranquility Base", lat: 0.67, lon: 23.47 },
    summary:
      "First crewed lunar landing. Armstrong and Aldrin spent 21.6 hours on the surface and returned 21.5 kg of samples.",
    discoveries: [
      "First human samples from the lunar surface",
      "SEP and passive seismic experiments deployed",
    ],
  },
  {
    id: "apollo12",
    name: "Apollo 12",
    agency: "NASA",
    year: 1969,
    endYear: 1969,
    target: "moon",
    targetLabel: "Moon — Oceanus Procellarum",
    status: "complete",
    type: "crewed",
    site: { name: "Oceanus Procellarum", lat: -3.01, lon: -23.42 },
    summary:
      "Precision landing beside Surveyor 3 in Oceanus Procellarum; returned the first long-lived ALSEP geophysical station.",
    discoveries: [
      "Recovered Surveyor 3 hardware for Earth analysis",
      "First ALSEP network station (seismic, magnetic, plasma)",
    ],
  },
  {
    id: "apollo14",
    name: "Apollo 14",
    agency: "NASA",
    year: 1971,
    endYear: 1971,
    target: "moon",
    targetLabel: "Moon — Fra Mauro",
    status: "complete",
    type: "crewed",
    site: { name: "Fra Mauro", lat: -3.64, lon: -17.49 },
    summary:
      "Landed at Fra Mauro, the intended Apollo 13 site, collecting ejecta thought to derive from the Imbrium basin.",
    discoveries: [
      "Fra Mauro breccias dated to the Imbrium impact",
      "Longest lunar-surface EVA of the program at the time",
    ],
  },
  {
    id: "apollo15",
    name: "Apollo 15",
    agency: "NASA",
    year: 1971,
    endYear: 1971,
    target: "moon",
    targetLabel: "Moon — Hadley–Apennine",
    status: "complete",
    type: "crewed",
    site: { name: "Hadley–Apennine", lat: 26.13, lon: 3.63 },
    summary:
      "First mission with the Lunar Roving Vehicle, exploring the Apennine front and the Hadley Rille.",
    discoveries: [
      "Genesis Rock — anorthosite, 4.1 Gyr old",
      "Evidence for early lunar magnetism in returned samples",
    ],
  },
  {
    id: "apollo16",
    name: "Apollo 16",
    agency: "NASA",
    year: 1972,
    endYear: 1972,
    target: "moon",
    targetLabel: "Moon — Descartes Highlands",
    status: "complete",
    type: "crewed",
    site: { name: "Descartes Highlands", lat: -8.97, lon: 15.5 },
    summary:
      "Explored the Descartes highlands, the only Apollo mission to target a lunar highland site.",
    discoveries: [
      "Highland anorthositic samples — ancient crust",
      "Cosmic-ray detector and ultraviolet astronomy on surface",
    ],
  },
  {
    id: "apollo17",
    name: "Apollo 17",
    agency: "NASA",
    year: 1972,
    endYear: 1972,
    target: "moon",
    targetLabel: "Moon — Taurus–Littrow",
    status: "complete",
    type: "crewed",
    site: { name: "Taurus–Littrow", lat: 20.19, lon: 30.77 },
    summary:
      "The final Apollo mission, carrying the first geologist (Harrison Schmitt) to the lunar surface.",
    discoveries: [
      "Orange volcanic glass — evidence of fire fountaining",
      "Longest traverse and largest sample return of the program",
    ],
  },
  {
    id: "phoenix",
    name: "Phoenix",
    agency: "NASA / JPL",
    year: 2008,
    endYear: 2008,
    target: "mars",
    targetLabel: "Mars — Green Valley (Vastitas Borealis)",
    status: "complete",
    type: "lander",
    site: { name: "Green Valley", lat: 68.22, lon: 234.25 },
    summary:
      "Polar lander that confirmed water ice beneath the surface and studied the arctic soil chemistry for five months.",
    discoveries: [
      "Water-ice buried centimetres below the surface",
      "Perchlorate salts — implications for brines and habitability",
    ],
  },
  {
    id: "insight",
    name: "InSight",
    agency: "NASA / JPL",
    year: 2018,
    endYear: 2022,
    target: "mars",
    targetLabel: "Mars — Elysium Planitia",
    status: "complete",
    type: "lander",
    site: { name: "Elysium Planitia", lat: 4.5, lon: 135.62 },
    summary:
      "The first dedicated geophysical station on Mars, operating a seismometer and heat-flow probe for four years.",
    discoveries: [
      "Marsquakes revealing a large liquid-core signature",
      "Seismic constraints on crustal thickness and mantle structure",
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
    traverse: {
      label: "Spirit traverse · Gusev Crater",
      note: "Approximate waypoints along the real MER-A route through the Columbia Hills.",
      points: [
        { lat: -14.5718, lon: 175.4745 }, // Columbia Memorial Station
        { lat: -14.5773, lon: 175.4677 }, // West Spur
        { lat: -14.5796, lon: 175.4328 }, // Husband Hill summit
        { lat: -14.6024, lon: 175.4414 }, // Home Plate
      ],
    },
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
    traverse: {
      label: "Opportunity traverse · Meridiani Planum",
      note: "Approximate waypoints along the real 45 km MER-B route to Endeavour crater.",
      points: [
        { lat: -1.9463, lon: -5.53 }, // Eagle crater
        { lat: -1.93, lon: -5.4 }, // Endurance crater
        { lat: -2.1, lon: -6.0 }, // Erebus crater
        { lat: -2.05, lon: -5.7 }, // Victoria crater
        { lat: -2.28, lon: -5.19 }, // Endeavour crater
      ],
    },
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
    traverse: {
      label: "Curiosity traverse · Gale Crater",
      note: "Approximate waypoints along the real MSL route to Mount Sharp.",
      points: [
        { lat: -4.5895, lon: 137.4417 }, // Bradbury Landing
        { lat: -4.5913, lon: 137.4419 }, // Yellowknife Bay
        { lat: -4.592, lon: 137.447 }, // Dingo Gap
        { lat: -4.6402, lon: 137.4401 }, // Kimberley
        { lat: -4.6492, lon: 137.4268 }, // Pahrump Hills
        { lat: -4.6288, lon: 137.4146 }, // Marias Pass
        { lat: -5.053, lon: 137.4726 }, // Murray Buttes
        { lat: -5.0952, lon: 137.4752 }, // Vera Rubin Ridge
        { lat: -5.3899, lon: 137.3993 }, // Glen Torridon
        { lat: -5.3533, lon: 137.4869 }, // Gediz Vallis
      ],
    },
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
    traverse: {
      label: "Perseverance traverse · Jezero Crater",
      note: "Approximate waypoints derived from the real NASA/JPL traverse map (2021–2024).",
      points: [
        { lat: 18.4447, lon: 77.4508 }, // Octavia E. Butler Landing
        { lat: 18.4478, lon: 77.4509 }, // Dourbes
        { lat: 18.4484, lon: 77.4442 }, // Rochette
        { lat: 18.4483, lon: 77.4462 }, // Citadelle
        { lat: 18.4535, lon: 77.454 }, // Artuby ridge
        { lat: 18.4242, lon: 77.4166 }, // South Séítah
        { lat: 18.442, lon: 77.4072 }, // Máaz
        { lat: 18.4549, lon: 77.3858 }, // Skinner Ridge
        { lat: 18.4799, lon: 77.4263 }, // Three Forks cache depot
      ],
    },
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
