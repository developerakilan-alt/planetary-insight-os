import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronsLeftRight, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: ReactNode;
}

function InnerLink({
  link,
  open,
  active,
  onClick,
  asButton,
}: {
  link: SidebarLinkItem;
  open: boolean;
  active?: boolean | undefined;
  onClick?: (() => void) | undefined;
  asButton?: boolean | undefined;
}) {
  const content = (
    <>
      <span
        className={cn(
          "relative z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {link.icon}
      </span>
      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-20 overflow-hidden whitespace-nowrap text-sm font-medium"
          >
            {link.label}
          </motion.span>
        )}
      </AnimatePresence>
      {active && (
        <span className="absolute inset-y-1 right-1 z-10 w-[3px] rounded-full bg-primary" />
      )}
    </>
  );

  const classes = cn(
    "group relative flex items-center gap-3 overflow-hidden rounded-xl border border-transparent px-2 py-2 transition-all duration-200 hover:border-glass-edge hover:bg-glass-fill-strong",
    active && "border-glass-edge bg-glass-fill-strong",
  );

  if (asButton) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }
  if (link.href.startsWith("/")) {
    return (
      <Link to={link.href} onClick={onClick} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <a href={link.href} onClick={onClick} className={classes}>
      {content}
    </a>
  );
}

/**
 * Collapsible navigation rail. Place as the LAST child of a flex-row container
 * so the dashboard content sits on the left and navigation hugs the right
 * edge. On mobile it becomes a floating toggle plus a right-hand drawer.
 */
export function Sidebar({
  open,
  setOpen,
  links,
  footer,
  logo,
  activeLabel,
  onLinkClick,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  links: SidebarLinkItem[];
  footer?: ReactNode;
  logo?: ReactNode;
  /** Explicit active item label — overrides pathname matching (for section navigation). */
  activeLabel?: string | undefined;
  /** Custom click handler. Hash links ("#…") render as buttons when provided. */
  onLinkClick?: ((link: SidebarLinkItem) => void) | undefined;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-24 hidden h-[calc(100vh-7.5rem)] shrink-0 md:block">
        <motion.div
          animate={{ width: open ? 236 : 76 }}
          initial={false}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="panel flex h-full flex-col justify-between gap-8 overflow-hidden p-3"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            {logo}
            <nav className="flex flex-col gap-1.5">
              {links.map((link) => (
                <InnerLink
                  key={link.label}
                  link={link}
                  open={open}
                  active={
                    activeLabel !== undefined
                      ? link.label === activeLabel
                      : link.href === pathname ||
                        (link.href !== "/" && pathname.startsWith(link.href))
                  }
                  asButton={onLinkClick !== undefined && link.href.startsWith("#")}
                  onClick={onLinkClick ? () => onLinkClick(link) : undefined}
                />
              ))}
            </nav>
          </div>
          <div className="flex flex-col gap-2">
            {footer}
            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={open ? "Collapse navigation" : "Expand navigation"}
              className="glass-chip press flex h-9 items-center justify-center gap-2 rounded-full text-muted-foreground hover:text-foreground"
            >
              <ChevronsLeftRight
                className={cn("h-4 w-4 transition-transform duration-300", !open && "rotate-180")}
              />
              <AnimatePresence initial={false}>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="label-tele overflow-hidden whitespace-nowrap"
                  >
                    Collapse
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open dashboard navigation"
        className="glass-chip press fixed right-4 top-[5.4rem] z-40 flex h-11 w-11 items-center justify-center rounded-full text-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="panel absolute bottom-0 right-0 top-0 flex w-72 flex-col justify-between gap-8 rounded-r-none p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-6 overflow-y-auto">
                <div className="flex items-center justify-between">
                  {logo}
                  <button
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation"
                    className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <nav className="flex flex-col gap-1.5">
                  {links.map((link) => (
                    <InnerLink
                      key={link.label}
                      link={link}
                      open
                      active={
                        activeLabel !== undefined
                          ? link.label === activeLabel
                          : link.href === pathname ||
                            (link.href !== "/" && pathname.startsWith(link.href))
                      }
                      asButton={onLinkClick !== undefined && link.href.startsWith("#")}
                      onClick={
                        onLinkClick
                          ? () => {
                              onLinkClick(link);
                              setMobileOpen(false);
                            }
                          : () => setMobileOpen(false)
                      }
                    />
                  ))}
                </nav>
              </div>
              {footer}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function SidebarBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col", className)}>{children}</div>;
}
