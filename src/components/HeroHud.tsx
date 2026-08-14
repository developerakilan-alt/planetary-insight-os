import { motion } from "framer-motion";

/**
 * Cinematic HUD layered over the hero. A restrained instrument layer —
 * a single thin reticle, drifting light, soft scanline and scroll cue.
 * Deliberately quieter than a mission-control overlay; the scene leads.
 */
export function HeroHud() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
      {/* drift light wash — filmic warmth meets cool cyan */}
      <div className="leak-warm absolute inset-0 opacity-60" />

      {/* corner markers — minimal, faint */}
      <div className="absolute left-6 top-24 hidden sm:block">
        <div className="h-9 w-9 border-l border-t border-primary/30" />
        <div className="label-tele mt-2 text-[9px] text-muted-foreground">
          SOL SYSTEM · INSTRUMENT VIEW
        </div>
      </div>
      <div className="absolute right-6 top-24 hidden text-right sm:block">
        <div className="ml-auto h-9 w-9 border-r border-t border-primary/30" />
        <div className="label-tele mt-2 text-[9px] text-muted-foreground">RENDER · LIVE</div>
      </div>

      {/* fine orbit reticle — a single hairline ellipse */}
      <div
        className="absolute left-1/2 top-[45%] h-[38vh] w-[110vw] rounded-[50%] border border-primary/10"
        style={{ transform: "translate(-50%, -50%) rotate(-6deg)" }}
      />

      {/* soft scanline sweep */}
      <div
        className="absolute inset-x-0 top-0 h-40 opacity-25"
        style={{
          background:
            "linear-gradient(180deg, transparent, color-mix(in oklab, var(--primary) 8%, transparent), transparent)",
          animation: "scanline 9s ease-in-out infinite",
        }}
      />

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-20 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="label-tele text-[9px] text-muted-foreground">SCROLL TO EXPLORE</span>
        <span className="h-8 w-px bg-gradient-to-b from-primary/70 to-transparent" />
      </motion.div>
    </div>
  );
}
