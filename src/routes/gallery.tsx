import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { BODIES } from "@/data/bodies";
import { MISSIONS } from "@/data/missions";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Imaging Library — Cosmos OS" },
      {
        name: "description",
        content:
          "A filterable imaging library of planetary surfaces and mission observations with AI-generated scientific descriptions.",
      },
      { property: "og:title", content: "Imaging Library — Cosmos OS" },
      { property: "og:description", content: "Filter planetary imaging products by body, mission and year." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gallery,
});

const ITEMS = BODIES.flatMap((b, bi) =>
  b.landmarks.map((l, li) => {
    const mission = MISSIONS.find((m) => m.target === b.id);
    return {
      id: `${b.id}-${li}`,
      title: l.name,
      body: b.name,
      bodyId: b.id,
      palette: b.palette,
      mission: mission?.name ?? "Orbital survey",
      spacecraft: mission?.agency ?? "Multi-agency",
      year: (mission?.year ?? 2004) + li,
      description: `${l.note}. Imaging product reconstructed from ${b.name} orbital datasets; ${l.kind} morphology at ${l.lat}°, ${l.lon}°.`,
      span: (bi + li) % 5 === 0 ? "row-span-2" : "",
    };
  }),
);

function Gallery() {
  const [body, setBody] = useState<string>("all");
  const filtered = ITEMS.filter((i) => body === "all" || i.bodyId === body);

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <div className="label-tele">Imaging library</div>
      <h1 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold">Surface observation archive</h1>

      <div className="mt-8 flex flex-wrap gap-2">
        {[["all", "All bodies"], ...BODIES.map((b) => [b.id, b.name] as [string, string])].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setBody(id!)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              body === id ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-10 grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item, i) => (
          <motion.figure
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (i % 8) * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`panel lift group relative overflow-hidden ${item.span}`}
          >
            <div
              className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
              style={{
                background: `radial-gradient(circle at 30% 25%, ${item.palette.high}, ${item.palette.mid} 45%, ${item.palette.low} 100%)`,
                opacity: 0.85,
              }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--background),transparent_65%)]" />
            <figcaption className="absolute inset-x-0 bottom-0 p-5">
              <div className="label-tele">{item.body} · {item.year}</div>
              <div className="mt-1 font-display text-lg font-medium">{item.title}</div>
              <p className="mt-2 max-h-0 overflow-hidden text-xs leading-relaxed text-muted-foreground opacity-0 transition-all duration-500 group-hover:max-h-32 group-hover:opacity-100">
                {item.description}
              </p>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </div>
  );
}
