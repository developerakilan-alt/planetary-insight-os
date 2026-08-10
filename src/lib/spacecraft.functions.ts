import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parseHorizonsResult, type HorizonsSample } from "./spacecraft";

/**
 * Server-side proxy for the NASA JPL Horizons API.
 *
 * The public Horizons endpoint sends no CORS headers, so browsers cannot call
 * it directly. This runs on the Nitro server (no CORS) and returns the parsed
 * ephemeris rows. Results are cached per spacecraft NAIF id for the lifetime
 * of the server process.
 */

const TrajectoryInput = z.object({
  naif: z.number().int().negative(),
  start: z.string(),
  stop: z.string(),
  step: z.string().default("30d"),
});

const cache = new Map<number, HorizonsSample[]>();

const HORIZONS_URL = "https://ssd.jpl.nasa.gov/api/horizons.api";

function buildUrl(naif: number, start: string, stop: string, step: string): string {
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${naif}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'VECTORS'",
    CENTER: "'500@10'",
    START_TIME: `'${start}'`,
    STOP_TIME: `'${stop}'`,
    STEP_SIZE: `'${step}'`,
    CSV_FORMAT: "'YES'",
    REF_PLANE: "'ECLIPTIC'",
    VEC_TABLE: "'1'",
    QUANTITIES: "'1'",
  });
  return `${HORIZONS_URL}?${params.toString()}`;
}

export const getSpacecraftTrajectory = createServerFn({ method: "POST" })
  .validator((data: unknown) => TrajectoryInput.parse(data))
  .handler(async ({ data }) => {
    const cached = cache.get(data.naif);
    if (cached) return { naif: data.naif, samples: cached };

    const res = await fetch(buildUrl(data.naif, data.start, data.stop, data.step), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Horizons returned HTTP ${res.status}`);

    const json = (await res.json()) as { result?: string; error?: string };
    if (json.error) throw new Error(json.error);
    const samples = parseHorizonsResult(json.result ?? "");
    if (samples.length === 0) {
      throw new Error("Horizons returned no ephemeris for this time window.");
    }

    cache.set(data.naif, samples);
    return { naif: data.naif, samples };
  });
