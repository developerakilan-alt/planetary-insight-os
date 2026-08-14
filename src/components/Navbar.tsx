import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Github, Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { GlobalSearch, SearchTrigger } from "@/components/GlobalSearch";
import { AmbientAudio } from "@/components/AmbientAudio";
import { bodyMap } from "@/data/bodies";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/explorer", label: "Explorer" },
  { to: "/research", label: "Research" },
  { to: "/missions", label: "Missions" },
  { to: "/telemetry", label: "Telemetry" },
  { to: "/copilot", label: "AI Copilot" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
] as const;

const LABS: { to: string; label: string; hint: string }[] = [
  { to: "/events", label: "Events Calendar", hint: "Eclipses, phases, meteors" },
  { to: "/neo", label: "Asteroid Radar", hint: "NEO close approaches" },
  { to: "/exoplanets", label: "Exoplanets", hint: "Worlds beyond Sol" },
  { to: "/scale", label: "Scale Lab", hint: "Compare planet metrics" },
  { to: "/timemachine", label: "Time Machine", hint: "Replay epochs 1960–2050" },
  { to: "/satellites", label: "Satellites", hint: "Earth orbit traffic" },
  { to: "/weather", label: "Weather Station", hint: "Forecasts across Sol" },
  { to: "/colony", label: "Colony Planner", hint: "Terraforming simulator" },
  { to: "/notebook", label: "Notebook", hint: "Field research log" },
  { to: "/command", label: "Command Center", hint: "Personal mission desk" },
];

