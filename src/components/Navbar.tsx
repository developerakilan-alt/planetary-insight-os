import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSession } from "@/lib/auth";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/explorer", label: "Explorer" },
  { to: "/research", label: "Research" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const user = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastY = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => setMobile(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div
        className={`liquid-bar relative mx-auto max-w-[1640px] overflow-hidden rounded-3xl border transition-all duration-500 ${
          scrolled ? "border-glass-edge-strong" : "border-glass-edge"
        }`}
        style={scrolled ? ({ boxShadow: "var(--shadow-glass-lg)" } as CSSProperties) : undefined}
      >
        {/* specular top edge */}
        <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <GlowingEffect spread={60} glow proximity={80} inactiveZone={0.01} />

        <div
          className={`relative grid grid-cols-[auto_1fr_auto] items-center gap-6 px-4 transition-all duration-300 sm:px-6 ${
            compact ? "h-14" : "h-[4.25rem]"
          }`}
        >
          {/* Logo — left column */}
          <div className="flex items-center">
            <HoverBorderGradient containerClassName="rounded-xl" className="rounded-xl">
              <Link to="/" className="group flex items-center gap-3 p-1">
                <span className="relative flex h-8 w-8 items-center justify-center">
                  <span className="absolute inset-0 rounded-xl border border-primary/40" />
                  <span className="absolute inset-0 rounded-xl bg-primary/10 blur-[6px] transition-all group-hover:bg-primary/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_2px_color-mix(in_oklab,var(--primary)_60%,transparent)]" />
                </span>
                <span className="font-display text-[15px] font-semibold tracking-[0.18em]">
                  COSMOS OS
                </span>
              </Link>
            </HoverBorderGradient>
          </div>

          {/* Nav links — center column */}
          <nav className="hidden items-center justify-center gap-1 lg:flex">
            {NAV.map((item) => (
              <HoverBorderGradient
                key={item.to}
                containerClassName="rounded-full"
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors data-[status=active]:text-foreground hover:text-foreground"
              >
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="relative flex items-center"
                >
                  {item.label}
                </Link>
              </HoverBorderGradient>
            ))}
          </nav>

          {/* Login / user — right column */}
          <div className="flex items-center justify-end gap-2">
            {mounted && user ? (
              <Link
                to="/login"
                className="glass-chip inline-flex h-9 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm text-foreground transition-colors hover:text-primary"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 bg-primary/15 font-display text-xs font-semibold text-primary">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-[8rem] truncate sm:inline">{user.name}</span>
              </Link>
            ) : (
              <HoverBorderGradient
                containerClassName="rounded-full"
                className="rounded-full px-4 py-2 text-sm font-medium text-foreground"
              >
                <Link
                  to="/login"
                  className="inline-flex h-9 items-center rounded-full bg-primary/15 px-4 text-sm font-medium text-foreground backdrop-blur-xl transition-colors hover:bg-primary/25"
                >
                  Log in
                </Link>
              </HoverBorderGradient>
            )}
            <button
              onClick={() => setMobile((v) => !v)}
              aria-label="Toggle navigation"
              className="glass-chip press flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground lg:hidden"
            >
              {mobile ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobile && (
          <div className="relative border-t border-glass-edge bg-background/70 px-6 py-4 backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="glass-chip rounded-lg px-3 py-2 text-sm text-muted-foreground data-[status=active]:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
