import { useEffect, useRef } from "react";

/**
 * Soft radial glow that follows the pointer behind the cursor, slightly
 * brightening when hovering interactive elements. Auto-disabled on touch
 * devices and under `prefers-reduced-motion`.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -400, y: -400 });
  const hot = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      hot.current = !!t?.closest?.(
        "a, button, [role='button'], input, textarea, select, [data-magnetic]",
      );
    };
    const loop = () => {
      x += (target.current.x - x) * 0.14;
      y += (target.current.y - y) * 0.14;
      el.style.opacity = hot.current ? "0.55" : "0.28";
      el.style.transform = `translate3d(${x - 360}px, ${y - 360}px, 0) scale(${hot.current ? 1.3 : 1})`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="cursor-glow pointer-events-none fixed left-0 top-0 z-[997] h-[720px] w-[720px] rounded-full opacity-0"
      style={{
        background:
          "radial-gradient(circle, color-mix(in oklab, var(--primary) 16%, transparent), transparent 62%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
