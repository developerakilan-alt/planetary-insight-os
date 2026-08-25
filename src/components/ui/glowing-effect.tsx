"use client";

import { useEffect, useRef, useCallback } from "react";

interface GlowingEffectProps {
  spread?: number;
  glow?: boolean;
  disabled?: boolean;
  proximity?: number;
  inactiveZone?: number;
  className?: string;
}

export function GlowingEffect({
  spread = 40,
  glow = true,
  disabled = false,
  proximity = 64,
  inactiveZone = 0.01,
  className = "",
}: GlowingEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const update = useCallback(() => {
    const container = containerRef.current;
    const glowEl = glowRef.current;
    if (!container || !glowEl || disabled) return;

    const rect = container.getBoundingClientRect();
    const x = mouseRef.current.x - rect.left;
    const y = mouseRef.current.y - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const distX = (x - centerX) / centerX;
    const distY = (y - centerY) / centerY;

    const dist = Math.sqrt(distX * distX + distY * distY);

    if (dist < inactiveZone) {
      glowEl.style.opacity = "0";
      return;
    }

    const isInside =
      x >= -proximity &&
      x <= rect.width + proximity &&
      y >= -proximity &&
      y <= rect.height + proximity;

    if (!isInside) {
      glowEl.style.opacity = "0";
      return;
    }

    const intensity = Math.max(0, 1 - dist * 0.5);
    glowEl.style.opacity = glow ? String(intensity * 0.7) : "0";
    glowEl.style.background = `radial-gradient(${spread}px circle at ${x}px ${y}px, color-mix(in oklab, var(--primary) 35%, transparent), transparent)`;
  }, [disabled, glow, spread, proximity, inactiveZone]);

  useEffect(() => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      if (idleTimer.current) clearTimeout(idleTimer.current);

      const loop = () => {
        update();
        rafRef.current = requestAnimationFrame(loop);
      };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      }

      idleTimer.current = setTimeout(() => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
      }, 150);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [disabled, update]);

  return (
    <div ref={containerRef} className={`pointer-events-none absolute inset-0 ${className}`}>
      <div
        ref={glowRef}
        className="absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200"
        style={{ willChange: "background, opacity" }}
      />
    </div>
  );
}
