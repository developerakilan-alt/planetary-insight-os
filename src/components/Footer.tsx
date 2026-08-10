import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border bg-background/80">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-sm font-semibold tracking-[0.2em]">COSMOS OS</div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            An AI-assisted planetary intelligence platform for mission planning, terrain analysis
            and comparative planetology.
          </p>
          <div className="label-tele mt-6 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-secondary" />
            All subsystems nominal · Build 4.2.1
          </div>
        </div>
        <div>
          <div className="label-tele mb-3">Platform</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/explorer" className="hover:text-foreground">
                Planet Explorer
              </Link>
            </li>
            <li>
              <Link to="/research" className="hover:text-foreground">
                Research Console
              </Link>
            </li>
            <li>
              <Link to="/missions" className="hover:text-foreground">
                Mission Archive
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="hover:text-foreground">
                Imaging Library
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="label-tele mb-3">Data sources</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>NASA PDS · Planetary Data System</li>
            <li>USGS Astrogeology</li>
            <li>ESA Planetary Science Archive</li>
            <li>JPL Horizons Ephemerides</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-6 py-5">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <p className="label-tele">© 2026 Cosmos OS — Research preview</p>
          <p className="label-tele">Values sourced from published planetary science literature</p>
        </div>
      </div>
    </footer>
  );
}
