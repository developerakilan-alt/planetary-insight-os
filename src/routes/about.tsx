import { createFileRoute } from "@tanstack/react-router";
import { PageMasthead } from "@/components/PageMasthead";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Platform — Cosmos OS" },
      {
        name: "description",
        content:
          "How Cosmos OS is built: real-time procedural planetary rendering, published science datasets and an AI analysis layer.",
      },
      { property: "og:title", content: "About the Platform — Cosmos OS" },
      {
        property: "og:description",
        content: "Architecture, data provenance and design principles behind Cosmos OS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const SECTIONS = [
  {
    title: "Rendering",
    body: "Bodies are rendered in real time with GPU procedural surface synthesis — fractal terrain fields, ice-cap latitude masking, cloud advection and Rayleigh-style atmospheric rim scattering. No texture downloads, so the console starts instantly on constrained links.",
  },
  {
    title: "Data provenance",
    body: "Physical parameters are transcribed from published planetary science literature and agency fact sheets (NASA PDS, USGS Astrogeology, ESA PSA, JPL Horizons). Model-derived values are labelled as estimates in the analyzer.",
  },
  {
    title: "Analysis layer",
    body: "The landing-site analyzer scores terrain safety, slope, rock abundance, volatile probability and radiation exposure into a single 0–100 index, then proposes a four-leg rover traverse. The AI Scientist answers with mission context on top of that model.",
  },
  {
    title: "Design principles",
    body: "Instrument-grade density over decoration: an 8px spatial rhythm, monospaced telemetry labels, restrained motion and a single luminous accent. Every surface is legible at a glance in a darkened operations room.",
  },
];

function About() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Platform"
        title={
          <>
            Built like <em className="text-editorial">mission software.</em>
          </>
        }
        description="Cosmos OS is a research console, not a website. It is designed for planetary scientists, mission planners and students who need to reason about worlds quickly."
        meta={[
          { label: "Build", value: "4.2.1" },
          { label: "Status", value: "Research preview" },
          { label: "Rendering", value: "GPU procedural" },
          { label: "Stack", value: "TanStack · Three.js" },
        ]}
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <section key={s.title} className="panel p-8">
            <h2 className="text-lg font-medium">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>

      <div className="panel mt-4 p-8">
        <div className="label-tele">Engineering stack</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "React 19",
            "TypeScript",
            "TanStack Start",
            "React Three Fiber",
            "Three.js / GLSL",
            "Framer Motion",
            "TanStack Query",
            "Tailwind CSS",
            "Recharts",
            "Lovable AI Gateway",
          ].map((t) => (
            <span
              key={t}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
