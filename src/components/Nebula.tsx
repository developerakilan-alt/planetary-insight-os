export function Nebula({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className="absolute -left-[20%] top-[-30%] h-[80vh] w-[80vw] rounded-full opacity-[0.5] blur-[120px]"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, color-mix(in oklab, var(--primary) 26%, transparent), transparent 65%)",
        }}
      />
      <div
        className="absolute right-[-15%] top-[10%] h-[70vh] w-[60vw] rounded-full opacity-[0.35] blur-[140px]"
        style={{
          background:
            "radial-gradient(circle at 60% 50%, color-mix(in oklab, var(--secondary) 20%, transparent), transparent 65%)",
        }}
      />
      <div
        className="absolute bottom-[-30%] left-[25%] h-[60vh] w-[70vw] rounded-full opacity-[0.28] blur-[150px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--chart-5) 24%, transparent), transparent 68%)",
        }}
      />
      <div className="absolute inset-0 grid-fade opacity-60" />
    </div>
  );
}
