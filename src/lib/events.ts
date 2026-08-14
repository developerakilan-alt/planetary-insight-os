import {
  Body,
  EclipticLongitude,
  NextGlobalSolarEclipse,
  NextLunarEclipse,
  NextMoonQuarter,
  SearchGlobalSolarEclipse,
  SearchLunarEclipse,
  SearchMoonQuarter,
  Seasons,
  SunPosition,
  type GlobalSolarEclipseInfo,
  type LunarEclipseInfo,
  type MoonQuarter,
} from "astronomy-engine";
import { BODIES, type BodyId } from "@/data/bodies";

/**
 * Celestial events engine. Computes real upcoming events from
 * astronomy-engine ephemerides: solar/lunar eclipses, moon quarters,
 * equinoxes/solstices, planetary oppositions & conjunctions — plus the
 * fixed annual meteor-shower calendar.
 */

export type EventKind =
  | "solar-eclipse"
  | "lunar-eclipse"
  | "moon-phase"
  | "season"
  | "opposition"
  | "conjunction"
  | "meteor-shower";

export interface CelestialEvent {
  id: string;
  kind: EventKind;
  title: string;
  /** body name when the event involves a specific world */
  body?: string;
  date: Date;
  description: string;
  magnitude?: number;
}

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
};

const METEOR_SHOWERS: { name: string; peak: [number, number]; rate: number; radiant: string }[] = [
  { name: "Quadrantids", peak: [1, 3], rate: 110, radiant: "Boötes" },
  { name: "Lyrids", peak: [4, 22], rate: 18, radiant: "Lyra" },
  { name: "Eta Aquariids", peak: [5, 5], rate: 50, radiant: "Aquarius" },
  { name: "Perseids", peak: [8, 12], rate: 100, radiant: "Perseus" },
  { name: "Orionids", peak: [10, 21], rate: 20, radiant: "Orion" },
  { name: "Leonids", peak: [11, 17], rate: 15, radiant: "Leo" },
  { name: "Geminids", peak: [12, 14], rate: 120, radiant: "Gemini" },
  { name: "Ursids", peak: [12, 22], rate: 10, radiant: "Ursa Minor" },
];

const DEG = Math.PI / 180;

function normalizeDeg(d: number): number {
  let v = d % 360;
  if (v < 0) v += 360;
  return v;
}

