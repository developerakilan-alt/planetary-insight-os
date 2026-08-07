import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { BODIES } from "@/data/bodies";
import { MISSIONS } from "@/data/missions";

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
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

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search surface features, bodies, missions…" />
      <CommandList>
        <CommandEmpty>No records in the catalogue.</CommandEmpty>
        <CommandGroup heading="Surface features">
          {features.map((f) => (
            <CommandItem
              key={f.key}
              value={`${f.landmark.name} ${f.body.name} ${f.landmark.note}`}
              onSelect={() =>
                go(`/explorer/${f.body.id}`, { lat: String(f.landmark.lat), lon: String(f.landmark.lon) })
              }
            >
              <span className="font-medium">{f.landmark.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {f.body.name} · {f.landmark.note}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Bodies">
          {BODIES.map((b) => (
            <CommandItem key={b.id} value={`${b.name} ${b.designation}`} onSelect={() => go(`/explorer/${b.id}`)}>
              <span className="font-medium">{b.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{b.designation}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Missions">
          {MISSIONS.map((m) => (
            <CommandItem key={m.id} value={`${m.name} ${m.agency}`} onSelect={() => go("/missions")}>
              <span className="font-medium">{m.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{m.agency}</span>
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

export function useSearchHotkey(setOpen: (fn: (v: boolean) => boolean) => void) {
  const [state] = useState(null);
  return state;
}
