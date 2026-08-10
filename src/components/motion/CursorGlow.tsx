import { useEffect, useRef } from "react";

/**
 * Soft radial glow that follows the pointer behind the cursor, slightly
 * brightening when hovering interactive elements.
 *
 * Performance notes:
 * - The rAF loop runs ONLY while the pointer is moving; it stops ~150ms after
 *   the pointer goes idle (so it does zero work while you scroll).
 * - No `mix-blend-mode`: blending against the backdrop forces a full-page
 *   recomposite on every frame. A plain translucent gradient looks the same
 *   on the dark UI and composites for free.
 * - Auto-disabled on touch devices and under `prefers-reduced-motion`.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const hot = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let raf = 0;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const start = () => {
      if (raf) return;
      const loop = () => {
        x += (target.current.x - x) * 0.14;
        y += (target.current.y - y) * 0.14;
        el.style.opacity = hot.current ? "0.55" : "0.28";
        el.style.transform = `translate3d(${x - 360}px, ${y - 360}px, 0) scale(${
          hot.current ? 1.3 : 1
        })`;
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(stop, 150);
      start();
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      hot.current = !!t?.closest?.(
        "a, button, [role='button'], input, textarea, select, [data-magnetic]",
      );
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      if (idleTimer) clearTimeout(idleTimer);
      stop();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="cursor-glow pointer-events-none fixed left-0 top-0 z-[997] h-[720px] w-[720px] rounded-full opacity-0"
      style={{
        background:
          "radial-gradient(circle, color-mix(in oklab, var(--primary) 14%, transparent), transparent 62%)",
      }}
    />
  );
}
