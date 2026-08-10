import type { ElevationStats } from "@/data/planets/types";

/**
 * Samples real elevation values from a body's DEM texture on the CPU.
 *
 * The DEM is a grayscale equirectangular map. We render it to a canvas once,
 * apply a percentile stretch (the source grayscales are colour-derived, so
 * their extremes are noisy), then map luminance linearly onto the official
 * [minM, maxM] range for the dataset. Values are therefore approximate.
 */
export interface ElevationSampler {
  sample(lat: number, lon: number): number;
}

const cache = new Map<string, Promise<ElevationSampler | null>>();

export function getElevationSampler(
  url: string,
  stats: ElevationStats,
): Promise<ElevationSampler | null> {
  const key = `${url}|${stats.minM}|${stats.maxM}`;
  const existing = cache.get(key);
  if (existing) return existing;
  const promise = build(url, stats);
  cache.set(key, promise);
  return promise;
}

async function build(url: string, stats: ElevationStats): Promise<ElevationSampler | null> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  await img.decode();

  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }

  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4] ?? 0;
    const g = data[i * 4 + 1] ?? 0;
    const b = data[i * 4 + 2] ?? 0;
    lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const sorted = Float32Array.from(lum).sort();
  const lo = sorted[Math.floor(sorted.length * 0.02)] ?? 0;
  const hi = sorted[Math.floor(sorted.length * 0.98)] ?? 255;
  const span = Math.max(hi - lo, 1);
  const range = stats.maxM - stats.minM;

  return {
    sample(lat: number, lon: number): number {
      const x = ((((lon % 360) + 360) % 360) / 360) * w;
      const y = ((90 - lat) / 180) * h;
      const ix = Math.min(w - 1, Math.max(0, Math.floor(x)));
      const iy = Math.min(h - 1, Math.max(0, Math.floor(y)));
      const v = ((lum[iy * w + ix] ?? 0) - lo) / span;
      return stats.minM + clamp01(v) * range;
    },
  };
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}
