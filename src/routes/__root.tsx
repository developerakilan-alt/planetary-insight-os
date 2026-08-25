import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { captureError, errorDetail, initErrorMonitoring } from "../lib/error-reporting";
import { registerServiceWorker } from "../lib/offline";
import { Navbar } from "@/components/Navbar";
import { AICopilot } from "@/components/AICopilot";
import { Toaster } from "@/components/ui/sonner";
import { CursorGlow } from "@/components/motion/CursorGlow";
import { PageTransition } from "@/components/motion/PageTransition";
import { WarpIntro } from "@/components/WarpIntro";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const [reportState, setReportState] = useState<"idle" | "sending" | "done">("idle");
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const reportError = async () => {
    if (reportState !== "idle") return;
    setReportState("sending");
    const sent = await captureError(error, { boundary: "tanstack_root_error_component" });
    if (!sent) {
      try {
        await navigator.clipboard.writeText(errorDetail(error));
      } catch {
        /* clipboard unavailable — nothing more we can do */
      }
    }
    setReportState("done");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        {error?.message && (
          <pre className="mt-4 max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-left text-xs text-red-300">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <button
            onClick={reportError}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {reportState === "done"
              ? "Error reported"
              : reportState === "sending"
                ? "Reporting…"
                : "Report this error"}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cosmos OS — AI Powered Planetary Intelligence Platform" },
      {
        name: "description",
        content:
          "Cosmos OS is an AI-powered planetary intelligence platform for 3D exploration, landing-site analysis and mission research.",
      },
      { name: "author", content: "Cosmos OS" },
      { property: "og:title", content: "Cosmos OS — The Future of Planetary Exploration" },
      {
        property: "og:description",
        content:
          "Explore nine worlds in 3D, score landing sites with AI and compare planetary datasets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#05070f" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Cosmos OS" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* One-time service-worker reset. A worker left by an older build can
            keep serving stale modules and crash hydration; this runs before
            any app code, unregisters workers and wipes caches once. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("cosmos-sw-reset")==="v3")return;if(navigator.serviceWorker){navigator.serviceWorker.getRegistrations().then(function(rs){for(var i=0;i<rs.length;i++)rs[i].unregister()})}if(window.caches){caches.keys().then(function(ks){for(var j=0;j<ks.length;j++)caches.delete(ks[j])})}localStorage.setItem("cosmos-sw-reset","v3")}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    initErrorMonitoring();
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CursorGlow />
      <WarpIntro />
      <Navbar />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <main>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <AICopilot />
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
