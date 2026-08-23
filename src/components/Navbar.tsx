import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/explorer", label: "Explorer" },
  { to: "/research", label: "Research" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [mobile, setMobile] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex h-9 items-center rounded-full border border-primary/40 bg-primary/15 px-4 text-sm font-medium text-foreground backdrop-blur-xl transition-colors hover:border-primary/60 hover:bg-primary/25"
            >
              Log in
            </Link>
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
