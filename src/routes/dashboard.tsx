import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Columns2,
  FlaskConical,
  GalleryHorizontalEnd,
  LayoutDashboard,
  Orbit,
  Radar,
  Radio,
  Rocket,
  Satellite,
  Telescope,
} from "lucide-react";
import { Sidebar, type SidebarLinkItem } from "@/components/ui/animated-sidebar";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { BODIES, type BodyId } from "@/data/bodies";
import { MISSIONS } from "@/data/missions";
import { fetchDsn } from "@/lib/tracking";
import { getItems } from "@/lib/saved";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Dashboard — Cosmos OS" },
      {
        name: "description",
        content:
          "Your mission-control desk: live DSN uplinks, archived missions, saved research and one-click access to every planetary instrument.",
      },
      { property: "og:title", content: "Command Dashboard — Cosmos OS" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DashboardPage,
});

const NAV_LINKS: SidebarLinkItem[] = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
  { label: "Explorer", href: "/explorer", icon: <Orbit className="h-4.5 w-4.5" /> },
  { label: "Comparison Lab", href: "/compare", icon: <Columns2 className="h-4.5 w-4.5" /> },
  { label: "Research Console", href: "/research", icon: <FlaskConical className="h-4.5 w-4.5" /> },
  { label: "Missions", href: "/missions", icon: <Rocket className="h-4.5 w-4.5" /> },
  { label: "Asteroid Radar", href: "/neo", icon: <Radar className="h-4.5 w-4.5" /> },
  { label: "Gallery", href: "/gallery", icon: <GalleryHorizontalEnd className="h-4.5 w-4.5" /> },
  { label: "Events", href: "/events", icon: <CalendarDays className="h-4.5 w-4.5" /> },
  { label: "Notebook", href: "/notebook", icon: <Bookmark className="h-4.5 w-4.5" /> },
];

function BrandMark({ expanded }: { expanded: boolean }) {
  return (
    <Link to="/dashboard" className="group flex items-center gap-2.5 overflow-hidden px-1 py-1">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10">
        <span className="absolute inset-0 rounded-xl bg-primary/10 blur-md transition-all group-hover:bg-primary/25" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_2px_color-mix(in_oklab,var(--primary)_60%,transparent)]" />
      </span>
      {expanded && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="whitespace-nowrap font-display text-[13px] font-semibold tracking-[0.18em]"
        >
          COSMOS OS
        </motion.span>
      )}
    </Link>
  );
}

function DashboardPage() {
  const [open, setOpen] = useState(true);

  const footer = (
    <Link
      to="/login"
      className="group flex items-center gap-3 overflow-hidden rounded-xl border border-transparent px-2 py-2 transition-all hover:border-glass-edge hover:bg-glass-fill-strong"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-glass-edge bg-glass-fill-strong font-display text-xs font-semibold text-primary">
        MC
      </span>
      {open && (
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">Mission Commander</span>
          <span className="label-tele block text-[9px]">Sign in · sync your library</span>
        </span>
      )}
    </Link>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1600px] items-start gap-4 px-4 pb-16 pt-24 lg:px-6">
      {/* Main dashboard — left side */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="min-w-0 flex-1 space-y-4"
      >
        <div className="panel relative overflow-hidden p-6 md:p-8">
          <GlowingEffect spread={50} glow proximity={70} inactiveZone={0.01} />
          <div className="leak-warm pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="label-tele flex items-center gap-2">
                <Satellite className="h-3.5 w-3.5 text-primary" /> Command deck · Sol system
              </div>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Commander Dashboard
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Live status of every instrument in the platform — worlds modelled, missions in
                flight and your saved research, all in one console.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/25"
              >
                <Columns2 className="h-3.5 w-3.5" /> Compare worlds
              </Link>
              <Link
                to="/explorer"
                className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Open Explorer <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <StatStrip />
        </div>

        <section className="panel p-6 md:p-8">
          <div className="label-tele flex items-center justify-between">
            <span>Quick launch · bodies</span>
            <Link to="/explorer" className="text-[10px] text-primary hover:text-foreground">
              OPEN EXPLORER →
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {BODIES.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to="/explorer/$body"
                  params={{ body: b.id as BodyId }}
                  className="lift group flex h-full flex-col items-start gap-3 rounded-xl border border-glass-edge bg-glass-fill p-3.5"
                >
                  <span
                    className="h-9 w-9 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `radial-gradient(circle at 32% 30%, ${b.palette.high}, ${b.palette.mid} 52%, ${b.palette.low} 100%)`,
                      boxShadow: `0 0 14px -3px ${b.palette.mid}`,
                    }}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{b.name}</span>
                    <span className="label-tele block text-[9px]">{b.designation}</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <MissionsPanel />
          <InstrumentsPanel />
        </div>
      </motion.div>

      {/* Navigation rail — right side */}
      <Sidebar
        open={open}
        setOpen={setOpen}
        links={NAV_LINKS}
        logo={<BrandMark expanded={open} />}
        footer={footer}
      />
    </div>
  );
}

