import { BODIES, type BodyId } from "@/data/bodies";

/**
 * Colony / terraforming simulation model. The sliders drive a transparent,
 * deterministic physical approximation (not a validated climate model).
 * Outputs include habitability score, stage, risk register and a downloadable
 * settlement blueprint.
 */

export interface TerraformParams {
  /** atmospheric CO₂ fraction in % (0–100) */
  co2Pct: number;
  /** orbital sun-shield/reflector gigawatts of insolation redirected (0–200 GW) */
  reflectorsGw: number;
  /** water delivered in Gt (0–5000) */
  waterGt: number;
  /** greenhouse gases (CH₄ etc.) in ppm (0–10000) */
  ghgPpm: number;
  /** magnetosphere shield strength in % of Earth (0–100) */
  shieldPct: number;
}

export interface TerraformResult {
  temperatureC: number;
  pressureBar: number;
  surfaceWaterPct: number;
  radiationDose: number;
  breathability: number;
  habitability: number;
  stage: string;
  stageIndex: number;
  timelineYears: number;
  risks: { label: string; severity: "low" | "medium" | "high" }[];
  infeasible: boolean;
}

const STAGES = [
  "Dead rock",
  "Tenuous atmosphere",
  "Thin cold atmosphere",
  "Marginal outpost",
  "Sheltered settlement",
  "Partial terraformation",
  "Earth-like horizon",
];

export function terraformSimulate(bodyId: BodyId, p: TerraformParams): TerraformResult {
  const body = BODIES.find((b) => b.id === bodyId);
  if (!body) throw new Error(`Unknown body: ${bodyId}`);
  const m = body.metrics;
  const baseTemp = (m.tempC[0] + m.tempC[1]) / 2;

  const co2Warming = Math.min(120, (p.co2Pct / 100) * 140);
  const ghgWarming = Math.min(60, Math.sqrt(p.ghgPpm) * 0.7);
  const reflectorCooling = Math.min(40, p.reflectorsGw / 8);
  const waterWarming = Math.min(25, Math.sqrt(p.waterGt) * 0.5);
  const temperatureC = baseTemp + co2Warming + ghgWarming + waterWarming - reflectorCooling;

  const pressureBase = Math.max(0, Math.log10(m.pressureBar + 1e-8));
  const pressureBar = Math.max(
    0,
    pressureBase +
      (p.co2Pct / 100) * 0.95 +
      (p.ghgPpm / 10000) * 0.3 +
      Math.min(0.35, Math.sqrt(p.waterGt) * 0.012),
  );

  const surfaceWaterPct = clamp(
    (Math.sqrt(p.waterGt) / 71) * 100 * (temperatureC > 0 ? 1 : 0.4),
    0,
    100,
  );
  const radiationDose = Math.max(
    0,
    Math.round(
      100 *
        (1 - p.shieldPct / 100) *
        (m.magneticField.includes("None") ? 1.35 : m.magneticField.includes("Global") ? 0.12 : 0.7),
    ),
  );

  const tempScore = Math.max(0, 100 - Math.abs(temperatureC - 14) * 1.6);
  const pressureScore = Math.max(0, 100 - Math.abs(pressureBar - 1) * 60);
  const waterScore = surfaceWaterPct;
  const shieldScore = p.shieldPct;
  const breathability = Math.round(
    clamp(tempScore * 0.35 + pressureScore * 0.35 + waterScore * 0.15 + shieldScore * 0.15, 0, 100),
  );

  const habitability = Math.round(
    clamp(breathability * 0.85 + (temperatureC > -60 ? 15 : 0), 0, 100),
  );
  const stageIndex =
    habitability >= 88
      ? 6
      : habitability >= 70
        ? 5
        : habitability >= 50
          ? 4
          : habitability >= 30
            ? 3
            : habitability >= 12
              ? 2
              : habitability >= 3
                ? 1
                : 0;
  const stage = STAGES[stageIndex]!;

  const timelineYears = Math.max(
    5,
    Math.round((100 - habitability) * 14 + Math.sqrt(p.waterGt) * 2),
  );

  const risks: TerraformResult["risks"] = [];
  if (p.co2Pct > 70) risks.push({ label: "Runaway CO₂ greenhouse", severity: "high" });
  if (temperatureC < -80) risks.push({ label: "Cryogenic freeze-out", severity: "high" });
  if (temperatureC > 60) risks.push({ label: "Runaway greenhouse", severity: "high" });
  if (p.shieldPct < 30) risks.push({ label: "Surface radiation exposure", severity: "medium" });
  if (p.waterGt < 200) risks.push({ label: "Water scarcity", severity: "medium" });
  if (pressureBar < 0.05) risks.push({ label: "Near-vacuum surface pressure", severity: "high" });
  if (radiationDose > 60)
    risks.push({ label: "Crew EVA dose limits exceeded", severity: "medium" });

  const infeasible = habitability < 12 && pressureBar < 0.005 && temperatureC < -150;

  return {
    temperatureC: Math.round(temperatureC * 10) / 10,
    pressureBar: Math.round(pressureBar * 1000) / 1000,
    surfaceWaterPct: Math.round(surfaceWaterPct),
    radiationDose,
    breathability,
    habitability,
    stage,
    stageIndex,
    timelineYears,
    risks,
    infeasible,
  };
}

export function defaultParams(bodyId: BodyId): TerraformParams {
  const body = BODIES.find((b) => b.id === bodyId);
  const co2Pct = body?.id === "venus" ? 30 : 5;
  return {
    co2Pct,
    reflectorsGw: 10,
    waterGt: body?.id === "mars" ? 500 : 100,
    ghgPpm: 300,
    shieldPct: 20,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function buildColonyBlueprint(
  bodyId: BodyId,
  p: TerraformParams,
  r: TerraformResult,
): string {
  const body = BODIES.find((b) => b.id === bodyId);
  if (!body) return "";
  const d = new Date();
  return [
    `# ${body.name} Settlement Blueprint`,
    `Generated ${d.toISOString().slice(0, 10)} · Cosmos OS Colony Planner (modeled)`,
    ``,
    `## Mission parameters`,
    `- Target: ${body.name} (${body.classification})`,
    `- Surface gravity: ${body.metrics.gravity} m/s²`,
    `- Baseline temperature: ${body.metrics.tempC[0]}…${body.metrics.tempC[1]} °C`,
    `- Baseline pressure: ${body.metrics.pressureBar} bar`,
    ``,
    `## Terraforming inputs`,
    `- CO₂ fraction: ${p.co2Pct}%`,
    `- Orbital reflectors: ${p.reflectorsGw} GW`,
    `- Water delivered: ${p.waterGt} Gt`,
    `- Greenhouse gases: ${p.ghgPpm} ppm`,
    `- Magnetosphere shield: ${p.shieldPct}%`,
    ``,
    `## Projected outcome`,
    `- Mean temperature: ${r.temperatureC} °C`,
    `- Surface pressure: ${r.pressureBar} bar`,
    `- Surface water: ${r.surfaceWaterPct}% cover`,
    `- Radiation dose: ${r.radiationDose} (relative)`,
    `- Habitability index: ${r.habitability}/100 — ${r.stage}`,
    `- Estimated timeline: ${r.timelineYears} years`,
    ``,
    `## Risk register`,
    ...r.risks.map((x) => `- [${x.severity.toUpperCase()}] ${x.label}`),
    ``,
    `> Model output — physics is approximate and does not constitute an engineering design.`,
  ].join("\n");
}
