import type { Body } from "@/data/bodies";
import type { SiteAnalysis } from "@/lib/analysis";

/**
 * Report generation for the research console and saved analyses.
 * Produces a shareable Markdown brief and a download/print helper.
 */

function fmt(v: number, unit = ""): string {
  return `${v.toLocaleString()}${unit}`;
}

export function buildComparisonMarkdown(bodies: Body[], generatedAt = new Date()): string {
  const lines: string[] = [];
  lines.push("# COSMOS OS — Comparative Planetology Brief");
  lines.push("");
  lines.push(`Generated ${generatedAt.toISOString()} · ${bodies.length} bodies compared`);
  lines.push("");
  bodies.forEach((b, i) => {
    lines.push(`## ${i + 1}. ${b.name} (${b.designation})`);
    lines.push("");
    lines.push(`**Classification:** ${b.classification}`);
    lines.push(`**Summary:** ${b.summary}`);
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("| --- | --- |");
    const m = b.metrics;
    lines.push(`| Mean radius | ${fmt(m.radiusKm)} km |`);
    lines.push(`| Surface gravity | ${m.gravity} m/s² |`);
    lines.push(`| Temperature range | ${m.tempC[0]} … ${m.tempC[1]} °C |`);
    lines.push(`| Surface pressure | ${m.pressureBar} bar |`);
    lines.push(`| Atmosphere | ${m.atmosphere} |`);
    lines.push(`| Surface material | ${m.surface} |`);
    lines.push(`| Water presence | ${m.water} |`);
    lines.push(`| Escape velocity | ${m.escapeVelocity} km/s |`);
    lines.push(`| Magnetic field | ${m.magneticField} |`);
    lines.push(`| Orbital period | ${m.orbitalPeriod} |`);
    lines.push("");
  });
  lines.push("---");
  lines.push("Compiled with Cosmos OS — an AI-powered planetary intelligence platform.");
  lines.push("Source data: NASA / JPL / USGS public datasets.");
  return lines.join("\n");
}

export function buildSiteAnalysisMarkdown(
  body: Body,
  a: SiteAnalysis,
  generatedAt = new Date(),
): string {
  const lines: string[] = [];
  lines.push(`# Landing-site analysis — ${body.name}`);
  lines.push("");
  lines.push(`Generated ${generatedAt.toISOString()}`);
  lines.push(
    `Target: ${a.lat}°, ${a.lon}° · Verdict: **${a.verdict}** · Score: **${a.score}/100**`,
  );
  lines.push("");
  const rows: [string, string][] = [
    ["Terrain safety", `${(a.terrainSafety * 100).toFixed(0)}%`],
    ["Rock density", `${(a.rockDensity * 100).toFixed(0)}%`],
    ["Water-ice probability", `${(a.iceProbability * 100).toFixed(0)}%`],
    ["Scientific importance", `${(a.scientificValue * 100).toFixed(0)}%`],
    ["Landing difficulty", `${(a.landingDifficulty * 100).toFixed(0)}%`],
    ["Radiation risk", `${(a.radiationRisk * 100).toFixed(0)}%`],
    ["Elevation", `${Math.round(a.elevationM).toLocaleString()} m`],
    ["Mean slope", `${a.slopeDeg}°`],
  ];
  lines.push("| Metric | Value |");
  lines.push("| --- | --- |");
  rows.forEach(([k, v]) => lines.push(`| ${k} | ${v} |`));
  lines.push("");
  lines.push("## Recommendation");
  lines.push("");
  lines.push(a.recommendation);
  lines.push("");
  lines.push("## Suggested rover path");
  lines.push("");
  a.roverPath.forEach((leg) =>
    lines.push(`- ${leg.d} km heading ${leg.heading} — ${leg.objective}`),
  );
  lines.push("");
  lines.push(
    "> The landing-score model is an illustrative approximation, not a mission-planning tool.",
  );
  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mime = "text/markdown"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
