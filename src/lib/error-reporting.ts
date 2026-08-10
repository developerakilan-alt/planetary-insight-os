import { reportLovableError } from "./lovable-error-reporting";

/**
 * Client-side error monitoring.
 *
 * - Always forwards errors to the Lovable editor reporting bridge.
 * - When `VITE_SENTRY_DSN` is configured, Sentry is loaded lazily and errors
 *   are also sent there. Without a DSN the bundle stays untouched — the
 *   in-app "Report this error" button falls back to a clipboard copy.
 */

type SentryClient = typeof import("@sentry/browser");

let sentry: SentryClient | null = null;
let initPromise: Promise<void> | null = null;

export function initErrorMonitoring() {
  if (typeof window === "undefined") return;

  const dsn = import.meta.env["VITE_SENTRY_DSN"];
  if (dsn && !initPromise) {
    initPromise = import("@sentry/browser")
      .then((Sentry) => {
        Sentry.init({ dsn, tracesSampleRate: 0.1 });
        sentry = Sentry;
      })
      .catch(() => {
        /* Sentry chunk failed to load — degrade to the built-in reporting only */
      });
  }

  window.addEventListener("error", (e) => {
    const err = e.error ?? new Error(e.message);
    sentry?.captureException(err);
    reportLovableError(err, { mechanism: "onerror" });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const err = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
    sentry?.captureException(err);
    reportLovableError(err, { mechanism: "unhandledrejection" });
  });
}

/** Human-readable, PII-free error summary used for clipboard fallback. */
export function errorDetail(error: unknown): string {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : String(error);
  const stack = error instanceof Error && error.stack ? `\n${error.stack}` : "";
  return `${message}${stack}\nRoute: ${typeof window !== "undefined" ? window.location.pathname : "unknown"}\nUser agent: ${
    typeof navigator !== "undefined" ? navigator.userAgent : "unknown"
  }`;
}

/**
 * Report an error to every configured channel. Returns `true` when a durable
 * channel (Sentry) accepted it; `false` means the caller should surface a
 * manual fallback (e.g. clipboard copy) to the user.
 */
export async function captureError(
  error: unknown,
  context: Record<string, unknown> = {},
): Promise<boolean> {
  if (initPromise) {
    try {
      await initPromise;
    } catch {
      /* ignore — fall through to the built-in reporter */
    }
  }
  if (sentry) {
    sentry.captureException(error, { extra: context });
    return true;
  }
  reportLovableError(error, { ...context, mechanism: "manual" });
  return false;
}
