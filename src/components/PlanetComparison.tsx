import { lazy, memo, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  ChevronDown,
  Clock3,
  Database,
  Droplets,
  Layers,
  Lightbulb,
  Mountain,
  Orbit,
  Plus,
  Ruler,
  Scale,
  Thermometer,
  Weight,
  Wind,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { BODIES, getBody, type Body, type BodyId } from "@/data/bodies";
import { PLANET_CONFIGS } from "@/data/planets/configs";
import { cn } from "@/lib/utils";

const ScientificGlobe = lazy(() => import("@/components/three/ScientificGlobe"));

const EARTH_GRAVITY = 9.81;
const EARTH_RADIUS_KM = 6371;
const EARTH_MASS_KG = 5.972e24;

const SLOT_ACCENTS = ["#38BDF8", "#FF6B4A", "#9B8CFF", "#7EF9C6"];
const MAX_SLOTS = 4;

const SUP_DIGITS: Record<string, string> = {
  "0": "\u2070",
  "1": "\u00B9",
  "2": "\u00B2",
  "3": "\u00B3",
  "4": "\u2074",
  "5": "\u2075",
  "6": "\u2076",
  "7": "\u2077",
  "8": "\u2078",
  "9": "\u2079",
  "-": "\u207B",
};

function superscript(n: number): string {
  return String(n)
    .split("")
    .map((c) => SUP_DIGITS[c] ?? c)
    .join("");
}

function estimateEarthMasses(b: Body): number {
  return (b.metrics.gravity / EARTH_GRAVITY) * (b.metrics.radiusKm / EARTH_RADIUS_KM) ** 2;
}

function formatMassKg(b: Body): string {
  const kg = estimateEarthMasses(b) * EARTH_MASS_KG;
  const exp = Math.floor(Math.log10(kg));
  const mantissa = kg / 10 ** exp;
  return `${mantissa.toFixed(2)} \u00D7 10${superscript(exp)} kg`;
}

function dayLengthHours(b: Body): number {
  const s = b.metrics.dayLength;
  const h = s.match(/(\d+(?:\.\d+)?)\s*h/i);
  const m = s.match(/(\d+(?:\.\d+)?)\s*m\b/i);
  if (h) return parseFloat(h[1]!) + (m ? parseFloat(m[1]!) / 60 : 0);
  const d = s.match(/([\d.]+)\s*(?:Earth\s*)?days?/i);
  if (d) return parseFloat(d[1]!) * 24;
  const y = s.match(/([\d.]+)\s*years?/i);
  if (y) return parseFloat(y[1]!) * 24 * 365.25;
  return 24;
}

function yearLengthDays(b: Body): number {
  const s = b.metrics.orbitalPeriod;
  const d = s.match(/([\d.]+)\s*(?:Earth\s*)?days?/i);
  if (d) return parseFloat(d[1]!);
  const y = s.match(/([\d.]+)\s*years?/i);
  if (y) return parseFloat(y[1]!) * 365.25;
  return 365;
}

function clamp01(v: number): number {
  return Math.max(0.04, Math.min(1, v));
}

function tempShare(b: Body): number {
  const avg = (b.metrics.tempC[0] + b.metrics.tempC[1]) / 2;
  return clamp01((avg + 240) / 520);
}

function pressureShare(b: Body): number {
  const log = Math.log10(Math.max(b.metrics.pressureBar, 1e-15));
  return clamp01((log + 15) / 17.5);
}

function buildQuickFact(a: Body, b: Body): string {
  if (a.id === b.id) {
    return `${a.name} \u2014 ${a.summary}`;
  }
  const hi = a.metrics.gravity >= b.metrics.gravity ? a : b;
  const lo = a.metrics.gravity >= b.metrics.gravity ? b : a;
  const pct = Math.round((lo.metrics.gravity / hi.metrics.gravity) * 100);
  return `${lo.name} has about ${pct}% of ${hi.name}'s gravity (${lo.metrics.gravity} vs ${hi.metrics.gravity} m/s\u00B2) \u2014 you would weigh far less standing on ${lo.name}.`;
}

interface RowDef {
  key: string;
  label: string;
  icon: LucideIcon;
  display: (b: Body) => string;
  share?: (b: Body) => number;
  hint?: (b: Body) => string | undefined;
}

const ROWS: RowDef[] = [
  {
    key: "gravity",
    label: "Gravity",
    icon: Scale,
    display: (b) => `${(b.metrics.gravity / EARTH_GRAVITY).toFixed(2)} g`,
    share: (b) => clamp01(b.metrics.gravity / 25),
  },
  {
    key: "diameter",
    label: "Diameter",
    icon: Ruler,
    display: (b) => `${(b.metrics.radiusKm * 2).toLocaleString()} km`,
    share: (b) => clamp01((b.metrics.radiusKm * 2) / 140000),
  },
  {
    key: "mass",
    label: "Mass",
    icon: Weight,
    display: (b) => formatMassKg(b),
    share: (b) => clamp01(estimateEarthMasses(b) / 320),
    hint: (b) =>
      `Estimated from surface gravity and radius (M \u221D g\u00B7R\u00B2) \u2014 ${estimateEarthMasses(b) >= 100 ? Math.round(estimateEarthMasses(b)) : estimateEarthMasses(b).toFixed(3)} \u00D7 Earth`,
  },
  {
    key: "temperature",
    label: "Temperature (Avg)",
    icon: Thermometer,
    display: (b) => `${Math.round((b.metrics.tempC[0] + b.metrics.tempC[1]) / 2)} \u00B0C`,
    share: tempShare,
  },
  {
    key: "atmosphere",
    label: "Atmosphere",
    icon: Wind,
    display: (b) => b.metrics.atmosphere,
    share: pressureShare,
  },
  {
    key: "day",
    label: "Day Length",
    icon: Clock3,
    display: (b) => b.metrics.dayLength,
    share: (b) => clamp01(dayLengthHours(b) / 4300),
  },
  {
    key: "year",
    label: "Year Length",
    icon: Orbit,
    display: (b) => b.metrics.orbitalPeriod,
    share: (b) => clamp01(yearLengthDays(b) / 91000),
  },
  {
    key: "surface",
    label: "Surface Composition",
    icon: Layers,
    display: (b) => b.metrics.surface,
  },
  {
    key: "water",
    label: "Water",
    icon: Droplets,
    display: (b) => b.metrics.water,
  },
  {
    key: "terrain",
    label: "Terrain",
    icon: Mountain,
    display: (b) => b.classification,
  },
];

export function PlanetThumb({
  body,
  size = 56,
  className,
}: {
  body: Body;
  size?: number;
  className?: string;
}) {
  const p = body.palette;
  const cloudLayer =
    body.clouds > 0.4
      ? `radial-gradient(circle at 62% 68%, rgba(255,255,255,0.34) 0%, transparent 34%), radial-gradient(circle at 24% 74%, rgba(255,255,255,0.22) 0%, transparent 30%), `
      : "";
  return (
    <span
      aria-hidden
      className={cn("relative inline-block shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: `${cloudLayer}radial-gradient(circle at 31% 27%, ${p.high} 0%, ${p.mid} 46%, ${p.low} 88%)`,
        boxShadow: [
          `inset ${-size * 0.16}px ${-size * 0.1}px ${size * 0.32}px rgba(0,0,0,0.78)`,
          `inset ${size * 0.05}px ${size * 0.06}px ${size * 0.22}px rgba(255,255,255,0.3)`,
          `0 0 ${size * 0.5}px ${-size * 0.1}px ${p.atmosphere}`,
        ].join(", "),
      }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 33% 26%, rgba(255,255,255,0.5), transparent 42%)",
          mixBlendMode: "screen",
        }}
      />
    </span>
  );
}

