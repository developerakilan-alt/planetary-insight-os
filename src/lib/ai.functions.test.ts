import { afterEach, describe, expect, it, vi } from "vitest";
import { gatewayRequest } from "./ai.functions";

const URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("gatewayRequest", () => {
  it("returns the first non-empty model completion", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: "" } }] }))
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: "  hello  " } }] }));

    const outcome = await gatewayRequest([{ role: "user", content: "hi" }], fetcher);
    expect(outcome).toEqual({ status: "ok", content: "hello" });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]![0]).toBe(URL);
    const init = fetcher.mock.calls[0]![1];
    expect(init?.headers).toMatchObject({ "Lovable-API-Key": "test-key" });
  });

  it("reports throttled on HTTP 429", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 429));
    const outcome = await gatewayRequest([{ role: "user", content: "hi" }], fetcher);
    expect(outcome).toEqual({ status: "throttled" });
  });

  it("reports exhausted credits on HTTP 402", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 402));
    const outcome = await gatewayRequest([{ role: "user", content: "hi" }], fetcher);
    expect(outcome).toEqual({ status: "exhausted" });
  });

  it("fails over across models and returns the last gateway error", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse({}, 503));
    const outcome = await gatewayRequest([{ role: "user", content: "hi" }], fetcher);
    expect(outcome).toEqual({ status: "error", message: "Gateway error 503" });
  });

  it("handles network failures gracefully", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("ECONNRESET"));
    const outcome = await gatewayRequest([{ role: "user", content: "hi" }], fetcher);
    expect(outcome).toEqual({ status: "error", message: "ECONNRESET" });
  });

  it("does not call the network without a configured key", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "");
    const fetcher = vi.fn<typeof fetch>();
    const outcome = await gatewayRequest([{ role: "user", content: "hi" }], fetcher);
    if (outcome.status !== "error") throw new Error("expected error outcome");
    expect(outcome.message).toContain("AI gateway is not configured.");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
