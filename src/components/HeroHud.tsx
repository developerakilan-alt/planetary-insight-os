import { motion } from "framer-motion";

/**
 * Mission-control HUD layered over the hero: corner brackets, an orbit guide
 * and a slowly rotating instrument ring around the planet, plus a scanline.
 */
export function HeroHud() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
      {/* corner brackets */}
      <div className="absolute left-6 top-24 hidden sm:block">
        <div className="h-9 w-9 border-l border-t border-primary/40" />
        <div className="label-tele mt-2 text-[9px]">SOL SYSTEM · INSTRUMENT VIEW</div>
      </div>
      <div className="absolute right-6 top-24 hidden text-right sm:block">
        <div className="ml-auto h-9 w-9 border-r border-t border-primary/40" />
        <div className="label-tele mt-2 text-[9px]">RENDER · LIVE</div>
      </div>
      <div className="absolute bottom-40 left-6 hidden sm:block">
        <div className="h-9 w-9 border-b border-l border-primary/40" />
      </div>
      <div className="absolute bottom-40 right-6 hidden sm:block">
        <div className="ml-auto h-9 w-9 border-b border-r border-primary/40" />
      </div>

      {/* orbit guide ellipse */}
      <div
        className="absolute left-1/2 top-[45%] h-[46vh] w-[130vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-primary/10"
        style={{ transform: "translate(-50%, -50%) rotate(-6deg)" }}
      />

      {/* rotating HUD instrument ring */}
      <div className="absolute left-1/2 top-[45%] h-[74vh] w-[74vh] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 rounded-full border border-primary/15" />
        <div
          className="absolute inset-3 rounded-full"
          style={{
            border: "1px dashed color-mix(in oklab, var(--primary) 22%, transparent)",
            animation: "hud-spin 46s linear infinite",
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, color-mix(in oklab, var(--primary) 26%, transparent) 0deg 1deg, transparent 1deg 6deg)",
            WebkitMaskImage: "radial-gradient(circle, transparent 60%, black 62%)",
            maskImage: "radial-gradient(circle, transparent 60%, black 62%)",
          }}
        />
      </div>

      {/* scanline sweep */}
      <div
        className="absolute inset-x-0 top-0 h-32 opacity-30"
        style={{
          background:
            "linear-gradient(180deg, transparent, color-mix(in oklab, var(--primary) 9%, transparent), transparent)",
          animation: "scanline 7s ease-in-out infinite",
        }}
      />

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-16 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="label-tele text-[9px]">SCROLL TO EXPLORE</span>
        <span className="h-8 w-px bg-gradient-to-b from-primary/70 to-transparent" />
      </motion.div>
    </div>
  );
}
