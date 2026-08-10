import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { BODIES } from "@/data/bodies";
import { MISSIONS } from "@/data/missions";

const ACTIONS = [
  { label: "Launch Explorer", hint: "Open the 3D solar system", to: "/explorer" },
  { label: "Research Console", hint: "Compare planetary datasets", to: "/research" },
  { label: "Mission Archive", hint: "Apollo through Europa Clipper", to: "/missions" },
  { label: "Telemetry", hint: "Live system metrics", to: "/telemetry" },
  { label: "AI Copilot", hint: "Ask the AI Scientist", to: "/copilot" },
  { label: "Gallery", hint: "NASA imagery catalogue", to: "/gallery" },
] as const;

/** Tiny procedural planet thumbnail built from the body's shader palette. */
function PlanetThumb({ body }: { body: (typeof BODIES)[number] }) {
  return (
    <span
      className="h-5 w-5 shrink-0 rounded-full"
      style={{
        background: `radial-gradient(circle at 32% 30%, ${body.palette.high}, ${body.palette.mid} 52%, ${body.palette.low} 100%)`,
        boxShadow: `0 0 10px -2px ${body.palette.mid}`,
      }}
      aria-hidden
    />
  );
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();

  const features = useMemo(
    () =>
      BODIES.flatMap((b) =>
        b.landmarks.map((l) => ({
          key: `${b.id}-${l.name}`,
          body: b,
          landmark: l,
        })),
      ),
    [],
  );

  const go = (to: string, search?: Record<string, string>) => {
    onOpenChange(false);
    navigate({ to, search: search as never });
  };

  const goMission = (id: string) => {
    onOpenChange(false);
    navigate({ to: "/missions", search: { mission: id } });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search features, bodies, missions, pages…" />
      <CommandList>
        <CommandEmpty>No records in the catalogue.</CommandEmpty>
        <CommandGroup heading="Surface features">
          {features.map((f) => (
            <CommandItem
              key={f.key}
              value={`${f.landmark.name} ${f.body.name} ${f.landmark.note}`}
              onSelect={() =>
                go(`/explorer/${f.body.id}`, {
                  lat: String(f.landmark.lat),
                  lon: String(f.landmark.lon),
                })
              }
            >
              <PlanetThumb body={f.body} />
              <span className="font-medium">{f.landmark.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {f.body.name} · {f.landmark.note}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Bodies">
          {BODIES.map((b) => (
            <CommandItem
              key={b.id}
              value={`${b.name} ${b.designation} ${b.classification}`}
              onSelect={() => go(`/explorer/${b.id}`)}
            >
              <PlanetThumb body={b} />
              <span className="font-medium">{b.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {b.designation} · {b.classification}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Missions">
          {MISSIONS.map((m) => (
            <CommandItem
              key={m.id}
              value={`${m.name} ${m.agency} ${m.status ?? ""}`}
              onSelect={() => goMission(m.id)}
            >
              <span className="font-medium">{m.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{m.agency}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Shortcuts">
          {ACTIONS.map((a) => (
            <CommandItem
              key={a.label}
              value={a.label}
              onSelect={() => go(a.to)}
              keywords={[a.hint]}
            >
              <span className="font-medium">{a.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">{a.hint}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex h-9 w-full max-w-72 items-center gap-2 rounded-full border border-border bg-card/50 px-3 text-left text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 truncate">Search the catalogue…</span>
      <kbd className="label-tele rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
    </button>
  );
}
