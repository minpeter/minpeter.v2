// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyStoredTheme,
  ensurePretendardFonts,
  holdStoreThemeColor,
  promoteDeferredFonts,
  syncThemeColorMeta,
} from "./theme-init";

const readThemeColors = () =>
  Array.from(
    document.head.querySelectorAll('meta[name="theme-color"]'),
    (meta) => meta.getAttribute("content")
  );

describe("promoteDeferredFonts", () => {
  afterEach(() => {
    document.head.innerHTML = "";
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
    localStorage.clear();
  });

  it("promotes SSR preload links without pre-assigned ids immediately", () => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "style";
    link.href = "/fonts/deferred-fonts.css";

    const pretendard = document.createElement("link");
    pretendard.rel = "preload";
    pretendard.as = "style";
    pretendard.href = "/fonts/pretendard.css";
    document.head.append(link, pretendard);

    // Preload links always report sheet === null before rel="stylesheet".
    expect(link.sheet).toBeNull();

    promoteDeferredFonts();

    expect(link.id).toBe("deferred-fonts");
    expect(link.rel).toBe("stylesheet");
    expect(pretendard.id).toBe("pretendard-fonts");
    expect(pretendard.rel).toBe("stylesheet");
  });

  it("is a safe no-op when #deferred-fonts is absent or already a stylesheet", () => {
    expect(() => promoteDeferredFonts()).not.toThrow();

    const link = document.createElement("link");
    link.id = "deferred-fonts";
    link.rel = "stylesheet";
    link.href = "/fonts/deferred-fonts.css";
    document.head.append(link);

    promoteDeferredFonts();
    expect(link.rel).toBe("stylesheet");
  });

  it("appends #pretendard-fonts once and stays idempotent across repeat mounts", () => {
    ensurePretendardFonts();
    ensurePretendardFonts();

    const links = document.head.querySelectorAll("#pretendard-fonts");
    expect(links).toHaveLength(1);
    expect((links[0] as HTMLLinkElement).href).toContain(
      "/fonts/pretendard.css"
    );
  });

  it("promotes an SSR preload link for /fonts/pretendard.css in place without duplicating it", () => {
    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "style";
    preloadLink.href = "/fonts/pretendard.css";
    document.head.append(preloadLink);

    ensurePretendardFonts();

    const links = document.head.querySelectorAll(
      'link[href="/fonts/pretendard.css"]'
    );
    expect(links).toHaveLength(1);
    expect(preloadLink.id).toBe("pretendard-fonts");
    expect(preloadLink.rel).toBe("stylesheet");
  });
});

describe("applyStoredTheme", () => {
  afterEach(() => {
    document.head.innerHTML = "";
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("applies light by default, creates/updates a single meta theme-color, and respects stored dark preference", () => {
    applyStoredTheme();
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(
      document.head.querySelectorAll('meta[name="theme-color"]')
    ).toHaveLength(1);
    expect(
      document.head
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content")
    ).toBe("#ffffff");

    localStorage.setItem("theme", "dark");
    applyStoredTheme();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(
      document.head.querySelectorAll('meta[name="theme-color"]')
    ).toHaveLength(1);
    expect(
      document.head
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content")
    ).toBe("#0a0a0b");
  });

  it("resolves a legacy stored system theme from the OS preference", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }))
    );
    localStorage.setItem("theme", "system");

    applyStoredTheme();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(readThemeColors()).toEqual(["#0a0a0b"]);
    vi.unstubAllGlobals();
  });

  it("starts store routes black before hydration and leaves other routes on the theme color", () => {
    for (const [path, color] of [
      ["/products", "#000000"],
      ["/en/products/maru60", "#000000"],
      ["/products-archive", "#ffffff"],
      ["/ja/blog", "#ffffff"],
    ] as const) {
      window.history.replaceState(null, "", path);
      applyStoredTheme();
      expect(readThemeColors(), path).toEqual([color]);
    }
    window.history.replaceState(null, "", "/");
  });
});

describe("holdStoreThemeColor", () => {
  afterEach(() => {
    document.head.innerHTML = "";
    document.documentElement.className = "";
  });

  it("keeps theme-color black while held, then restores the applied theme", () => {
    document.documentElement.classList.add("light");
    syncThemeColorMeta("light");

    const release = holdStoreThemeColor();
    expect(readThemeColors()).toEqual(["#000000"]);
    syncThemeColorMeta("light");
    expect(readThemeColors()).toEqual(["#000000"]);

    release();
    expect(readThemeColors()).toEqual(["#ffffff"]);
  });
});
