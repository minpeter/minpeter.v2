import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    // Playwright e2e lives under e2e/ and is not for Vitest.
    exclude: ["**/node_modules/**", "**/e2e/**", "**/dist/**", "**/.next/**"],
    globals: true,
    server: {
      deps: {
        // `next` ships no "exports" map, so its extensionless deep imports
        // (e.g. `next/navigation`) are unresolvable under Node's ESM loader.
        // Inlining next-intl routes it through Vite's resolver instead.
        inline: ["next-intl"],
      },
    },
  },
});

