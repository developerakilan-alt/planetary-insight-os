import * as THREE from "three";
import type { Landmark } from "@/data/bodies";

/** Convert planetocentric latitude/longitude (deg, E positive) to a unit vector. */
export function latLonToVec3(lat: number, lon: number, r = 1): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/** Convert a unit vector to planetocentric latitude/longitude (deg, E positive). */
export function vec3ToLatLon(v: THREE.Vector3): { lat: number; lon: number } {
  const n = v.clone().normalize();
  const lat = 90 - (Math.acos(n.y) * 180) / Math.PI;
  let lon = (Math.atan2(n.z, -n.x) * 180) / Math.PI - 180;
  if (lon < -180) lon += 360;
  return { lat, lon };
}

export function formatLat(lat: number): string {
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}`;
}

export function formatLon(lon: number): string {
  const l = ((lon % 360) + 360) % 360;
  return `${Math.abs(l).toFixed(2)}° ${l >= 180 ? "W" : "E"}`;
}

export interface NamedFeature {
  name: string;
  lat: number;
  lon: number;
  kind: Landmark["kind"];
  note: string;
  distanceDeg: number;
}

/** Great-circle distance between two lat/lon points in degrees. */
export function distanceDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = ((90 - lat1) * Math.PI) / 180;
  const p2 = ((90 - lat2) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  return (
    Math.acos(
      Math.min(
        1,
        Math.max(-1, Math.sin(p1) * Math.sin(p2) * Math.cos(dLon) + Math.cos(p1) * Math.cos(p2)),
      ),
    ) *
    (180 / Math.PI)
  );
}

export function nearestFeature(
  lat: number,
  lon: number,
  landmarks: Landmark[],
  maxDistanceDeg = 12,
): NamedFeature | null {
  let best: NamedFeature | null = null;
  for (const l of landmarks) {
    const d = distanceDeg(lat, lon, l.lat, l.lon);
    if (d > maxDistanceDeg) continue;
    if (!best || d < best.distanceDeg) {
      best = { ...l, distanceDeg: d };
    }
  }
  return best;
}
