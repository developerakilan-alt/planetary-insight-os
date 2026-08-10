import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { getSpacecraftTrajectory } from "@/lib/spacecraft.functions";
import {
  SPACECRAFT,
  interpolatePosition,
  type HorizonsSample,
  type SpacecraftPosition,
} from "@/lib/spacecraft";

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useSpacecraftPositions(epoch: Date | null): {
  positions: SpacecraftPosition[] | null;
  error: string | null;
} {
  const fn = useServerFn(getSpacecraftTrajectory);
  const cacheRef = useRef<Map<number, HorizonsSample[]>>(new Map());
  const [positions, setPositions] = useState<SpacecraftPosition[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!epoch) {
      setPositions(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const active: SpacecraftPosition[] = [];
    const inWindow = SPACECRAFT.filter((def) => {
      const start = new Date(`${def.launch}T00:00:00`);
      const end = new Date(`${def.windowEnd}T00:00:00`);
      return epoch >= start && epoch <= end;
    });

    setError(null);

    (async () => {
      const samplesByNaif = await Promise.all(
        inWindow.map(async (def) => {
          const cached = cacheRef.current.get(def.naif);
          if (cached) return { def, samples: cached };
          try {
            const res = await fn({
              data: { naif: def.naif, start: def.launch, stop: def.windowEnd, step: "30d" },
            });
            cacheRef.current.set(def.naif, res.samples);
            return { def, samples: res.samples };
          } catch (err) {
            if (!cancelled) {
              setError(err instanceof Error ? err.message : `Failed to load ${def.name} position`);
            }
            return { def, samples: null };
          }
        }),
      );

      for (const { def, samples } of samplesByNaif) {
        if (!samples) continue;
        const pos = interpolatePosition(def, samples, epoch);
        if (pos) active.push(pos);
      }

      if (!cancelled) setPositions(active);
    })();

    return () => {
      cancelled = true;
    };
  }, [epoch, fn]);

  return { positions, error };
}
