import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  startSonification,
  stopSonification,
  isSonifying,
  playSequence,
  type SonifyValue,
} from "@/lib/sonify";

/**
 * Toggle that maps a set of telemetry values to a Web-Audio arpeggio.
 * Plays once on activation and on every values change while enabled.
 */
export function SonifyToggle({
  label = "Sonify",
  values,
}: {
  label?: string;
  values: SonifyValue[];
}) {
  const [on, setOn] = useState(false);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const toggle = () => {
    const next = !on;
    setOn(next);
    if (next) {
      startSonification();
      playSequence(valuesRef.current);
    } else {
      stopSonification();
    }
  };

  useEffect(() => {
    if (!on) return;
    playSequence(valuesRef.current);
  }, [on]);

  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      title={`${on ? "Stop" : "Play"} ${label}`}
      className={`flex h-9 items-center gap-2 rounded-full border px-3 text-xs transition-colors ${
        on
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {on ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
      <span>{on ? "Playing" : label}</span>
    </button>
  );
}

export { isSonifying };
