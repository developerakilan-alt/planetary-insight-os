import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen,
  Download,
  FileText,
  Pin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageMasthead } from "@/components/PageMasthead";
import { BODIES, type BodyId } from "@/data/bodies";
import { askScientist } from "@/lib/ai.functions";
import {
  categoryLabel,
  deleteNote,
  exportNotes,
  importNotes,
  listNotes,
  NOTE_CATEGORIES,
  NOTE_PROMPTS,
  saveNote,
  togglePin,
  type NoteCategory,
} from "@/lib/notebook";

export const Route = createFileRoute("/notebook")({
  head: () => ({
    meta: [
      { title: "Science Notebook — Cosmos OS" },
      {
        name: "description",
        content:
          "A persistent research log for field observations, hypotheses and experiments — with AI-generated experiment ideas.",
      },
      { property: "og:title", content: "Science Notebook — Cosmos OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Notebook,
});

function Notebook() {
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<NoteCategory | "all">("all");
  const [bodyId, setBodyId] = useState<BodyId>("mars");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [noteCategory, setNoteCategory] = useState<NoteCategory>("field-log");
  const [tags, setTags] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const askFn = useServerFn(askScientist);

  const notes = useMemo(() => {
    const all = listNotes();
    const q = query.trim().toLowerCase();
    return all.filter((n) => {
      const matchesQuery =
        q.length === 0 ||
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q));
      const matchesCat = category === "all" || n.category === category;
      return matchesQuery && matchesCat;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, query, category]);

  const ai = useMutation({
    mutationFn: async () => {
      const res = await askFn({
        data: {
          messages: [
            {
              role: "user",
              content: `Working context: ${BODIES.find((b) => b.id === bodyId)?.name}. ${NOTE_PROMPTS[noteCategory]}`,
            },
          ],
        },
      });
      return res.content;
    },
    onSuccess: (content) => {
      setBody((b) => (b ? `${b}\n\n${content}` : content));
      toast.success("AI draft appended");
    },
    onError: () => toast.error("The AI Scientist is unavailable right now."),
  });

  const resetEditor = () => {
    setEditingId(null);
    setTitle("");
    setBody("");
    setNoteCategory("field-log");
    setTags("");
  };

  const save = () => {
    if (!title.trim()) {
      toast.error("Give the entry a title first");
      return;
    }
    saveNote({
      ...(editingId ? { id: editingId } : {}),
      title: title.trim(),
      body: body.trim(),
      category: noteCategory,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    resetEditor();
    setTick((t) => t + 1);
    toast.success("Entry saved");
  };

  const edit = (id: string) => {
    const n = listNotes().find((x) => x.id === id);
    if (!n) return;
    setEditingId(n.id);
    setTitle(n.title);
    setBody(n.body);
    setNoteCategory(n.category);
    setTags(n.tags.join(", "));
  };

  const remove = (id: string) => {
    deleteNote(id);
    if (editingId === id) resetEditor();
    setTick((t) => t + 1);
    toast("Entry deleted");
  };

  const pin = (id: string) => {
    togglePin(id);
    setTick((t) => t + 1);
  };

  const doExport = () => {
    const blob = new Blob([exportNotes()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cosmos-os-notebook-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Notebook exported");
  };

  const doImport = (file: File) => {
    file.text().then((txt) => {
      const { added } = importNotes(txt);
      setTick((t) => t + 1);
      toast.success(added > 0 ? `${added} entries imported` : "No new entries found");
    });
  };

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10">
      <PageMasthead
        eyebrow="Science notebook"
        icon={<BookOpen className="h-4 w-4" />}
        title={
          <>
            Your field <em className="text-editorial">research log.</em>
          </>
        }
        description="A local-first research log for observations, hypotheses and experiment designs. Draft entries with the AI Scientist and export the whole notebook as JSON."
        meta={[
          { label: "Entries", value: String(listNotes().length) },
          { label: "Storage", value: "Local · device only" },
          { label: "Categories", value: "5" },
          { label: "AI draft", value: "Ask the Scientist" },
        ]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* List */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-56 flex-1 items-center gap-2 rounded-full border border-glass-edge bg-glass-fill px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search entries…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <button
              onClick={() => resetEditor()}
              className="glass-chip flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              New entry
            </button>
            <button
              onClick={doExport}
              className="glass-chip flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="glass-chip flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) doImport(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("all")}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                category === "all"
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "glass-chip text-muted-foreground"
              }`}
            >
              All
            </button>
            {NOTE_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  category === c
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "glass-chip text-muted-foreground"
                }`}
              >
                {categoryLabel(c)}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {notes.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={`panel-flat lift cursor-pointer p-4 ${editingId === n.id ? "border-primary/40" : ""}`}
                onClick={() => edit(n.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {n.pinned && <Pin className="h-3 w-3 shrink-0 text-warning" />}
                      <span className="truncate font-display text-[15px] font-semibold">
                        {n.title}
                      </span>
                    </div>
                    <div className="label-tele mt-0.5 text-[8px] text-muted-foreground/70">
                      {categoryLabel(n.category)} · {new Date(n.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        pin(n.id);
                      }}
                      aria-label="Pin entry"
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground ${n.pinned ? "text-warning" : ""}`}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(n.id);
                      }}
                      aria-label="Delete entry"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                  {n.body || "No body yet."}
                </p>
                {n.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {n.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-glass-edge bg-glass-fill px-2 py-0.5 font-mono text-[9px] text-muted-foreground"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
            {notes.length === 0 && (
              <div className="panel-flat p-10 text-center text-sm text-muted-foreground">
                No entries yet. Start a new one — or ask the AI Scientist for a draft.
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="panel p-6">
          <div className="label-tele mb-1 flex items-center gap-2 text-primary">
            <FileText className="h-3.5 w-3.5" />
            {editingId ? "Editing entry" : "New entry"}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title — e.g. 'Candidate landing site: Shackleton rim'"
            className="mt-4 w-full rounded-xl border border-glass-edge bg-glass-fill px-4 py-3 font-display text-lg font-medium outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value as NoteCategory)}
              className="glass-chip rounded-full px-3 py-1.5 text-xs outline-none"
            >
              {NOTE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tags, comma, separated"
              className="min-w-40 flex-1 rounded-full border border-glass-edge bg-glass-fill px-4 py-1.5 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
            />
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Record observations, hypotheses, measurements…"
            className="mt-3 h-64 w-full resize-none rounded-xl border border-glass-edge bg-glass-fill px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => ai.mutate()}
              disabled={ai.isPending}
              className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {ai.isPending ? "Drafting…" : "AI draft for this body"}
            </button>
            <select
              value={bodyId}
              onChange={(e) => setBodyId(e.target.value as BodyId)}
              className="glass-chip rounded-full px-3 py-2 text-xs outline-none"
              aria-label="AI draft context body"
            >
              {BODIES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              onClick={save}
              className="ml-auto rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
            >
              {editingId ? "Update entry" : "Save entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
