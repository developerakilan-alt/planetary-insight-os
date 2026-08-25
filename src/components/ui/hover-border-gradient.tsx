"use client";

import { useRef, useState, type ReactNode } from "react";

interface HoverBorderGradientProps {
  children: ReactNode;
  containerClassName?: string;
  className?: string;
  duration?: number;
}

export function HoverBorderGradient({
  children,
  containerClassName = "",
  className = "",
  duration: _duration,
}: HoverBorderGradientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gradient, setGradient] = useState({ x: 50, y: 50 });
  const [active, setActive] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGradient({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={`relative z-0 flex items-center justify-center overflow-hidden rounded-[inherit] bg-transparent ${containerClassName}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(circle at ${gradient.x}% ${gradient.y}%, color-mix(in oklab, var(--primary) 80%, transparent), transparent 40%)`,
        }}
      />
      <div
        className="absolute inset-0 z-20"
        style={{
          padding: "1px",
          borderRadius: "inherit",
          background: active
            ? `radial-gradient(circle at ${gradient.x}% ${gradient.y}%, var(--primary), transparent 60%)`
            : "transparent",
          transition: "background 0.3s ease",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <div className={`relative z-30 ${className}`}>{children}</div>
    </div>
  );
}
