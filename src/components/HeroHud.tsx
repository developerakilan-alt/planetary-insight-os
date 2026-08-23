/**
 * Cinematic HUD layered over the hero. A restrained instrument layer —
 * a single thin reticle, drifting light and soft scanline.
 * Deliberately quieter than a mission-control overlay; the scene leads.
 */
export function HeroHud() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
      {/* drift light wash — filmic warmth meets cool cyan */}
      <div className="leak-warm absolute inset-0 opacity-60" />

      {/* corner marker — minimal, faint */}
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
    </div>
  );
}
