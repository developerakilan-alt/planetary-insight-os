import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LogOut, Mail, Rocket, User } from "lucide-react";
import { toast } from "sonner";
import {
  createAccount,
  getSession,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  useSession,
} from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in or sign up — Cosmos OS" },
      {
        name: "description",
        content:
          "Sign in to your Cosmos OS account with Google or email to sync your research console, saved sites and field notebook.",
      },
      { property: "og:title", content: "Log in or sign up — Cosmos OS" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LoginPage,
});

type Mode = "signin" | "signup";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.63l3.98 3.09C6.22 6.87 8.87 4.76 12 4.76Z"
      />
    </svg>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const user = useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"google" | "email" | null>(null);

  const finish = (displayName: string) => {
    toast.success(`Welcome aboard, ${displayName}`);
    void navigate({ to: "/dashboard" });
  };

  const handleGoogle = () => {
    if (busy) return;
    setError(null);
    setBusy("google");
    window.setTimeout(() => {
      try {
        const u = signInWithGoogle();
        finish(u.name);
      } finally {
        setBusy(null);
      }
    }, 700);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError("Tell us your name to create the account.");
      return;
    }

    setBusy("email");
    window.setTimeout(() => {
      try {
        if (mode === "signup") {
          const u = createAccount(name, email, password);
          finish(u.name.split(" ")[0] ?? u.name);
        } else {
          const u = signInWithEmail(email, password);
          finish(u.name.split(" ")[0] ?? u.name);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setBusy(null);
      }
    }, 650);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  if (getSession()) {
    return <SignedInCard />;
  }

  return (
    <div className="relative mx-auto grid min-h-screen w-full max-w-[1600px] items-stretch gap-10 px-4 pb-16 pt-28 lg:grid-cols-[1.05fr_1fr] lg:px-8">
      {/* Brand panel */}
      <div className="panel relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          aria-hidden
          style={{
            background:
              "radial-gradient(70% 60% at 20% 15%, rgba(56,189,248,0.14), transparent 60%), radial-gradient(60% 55% at 85% 90%, rgba(155,140,255,0.12), transparent 65%)",
          }}
        />
        <div className="relative">
          <span className="label-tele text-primary">Cosmos OS · Access</span>
          <h2 className="mt-4 max-w-md font-display text-4xl leading-tight font-semibold tracking-tight">
            Your research console,
            <br />
            <span className="text-muted-foreground">synced across every world.</span>
          </h2>
        </div>

        <div className="relative my-10 flex flex-1 items-center justify-center">
          <div className="relative h-56 w-56" aria-hidden>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 26, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-glass-edge"
            >
              <span className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_2px_rgba(79,209,255,0.7)]" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
              className="absolute inset-[18%] rounded-full border border-dashed border-glass-edge-strong"
            >
              <span className="absolute top-1/2 -right-1 h-1.5 w-1.5 rounded-full bg-[#9B8CFF]" />
            </motion.div>
            <div className="absolute inset-[36%] rounded-full bg-gradient-to-br from-[#38BDF8] via-[#2b5f8f] to-[#0b1020] shadow-[inset_-10px_-8px_24px_rgba(0,0,0,0.75),0_0_50px_-10px_rgba(56,189,248,0.6)]" />
          </div>
        </div>

        <ul className="relative space-y-3 text-sm text-muted-foreground">
          {[
            "Saved landing sites and landmark bookmarks",
            "Field notebook synced to your account",
            "Personal mission dashboard and instruments",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="h-1 w-1 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Form panel */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="panel lift mx-auto flex w-full max-w-md flex-col justify-center self-start p-7 sm:p-9 lg:mt-16"
      >
        <div className="label-tele flex items-center gap-2 lg:hidden">
          <Rocket className="h-3.5 w-3.5 text-primary" /> Cosmos OS · Access
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight lg:mt-0">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to sync your research console, saved sites and field notebook."
            : "One account for every planetary instrument on the platform."}
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy !== null}
          className="press mt-7 inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-glass-edge-strong bg-white text-sm font-semibold text-neutral-800 transition-all hover:bg-white/90 disabled:opacity-60"
        >
          {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-border" />
          <span className="label-tele text-[9px]">or continue with email</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === "signup" && (
            <label className="block">
              <span className="label-tele flex items-center gap-1.5 text-[9px]">
                <User className="h-3 w-3" /> Full name
              </span>
              <input
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-chip mt-1.5 h-11 w-full rounded-xl px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
              />
            </label>
          )}

          <label className="block">
            <span className="label-tele flex items-center gap-1.5 text-[9px]">
              <Mail className="h-3 w-3" /> Email
            </span>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@agency.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-chip mt-1.5 h-11 w-full rounded-xl px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
            />
          </label>

          <label className="block">
            <span className="label-tele flex items-center justify-between text-[9px]">
              Password
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => toast.info("Password reset is not available in this demo build.")}
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </span>
            <span className="relative mt-1.5 block">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-chip h-11 w-full rounded-xl px-4 pr-11 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs text-destructive"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy !== null}
            className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-primary/50 bg-primary/20 text-sm font-semibold text-foreground backdrop-blur-2xl transition-all hover:bg-primary/30 disabled:opacity-60"
          >
            {busy === "email" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "signin" ? "Signing in…" : "Creating account…"}
              </>
            ) : mode === "signin" ? (
              <>
                Log in
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              New to Cosmos OS?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="font-medium text-primary hover:underline"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="font-medium text-primary hover:underline"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

function SignedInCard() {
  const navigate = useNavigate();
  const user = getSession();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-24 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="panel lift w-full max-w-md p-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/15 font-display text-xl font-semibold text-primary">
          {(user?.name ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
          You're signed in
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {user?.name} · {user?.email}
        </p>
        <p className="label-tele mt-1 text-[9px] capitalize">{user?.provider} account</p>

        <button
          type="button"
          onClick={() => void navigate({ to: "/dashboard" })}
          className="group relative mt-7 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-primary/50 bg-primary/20 text-sm font-semibold text-foreground backdrop-blur-2xl transition-all hover:bg-primary/30"
        >
          Continue to dashboard
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            signOut();
            toast("Signed out of this device.");
          }}
          className="glass-chip press mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </motion.div>
    </div>
  );
}
