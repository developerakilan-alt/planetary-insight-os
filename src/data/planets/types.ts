import type { BodyId } from "@/data/bodies";

export type Quality = "low" | "medium" | "high" | "ultra" | "auto";

export type TextureTier = "L" | "M" | "H";

export type MapKind =
  | "color"
  | "normal"
  | "specular"
  | "roughness"
  | "elevation"
  | "terrain"
  | "scientific"
  | "night"
  | "clouds"
  | "atmosphere";

export type VisualizationMode =
  "natural" | "elevation" | "terrain" | "infrared" | "scientific" | "night";

export type RotationMode = "realistic" | "fast" | "pause" | "reverse";

export interface TextureSource {
  id: string;
  kind: MapKind;
  /** short display name, e.g. "Mars image texture" */
  label: string;
  /** what the layer represents, e.g. "Planetary surface albedo" */
  dataType: string;
  /** primary mission/data owner, e.g. "NASA / JPL-Caltech" */
  source: string;
  /** official dataset name, e.g. "Viking global mosaic" */
  dataset: string;
  /** repository that distributed it, e.g. "NASA Planetary Data System" */
  provider: string;
  /** credit line */
  credit: string;
  /** processing applied for web, e.g. "Mosaic assembled by USGS; web-optimized" */
  processing: string;
  /** display resolution of the highest tier */
  resolution: string;
  license: string;
  /** official NASA / USGS source page */
  sourceUrl: string;
  /** file name stem (without tier suffix) inside /textures/<planet>/ */
  stem: string;
  /** file extension, defaults to "jpg" */
  ext?: string;
  /** true for single-file layers (no quality tiers), e.g. the ring strip */
  single?: boolean;
  /** true if this layer only covers part of the body (scientific honesty) */
  partialCoverage?: boolean;
  coverageNote?: string;
}

export interface ElevationStats {
  /** official dataset short name, e.g. "MOLA (Mars Orbiter Laser Altimeter)" */
  dataset: string;
  source: string;
  sourceUrl: string;
  minM: number;
  maxM: number;
  avgM: number;
  unitLabel: string;
  /** max vertical exaggeration multiplier offered by the UI */
  maxExaggeration: number;
}

export interface AtmosphereConfig {
  /** base color of the scattering layer */
  color: string;
  /** rim-glow intensity */
  intensity: number;
  /** radius multiplier of the glow shell */
  scale: number;
  /** front-side haze opacity (0 = none) for thick atmospheres (Venus/Titan) */
  hazeOpacity?: number;
}

export interface CloudConfig {
  source: TextureSource;
  /** world-space speed (rad/s) */
  speed: number;
  opacity: number;
  /** radius multiplier of the cloud shell */
  scale: number;
}

export interface RingConfig {
  source: TextureSource;
  innerRadius: number;
  outerRadius: number;
  /** axial tilt of the ring plane relative to the body's equator (deg) */
  tiltDeg: number;
  opacity: number;
}

export interface RotationConfig {
  /** seconds per full revolution in "realistic" mode (relative real periods) */
  realisticSeconds: number;
  /** seconds per full revolution in "fast" mode */
  fastSeconds: number;
  /** true if the body rotates retrograde */
  retrograde: boolean;
}

export interface Provenance {
  title: string;
  rows: { label: string; value: string }[];
  viewSourceUrl: string;
  /** short disclaimer separating NASA data from Cosmos OS visualization */
  disclaimer: string;
}

export interface PlanetVisualConfig {
  planetId: BodyId;
  displayName: string;
  surfaceColor: TextureSource;
  surfaceNormal?: TextureSource;
  surfaceSpecular?: TextureSource;
  surfaceRoughness?: TextureSource;
  surfaceElevation?: TextureSource;
  surfaceTerrain?: TextureSource;
  surfaceScientific?: TextureSource;
  nightLights?: TextureSource;
  clouds?: CloudConfig;
  atmosphere?: AtmosphereConfig;
  rings?: RingConfig;
  elevation?: ElevationStats;
  rotation: RotationConfig;
  /** surface material roughness constant (physically informed) */
  roughness: number;
  /** metalness constant */
  metalness: number;
  /** normal strength applied to the normal map */
  normalStrength: number;
  /** vertical exaggeration used for displacement in elevation/terrain modes */
  defaultExaggeration: number;
  modes: VisualizationMode[];
  provenance: Provenance;
  notes?: string;
}