function StarSpecks({ count = 26 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${((Math.sin(i * 12.9898) * 43758.5453) % 1) * 50 + 50}%`.replace("-", ""),
        top: `${Math.abs((Math.sin(i * 78.233) * 12345.6789) % 1) * 100}%`,
        size: 1 + ((i * 7) % 3) * 0.6,
        delay: (i % 9) * 0.55,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white/70"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animation: `pulse-ring 3.6s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function PlanetSelector({
  body,
  accent,
  takenIds,
  onPick,
  onRemove,
  removable,
  pickLabel,
}: {
  body: Body;
  accent: string;
  takenIds: BodyId[];
  onPick: (id: BodyId) => void;
  onRemove?: () => void;
  removable?: boolean;
  pickLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options = BODIES.filter((b) => !takenIds.includes(b.id));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="group relative flex w-full items-center gap-4 overflow-visible rounded-2xl border border-glass-edge bg-glass-fill p-4 pr-4 text-left backdrop-blur-xl transition-all duration-300 hover:border-glass-edge-strong sm:gap-5 sm:p-5"
        style={{ boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.08)` }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `inset 0 1px 0 0 rgba(255,255,255,0.1), 0 0 44px -12px ${accent}59`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `inset 0 1px 0 0 rgba(255,255,255,0.08)`;
        }}
      >
        <motion.span
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
          className="shrink-0"
        >
          <PlanetThumb body={body} size={58} />
        </motion.span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-lg font-semibold tracking-tight text-[#F5F7FA] sm:text-xl">
            {body.name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-[#9AA6B2]">
            {body.classification}
          </span>
        </span>
        {removable && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Remove ${body.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onRemove?.();
              }
            }}
            className="shrink-0 rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.985 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            role="listbox"
            aria-label={`${pickLabel} \u2014 choose a world`}
            className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-glass-edge-strong bg-popover p-1.5 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <div className="label-tele sticky top-0 bg-popover/90 px-3 py-2 text-[9px] backdrop-blur">
              Select a world
            </div>
            {options.map((b) => (
              <button
                key={b.id}
                role="option"
                aria-selected={b.id === body.id}
                onClick={() => {
                  onPick(b.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5",
                  b.id === body.id && "bg-primary/10",
                )}
              >
                <PlanetThumb body={b} size={26} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{b.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {b.classification}
                  </span>
                </span>
                <span className="label-tele shrink-0 text-[9px]">{b.designation}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MemoSelector = memo(PlanetSelector);

function ComparisonCell({ body, row, accent }: { body: Body; row: RowDef; accent: string }) {
  const share = row.share ? row.share(body) : null;
  return (
    <td className="px-4 py-4 align-top sm:px-5 sm:py-5">
      <div className="font-mono text-[13px] leading-snug text-[#F5F7FA]">{row.display(body)}</div>
      <div className="mt-2.5 h-1 w-full max-w-44 overflow-hidden rounded-full bg-white/[0.07]">
        <motion.span
          className="block h-full rounded-full"
          style={{
            background:
              share === null ? `linear-gradient(90deg, ${accent}40, ${accent}22)` : accent,
            boxShadow: share === null ? "none" : `0 0 10px -1px ${accent}80`,
          }}
          initial={{ width: 0 }}
          animate={{ width: share === null ? "58%" : `${share * 100}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {row.hint && (
        <div className="label-tele mt-1.5 text-[8px] leading-relaxed normal-case tracking-normal text-muted-foreground/80">
          {row.hint(body)}
        </div>
      )}
    </td>
  );
}

function VisualPanel({ planets }: { planets: Body[] }) {
  const featured = planets.slice(0, 2);
  return (
    <div className="panel relative flex flex-col gap-6 overflow-hidden p-5">
      <StarSpecks />
      {featured.map((b, i) => (
        <motion.div
          key={b.id}
          animate={{ y: [0, -5, 0] }}
          transition={{
            repeat: Infinity,
            duration: 7 + i * 1.4,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
          className="relative h-52 overflow-hidden rounded-2xl border border-glass-edge bg-[#01040c]/80"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background: `radial-gradient(80% 60% at 50% 110%, ${b.palette.atmosphere}2e, transparent 70%)`,
            }}
          />
          <ClientOnly
            fallback={
              <div className="absolute inset-0 grid place-items-center">
                <PlanetThumb body={b} size={104} />
              </div>
            }
          >
            <ScientificGlobe
              config={PLANET_CONFIGS[b.id]}
              body={b}
              options={{
                quality: "low",
                mode: "natural",
                rotation: "fast",
                atmosphere: true,
                clouds: true,
                exaggeration: 1,
                lighting: "sun",
              }}
              maxDpr={1.3}
            />
          </ClientOnly>
          <div className="pointer-events-none absolute left-4 top-4">
            <div className="label-tele">{b.designation}</div>
            <div className="font-display text-lg font-semibold text-[#F5F7FA]">{b.name}</div>
          </div>
        </motion.div>
      ))}

      <div className="relative rounded-2xl border border-glass-edge bg-glass-fill p-4">
        <div className="label-tele flex items-center gap-2 text-[10px]">
          <Lightbulb className="h-3.5 w-3.5 text-primary" /> Quick fact
        </div>
        <p className="mt-2.5 text-[13px] leading-relaxed text-[#C7D0DA]">
          {buildQuickFact(featured[0]!, featured[1] ?? featured[0]!)}
        </p>
      </div>
    </div>
  );
}

export function PlanetComparison({
  initialA = "earth",
  initialB = "mars",
}: {
  initialA?: BodyId | null;
  initialB?: BodyId | null;
}) {
  const [slots, setSlots] = useState<[BodyId, BodyId]>([
    getBody(initialA ?? "earth") ? (initialA as BodyId) : "earth",
    getBody(initialB ?? "mars") ? (initialB as BodyId) : "mars",
  ]);
  const [extras, setExtras] = useState<BodyId[]>([]);
  const [swapTick, setSwapTick] = useState(0);

  const allIds = [...slots, ...extras];
  const planets = allIds.map((id) => getBody(id)).filter((b): b is Body => Boolean(b));

  const accentOf = (id: BodyId) => SLOT_ACCENTS[allIds.indexOf(id) % SLOT_ACCENTS.length]!;
  const takenExcept = (self: BodyId) => allIds.filter((id) => id !== self);

  const swap = () => {
    setSlots(([a, b]) => [b, a]);
    setSwapTick((t) => t + 1);
  };

  const addPlanet = () => {
    if (allIds.length >= MAX_SLOTS) return;
    const candidate = BODIES.find((b) => !allIds.includes(b.id));
    if (!candidate) return;
    setExtras((e) => [...e, candidate.id]);
  };

  const removeExtra = (id: BodyId) => setExtras((e) => e.filter((x) => x !== id));

  return (
    <div className="relative space-y-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-16 h-64 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(60% 100% at 20% 0%, rgba(56,189,248,0.09), transparent 65%), radial-gradient(60% 100% at 80% 0%, rgba(255,107,74,0.07), transparent 65%)",
        }}
      />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-end justify-between gap-5"
      >
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-[#F5F7FA] md:text-[2.75rem]">
            Planet Comparison
          </h1>
          <p className="mt-2 text-sm text-[#9AA6B2]">
            Compare planetary characteristics side by side
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={swap}
            className="glass-chip press inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-[#F5F7FA]"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" /> Swap
          </button>
          <button
            type="button"
            onClick={addPlanet}
            disabled={allIds.length >= MAX_SLOTS}
            className="press inline-flex items-center gap-2 rounded-full border border-glass-edge-strong bg-glass-fill px-4 py-2 text-xs font-medium text-[#F5F7FA] backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:bg-glass-fill-strong hover:shadow-[0_0_34px_-10px_rgba(56,189,248,0.6)] disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add Planet
          </button>
        </div>
      </motion.header>

      {/* Selectors */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <motion.div layout transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
            <MemoSelector
              body={getBody(slots[0])!}
              accent={accentOf(slots[0])}
              takenIds={takenExcept(slots[0])}
              onPick={(id) => setSlots(([, b]) => [id, b])}
              pickLabel={`Slot A (key ${swapTick})`}
            />
          </motion.div>

          <div className="flex items-center justify-center" aria-hidden>
            <span className="label-tele flex h-12 w-12 items-center justify-center rounded-full border border-glass-edge-strong bg-glass-fill text-[11px] text-[#9AA6B2] backdrop-blur-xl">
              VS
            </span>
          </div>

          <motion.div layout transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
            <MemoSelector
              body={getBody(slots[1])!}
              accent={accentOf(slots[1])}
              takenIds={takenExcept(slots[1])}
              onPick={(id) => setSlots(([a]) => [a, id])}
              pickLabel="Slot B"
            />
          </motion.div>
        </div>

        {extras.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {extras.map((id) => (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <MemoSelector
                  body={getBody(id)!}
                  accent={accentOf(id)}
                  takenIds={takenExcept(id)}
                  onPick={(next) => setExtras((e) => e.map((x) => (x === id ? next : x)))}
                  onRemove={() => removeExtra(id)}
                  removable
                  pickLabel={`Extra slot \u2014 ${getBody(id)?.name ?? ""}`}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Table + visualization */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="overflow-hidden rounded-2xl border border-glass-edge bg-white/[0.03] backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="label-tele px-4 pb-4 pt-5 text-[10px] sm:px-5">Parameter</th>
                  {planets.map((p) => (
                    <th
                      key={p.id}
                      className="px-4 pb-4 pt-5 text-[11px] font-semibold uppercase tracking-[0.18em] sm:px-5"
                      style={{
                        color: accentOf(p.id),
                        borderLeft: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, ri) => {
                  const Icon = row.icon;
                  return (
                    <tr
                      key={row.key}
                      className={ri < ROWS.length - 1 ? "border-b border-white/[0.06]" : undefined}
                    >
                      <td className="px-4 py-4 align-middle sm:px-5 sm:py-5">
                        <span className="flex items-center gap-2.5 whitespace-nowrap text-sm text-[#C7D0DA]">
                          <Icon className="h-3.5 w-3.5 text-[#9AA6B2]" strokeWidth={1.75} />
                          {row.label}
                        </span>
                      </td>
                      {planets.map((p) => (
                        <ComparisonCell
                          key={`${p.id}:${row.key}`}
                          body={p}
                          row={row}
                          accent={accentOf(p.id)}
                        />
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <VisualPanel planets={planets} />
      </motion.section>

      {/* Data source */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.24 }}
        className="label-tele flex items-start gap-2 text-[9px] leading-relaxed text-muted-foreground"
      >
        <Database className="mt-0.5 h-3 w-3 shrink-0" />
        <span>
          Physical parameters from published NASA / JPL / USGS planetary fact sheets. Masses are
          estimated from surface gravity and radius (M \u221D g\u00B7R\u00B2) in kilograms.
          Atmospheric profiles are representative compositions at the 1-bar level where defined.
        </span>
      </motion.footer>
    </div>
  );
}
