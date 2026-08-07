import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(24),
  context: z.string().max(2000).optional(),
});

const SYSTEM = `You are the COSMOS OS AI Scientist — an expert planetary scientist and mission analyst embedded in professional planetary-exploration software used by research teams.

Rules:
- Answer with scientific accuracy. Cite instruments, missions and measured values where relevant.
- Be concise and structured: a short direct answer first, then compact markdown sections or bullets.
- Use SI units, include uncertainty or "estimated" when values are model-derived.
- When asked about habitability, colonisation or landing sites, give an engineering-grade assessment: constraints, hazards, and mitigation.
- Never invent mission names or measurements. If unknown, say so plainly.
- Keep responses under ~280 words unless the user asks for depth.`;

const MODELS = ["google/gemini-3.6-flash", "google/gemini-2.5-flash"];

export const askScientist = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI gateway is not configured.");

    const messages = [
      { role: "system", content: SYSTEM + (data.context ? `\n\nActive context: ${data.context}` : "") },
      ...data.messages,
    ];

    let lastError = "";
    for (const model of MODELS) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({ model, messages, stream: false }),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = json.choices?.[0]?.message?.content?.trim();
        if (content) return { content };
        lastError = "Empty response from the model.";
        continue;
      }

      if (res.status === 429) {
        return {
          content:
            "Request throttled at the gateway. Too many analyses are queued — retry in a few seconds.",
        };
      }
      if (res.status === 402) {
        return {
          content:
            "AI compute credits are exhausted for this workspace. Add credits to resume the AI Scientist.",
        };
      }
      lastError = `Gateway error ${res.status}`;
    }

    return { content: `The AI Scientist is unavailable right now (${lastError}).` };
  });
