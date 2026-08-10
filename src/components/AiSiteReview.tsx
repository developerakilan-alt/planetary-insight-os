import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Bot, Sparkles } from "lucide-react";
import { useState } from "react";
import { assessSite } from "@/lib/ai.functions";
import type { SiteAnalysis } from "@/lib/analysis";
import { AnswerBody } from "@/components/AICopilot";
import type { Body } from "@/data/bodies";

/**
 * AI review of a deterministic landing-site analysis. The deterministic model
 * remains the source of truth for the numeric metrics; the AI produces an
 * engineering narrative grounded in those values.
 */
export function AiSiteReview({ body, analysis }: { body: Body; analysis: SiteAnalysis }) {
  const fn = useServerFn(assessSite);
  const [result, setResult] = useState<string | null>(null);
  const [used, setUsed] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const m = body.metrics;
      const res = await fn({
        data: {
          body: body.name,
          classification: body.classification,
          lat: analysis.lat,
          lon: analysis.lon,
          metrics: {
            gravity: m.gravity,
            pressureBar: m.pressureBar,
            tempC: m.tempC,
            atmosphere: m.atmosphere,
            surface: m.surface,
            water: m.water,
            magneticField: m.magneticField,
            elevationM: analysis.elevationM,
            slopeDeg: analysis.slopeDeg,
            iceProbability: analysis.iceProbability,
            rockDensity: analysis.rockDensity,
            terrainSafety: analysis.terrainSafety,
            radiationRisk: analysis.radiationRisk,
            landingDifficulty: analysis.landingDifficulty,
            scientificValue: analysis.scientificValue,
            modelScore: analysis.score,
          },
        },
      });
      return res.content;
    },
    onSuccess: (content) => {
      setResult(content);
      setUsed(true);
    },
  });

  if (result) {
    return (
      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="label-tele flex items-center gap-2 text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI engineer review
        </div>
        <div className="mt-3">
          <AnswerBody text={result} />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending || used}
      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition-colors hover:bg-primary/15 disabled:opacity-50"
    >
      <Bot className="h-4 w-4" />
      {mutation.isPending ? "Running AI engineer review…" : "Ask the AI to review this site"}
    </button>
  );
}
