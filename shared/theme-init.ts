import { locales } from "./i18n/locales.js";

const THEME_COLORS = {
  dark: "#0a0a0b",
  light: "#ffffff",
} as const;

/** Product store pages paint pure black regardless of the site theme. */
const STORE_THEME_COLOR = "#000000";
const STORE_PATH = new RegExp(
  `^(?:/(?:${locales.join("|")}))?/products(?:/|$)`,
  "u"
);
let storeThemeColorHolds = 0;

/**
 * Read the saved theme. A legacy `system` value (from the former next-themes
 * setup) keeps following the OS instead of silently becoming light.
 */
export function readStoredTheme(
  fallback: "light" | "dark" = "light"
): "light" | "dark" {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  if (stored === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return fallback;
}

/**
 * Synchronize a single imperative `<meta name="theme-color">` in `<head>`.
 * Kept outside React/Next ViewportBoundary so pre-hydration bootstrap neither
 * flashes light chrome for dark users nor collides with React hoistable hydration,
 * and soft navigations never reset it.
 */
export function syncThemeColorMeta(resolved: "light" | "dark"): void {
  writeThemeColorMeta(
    storeThemeColorHolds > 0 ? STORE_THEME_COLOR : THEME_COLORS[resolved]
  );
}

/**
 * Keep the browser chrome black while a store page is mounted; the returned
 * release restores the color of the theme applied to `<html>`.
 */
export function holdStoreThemeColor(): () => void {
  storeThemeColorHolds += 1;
  writeThemeColorMeta(STORE_THEME_COLOR);
  return () => {
    storeThemeColorHolds -= 1;
    syncThemeColorMeta(
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
  };
}

function writeThemeColorMeta(color: string): void {
  const [existing, ...duplicates] =
    document.head.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  for (const duplicate of duplicates) {
    duplicate.remove();
  }
  const meta = existing ?? document.createElement("meta");
  if (!existing) {
    meta.name = "theme-color";
    document.head.append(meta);
  }
  meta.content = color;
}

/**
 * Apply stored theme to <html> before paint when possible.
 * Must not be rendered as a React <script> — React 19 warns on client re-render
 * (e.g. locale soft-nav). Call from instrumentation-client only.
 */
export function applyStoredTheme(): void {
  try {
    const resolved = readStoredTheme();
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
    // Store pages hold black once hydrated; start black so the chrome never flashes the theme color.
    writeThemeColorMeta(
      STORE_PATH.test(window.location.pathname)
        ? STORE_THEME_COLOR
        : THEME_COLORS[resolved]
    );
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
