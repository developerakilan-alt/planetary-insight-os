/** Offline / PWA helpers: service-worker registration and HD texture pack caching. */

export function isServiceWorkerSupported(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

export function registerServiceWorker(): void {
  if (!isServiceWorkerSupported() || import.meta.env.SSR) return;
  if (import.meta.env.DEV) return; // only register in production builds
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The app must keep working even if the SW fails to register.
    });
  });
}

export function swController(): ServiceWorker | null {
  if (!isServiceWorkerSupported()) return null;
  return navigator.serviceWorker.controller;
}

/**
 * Cache a set of texture URLs for offline use.
 * - With an active service worker the request is delegated to the SW cache.
 * - Without one we simply prefetch the images so they land in the HTTP cache.
 */
export async function cacheTexturePack(
  urls: string[],
): Promise<{ cached: number; mode: "sw" | "prefetch" }> {
  const unique = [...new Set(urls)];
  if (isServiceWorkerSupported() && navigator.serviceWorker.controller) {
    try {
      const msg = await new Promise<{ type: string; count?: number }>((resolve, reject) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (e) => resolve(e.data);
        setTimeout(() => reject(new Error("sw-timeout")), 60_000);
        navigator.serviceWorker.controller!.postMessage({ type: "CACHE_TEXTURES", urls: unique }, [
          channel.port2,
        ]);
      });
      if (msg.type === "CACHE_DONE") return { cached: msg.count ?? unique.length, mode: "sw" };
    } catch {
      /* fall through to prefetch */
    }
  }
  await Promise.all(
    unique.map(
      (u) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = u;
        }),
    ),
  );
  return { cached: unique.length, mode: "prefetch" };
}

/** Warm the browser/HTTP cache for a set of texture URLs (no decode until used). */
export function preloadImages(urls: string[]): void {
  if (typeof window === "undefined") return;
  for (const u of [...new Set(urls)]) {
    const img = new Image();
    img.decoding = "async";
    img.src = u;
  }
}

/** Run a callback when the browser is idle, with a setTimeout fallback. */
export function whenIdle(cb: () => void, timeoutMs = 1200): void {
  if (typeof window === "undefined") return;
  const win = window as Window & { requestIdleCallback?: (cb: () => void) => number };
  if (typeof win.requestIdleCallback === "function") {
    win.requestIdleCallback(cb);
  } else {
    setTimeout(cb, timeoutMs);
  }
}

export function haptic(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* unsupported */
    }
  }
}