function StatStrip() {
  const [dishes, setDishes] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDsn()
      .then((snap) => {
        if (!cancelled) setDishes(snap.dishes.length);
      })
      .catch(() => {
        if (!cancelled) setDishes(0);
      });
    try {
      setSaved(getItems().length);
    } catch {
      setSaved(0);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const activeMissions = MISSIONS.filter((m) => m.status === "active").length;

  const stats: { label: string; value: string | null; hint: string; icon: typeof Orbit }[] = [
    {
      label: "Bodies modelled",
      value: String(BODIES.length),
      hint: "NASA-derived surfaces",
      icon: Orbit,
    },
    {
      label: "Missions archived",
      value: String(MISSIONS.length),
      hint: `${activeMissions} currently active`,
      icon: Rocket,
    },
    {
      label: "DSN uplinks",
      value: dishes === null ? null : String(dishes),
      hint: "Live deep-space feed",
      icon: Radio,
    },
    {
      label: "Saved items",
      value: saved === null ? null : String(saved),
      hint: "Your library",
      icon: Bookmark,
    },
  ];

  return (
    <div className="relative mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-glass-edge bg-glass-fill p-4 backdrop-blur-xl"
        >
          <div className="label-tele flex items-center gap-1.5">
            <s.icon className="h-3 w-3 text-primary" /> {s.label}
          </div>
          <div className="mt-2 font-display text-3xl font-semibold tabular-nums">
            {s.value ?? "—"}
          </div>
          <div className="label-tele mt-1 text-[9px]">{s.hint}</div>
        </div>
      ))}
    </div>
  );
}

const STATUS_DOT: Record<string, string> = {
  active: "bg-secondary",
  planned: "bg-warning",
  complete: "bg-border-strong",
};

function MissionsPanel() {
  const featured = MISSIONS.filter((m) => m.status !== "complete").slice(0, 5);
  const list = featured.length > 0 ? featured : MISSIONS.slice(-5).reverse();

  return (
    <section className="panel p-6">
      <div className="label-tele flex items-center justify-between">
        <span>In flight &amp; upcoming</span>
        <Link to="/missions" className="text-[10px] text-primary hover:text-foreground">
          FULL ARCHIVE →
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {list.map((m) => (
          <Link
            key={m.id}
            to="/missions"
            search={{ mission: m.id }}
            className="group flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all hover:border-glass-edge hover:bg-glass-fill-strong"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{m.name}</span>
              <span className="label-tele block truncate text-[9px]">{m.targetLabel}</span>
            </span>
            <span className="label-tele flex shrink-0 items-center gap-2 text-[9px]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[m.status] ?? "bg-border-strong"}`}
              />
              {m.year}
              <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const INSTRUMENTS = [
  {
    to: "/compare",
    icon: Columns2,
    title: "Comparison Lab",
    body: "Line any two worlds up side by side across ten parameters.",
  },
  {
    to: "/weather",
    icon: Activity,
    title: "Weather Station",
    body: "Forecast conditions across every modelled surface.",
  },
  {
    to: "/satellites",
    icon: Satellite,
    title: "Satellite View",
    body: "Live Earth-orbit traffic, tracked in real time.",
  },
  {
    to: "/telemetry",
    icon: Telescope,
    title: "Telemetry",
    body: "System metrics and live spacecraft readouts.",
  },
] as const;

function InstrumentsPanel() {
  return (
    <section className="panel p-6">
      <div className="label-tele">Instrument shortcuts</div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {INSTRUMENTS.map((i) => (
          <Link
            key={i.title}
            to={i.to}
            className="lift group rounded-xl border border-glass-edge bg-glass-fill p-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
              <i.icon className="h-4 w-4" />
            </span>
            <span className="mt-3 block text-sm font-medium">{i.title}</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {i.body}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
