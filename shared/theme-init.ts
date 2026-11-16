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

const prefersDark = (): boolean | undefined =>
  typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : undefined;

/** Whether the visitor picked a theme with the toggle (as opposed to the OS). */
export function hasStoredTheme(): boolean {
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "dark";
}

/**
 * Read the saved theme. Until the visitor picks one with the toggle (or when
 * a legacy `system` value from the former next-themes setup is stored), the
 * site follows the OS; `fallback` only applies where that cannot be read.
 */
export function readStoredTheme(
  fallback: "light" | "dark" = "light"
): "light" | "dark" {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  const dark = prefersDark();
  if (dark === undefined) {
    return fallback;
  }
  return dark ? "dark" : "light";
}

/**
 * `readStoredTheme` again, as source text for the one inline `<script>` in the
 * document head (app/root-document.tsx). Being parser-blocking, it puts the
 * theme class on `<html>` before first paint, so a stored choice that differs
 * from the OS no longer flashes the other theme while the bundle loads.
 *
 * Kept free of `<` and `&` so it needs no escaping inside the tag.
 */
export const THEME_BOOTSTRAP_SCRIPT =
  '(function(){try{var s=localStorage.getItem("theme");' +
  'var d=s==="dark"?true:s==="light"?false:window.matchMedia("(prefers-color-scheme: dark)").matches;' +
  'var r=document.documentElement;r.classList.remove("light","dark");' +
  'r.classList.add(d?"dark":"light");r.style.colorScheme=d?"dark":"light"}catch(e){}})()';

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
 * Apply the stored theme to `<html>` and sync the theme-color meta as soon as
 * the client bundle runs. The class itself is already set before paint by
 * `THEME_BOOTSTRAP_SCRIPT`; this keeps the two in agreement and owns the meta.
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
