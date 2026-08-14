/**
 * Science Notebook — persistent local-first notes. Everything is stored in
 * localStorage under a single key so the notebook survives reloads and can be
 * exported/imported as JSON.
 */

export type NoteCategory = "field-log" | "hypothesis" | "experiment" | "site-analysis" | "mission";

export interface Note {
  id: string;
  title: string;
  body: string;
  category: NoteCategory;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

const KEY = "cosmos-os.notebook.v1";

const CATEGORY_LABELS: Record<NoteCategory, string> = {
  "field-log": "Field log",
  hypothesis: "Hypothesis",
  experiment: "Experiment",
  "site-analysis": "Site analysis",
  mission: "Mission analysis",
};

export const NOTE_CATEGORIES = Object.keys(CATEGORY_LABELS) as NoteCategory[];

export function categoryLabel(c: NoteCategory): string {
  return CATEGORY_LABELS[c];
}

function loadRaw(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Note[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listNotes(): Note[] {
  return loadRaw().sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

export function saveNote(input: {
  id?: string;
  title: string;
  body: string;
  category: NoteCategory;
  tags: string[];
}): Note {
  const all = loadRaw();
  const now = Date.now();
  if (input.id) {
    const existing = all.find((n) => n.id === input.id);
    if (existing) {
      existing.title = input.title;
      existing.body = input.body;
      existing.category = input.category;
      existing.tags = input.tags;
      existing.updatedAt = now;
      persist(all);
      return existing;
    }
  }
  const note: Note = {
    id: `n-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title,
    body: input.body,
    category: input.category,
    tags: input.tags,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  persist([note, ...all]);
  return note;
}

export function deleteNote(id: string): void {
  persist(loadRaw().filter((n) => n.id !== id));
}

export function togglePin(id: string): void {
  const all = loadRaw();
  const n = all.find((x) => x.id === id);
  if (n) {
    n.pinned = !n.pinned;
    n.updatedAt = Date.now();
    persist(all);
  }
}

export function exportNotes(): string {
  return JSON.stringify(loadRaw(), null, 2);
}

export function importNotes(json: string): { added: number } {
  try {
    const parsed = JSON.parse(json) as Note[];
    if (!Array.isArray(parsed)) return { added: 0 };
    const existing = loadRaw();
    const ids = new Set(existing.map((n) => n.id));
    const fresh = parsed.filter((n) => n && typeof n.id === "string" && !ids.has(n.id));
    persist([...fresh, ...existing]);
    return { added: fresh.length };
  } catch {
    return { added: 0 };
  }
}

function persist(notes: Note[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(notes));
}

export const NOTE_PROMPTS: Record<NoteCategory, string> = {
  "field-log":
    "Draft a field-log entry for today's observations on this body. Suggest what to log: conditions, terrain, instrument state.",
  hypothesis:
    "Propose two testable scientific hypotheses about this body, each with a falsification criterion.",
  experiment:
    "Design a low-cost surface experiment for this world: instrument list, placement rationale and expected outcomes.",
  "site-analysis":
    "Analyse a candidate landing site: hazards, science value and a recommended traverse.",
  mission: "Summarise mission options for this body: orbiter, lander or sample-return trade-offs.",
};
