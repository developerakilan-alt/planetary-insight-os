import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { askScientist } from "@/lib/ai.functions";
import { AiOrb } from "@/components/AiOrb";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const SUGGESTIONS = [
  "Why is Olympus Mons so large?",
  "Why does Europa contain subsurface oceans?",
  "Explain Valles Marineris.",
  "Can humans colonize Titan?",
];

/** Lightweight markdown-ish renderer for scientific answers. */
export function AnswerBody({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return (
    <div className="space-y-2 text-sm leading-relaxed text-foreground/90">
      {lines.map((line, i) => {
        const clean = line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/, "");
        if (/^[-*•]\s+/.test(line)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{clean.replace(/^[-*•]\s+/, "")}</span>
            </div>
          );
        }
        if (/^#+\s/.test(line)) {
          return (
            <div key={i} className="label-tele pt-1 text-primary">
              {clean}
            </div>
          );
        }
        return <p key={i}>{clean}</p>;
      })}
    </div>
  );
}

export function useScientist(context?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const fn = useServerFn(askScientist);

  const mutation = useMutation({
    mutationFn: async (question: string) => {
      const next: ChatMessage[] = [...messages, { role: "user", content: question }];
      setMessages(next);
      const res = await fn({ data: { messages: next, ...(context ? { context } : {}) } });
      return res.content;
    },
    onSuccess: (content) => setMessages((m) => [...m, { role: "assistant", content }]),
    onError: () =>
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Link to the analysis cluster failed. Try again." },
      ]),
  });

  return {
    messages,
    ask: mutation.mutate,
    pending: mutation.isPending,
    reset: () => setMessages([]),
  };
}

export function ChatPanel({ context, compact = false }: { context?: string; compact?: boolean }) {
  const { messages, ask, pending } = useScientist(context);
  const [value, setValue] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  const submit = (q: string) => {
    if (!q.trim() || pending) return;
    ask(q.trim());
    setValue("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className={`flex-1 space-y-4 overflow-y-auto ${compact ? "px-4 py-4" : "px-6 py-6"}`}>
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="label-tele text-primary">AI Scientist online</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Ask about planetary geology, mission history, habitability or landing-site
              engineering.
            </p>
            <div className="grid gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-lg border border-glass-edge bg-glass-fill px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-glass-edge-strong hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary/15 px-4 py-2.5 text-sm text-foreground">
                {m.content}
              </div>
            </div>
          ) : (
            <div
              key={i}
              className="rounded-2xl rounded-bl-sm border border-glass-edge bg-glass-fill px-4 py-3"
            >
              <AnswerBody text={m.content} />
            </div>
          ),
        )}

        {pending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AiOrb size={18} thinking />
            Synthesising from mission literature…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="border-t border-border p-3"
      >
        <div className="flex items-center gap-2 rounded-xl border border-glass-edge bg-glass-fill px-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask the AI Scientist…"
            aria-label="Ask the AI Scientist"
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={pending || !value.trim()}
            aria-label="Send question"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
          >
            <CornerDownLeft className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export function AICopilot() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="panel fixed bottom-24 right-6 z-50 flex h-[560px] w-[min(420px,calc(100vw-3rem))] flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <AiOrb size={30} />
                <div>
                  <div className="text-sm font-medium">AI Scientist</div>
                  <div className="label-tele text-[9px]">Planetary analysis engine</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close AI Scientist"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ChatPanel compact />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open the AI Scientist assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 items-center gap-3 rounded-full border border-glass-edge-strong bg-glass-fill-strong px-5 backdrop-blur-2xl transition-transform hover:scale-[1.03]"
        style={{ boxShadow: "var(--shadow-glow)" }}
      >
        <span className="relative flex h-7 w-7 items-center justify-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/25" />
          <AiOrb size={26} />
        </span>
        <span className="hidden text-sm font-medium sm:block">AI Scientist</span>
      </button>
    </>
  );
}
