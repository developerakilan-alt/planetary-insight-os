import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const STORAGE_KEY = "cosmos-tour-v1";

const STEPS = [
  {
    title: "Welcome to Cosmos OS",
    body: "A planetary intelligence platform. Explore NASA-derived surface data of nine worlds in real 3D — every texture has verifiable provenance.",
  },
  {
    title: "Time-travel the solar system",
    body: "Use the epoch control to jump between dates. Planet positions are computed from real ephemeris data, not an animation.",
  },
  {
    title: "Dive into a world",
    body: "Click any planet to open its dashboard: terrain layers, landing-site analysis, atmospheric profiles and mission records.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, []);

  const finish = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  };

  const stepData = STEPS[Math.min(step, STEPS.length - 1)]!;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="panel w-full max-w-md p-8"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="label-tele mt-5 text-[10px]">
              Guided tour · {step + 1} of {STEPS.length}
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold">{stepData.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stepData.body}</p>

            <div className="mt-6 flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === step ? "w-6 bg-primary" : "w-2 bg-border-strong"
                  }`}
                />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={finish}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip
              </button>
              <button
                onClick={() => (step === STEPS.length - 1 ? finish() : setStep((s) => s + 1))}
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {step === STEPS.length - 1 ? "Start exploring" : "Next"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
