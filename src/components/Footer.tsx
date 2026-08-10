import { Link } from "@tanstack/react-router";

const PLATFORM = [
  { to: "/explorer", label: "Planet Explorer" },
  { to: "/research", label: "Research Console" },
  { to: "/missions", label: "Mission Archive" },
  { to: "/telemetry", label: "Live Telemetry" },
  { to: "/gallery", label: "Imaging Library" },
  { to: "/copilot", label: "AI Scientist" },
] as const;

const RESOURCES = [
  { to: "/about", label: "About the platform" },
  { to: "/ar", label: "Flight Operations (AR)" },
  { to: "/", label: "Release notes" },
] as const;

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border bg-background/80">
      <div className="mx-auto max-w-[1600px] px-6 py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-display text-sm font-semibold tracking-[0.2em]">COSMOS OS</div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              An AI-assisted planetary intelligence platform for mission planning, terrain analysis
              and comparative planetology.
            </p>
            <div className="label-tele mt-6 flex items-center gap-2 text-[9px]">
              <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-secondary" />
              All subsystems nominal · Build 4.2.1
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="label-tele mb-4 text-[9px] text-muted-foreground">Platform</div>
            <ul className="space-y-2.5 text-sm">
              {PLATFORM.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="label-tele mb-4 text-[9px] text-muted-foreground">Resources</div>
            <ul className="space-y-2.5 text-sm">
              {RESOURCES.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="label-tele mb-4 text-[9px] text-muted-foreground">Data sources</div>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>NASA PDS · Planetary Data System</li>
              <li>USGS Astrogeology</li>
              <li>ESA Planetary Science Archive</li>
              <li>JPL Horizons Ephemerides</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 py-5">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <p className="label-tele text-[9px]">© 2026 Cosmos OS — Research preview</p>
          <p className="label-tele text-[9px]">
            Values sourced from published planetary science literature
          </p>
        </div>
      </div>
    </footer>
  );
}
