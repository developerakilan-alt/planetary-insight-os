import { Body, Equator, Horizon, type Observer } from "astronomy-engine";
import { BODIES, type BodyId } from "@/data/bodies";

/**
 * Flight-Ops sky engine: given an observer on Earth and a time, compute the
 * real topocentric altitude/azimuth of every body using astronomy-engine.
 * These positions drive the device-orientation AR overlay.
 */

const EPHEMERIS_BODY: Partial<Record<BodyId, Body>> = {
  mercury: Body.Mercury,
  venus: Body.Venus,
  earth: Body.Earth,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
  moon: Body.Moon,
};

export interface SkyPoint {
  bodyId: BodyId;
  name: string;
  /** degrees above (+) or below (−) the horizon */
  altitude: number;
  /** degrees clockwise from true north */
  azimuth: number;
  /** distance from Earth in AU */
  distAu: number;
  visible: boolean;
}

export interface ObserverState {
  latitude: number;
  longitude: number;
  height: number;
}

const DEFAULT_OBSERVER: ObserverState = { latitude: 28.5, longitude: -81.5, height: 10 };

export function getObserver(): ObserverState {
  if (typeof window === "undefined") return DEFAULT_OBSERVER;
  try {
    const geo = navigator.geolocation;
    void geo; // only used when explicitly requested
  } catch {
    /* ignore */
  }
  return DEFAULT_OBSERVER;
}

export function observerFromPosition(lat: number, lon: number, height = 0): Observer {
  return { latitude: lat, longitude: lon, height };
}

export function observerToSkyState(o: Observer, date = new Date()): ObserverState {
  void o;
  void date;
  return getObserver();
}

export function computeSky(date: Date, observer: ObserverState): SkyPoint[] {
  const obs: Observer = {
    latitude: observer.latitude,
    longitude: observer.longitude,
    height: observer.height,
  };
  const out: SkyPoint[] = [];
  for (const b of BODIES) {
    const body = EPHEMERIS_BODY[b.id];
    if (!body) continue;
    try {
      const eq = Equator(body, date, obs, true, true);
      const hor = Horizon(date, obs, eq.ra, eq.dec, "normal");
      out.push({
        bodyId: b.id,
        name: b.name,
        altitude: hor.altitude,
        azimuth: hor.azimuth,
        distAu: eq.dist,
        visible: hor.altitude > -0.5,
      });
    } catch {
      /* skip bodies astronomy-engine cannot resolve */
    }
  }
  return out.sort((a, z) => z.altitude - a.altitude);
}

export function formatAu(au: number): string {
  if (au < 0.002) return `${Math.round(au * 384_400).toLocaleString()} km`;
  return `${au.toFixed(3)} AU`;
}

export function lightMinutes(au: number): string {
  const min = au * 8.316746;
  if (min < 1) return `${(min * 60).toFixed(1)} s`;
  return `${min.toFixed(1)} min`;
}
