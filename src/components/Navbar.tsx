import { Link, useRouterState } from "@tanstack/react-router";
import { Github, Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [light, setLight] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = crumbPath(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-border bg-background/80 backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-6">
          <Link to="/" className="group flex items-center gap-3">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inset-0 rounded-lg border border-primary/40" />
              <span className="absolute inset-0 rounded-lg bg-primary/10 blur-[6px] transition-all group-hover:bg-primary/25" />
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
                className="relative rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground after:absolute after:inset-x-2 after:-bottom-0.5 after:h-px after:bg-primary after:opacity-0 after:transition-opacity after:content-[''] data-[status=active]:text-foreground data-[status=active]:after:opacity-100"
              >
                {item.label}
              </Link>
            ))}
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
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
            <AmbientAudio />
            <button
              onClick={() => setLight((v) => !v)}
              aria-label="Toggle laboratory light mode"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <Link
              to="/ar"
              className="hidden h-9 items-center gap-2 rounded-full border border-border pl-1 pr-3 transition-colors hover:border-primary/50 sm:flex"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                AR
              </span>
              <span className="label-tele text-[10px]">Flight Ops</span>
            </Link>
            <button
              onClick={() => setMobile((v) => !v)}
              aria-label="Toggle navigation"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground lg:hidden"
            >
              {mobile ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* breadcrumb / system status strip */}
        <div
          className={`hidden overflow-hidden border-t transition-all duration-500 md:block ${
            scrolled ? "max-h-8 border-border/70" : "max-h-0 border-transparent"
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
              <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-secondary" />
              All subsystems nominal · Build 4.2.1
            </div>
          </div>
        </div>

        {mobile && (
          <div className="border-t border-border bg-background/95 px-6 py-4 backdrop-blur-xl lg:hidden">
            <div className="mb-4 md:hidden">
              <SearchTrigger onClick={() => setSearchOpen(true)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground data-[status=active]:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
