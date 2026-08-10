import { useEffect, useState } from "react";

const STORAGE_KEY = "cosmos-warp-v1";
const STREAKS = 110;

/**
 * One-time "warp in" intro on first visit: a radial star-streak burst that
 * stretches outward and fades to reveal the site. Skipped for reduced-motion.
 */
export function WarpIntro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => {
      setShow(true);
      setTimeout(() => {
        setShow(false);
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch {
          /* storage unavailable */
        }
      }, 2000);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-black" aria-hidden>
      <div className="absolute left-1/2 top-1/2">
        {Array.from({ length: STREAKS }, (_, i) => {
          const angle = (i / STREAKS) * 360;
          const delay = (i % 12) * 0.012;
          return (
            <span
              key={i}
              className="absolute left-0 top-0"
              style={
                {
                  width: 2,
                  height: 90,
                  transformOrigin: "50% 100%",
                  ["--wa" as string]: `${angle}deg`,
                  background: "linear-gradient(180deg, #bcdcff 0%, #4fd1ff 55%, transparent 100%)",
                  boxShadow: "0 0 10px rgba(127,197,255,0.6)",
                  opacity: 0,
                  animation: `warp 1.6s ${delay}s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
      <div
        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "#eaf6ff",
          boxShadow: "0 0 80px 36px rgba(159,216,255,0.55)",
          animation: "warp-core 1.7s ease-out forwards",
        }}
      />
      <div className="absolute inset-x-0 top-[58%] flex flex-col items-center gap-1.5 text-center">
        <span
          className="label-tele text-[10px] text-foreground/50"
          style={{ animation: "warp-fade 0.9s ease-out forwards" }}
        >
          ESTABLISHING INTERPLANETARY LINK
        </span>
        <div
          className="label-tele flex flex-col items-center gap-0.5 text-[9px] text-foreground/40"
          style={{ animation: "warp-fade 1.4s ease-out forwards" }}
        >
          <span>SYSTEM BOOT 04.2.1 · LOADING EPHEMERIS …</span>
          <span>CALIBRATING RENDER PIPELINE … LINK ESTABLISHED</span>
        </div>
      </div>
    </div>
  );
}
