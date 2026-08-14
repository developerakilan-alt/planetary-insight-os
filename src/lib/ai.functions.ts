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

type GatewayMessage = { role: "system" | "user" | "assistant"; content: string };

type GatewayOutcome =
  | { status: "ok"; content: string }
  | { status: "throttled" }
  | { status: "exhausted" }
  | { status: "error"; message: string };

/**
 * Shared AI-gateway request loop with model fallback and graceful handling of
 * throttling / exhausted-credits responses. `fetcher` is injectable so tests
 * can exercise the fallback logic without hitting the network.
 */
export async function gatewayRequest(
  messages: GatewayMessage[],
  fetcher: typeof fetch = fetch,
): Promise<GatewayOutcome> {
  const key = process.env["LOVABLE_API_KEY"] || import.meta.env["LOVABLE_API_KEY"];
  if (!key) {
    return {
      status: "error",
      message:
        "AI gateway is not configured. Set the LOVABLE_API_KEY environment variable (for local dev, add it to a .env.local file in the project root) or run the app from the Lovable preview.",
    };
  }

  let lastError = "";
  for (const model of MODELS) {
    try {
      const res = await fetcher("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        if (content) return { status: "ok", content };
        lastError = "Empty response from the model.";
        continue;
      }

      if (res.status === 429) return { status: "throttled" };
      if (res.status === 402) return { status: "exhausted" };
      lastError = `Gateway error ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error";
    }
  }

  return { status: "error", message: lastError || "Gateway error" };
}

export const askScientist = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const messages: GatewayMessage[] = [
      {
        role: "system",
        content: SYSTEM + (data.context ? `\n\nActive context: ${data.context}` : ""),
      },
      ...data.messages,
    ];

    const outcome = await gatewayRequest(messages);
    if (outcome.status === "ok") return { content: outcome.content };
    if (outcome.status === "throttled") {
      return {
        content:
          "Request throttled at the gateway. Too many analyses are queued — retry in a few seconds.",
      };
    }
    if (outcome.status === "exhausted") {
      return {
        content:
          "AI compute credits are exhausted for this workspace. Add credits to resume the AI Scientist.",
      };
    }
    return { content: `The AI Scientist is unavailable right now (${outcome.message}).` };
  });

const AssessInput = z.object({
  body: z.string().min(1).max(60),
  classification: z.string().max(120),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  metrics: z.object({
    gravity: z.number(),
    pressureBar: z.number(),
    tempC: z.tuple([z.number(), z.number()]),
    atmosphere: z.string().max(200),
    surface: z.string().max(200),
    water: z.string().max(200),
    magneticField: z.string().max(200),
    elevationM: z.number(),
    slopeDeg: z.number(),
    iceProbability: z.number().min(0).max(1),
    rockDensity: z.number().min(0).max(1),
    terrainSafety: z.number().min(0).max(1),
    radiationRisk: z.number().min(0).max(1),
    landingDifficulty: z.number().min(0).max(1),
    scientificValue: z.number().min(0).max(1),
    modelScore: z.number().min(0).max(100),
  }),
});

const ASSESS_SYSTEM = `You are the COSMOS OS AI landing-site analyst, embedded in professional planetary-exploration software.

A deterministic terrain model has computed site metrics. Review them like an EDL (entry, descent, landing) engineer and produce a SHORT structured review:

1. A one-paragraph engineering assessment of the site for a soft landing + surface operations.
2. A bullet list of the two strongest and two weakest site characteristics.
3. A revised 0–100 landing score and a one-word verdict: Prime | Viable | Marginal | Rejected.

Rules:
- Ground your reasoning in the provided measured/modeled values (gravity, pressure, slope, rock density, ice probability, radiation, magnetic field).
- Be honest: if the model inputs look contradictory, say so.
- Keep the whole answer under ~200 words.`;

/**
 * Ask the AI to review a deterministic landing-site analysis.
 * Returns a free-form review; the deterministic model remains the source of
 * truth for the numeric metrics (this is disclosed in the UI).
 */
export const assessSite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AssessInput.parse(data))
  .handler(async ({ data }) => {
    const prompt = `Body: ${data.body} (${data.classification})
Coordinates: ${data.lat.toFixed(2)}°, ${data.lon.toFixed(2)}°
Surface gravity: ${data.metrics.gravity} m/s²
Surface pressure: ${data.metrics.pressureBar} bar
Temperature range: ${data.metrics.tempC[0]} … ${data.metrics.tempC[1]} °C
Atmosphere: ${data.metrics.atmosphere}
Surface material: ${data.metrics.surface}
Water presence: ${data.metrics.water}
Magnetic field: ${data.metrics.magneticField}
Modeled site metrics:
- Elevation: ${Math.round(data.metrics.elevationM)} m
- Mean slope: ${data.metrics.slopeDeg}°
- Rock density: ${(data.metrics.rockDensity * 100).toFixed(0)}%
- Terrain safety: ${(data.metrics.terrainSafety * 100).toFixed(0)}%
- Water-ice probability: ${(data.metrics.iceProbability * 100).toFixed(0)}%
- Scientific value: ${(data.metrics.scientificValue * 100).toFixed(0)}%
- Radiation risk: ${(data.metrics.radiationRisk * 100).toFixed(0)}%
- Landing difficulty: ${(data.metrics.landingDifficulty * 100).toFixed(0)}%
- Deterministic model score: ${data.metrics.modelScore}/100

Produce the structured review now.`;

    const messages: GatewayMessage[] = [
      { role: "system", content: ASSESS_SYSTEM },
      { role: "user", content: prompt },
    ];

    const outcome = await gatewayRequest(messages);
    if (outcome.status === "ok") return { content: outcome.content };
    if (outcome.status === "throttled") {
      return {
        content:
          "Request throttled at the gateway. Too many analyses are queued — retry in a few seconds.",
      };
    }
    if (outcome.status === "exhausted") {
      return {
        content:
          "AI compute credits are exhausted for this workspace. The deterministic model result is still available above.",
      };
    }
    return {
      content: `The AI review is unavailable right now (${outcome.message}). The deterministic result stands.`,
    };
  });

const DescribeImageInput = z.object({
  title: z.string().min(1).max(300),
  body: z.string().max(80),
  mission: z.string().max(80),
  spacecraft: z.string().max(80),
  year: z.number().nullable(),
  description: z.string().max(2000),
  nasaId: z.string().max(120),
});

const DESCRIBE_SYSTEM = `You are the COSMOS OS imaging analyst — a planetary geologist and instrument specialist who writes scientific captions for spacecraft imagery.

Given an image's metadata (title, target body, mission, spacecraft, capture year and the original archive description), produce a SHORT scientific caption:

- One direct sentence stating what the image shows and which instrument/spacecraft acquired it.
- 2–4 sentences of geological or scientific context: why this scene matters, what processes it records, or what the mission found there.
- One closing sentence on research significance or next steps.

Rules:
- Ground every claim in the provided metadata. Never invent mission names, instruments or measurements.
- If the body or mission is unknown, say "unverified" rather than guessing.
- Use SI units and measured values when available.
- Keep the whole caption under ~120 words, written for planetary scientists and informed enthusiasts alike.`;

/**
 * Ask the AI to write a scientific caption for an archived image.
 * The model receives image metadata only (the archive API returns text, not
 * pixel data); the caption is grounded in the title, body, mission and the
 * original NASA description.
 */
export const describeImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DescribeImageInput.parse(data))
  .handler(async ({ data }) => {
    const prompt = `Image metadata:
- Archive ID: ${data.nasaId}
- Title: ${data.title}
- Target body: ${data.body || "unspecified"}
- Mission: ${data.mission || "unspecified"}
- Spacecraft / instrument: ${data.spacecraft || "unspecified"}
- Capture year: ${data.year ?? "unknown"}
- Original NASA description:
${data.description || "(no description provided)"}

Write the scientific caption now.`;

    const messages: GatewayMessage[] = [
      { role: "system", content: DESCRIBE_SYSTEM },
      { role: "user", content: prompt },
    ];

    const outcome = await gatewayRequest(messages);
    if (outcome.status === "ok") return { content: outcome.content };
    if (outcome.status === "throttled") {
      return {
        content:
          "Request throttled at the gateway. Too many captions are queued — retry in a few seconds.",
      };
    }
    if (outcome.status === "exhausted") {
      return {
        content:
          "AI compute credits are exhausted for this workspace. Add credits to resume AI image captions.",
      };
    }
    return { content: `The imaging analyst is unavailable right now (${outcome.message}).` };
  });
