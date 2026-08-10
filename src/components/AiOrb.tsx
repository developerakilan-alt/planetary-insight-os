/**
 * CSS-only AI orb: layered radial gradients, a masked conic "signal" sweep and
 * an optional listening waveform. No canvas, no textures.
 */
export function AiOrb({ size = 40, thinking = false }: { size?: number; thinking?: boolean }) {
  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 30%, #d7f2ff 0%, #4fd1ff 40%, #1b6bb0 72%, #082c4f 100%)",
        }}
      />
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 26%, rgba(255,255,255,0.95), transparent 55%)",
          mixBlendMode: "screen",
        }}
      />
      <span className="absolute inset-[8%] rounded-full border border-white/25" />
      <span
        className="absolute inset-0 animate-[hud-spin_7s_linear_infinite] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0 62%, rgba(255,255,255,0.75) 80%, transparent 94%)",
          mixBlendMode: "screen",
          WebkitMaskImage: "radial-gradient(circle, transparent 52%, black 58%)",
          maskImage: "radial-gradient(circle, transparent 52%, black 58%)",
        }}
      />
      <span
        className="absolute -inset-1.5 rounded-full opacity-40"
        style={{
          background:
            "conic-gradient(from 120deg, transparent, color-mix(in oklab, var(--primary) 30%, transparent), transparent)",
          animation: "hud-spin 3.2s linear infinite reverse",
          filter: "blur(6px)",
        }}
      />
      {thinking && (
        <span className="absolute inset-0 flex items-center justify-center gap-[3px]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-white/90"
              style={{
                height: size * 0.3,
                animation: `wave 1s ease-in-out ${i * 0.12}s infinite`,
              }}
            />
          ))}
        </span>
      )}
    </span>
  );
}
