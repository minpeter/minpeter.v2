/**
 * Client instrumentation runs before the app becomes interactive.
 * Keep side-effect bootstrapping here rather than in <script> / next/script
 * tags inside React trees: React logs an error whenever it has to create a
 * script element on the client (anything that remounts on navigation).
 *
 * The single exception is the theme bootstrap in app/root-document.tsx, which
 * must block first paint. It is server-rendered into <head> and never
 * remounts, because switching language is a full document navigation.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */

import { applyStoredTheme, promoteDeferredFonts } from "@/shared/theme-init";

// Sync: runs as soon as this module evaluates (before app interactive).
applyStoredTheme();
promoteDeferredFonts();

if (process.env.NODE_ENV === "development") {
  import("react-grab")
    .then(() => {
      if (typeof window !== "undefined" && window.__REACT_GRAB__) {
        console.info(
          "[react-grab] ready — hover a UI element, then ⌘C / Ctrl+C to copy context"
        );
      } else {
        console.warn(
          "[react-grab] module loaded but window.__REACT_GRAB__ is missing"
        );
      }
    })
    .catch((error: unknown) => {
      console.error("[react-grab] failed to load", error);
    });
}
