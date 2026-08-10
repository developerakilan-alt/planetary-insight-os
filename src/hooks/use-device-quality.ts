import { useMemo } from "react";
import type { Quality } from "@/data/planets/types";

export type AutoQuality = Exclude<Quality, "auto">;

export interface DeviceBudget {
  /** resolved quality tier chosen for the current device */
  tier: AutoQuality;
  /** maximum device-pixel-ratio the renderer should target */
  maxDpr: number;
}

/**
 * Chooses a concrete quality tier from device capability hints so the
 * `auto` quality option maps to a real budget. Uses navigator.deviceMemory,
 * hardware concurrency and screen size; falls back to conservative values.
 */
export function detectDeviceBudget(): DeviceBudget {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { tier: "high", maxDpr: 1.8 };
  }
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const width = window.screen?.width || window.innerWidth || 1920;
  const smallScreen = width < 900;

  let score = memory * 0.55 + Math.min(cores, 16) * 0.45;
  if (smallScreen) score *= 0.55;

  let tier: AutoQuality;
  if (score <= 3.2) tier = "low";
  else if (score <= 6) tier = "medium";
  else if (score <= 11) tier = "high";
  else tier = "ultra";

  const maxDpr = tier === "low" ? 1.2 : tier === "medium" ? 1.5 : tier === "high" ? 1.8 : 2;
  return { tier, maxDpr };
}

export function useDeviceQuality(): DeviceBudget {
  return useMemo(() => detectDeviceBudget(), []);
}
