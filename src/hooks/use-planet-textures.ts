import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();

function getTexture(url: string): THREE.Texture {
  let tex = cache.get(url);
  if (tex) return tex;
  tex = new THREE.TextureLoader().load(url);
  cache.set(url, tex);
  return tex;
}

export type PlanetTextureKey =
  "color" | "normal" | "specular" | "elev" | "terrain" | "scientific" | "night" | "clouds" | "ring";

/**
 * Loads a set of textures keyed by URL, reusing a module-level cache so that
 * switching between planets / tiers does not re-download or re-decode data.
 *
 * Keys listed in `linearKeys` keep a linear (non-sRGB) colour space — used for
 * data maps such as normals and ring strips — everything else is marked sRGB.
 */
export function usePlanetTextures(
  urls: Partial<Record<PlanetTextureKey, string>>,
  linearKeys: PlanetTextureKey[] = [],
): { textures: Partial<Record<PlanetTextureKey, THREE.Texture>>; ready: boolean } {
  const entries = useMemo(() => Object.entries(urls) as [PlanetTextureKey, string][], [urls]);
  const linear = useMemo(() => new Set(linearKeys), [linearKeys]);

  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    setLoaded(0);
    if (entries.length === 0) return;
    let done = 0;
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    for (const [key, url] of entries) {
      if (cache.has(url)) {
        done += 1;
        continue;
      }
      const tex = loader.load(url, () => {
        if (cancelled) return;
        done += 1;
        setLoaded(done);
      });
      cache.set(url, tex);
    }
    setLoaded(done);
    return () => {
      cancelled = true;
    };
  }, [entries]);

  const textures = useMemo(() => {
    const out: Record<string, THREE.Texture> = {};
    for (const [key, url] of entries) {
      const tex = getTexture(url);
      tex.colorSpace = linear.has(key) ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      out[key] = tex;
    }
    return out;
  }, [entries, linear]);

  const ready = entries.length === 0 || loaded >= entries.length;
  return { textures, ready };
}
