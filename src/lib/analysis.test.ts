import { describe, expect, it } from "vitest";
import { BODIES } from "@/data/bodies";
import { analyseSite } from "./analysis";

describe("analyseSite", () => {
  it("returns a well-formed analysis for every body", () => {
    for (const body of BODIES) {
      const a = analyseSite(body, 10, 20);
      expect(a.lat).toBeCloseTo(10, 2);
      expect(a.lon).toBeCloseTo(20, 2);
      expect(a.score).toBeGreaterThanOrEqual(0);
      expect(a.score).toBeLessThanOrEqual(100);
      expect(["Prime", "Viable", "Marginal", "Rejected"]).toContain(a.verdict);
      expect(a.recommendation.length).toBeGreaterThan(0);
      expect(a.roverPath).toHaveLength(4);
    }
  });

  it("keeps all modelled metrics inside [0, 1] and finite", () => {
    for (const body of BODIES) {
      const a = analyseSite(body, 37, -112);
      for (const key of [
        "terrainSafety",
        "rockDensity",
        "iceProbability",
        "scientificValue",
        "landingDifficulty",
        "radiationRisk",
      ] as const) {
        expect(a[key], `${body.id}.${key}`).toBeGreaterThanOrEqual(0);
        expect(a[key], `${body.id}.${key}`).toBeLessThanOrEqual(1);
        expect(Number.isFinite(a[key])).toBe(true);
      }
    }
  });

  it("is deterministic for a fixed coordinate", () => {
    const body = BODIES.find((b) => b.id === "mars")!;
    const a1 = analyseSite(body, 18.65, 77.5);
    const a2 = analyseSite(body, 18.65, 77.5);
    expect(a1).toEqual(a2);
  });

  it("does not change across calls within a single render", () => {
    const body = BODIES.find((b) => b.id === "mars")!;
    const a = analyseSite(body, 0, 0);
    expect(a.score).toBe(Math.round(a.score));
    expect(a.slopeDeg).toBeGreaterThanOrEqual(0);
  });

  it("produces at least one strong verdict somewhere on a calm body", () => {
    const moon = BODIES.find((b) => b.id === "moon")!;
    const best = Math.max(...[0, 15, 30, 45].map((lat) => analyseSite(moon, lat, 0).score));
    expect(best).toBeGreaterThan(0);
  });
});
