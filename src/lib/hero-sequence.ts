import type { BodyId } from "@/data/bodies";

/** Solar-system order used by the home-page 3D carousel. */
export const HERO_ORDER: BodyId[] = [
  "mercury",
  "venus",
  "earth",
  "mars",
  "saturn",
  "jupiter",
  "uranus",
  "neptune",
];

/** Scroll starts focused on Earth. */
export const HERO_START = 2;

/**
 * Rail order for the secondary carousel: every world except Earth (which owns
 * the dedicated hero), in solar-system order — Mars is followed by Jupiter.
 */
export const RAIL_ORDER: BodyId[] = [
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
];

/** The rail opens on Mars — a strong opener now that Earth has its own hero. */
export const RAIL_START = 2;
