import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Compass, Crosshair, LocateFixed, Move, RefreshCcw } from "lucide-react";
import { computeSky, formatAu, lightMinutes, type ObserverState, type SkyPoint } from "@/lib/sky";

export const Route = createFileRoute("/ar")({
  head: () => ({
    meta: [
      { title: "Flight Ops / AR Sky — Cosmos OS" },
      {
        name: "description",
        content:
          "Point your device at the sky to see the real positions of every planet, computed live from your location and orientation.",
      },
      { property: "og:title", content: "Flight Ops — AR Sky | Cosmos OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FlightOps,
});

const OBSERVER_KEY = "cosmos-os.observer.v1";

function loadObserver(): ObserverState {
  if (typeof window === "undefined") return { latitude: 28.5, longitude: -81.5, height: 10 };
  try {
    const raw = window.localStorage.getItem(OBSERVER_KEY);
    if (raw) return JSON.parse(raw) as ObserverState;
  } catch {
    /* ignore */
  }
  return { latitude: 28.5, longitude: -81.5, height: 10 };
}

function FlightOps() {
  const [observer, setObserver] = useState<ObserverState>(loadObserver);
  const [now, setNow] = useState<Date>(() => new Date());
  const [viewAz, setViewAz] = useState(0);
  const [viewAlt, setViewAlt] = useState(20);
  const [gyro, setGyro] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });
  const [locating, setLocating] = useState(false);

  const sky = useMemo(() => computeSky(now, observer), [now, observer]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha != null) setViewAz(e.alpha);
      if (e.beta != null) setViewAlt(Math.max(-45, Math.min(85, 90 - e.beta)));
    };
    window.addEventListener("deviceorientation", onOrient);
    setGyro(true);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, []);

  const requestGyro = async () => {
    const D = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof D?.requestPermission === "function") {
      const res = await D.requestPermission();
      if (res !== "granted") return;
    }
    setGyro(true);
  };

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const o = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          height: pos.coords.altitude ?? 0,
        };
        setObserver(o);
        try {
          window.localStorage.setItem(OBSERVER_KEY, JSON.stringify(o));
        } catch {
          /* ignore */
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setViewAz((a) => (a - dx * 0.35 + 360) % 360);
    setViewAlt((a) => Math.max(-45, Math.min(85, a + dy * 0.35)));
  };
  const onPointerUp = () => setDragging(false);

  const scale = 9;

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_20%,#0d1b33,transparent_70%),radial-gradient(circle_at_70%_30%,rgba(79,209,255,0.08),transparent_45%)]" />

      <div className="pointer-events-none absolute inset-x-0 top-[38%] h-px bg-border/40" />

      {/* sky points */}
      <div
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {sky.map((p) => {
          const relAz = ((p.azimuth - viewAz + 540) % 360) - 180;
          const relAlt = p.altitude - viewAlt;
          if (Math.abs(relAz) > 100 || relAlt < -30) return null;
          const x = (relAz * scale) / 2;
          const y = -relAlt * scale;
          return <SkyDot key={p.bodyId} p={p} x={x} y={y} />;
        })}
      </div>

      {/* horizon reticle */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
        <Crosshair className="h-8 w-8 text-primary/50" />
      </div>

      {/* heading tape */}
      <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-glass-edge bg-background/40 px-4 py-2 backdrop-blur-2xl">
          <Compass className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm tabular-nums">{Math.round(viewAz)}°</span>
          <span className="label-tele">heading</span>
          <span className="mx-2 h-4 w-px bg-border" />
          <span className="font-mono text-sm tabular-nums">{Math.round(viewAlt)}°</span>
          <span className="label-tele">alt</span>
        </div>
      </div>

      {/* header */}
      <div className="pointer-events-auto absolute left-6 top-6 z-10">
        <div className="label-tele text-primary">Flight Ops · AR sky overlay</div>
        <h1 className="mt-1 font-display text-2xl font-semibold">Point the way</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Real planet positions for your location and time. Drag to look around, or enable device
          orientation on mobile.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={requestGyro}
            disabled={gyro}
            className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <Move className="h-3.5 w-3.5" /> {gyro ? "Gyro enabled" : "Enable device orientation"}
          </button>
          <button
            onClick={locate}
            className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <LocateFixed className={`h-3.5 w-3.5 ${locating ? "animate-spin" : ""}`} /> Use my
            location
          </button>
          <button
            onClick={() => setNow(new Date())}
            className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* observer readout */}
      <div className="pointer-events-none absolute right-6 top-6 z-10 hidden text-right md:block">
        <div className="label-tele">Observer</div>
        <div className="mt-1 font-mono text-sm">
          {observer.latitude.toFixed(2)}° , {observer.longitude.toFixed(2)}°
        </div>
        <div className="label-tele mt-1 text-[9px]">{now.toLocaleString()}</div>
      </div>

      {/* sky list */}
      <div className="absolute bottom-6 left-6 z-10 hidden w-72 lg:block">
        <div className="panel max-h-[38vh] overflow-y-auto p-4">
          <div className="label-tele mb-3">Sky catalogue</div>
          <div className="space-y-1">
            {sky.map((p) => (
              <div
                key={p.bodyId}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: p.visible ? "var(--primary)" : "var(--muted-foreground)" }}
                  />
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="label-tele text-[9px]">
                  {formatAu(p.distAu)} · {lightMinutes(p.distAu)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkyDot({ p, x, y }: { p: SkyPoint; x: number; y: number }) {
  const size = p.name === "Sun" ? 26 : p.name === "Moon" ? 18 : 12;
  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(38% + ${y}px)`,
        opacity: p.visible ? 1 : 0.35,
      }}
    >
      <span
        className="block rounded-full"
        style={{
          width: size,
          height: size,
          background: p.visible ? "var(--primary)" : "var(--muted-foreground)",
          boxShadow: p.visible
            ? "0 0 18px 4px color-mix(in oklab, var(--primary) 45%, transparent)"
            : "none",
        }}
      />
      <div className="label-tele mt-1.5 whitespace-nowrap text-center text-[9px]">
        {p.name}
        <span className="block text-muted-foreground">
          az {Math.round(p.azimuth)}° · alt {Math.round(p.altitude)}°
        </span>
      </div>
    </div>
  );
}
