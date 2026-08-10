import { useSyncExternalStore } from "react";

/**
 * Client-side persisted library: saved landing-site analyses, bookmarked
 * landmarks and named views. Data lives in localStorage (no backend required),
 * and can be exported/imported as JSON for portability.
 */

export interface SavedAnalysis {
  id: string;
  kind: "analysis";
  bodyId: string;
  bodyName: string;
  lat: number;
  lon: number;
  score: number;
  verdict: string;
  createdAt: number;
}

export interface SavedLandmark {
  id: string;
  kind: "landmark";
  bodyId: string;
  bodyName: string;
  landmarkName: string;
  lat: number;
  lon: number;
  createdAt: number;
}

export type SavedItem = SavedAnalysis | SavedLandmark;

/** Payload accepted when adding a new item — the flattened analysis or landmark shape. */
export type SavedItemInput =
  Omit<SavedAnalysis, "id" | "createdAt"> | Omit<SavedLandmark, "id" | "createdAt">;

const STORAGE_KEY = "cosmos-os.library.v1";

type Listener = () => void;

let items: SavedItem[] = load();
const listeners = new Set<Listener>();

function load(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full / private mode — keep in memory */
  }
  listeners.forEach((l) => l());
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getItems(): SavedItem[] {
  return items;
}

export function addItem(item: SavedItemInput): SavedItem {
  const saved: SavedItem = { ...item, id: uid(), createdAt: Date.now() } as SavedItem;
  items = [saved, ...items];
  persist();
  return saved;
}

export function hasItem(kind: SavedItem["kind"], key: string): boolean {
  return items.some((i) => itemKey(i) === key && i.kind === kind);
}

function itemKey(i: SavedItem): string {
  if (i.kind === "analysis") return `${i.bodyId}:${i.lat.toFixed(2)},${i.lon.toFixed(2)}`;
  return `${i.bodyId}:${i.landmarkName}`;
}

export function removeItem(id: string): void {
  items = items.filter((i) => i.id !== id);
  persist();
}

export function clearItems(): void {
  items = [];
  persist();
}

export function importItems(json: string): { added: number } {
  try {
    const parsed = JSON.parse(json) as SavedItem[];
    if (!Array.isArray(parsed)) throw new Error("not an array");
    const valid = parsed.filter((i) => i && typeof i === "object" && i.kind && i.bodyId);
    items = [...valid, ...items];
    persist();
    return { added: valid.length };
  } catch {
    throw new Error("Invalid library JSON.");
  }
}

export function exportItems(): string {
  return JSON.stringify(items, null, 2);
}

/** React hook binding to the library store. */
export function useSavedLibrary(): {
  items: SavedItem[];
  add: (item: SavedItemInput) => SavedItem;
  remove: (id: string) => void;
  clear: () => void;
  has: (kind: SavedItem["kind"], key: string) => boolean;
} {
  const snapshot = useSyncExternalStore(subscribe, getItems);
  return {
    items: snapshot,
    add: addItem,
    remove: removeItem,
    clear: clearItems,
    has: (kind, key) => hasItem(kind, key),
  };
}
