import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Log in — Cosmos OS" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 pt-24 pb-16">
      <div className="panel lift w-full max-w-md p-8">
        <div className="label-tele flex items-center justify-between">
          <span>Cosmos OS · Access</span>
          <span className="text-primary">Mission Desk</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Log in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to sync your research console, saved sites and field notebook.
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-glass-edge bg-glass-fill p-5 text-center backdrop-blur-xl">
            <div className="font-display text-lg font-medium">Access request received</div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Mission control will verify your credentials shortly.
            </p>
            <Link
              to="/"
              className="label-tele mt-4 inline-flex items-center gap-1.5 text-[10px] text-primary hover:underline"
            >
              Back to base <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="label-tele text-[9px]">Email</span>
              <input
                type="email"
                required
                placeholder="you@agency.gov"
                className="glass-chip mt-1.5 h-11 w-full rounded-xl px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </label>
            <label className="block">
              <span className="label-tele text-[9px]">Password</span>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="glass-chip mt-1.5 h-11 w-full rounded-xl px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </label>
            <button
              type="submit"
              className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-glass-edge-strong bg-glass-fill text-sm font-semibold text-foreground backdrop-blur-2xl transition-transform hover:scale-[1.02]"
              style={{
                boxShadow:
                  "inset 0 1px 0 0 color-mix(in oklab, white 16%, transparent), var(--shadow-glow)",
              }}
            >
              Enter the console
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <p className="text-center text-xs text-muted-foreground">
              No account yet?{" "}
              <span className="text-foreground/80">Ask mission control for access.</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
