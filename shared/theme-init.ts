/**
 * Apply stored theme to <html> before paint when possible.
 * Must not be rendered as a React <script> — React 19 warns on client re-render
 * (e.g. locale soft-nav). Call from instrumentation-client only.
 */
const THEME_COLORS = {
  dark: "#0a0a0b",
  light: "#ffffff",
} as const;

export function syncThemeColorMeta(resolved: "light" | "dark"): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEME_COLORS[resolved]);
  }
}

export function applyStoredTheme(): void {
  try {
    const stored = localStorage.getItem("theme");
    const resolved = stored === "dark" ? "dark" : "light";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
    syncThemeColorMeta(resolved);
  } catch {
    // private mode / blocked storage
  }
}

/**
 * Promote deferred font preloads to stylesheets before hydration.
 * `<link rel="preload" as="style">` always has `sheet === null` even after the
 * preload finishes, so waiting for `load` misses fast/cached responses.
 * Switching `rel` to `"stylesheet"` immediately consumes the preload entry.
 */
export function promoteDeferredFonts(): void {
  for (const el of document.querySelectorAll(
    '#deferred-fonts, link[rel="preload"][href="/fonts/deferred-fonts.css"], link[rel="preload"][href="/fonts/pretendard.css"]'
  )) {
    if (!(el instanceof HTMLLinkElement)) {
      continue;
    }
    const href = el.getAttribute("href");
    if (href === "/fonts/deferred-fonts.css") {
      el.id = "deferred-fonts";
    } else if (href === "/fonts/pretendard.css") {
      el.id = "pretendard-fonts";
    }
    if (el.rel !== "stylesheet") {
      el.rel = "stylesheet";
    }
  }
}

/**
 * Lazily attach the Pretendard unicode-range stylesheet on Korean blog posts,
 * avoiding 124 extra @font-face declarations on routes that never use it.
 */
export function ensurePretendardFonts(): void {
  const existing = document.querySelector(
    '#pretendard-fonts, link[href="/fonts/pretendard.css"]'
  );
  if (existing instanceof HTMLLinkElement) {
    existing.id = "pretendard-fonts";
    if (existing.rel !== "stylesheet") {
      existing.rel = "stylesheet";
    }
    return;
  }
  const link = document.createElement("link");
  link.id = "pretendard-fonts";
  link.rel = "stylesheet";
  link.href = "/fonts/pretendard.css";
  document.head.append(link);
}
