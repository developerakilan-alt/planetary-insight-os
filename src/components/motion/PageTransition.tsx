import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Cinematic route transition: children fade / rise / unblur on navigation. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();
  const enter = reduce ? { opacity: 1 } : { opacity: 1, y: 0 };
  const leave = reduce ? { opacity: 0 } : { opacity: 0, y: -10 };
  const start = reduce ? { opacity: 0 } : { opacity: 0, y: 12 };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={start}
        animate={enter}
        exit={leave}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
