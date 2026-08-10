import { beforeEach, describe, expect, it, vi } from "vitest";

// The saved.ts module keeps a module-level `items` array loaded at import time,
// so each test gets a fresh module + clean localStorage.
async function freshLibrary() {
  vi.resetModules();
  localStorage.clear();
  return import("./saved");
}

describe("saved library", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds and retrieves an analysis item with a generated id", async () => {
    const { addItem, getItems } = await freshLibrary();
    const saved = addItem({
      kind: "analysis",
      bodyId: "mars",
      bodyName: "Mars",
      lat: 18.65,
      lon: 77.5,
      score: 82,
      verdict: "Prime",
    });
    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeGreaterThan(0);
    const items = getItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "analysis", bodyId: "mars", score: 82 });
  });

  it("accepts a landmark item with its landmarkName field", async () => {
    const { addItem, getItems } = await freshLibrary();
    addItem({
      kind: "landmark",
      bodyId: "europa",
      bodyName: "Europa",
      landmarkName: "Minoan Linea",
      lat: 18.0,
      lon: -101.0,
    });
    const item = getItems()[0]!;
    expect(item.kind).toBe("landmark");
    if (item.kind === "landmark") expect(item.landmarkName).toBe("Minoan Linea");
  });

  it("rejects neither kind in hasItem lookup by key", async () => {
    const { addItem, hasItem } = await freshLibrary();
    addItem({
      kind: "analysis",
      bodyId: "moon",
      bodyName: "Moon",
      lat: 1.23,
      lon: 4.56,
      score: 60,
      verdict: "Viable",
    });
    expect(hasItem("analysis", "moon:1.23,4.56")).toBe(true);
    expect(hasItem("analysis", "moon:9.99,9.99")).toBe(false);
  });

  it("removes an item by id and persists the rest", async () => {
    const { addItem, removeItem, getItems } = await freshLibrary();
    const a = addItem({
      kind: "analysis",
      bodyId: "venus",
      bodyName: "Venus",
      lat: 0,
      lon: 0,
      score: 40,
      verdict: "Marginal",
    });
    addItem({
      kind: "analysis",
      bodyId: "venus",
      bodyName: "Venus",
      lat: 1,
      lon: 1,
      score: 40,
      verdict: "Marginal",
    });
    removeItem(a.id);
    expect(getItems()).toHaveLength(1);
  });

  it("persists to localStorage and reloads across module resets", async () => {
    const first = await freshLibrary();
    first.addItem({
      kind: "analysis",
      bodyId: "titan",
      bodyName: "Titan",
      lat: 0,
      lon: 0,
      score: 75,
      verdict: "Viable",
    });
    vi.resetModules();
    const second = await import("./saved");
    expect(second.getItems()).toHaveLength(1);
    expect(second.getItems()[0]!.bodyId).toBe("titan");
  });

  it("imports a JSON array and exports it back", async () => {
    const { importItems, exportItems, getItems } = await freshLibrary();
    const payload = JSON.stringify([
      {
        kind: "analysis",
        bodyId: "mars",
        bodyName: "Mars",
        lat: 1,
        lon: 2,
        score: 50,
        verdict: "Marginal",
      },
    ]);
    expect(importItems(payload).added).toBe(1);
    const exported = JSON.parse(exportItems()) as Array<{ bodyId: string }>;
    expect(exported).toHaveLength(1);
    expect(exported[0]!.bodyId).toBe("mars");
    expect(getItems()).toHaveLength(1);
  });

  it("throws on malformed import JSON", async () => {
    const { importItems } = await freshLibrary();
    expect(() => importItems("{not json")).toThrow("Invalid library JSON.");
  });
});
