import type { Body } from "@/data/bodies";

function hash(x: number, y: number, seed: number) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

function fbm2(lat: number, lon: number, seed: number) {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 5; i++) {
    v += a * hash(Math.floor(lat * f * 0.6), Math.floor(lon * f * 0.6), seed + i);
    a *= 0.5;
    f *= 2.1;
  }
  return Math.min(1, Math.max(0, v * 1.35));
}

export interface SiteAnalysis {
  lat: number;
  lon: number;
  terrainSafety: number;
  rockDensity: number;
  elevationM: number;
  slopeDeg: number;
  iceProbability: number;
  scientificValue: number;
  landingDifficulty: number;
  radiationRisk: number;
  score: number;
  verdict: "Prime" | "Viable" | "Marginal" | "Rejected";
  recommendation: string;
  roverPath: { d: number; heading: string; objective: string }[];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function analyseSite(body: Body, lat: number, lon: number): SiteAnalysis {
  const seed = body.id.length * 13;
  const rough = fbm2(lat, lon, seed);
  const relief = fbm2(lat * 1.7, lon * 1.7, seed + 5);
  const polar = clamp01((Math.abs(lat) - 55) / 35);

  const slopeDeg = +(rough * 26 * (0.4 + body.roughness)).toFixed(1);
  const rockDensity = +(rough * 0.7 + relief * 0.3).toFixed(2);
  const elevationM = Math.round((relief - 0.5) * 12000 * (0.4 + body.roughness));
  const iceProbability = +clamp01(body.ice * 0.55 + polar * 0.6 + relief * 0.12).toFixed(2);
  const terrainSafety = +clamp01(1 - slopeDeg / 30 - rockDensity * 0.35 + 0.25).toFixed(2);
  const scientificValue = +clamp01(
    iceProbability * 0.45 + relief * 0.3 + (body.metrics.water.includes("ocean") ? 0.25 : 0.1),
  ).toFixed(2);
  const radiationRisk = +clamp01(
    (body.metrics.magneticField.toLowerCase().includes("none") ||
    body.metrics.magneticField.toLowerCase().includes("crustal")
      ? 0.65
      : 0.25) +
      (body.metrics.pressureBar < 0.01 ? 0.2 : -0.1) +
      (body.system === "Jupiter" ? 0.25 : 0),
  ).toFixed(2);
  const landingDifficulty = +clamp01(
    (1 - terrainSafety) * 0.55 + (body.metrics.pressureBar > 10 ? 0.4 : 0.1) + slopeDeg / 90,
  ).toFixed(2);

  const score = Math.round(
    (terrainSafety * 0.32 +
      (1 - landingDifficulty) * 0.22 +
      scientificValue * 0.28 +
      (1 - radiationRisk) * 0.18) *
      100,
  );

  const verdict: SiteAnalysis["verdict"] =
    score >= 78 ? "Prime" : score >= 62 ? "Viable" : score >= 45 ? "Marginal" : "Rejected";

  const recommendation =
    verdict === "Prime"
      ? `Recommend as a primary candidate. Slope and rock abundance are within EDL margins for a ${body.metrics.gravity < 3 ? "propulsive soft-landing" : "sky-crane"} architecture.`
      : verdict === "Viable"
        ? "Acceptable with hazard-relative navigation enabled and a 150 m landing ellipse offset toward lower relief."
        : verdict === "Marginal"
          ? "Only viable for a hardened lander. Recommend orbital reconnaissance at ≤ 0.3 m/px before committing."
          : "Reject for surface operations. Terrain and environmental risk exceed accepted mission thresholds.";

  const headings = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const roverPath = [0, 1, 2, 3].map((i) => {
    const h = headings[Math.floor(fbm2(lat + i * 3, lon - i * 2, seed + i * 9) * 8) % 8] ?? "N";
    return {
      d: +(0.4 + fbm2(lat - i, lon + i, seed + i) * 3.2).toFixed(1),
      heading: h,
      objective: [
        "Deploy and characterise the landing ellipse regolith",
        "Traverse to the nearest outcrop for stratigraphic imaging",
        iceProbability > 0.4
          ? "Subsurface radar sounding for volatile deposits"
          : "Sample dune-field sediment",
        "Cache sample tubes at a return-accessible depot",
      ][i] as string,
    };
  });

  return {
    lat: +lat.toFixed(2),
    lon: +lon.toFixed(2),
    terrainSafety,
    rockDensity,
    elevationM,
    slopeDeg,
    iceProbability,
    scientificValue,
    landingDifficulty,
    radiationRisk,
    score,
    verdict,
    recommendation,
    roverPath,
  };
}
