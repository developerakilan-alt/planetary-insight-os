import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { isAmbientEnabled, primeAmbient, toggleAmbient } from "@/lib/audio";

/** Navbar toggle for the ambient cockpit hum. */
export function AmbientAudio() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isAmbientEnabled());
    primeAmbient();
  }, []);

  return (
    <button
      onClick={() => {
        const next = toggleAmbient();
        setOn(next);
      }}
      aria-label={on ? "Mute ambient audio" : "Enable ambient audio"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
        on
          ? "border-primary/50 text-primary"
          : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
      }`}
    >
      {on ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}