/** Map a route path to breadcrumb segments, e.g. /explorer/mars → SYSTEM / EXPLORER / MARS. */
function crumbPath(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return ["SYSTEM", "OVERVIEW"];
  if (parts[0] === "explorer") {
    if (parts[1]) {
      const body = bodyMap[parts[1] as keyof typeof bodyMap];
      return ["SYSTEM", "EXPLORER", body?.name.toUpperCase() ?? "BODY"];
    }
    return ["SYSTEM", "EXPLORER"];
  }
  const label =
    parts[0] === "ar"
      ? "FLIGHT OPS"
      : parts[0] === "copilot"
        ? "AI COPILOT"
        : (parts[0] ?? "OVERVIEW").toUpperCase();
  return ["SYSTEM", label];
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [light, setLight] = useState(false);
  const [labsOpen, setLabsOpen] = useState(false);
  const labsRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const routeFailed = useRouterState({ select: (s) => s.matches.some((m) => m.error) });
  const crumbs = crumbPath(pathname);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      // shrink the bar while scrolling down, restore it on the way back up
      setCompact(y > 140 && y > lastY.current + 4);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onError = () => setDegraded(true);
    const onReject = () => setDegraded(true);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, []);

  useEffect(() => {
    if (degraded) return;
    if (routeFailed) setDegraded(true);
  }, [routeFailed, degraded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
  }, [light]);

  useEffect(() => setMobile(false), [pathname]);

  useEffect(() => setLabsOpen(false), [pathname]);

  useEffect(() => {
    if (!labsOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (labsRef.current && !labsRef.current.contains(e.target as Node)) setLabsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [labsOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <div
          className={`relative mx-auto max-w-[1640px] overflow-hidden rounded-3xl border backdrop-blur-2xl transition-all duration-500 ${
            scrolled ? "border-border bg-background/70" : "border-transparent bg-background/35"
          }`}
          style={scrolled ? ({ boxShadow: "var(--shadow-glass-lg)" } as CSSProperties) : undefined}
        >
          {/* specular top edge */}
          <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <div
            className={`relative flex items-center gap-6 px-4 transition-all duration-300 sm:px-6 ${
              compact ? "h-14" : "h-[4.25rem]"
            }`}
          >
            <Link to="/" className="group flex items-center gap-3">
              <span className="relative flex h-8 w-8 items-center justify-center">
                <span className="absolute inset-0 rounded-xl border border-primary/40" />
                <span className="absolute inset-0 rounded-xl bg-primary/10 blur-[6px] transition-all group-hover:bg-primary/25" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_2px_color-mix(in_oklab,var(--primary)_60%,transparent)]" />
              </span>
              <span className="font-display text-[15px] font-semibold tracking-[0.18em]">
                COSMOS OS
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="relative rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors data-[status=active]:bg-glass-fill-strong data-[status=active]:text-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div ref={labsRef} className="relative">
                <button
                  onClick={() => setLabsOpen((v) => !v)}
                  aria-expanded={labsOpen}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground ${
                    labsOpen ? "bg-glass-fill-strong text-foreground" : ""
                  }`}
                >
                  Labs
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${labsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {labsOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 grid w-[30rem] grid-cols-2 gap-1 rounded-2xl border border-glass-edge bg-background/95 p-2 shadow-2xl backdrop-blur-2xl">
                    {LABS.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to as never}
                        className="group rounded-xl px-3 py-2 transition-colors hover:bg-glass-fill-strong"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground/90 group-hover:text-primary">
                            {l.label}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-primary/50" />
                        </div>
                        <span className="label-tele text-[8px] text-muted-foreground">
                          {l.hint}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <div className="ml-auto hidden flex-1 justify-end md:flex">
              <SearchTrigger onClick={() => setSearchOpen(true)} />
            </div>

            <div className="ml-auto flex items-center gap-2 md:ml-0">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Open the source repository on GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-glass-edge bg-glass-fill text-muted-foreground transition-colors hover:border-glass-edge-strong hover:text-foreground"
              >
                <Github className="h-4 w-4" />
              </a>
              <AmbientAudio />
              <button
                onClick={() => setLight((v) => !v)}
                aria-label="Toggle laboratory light mode"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-glass-edge bg-glass-fill text-muted-foreground transition-colors hover:border-glass-edge-strong hover:text-foreground"
              >
                {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              <Link
                to="/ar"
                className="hidden h-9 items-center gap-2 rounded-full border border-glass-edge bg-glass-fill pl-1 pr-3 transition-colors hover:border-primary/50 sm:flex"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                  AR
                </span>
                <span className="label-tele text-[10px]">Flight Ops</span>
              </Link>
              <button
                onClick={() => setMobile((v) => !v)}
                aria-label="Toggle navigation"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-glass-edge bg-glass-fill text-muted-foreground lg:hidden"
              >
                {mobile ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* breadcrumb / system status strip */}
          <div
            className={`relative hidden overflow-hidden border-t transition-all duration-500 md:block ${
              scrolled && !compact ? "max-h-8 border-glass-edge" : "max-h-0 border-transparent"
            }`}
          >
            <div className="mx-auto flex h-8 max-w-[1600px] items-center justify-between px-6">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
                {crumbs.map((c, i) => (
                  <span key={c} className="flex items-center gap-1.5">
                    <span
                      className={`label-tele text-[9px] ${
                        i === crumbs.length - 1 ? "text-primary" : "text-muted-foreground/70"
                      }`}
                    >
                      {c}
                    </span>
                    {i < crumbs.length - 1 && <span className="text-muted-foreground/40">/</span>}
                  </span>
                ))}
              </nav>
              <div className="label-tele flex items-center gap-2 text-[9px]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    degraded ? "animate-pulse bg-warning" : "animate-pulse-ring bg-secondary"
                  }`}
                />
                {degraded
                  ? "Subsystem degraded · check error report"
                  : "All subsystems nominal · Build 4.3.0"}
              </div>
            </div>
          </div>

          {mobile && (
            <div className="relative border-t border-glass-edge bg-background/70 px-6 py-4 lg:hidden">
              <div className="mb-4 md:hidden">
                <SearchTrigger onClick={() => setSearchOpen(true)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-lg border border-glass-edge bg-glass-fill px-3 py-2 text-sm text-muted-foreground data-[status=active]:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="label-tele mt-5 mb-2 text-[9px] text-muted-foreground">
                LABS · EXPERIMENTAL INSTRUMENTS
              </div>
              <div className="grid grid-cols-2 gap-2">
                {LABS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    className="rounded-lg border border-glass-edge bg-glass-fill px-3 py-2 text-sm text-muted-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
