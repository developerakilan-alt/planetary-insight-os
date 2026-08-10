import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Standalone Vitest config — kept separate from vite.config.ts because the
// TanStack/Lovable vite config does not support the `test` block.
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
