// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyStoredTheme,
  ensurePretendardFonts,
  promoteDeferredFonts,
} from "./theme-init";

describe("promoteDeferredFonts", () => {
  afterEach(() => {
    document.head.innerHTML = "";
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
    localStorage.clear();
  });

  it("promotes preload links immediately even when sheet is null and load already fired", () => {
    const link = document.createElement("link");
    link.id = "deferred-fonts";
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
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("applies light by default and respects stored dark preference", () => {
    applyStoredTheme();
    expect(document.documentElement.classList.contains("light")).toBe(true);

    localStorage.setItem("theme", "dark");
    applyStoredTheme();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });
});
