import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, MapPin, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useSavedLibrary, exportItems, importItems } from "@/lib/saved";

/** Library panel: saved landing-site analyses and bookmarked landmarks. */
export function SavedLibrary() {
  const { items, remove, clear } = useSavedLibrary();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const doExport = () => {
    const blob = new Blob([exportItems()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cosmos-os-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { added } = importItems(String(reader.result));
        toast.success(`Imported ${added} saved items`);
      } catch {
        toast.error("Could not import that file");
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setImporting(false);
      toast.error("Could not read that file");
    };
    reader.readAsText(file);
  };

  const analysis = items.filter((i) => i.kind === "analysis");
  const landmarks = items.filter((i) => i.kind === "landmark");

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="label-tele">Saved library</div>
          <div className="label-tele mt-1 text-[9px]">
            {items.length} items · stored on this device
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={doExport}
            disabled={items.length === 0}
            aria-label="Export library"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Import library"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <Upload className={`h-3.5 w-3.5 ${importing ? "animate-spin" : ""}`} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setImporting(true);
                doImport(f);
              }
            }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {analysis.map((i) => (
          <div
            key={i.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/40 px-3 py-2"
          >
            <Link
              to="/explorer/$body"
              params={{ body: i.bodyId }}
              search={{ lat: String(i.lat), lon: String(i.lon) }}
              className="flex min-w-0 items-center gap-2 text-left"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate text-sm">
                  {i.bodyName} · {i.lat.toFixed(2)}°, {i.lon.toFixed(2)}°
                </span>
                <span className="label-tele text-[9px]">
                  {i.verdict} · score {i.score}/100
                </span>
              </span>
            </Link>
            <button
              onClick={() => remove(i.id)}
              aria-label="Remove saved analysis"
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {landmarks.map((i) => (
          <div
            key={i.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/40 px-3 py-2"
          >
            <Link
              to="/explorer/$body"
              params={{ body: i.bodyId }}
              search={{ lat: String(i.lat), lon: String(i.lon) }}
              className="flex min-w-0 items-center gap-2 text-left"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate text-sm">{i.landmarkName}</span>
                <span className="label-tele text-[9px]">{i.bodyName}</span>
              </span>
            </Link>
            <button
              onClick={() => remove(i.id)}
              aria-label="Remove saved landmark"
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {items.length > 0 ? (
        <button
          onClick={() => {
            clear();
            toast("Library cleared");
          }}
          className="label-tele mt-4 text-[9px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Clear library
        </button>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Nothing saved yet. Use the bookmark buttons next to a landing-site analysis or a named
          feature to keep it here.
        </p>
      )}

      <div className="label-tele mt-3 text-[9px] leading-relaxed">
        Library data stays on this device and can be exported as JSON.
      </div>
    </div>
  );
}
