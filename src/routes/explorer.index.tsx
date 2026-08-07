import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { lazy, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { BODIES, type BodyId } from "@/data/bodies";

const SolarSystemScene = lazy(() => import("@/components/three/SolarSystemScene"));

export const Route = createFileRoute("/explorer/")({
  head: () => ({
    meta: [
      { title: "Planet Explorer — Cosmos OS" },
      {
        name: "description",
        content:
          "Navigate a live 3D solar system of nine bodies. Select any planet or moon to open its scientific dashboard.",
      },
      { property: "og:title", content: "Planet Explorer — Cosmos OS" },
      {
        property: "og:description",
        content: "A live 3D solar system with per-body scientific dashboards and AI terrain analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explorer,
});

function Explorer() {
  const navigate = useNavigate();
  const [focus, setFocus] = useState<BodyId | null>(null);

  const open = (id: BodyId) => navigate({ to: "/explorer/$body", params: { body: id } });

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
      <ClientOnly>
        <SolarSystemScene onSelect={open} focus={focus} />
      </ClientOnly>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,transparent_40%,var(--background)_100%)] opacity-70" />

      <div className="pointer-events-none absolute left-6 top-6 z-10 max-w-sm">
        <div className="label-tele">Orbital chart · Sol system</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Planet Explorer</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a body to open its dashboard, terrain analyzer and mission record.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4"
      >
        <div className="panel mx-auto flex max-w-[1600px] gap-2 overflow-x-auto p-2">
          {BODIES.map((b) => (
            <button
              key={b.id}
              onMouseEnter={() => setFocus(b.id)}
              onMouseLeave={() => setFocus(null)}
              onClick={() => open(b.id)}
              className="group min-w-40 flex-1 rounded-xl border border-transparent px-4 py-3 text-left transition-all hover:border-border-strong hover:bg-card/60"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{b.name}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="label-tele mt-1 text-[9px]">{b.designation}</div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
                <span
                  className="block h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, (b.radius / 1) * 100)}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
