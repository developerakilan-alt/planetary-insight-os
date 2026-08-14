import type { ReactNode } from "react";

export interface MastheadMeta {
  label: string;
  value: ReactNode;
}

/**
 * Standard page masthead used by every route. Cinematic editorial treatment:
 * monospaced eyebrow, large display title with an optional serif flourish,
 * description, and a translucent glass meta strip. Keeps all pages on the same
 * premium "operations console" grid.
 */
export function PageMasthead({
  eyebrow,
  icon,
  title,
  description,
  meta = [],
  actions,
}: {
  eyebrow: string;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: MastheadMeta[];
  actions?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-glass-edge pb-10">
      <div className="leak-warm pointer-events-none absolute -top-24 right-0 h-72 w-full opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-3xl">
          <div className="label-tele flex items-center gap-2 text-primary">
            <span className="text-muted-foreground/50">/</span>
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{eyebrow}</span>
          </div>
          <h1 className="mt-4 text-[clamp(2.1rem,4.2vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {meta.length > 0 && (
        <div className="mt-9 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-glass-edge bg-glass-fill px-4 py-3 backdrop-blur-xl"
            >
              <div className="label-tele text-[9px]">{m.label}</div>
              <div className="mt-1 truncate font-mono text-sm tabular-nums text-foreground">
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
