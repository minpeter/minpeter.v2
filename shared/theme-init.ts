/**
 * Apply stored/system theme to <html> before paint when possible.
 * Must not be rendered as a React <script> — React 19 warns on client re-render
 * (e.g. locale soft-nav). Call from instrumentation-client only.
 */
export function applyStoredTheme(): void {
  try {
    const storageKey = "theme";
    const defaultTheme = "light";
    const stored = localStorage.getItem(storageKey) || defaultTheme;
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const resolved = stored === "system" ? system : stored;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (resolved === "light" || resolved === "dark") {
      root.classList.add(resolved);
      root.style.colorScheme = resolved;
    }
  } catch {
    // private mode / blocked storage
  }
}

/** Promote deferred font preload to stylesheet (race-safe). */
export function promoteDeferredFonts(): void {
  const el = document.getElementById("deferred-fonts");
  if (!(el instanceof HTMLLinkElement)) {
    return;
  }
  const promote = () => {
    el.rel = "stylesheet";
  };
  if (el.sheet) {
    promote();
    return;
  }
  el.addEventListener("load", promote);
}
