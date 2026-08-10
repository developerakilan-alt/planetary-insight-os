import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type {
  PlanetVisualConfig,
  Quality,
  RotationMode,
  VisualizationMode,
} from "@/data/planets/types";

export const ROTATION_LABELS: Record<RotationMode, string> = {
  realistic: "Realistic",
  fast: "Fast",
  pause: "Pause",
  reverse: "Reverse",
};

export const MODE_LABELS: Record<VisualizationMode, string> = {
  natural: "Natural",
  elevation: "Elevation",
  terrain: "Terrain",
  infrared: "Infrared",
  scientific: "Scientific",
  night: "Night",
};

export function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background/70 p-1 backdrop-blur-xl">
      <span className="label-tele pl-2 text-[9px]">{label}</span>
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            value === v
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs backdrop-blur-xl transition-colors ${
        on ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-secondary" : "bg-border-strong"}`} />
    </button>
  );
}

export interface GlobeControlPanelProps {
  config: PlanetVisualConfig;
  mode: VisualizationMode;
  onMode: (m: VisualizationMode) => void;
  rotation: RotationMode;
  onRotation: (r: RotationMode) => void;
  lighting: "sun" | "studio" | "terminator";
  onLighting: (l: "sun" | "studio" | "terminator") => void;
  quality: Quality;
  onQuality: (q: Quality) => void;
  atmosphere: boolean;
  onAtmosphere: (b: boolean) => void;
  clouds: boolean;
  onClouds: (b: boolean) => void;
  exaggeration: number;
  onExaggeration: (n: number) => void;
  hdPack: { downloading: boolean; onDownload: () => void };
  showAtmosphere?: boolean;
  showClouds?: boolean;
  showExaggeration?: boolean;
}

export function GlobeControlPanel({
  config,
  mode,
  onMode,
  rotation,
  onRotation,
  lighting,
  onLighting,
  quality,
  onQuality,
  atmosphere,
  onAtmosphere,
  clouds,
  onClouds,
  exaggeration,
  onExaggeration,
  hdPack,
  showAtmosphere = true,
  showClouds = true,
  showExaggeration = true,
}: GlobeControlPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented
        label="Layer"
        value={mode}
        onChange={(v) => onMode(v as VisualizationMode)}
        options={config.modes.map((m) => [m, MODE_LABELS[m]])}
      />
      <Segmented
        label="Rotation"
        value={rotation}
        onChange={(v) => onRotation(v as RotationMode)}
        options={(Object.keys(ROTATION_LABELS) as RotationMode[]).map((r) => [
          r,
          ROTATION_LABELS[r],
        ])}
      />
      <Segmented
        label="Lighting"
        value={lighting}
        onChange={(v) => onLighting(v as typeof lighting)}
        options={[
          ["sun", "Solar"],
          ["studio", "Studio"],
          ["terminator", "Terminator"],
        ]}
      />
      <Segmented
        label="Quality"
        value={quality}
        onChange={(v) => onQuality(v as Quality)}
        options={[
          ["auto", "Auto"],
          ["low", "Low"],
          ["medium", "Med"],
          ["high", "High"],
          ["ultra", "Ultra"],
        ]}
      />
      {showAtmosphere && config.atmosphere && (
        <Toggle label="Atmosphere" on={atmosphere} onClick={() => onAtmosphere(!atmosphere)} />
      )}
      {showClouds && config.clouds && (
        <Toggle label="Clouds" on={clouds} onClick={() => onClouds(!clouds)} />
      )}
      {showExaggeration && config.elevation && (
        <div className="flex w-56 items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 backdrop-blur-xl">
          <span className="label-tele shrink-0 text-[9px]">Relief</span>
          <input
            type="range"
            min={1}
            max={config.elevation.maxExaggeration}
            step={0.5}
            value={exaggeration}
            onChange={(e) => onExaggeration(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
          <span className="w-10 text-right font-mono text-[11px] text-primary">
            {exaggeration.toFixed(1)}×
          </span>
        </div>
      )}
      <button
        onClick={hdPack.onDownload}
        disabled={hdPack.downloading}
        className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs backdrop-blur-xl transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
      >
        {hdPack.downloading ? (
          <span className="label-tele">Caching HD pack…</span>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            Download HD pack
          </>
        )}
      </button>
    </div>
  );
}

export function MobileGlobeControls(props: GlobeControlPanelProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2.5 text-xs font-medium shadow-lg backdrop-blur-xl md:hidden"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" /> Controls
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto pb-8">
          <SheetHeader>
            <SheetTitle>Globe controls</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <GlobeControlPanel {...props} />
          </div>
          {props.mode === "infrared" && (
            <p className="label-tele mt-4 border-t border-border pt-3 text-[9px] leading-relaxed text-muted-foreground">
              Infrared is a modeled thermal view derived from real elevation / radar data — not a
              direct thermal-IR photograph.
            </p>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
