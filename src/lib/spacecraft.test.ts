import { describe, expect, it } from "vitest";
import { epochJulianDay } from "./ephemeris";
import {
  AU_KM,
  SPACECRAFT,
  auToChartRadius,
  formatSpacecraftDistance,
  interpolatePosition,
  parseHorizonsResult,
} from "./spacecraft";

const FIXTURE = `Header line
JDTDB, Calendar Date, X, Y, Z,
$$SOE
2443392.500000000, A.D. 1977-Sep-06 00:00:00.0000, -1.234567890123456E+08,  9.876543210987654E+07,  1.234567890123456E+06,
2443422.500000000, A.D. 1977-Oct-06 00:00:00.0000, -2.000000000000000E+08,  1.500000000000000E+08,  2.500000000000000E+06,
$$EOE
trailing text`;

describe("parseHorizonsResult", () => {
  it("extracts JD + X/Y/Z rows between SOE/EOE markers", () => {
    const samples = parseHorizonsResult(FIXTURE);
    expect(samples).toHaveLength(2);
    expect(samples[0]).toEqual({
      jd: 2443392.5,
      x: -123456789.0123456,
      y: 98765432.10987654,
      z: 1234567.890123456,
    });
    expect(samples[1]!.jd).toBe(2443422.5);
  });

  it("ignores malformed rows and empty input", () => {
    expect(parseHorizonsResult("")).toEqual([]);
    expect(
      parseHorizonsResult(`$$SOE
not-a-row
$$EOE`),
    ).toEqual([]);
  });
});

describe("auToChartRadius", () => {
  it("matches the planet anchors exactly", () => {
    expect(auToChartRadius(1.0)).toBeCloseTo(13.5, 5);
    expect(auToChartRadius(5.2)).toBeCloseTo(24, 5);
    expect(auToChartRadius(30.1)).toBeCloseTo(36, 5);
  });

  it("interpolates linearly between anchors", () => {
    // Mercury (0.39 → 7) to Venus (0.72 → 10): 0.5 AU is one third of the gap.
    const expected = 7 + ((0.5 - 0.39) * (10 - 7)) / (0.72 - 0.39);
    expect(auToChartRadius(0.5)).toBeCloseTo(expected, 5);
  });

  it("extrapolates past Pluto with the outer-orbit slope", () => {
    const beyond = auToChartRadius(120);
    expect(beyond).toBeGreaterThan(auToChartRadius(39.5));
    expect(beyond).toBeLessThan(300);
  });
});

describe("interpolatePosition", () => {
  const voyager = SPACECRAFT.find((s) => s.id === "voyager-1")!;
  const samples = parseHorizonsResult(FIXTURE);

  it("returns null outside the sampled window", () => {
    expect(interpolatePosition(voyager, samples, new Date("1970-01-01"))).toBeNull();
    expect(interpolatePosition(voyager, samples, new Date("2080-01-01"))).toBeNull();
  });

  it("interpolates the real heliocentric state for a date inside the window", () => {
    const a = samples[0]!;
    const b = samples[1]!;
    const mid = new Date(Date.UTC(1977, 8, 21, 12));
    const t = (epochJulianDay(mid) - a.jd) / (b.jd - a.jd);
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const z = a.z + (b.z - a.z) * t;

    const pos = interpolatePosition(voyager, samples, mid);
    expect(pos).not.toBeNull();
    expect(pos!.distanceKm).toBeCloseTo(Math.hypot(x, y, z), 6);
    expect(pos!.distanceAu).toBeCloseTo(Math.hypot(x, y, z) / AU_KM, 6);
    expect(pos!.lightMinutes).toBeGreaterThan(0);
    expect(pos!.spacecraft.id).toBe("voyager-1");
  });

  it("projects onto the chart in the ecliptic plane", () => {
    const a = samples[0]!;
    const b = samples[1]!;
    const date = new Date(Date.UTC(1977, 9, 6));
    const t = (epochJulianDay(date) - a.jd) / (b.jd - a.jd);
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;

    const pos = interpolatePosition(voyager, samples, date);
    expect(pos).not.toBeNull();
    const radius = Math.hypot(pos!.x, pos!.z);
    const au = Math.hypot(x, y) / AU_KM;
    expect(radius).toBeCloseTo(auToChartRadius(au), 5);
  });
});

describe("formatSpacecraftDistance", () => {
  it("formats AU with light time", () => {
    expect(
      formatSpacecraftDistance({
        spacecraft: SPACECRAFT[0]!,
        x: 1,
        z: 0,
        distanceKm: AU_KM,
        distanceAu: 1,
        lightMinutes: 8.3,
      }),
    ).toBe("1.0 AU · 8.3 lm");
    expect(
      formatSpacecraftDistance({
        spacecraft: SPACECRAFT[0]!,
        x: 1,
        z: 0,
        distanceKm: AU_KM * 100,
        distanceAu: 100,
        lightMinutes: 830,
      }),
    ).toBe("100.0 AU · 13.8 lh");
  });
});
