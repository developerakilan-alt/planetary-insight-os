import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "@/components/AICopilot";

export const Route = createFileRoute("/copilot")({
  head: () => ({
    meta: [
      { title: "AI Scientist — Cosmos OS" },
      {
        name: "description",
        content:
          "Ask the Cosmos OS AI Scientist about planetary geology, mission history, habitability and landing-site engineering.",
      },
      { property: "og:title", content: "AI Scientist — Cosmos OS" },
      { property: "og:description", content: "An AI planetary science analyst embedded in mission software." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Copilot,
});

function Copilot() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-10">
      <div className="label-tele">Analysis engine</div>
      <h1 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold">AI Scientist</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        A planetary science analyst trained on mission literature. Ask about geology, atmospheres, habitability
        or exploration architecture.
      </p>
      <div className="panel mt-8 h-[70vh] min-h-[560px] overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
}
