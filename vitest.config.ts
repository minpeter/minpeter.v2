import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
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
