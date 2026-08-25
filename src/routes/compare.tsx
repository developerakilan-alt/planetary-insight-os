import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PlanetComparison } from "@/components/PlanetComparison";
import { getBody, type BodyId } from "@/data/bodies";

const searchSchema = z.object({
  a: z.string().optional(),
  b: z.string().optional(),
});

function resolveSlot(value: string | undefined, fallback: BodyId): BodyId {
  if (!value) return fallback;
  const id = value as BodyId;
  return getBody(id) ? id : fallback;
}

export const Route = createFileRoute("/compare")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Planet Comparison — Cosmos OS" },
      {
        name: "description",
        content:
          "Compare gravity, diameter, mass, temperature, atmospheres, day and year lengths across every world in the solar system.",
      },
      { property: "og:title", content: "Planet Comparison — Cosmos OS" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const search = Route.useSearch();
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-24 lg:px-6">
      <PlanetComparison
        initialA={resolveSlot(search.a, "earth")}
        initialB={resolveSlot(search.b, "mars")}
      />
    </div>
  );
}
