import type { ReactNode } from "react";

export interface MastheadMeta {
  label: string;
  value: ReactNode;
}

/**
 * Standard page masthead used by every route: eyebrow + title + description,
 * with an optional meta strip and action slot. Keeps all pages on the same
 * professional "operations console" grid.
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
    <header className="border-b border-border pb-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-3xl">
          <div className="label-tele flex items-center gap-2 text-primary">
            <span className="text-muted-foreground/50">/</span>
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{eyebrow}</span>
          </div>
          <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,3rem)] font-semibold tracking-[-0.02em]">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {meta.length > 0 && (
        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {meta.map((m) => (
            <div key={m.label} className="bg-surface px-4 py-3">
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
