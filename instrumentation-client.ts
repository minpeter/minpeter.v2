/**
 * Client instrumentation runs before the app becomes interactive.
 * Keep all side-effect bootstrapping here — never put <script> / next/script
 * in React trees (locale soft-nav re-renders them and React 19 errors).
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