function diffDeg(a: number, b: number): number {
  let d = normalizeDeg(a) - normalizeDeg(b);
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

const OUTER_PLANETS: BodyId[] = ["mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
const INNER_PLANETS: BodyId[] = ["mercury", "venus"];

function planetOppositionConjunctions(from: Date, days: number, out: CelestialEvent[]) {
  const stepDays = 1.5;
  const targets = [
    ...OUTER_PLANETS.map((id) => ({ id, target: 180, label: "opposition" as const })),
    ...INNER_PLANETS.flatMap((id) => [
      { id, target: 0, label: "inferior conjunction" as const },
      { id, target: 180, label: "superior conjunction" as const },
    ]),
  ];

  for (const { id, target, label } of targets) {
    const body = EPHEMERIS_BODY[id];
    if (!body) continue;
    let prevDiff = NaN;
    for (let d = -1; d <= days; d += stepDays) {
      const t = new Date(from.getTime() + d * 86400000);
      const planetLon = EclipticLongitude(body, t);
      const sunLon = SunPosition(t).elon;
      const rel = diffDeg(planetLon - sunLon, target);
      if (!Number.isNaN(prevDiff) && prevDiff <= 0 && rel > 0) {
        const approx = new Date(t.getTime() - stepDays * 86400000);
        const refined = refineEvent(approx, target, body);
        if (refined) {
          const b = BODIES.find((x) => x.id === id)!;
          out.push({
            id: `${id}-${label}-${refined.getTime()}`,
            kind: label === "opposition" ? "opposition" : "conjunction",
            title: label === "opposition" ? `${b.name} at opposition` : `${b.name} at ${label}`,
            body: b.name,
            date: refined,
            description:
              label === "opposition"
                ? `The planet reaches its closest approach to Earth and is brightest in the night sky.`
                : `The planet passes near the Sun as seen from Earth — hidden in solar glare.`,
          });
        }
      }
      prevDiff = rel;
    }
  }
}

function refineEvent(approx: Date, target: number, body: Body): Date | null {
  let lo = approx.getTime();
  let hi = lo + 3 * 86400000;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const d = diffDeg(
      EclipticLongitude(body, new Date(mid)) - SunPosition(new Date(mid)).elon,
      target,
    );
    if (Math.abs(d) < 1e-6) return new Date(mid);
    const dLo = diffDeg(
      EclipticLongitude(body, new Date(lo)) - SunPosition(new Date(lo)).elon,
      target,
    );
    if (dLo <= 0 && d > 0) hi = mid;
    else if (dLo > 0 && d <= 0) hi = mid;
    else lo = mid;
  }
  return new Date((lo + hi) / 2);
}

function eclipses(from: Date, days: number, out: CelestialEvent[]) {
  let lunar: LunarEclipseInfo = SearchLunarEclipse(from);
  let solar: GlobalSolarEclipseInfo = SearchGlobalSolarEclipse(from);
  const horizon = from.getTime() + days * 86400000;
  let guard = 0;

  while (guard++ < 12) {
    const t = new Date(lunar.peak.date);
    if (t.getTime() > horizon) break;
    out.push({
      id: `lunar-${t.getTime()}`,
      kind: "lunar-eclipse",
      title: `${lunar.kind} lunar eclipse`,
      date: t,
      description: `The Moon passes through Earth's shadow. Magnitude ${lunar.obscuration.toFixed(2)}.`,
      magnitude: lunar.obscuration,
    });
    lunar = NextLunarEclipse(lunar.peak);
  }

  guard = 0;
  while (guard++ < 12) {
    const t = new Date(solar.peak.date);
    if (t.getTime() > horizon) break;
    out.push({
      id: `solar-${t.getTime()}`,
      kind: "solar-eclipse",
      title: `${solar.kind} solar eclipse`,
      date: t,
      description:
        solar.kind === "total"
          ? "The Sun is fully obscured along a narrow path on Earth."
          : solar.kind === "annular"
            ? "The Moon passes in front of the Sun, leaving a bright ring."
            : "A partial eclipse — only part of the Sun is covered.",
    });
    solar = NextGlobalSolarEclipse(solar.peak);
  }
}

function moonPhases(from: Date, days: number, out: CelestialEvent[]) {
  const NAMES: Record<number, string> = {
    0: "New Moon",
    0.25: "First Quarter",
    0.5: "Full Moon",
    0.75: "Last Quarter",
  };
  let mq: MoonQuarter = SearchMoonQuarter(from);
  const horizon = from.getTime() + days * 86400000;
  let guard = 0;
  while (guard++ < 20) {
    const t = new Date(mq.time.date.getTime());
    if (t.getTime() > horizon) break;
    const name = NAMES[mq.quarter] ?? `Moon phase ${mq.quarter}`;
    out.push({
      id: `moon-${name}-${t.getTime()}`,
      kind: "moon-phase",
      title: name,
      body: "Moon",
      date: t,
      description:
        mq.quarter === 0.5
          ? "The Moon is fully illuminated as seen from Earth."
          : mq.quarter === 0
            ? "The Moon lies between Earth and the Sun — dark skies, ideal for deep-sky observing."
            : "Quarter phase — the terminator is ideal for crater study.",
    });
    mq = NextMoonQuarter(mq);
  }
}

function seasons(from: Date, days: number, out: CelestialEvent[]) {
  const year = from.getFullYear();
  for (const y of [year - 1, year, year + 1]) {
    const s = Seasons(y);
    const entries = [
      { d: s.mar_equinox, name: "March equinox" },
      { d: s.jun_solstice, name: "June solstice" },
      { d: s.sep_equinox, name: "September equinox" },
      { d: s.dec_solstice, name: "December solstice" },
    ];
    for (const e of entries) {
      const t = new Date(e.d.date.getTime());
      if (t.getTime() < from.getTime() - 86400000 || t.getTime() > from.getTime() + days * 86400000)
        continue;
      out.push({
        id: `season-${e.name}-${t.getTime()}`,
        kind: "season",
        title: e.name,
        body: "Earth",
        date: t,
        description: "The Sun crosses a solstice/equinox point in the sky.",
      });
    }
  }
}

function meteorShowers(from: Date, days: number, out: CelestialEvent[]) {
  const year = from.getFullYear();
  for (const yearOffset of [0, 1]) {
    for (const s of METEOR_SHOWERS) {
      const peak = new Date(Date.UTC(year + yearOffset, s.peak[0] - 1, s.peak[1], 4));
      if (
        peak.getTime() < from.getTime() - 86400000 ||
        peak.getTime() > from.getTime() + days * 86400000
      )
        continue;
      out.push({
        id: `shower-${s.name}-${peak.getTime()}`,
        kind: "meteor-shower",
        title: `${s.name} meteor shower`,
        date: peak,
        description: `Peak zenithal hourly rate ≈ ${s.rate} meteors/hr from the radiant in ${s.radiant}.`,
        magnitude: s.rate,
      });
    }
  }
}

/** Compute all celestial events within `days` days of `from`, sorted by date. */
export function computeCelestialEvents(from = new Date(), days = 365): CelestialEvent[] {
  const out: CelestialEvent[] = [];
  eclipses(from, days, out);
  moonPhases(from, days, out);
  seasons(from, days, out);
  planetOppositionConjunctions(from, days, out);
  meteorShowers(from, days, out);
  return out
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((e) => ({ ...e, id: `${e.kind}-${e.date.getTime()}` }));
}

export function timeUntil(date: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
} {
  const diff = Math.max(0, date.getTime() - Date.now());
  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    done: diff === 0,
  };
}
