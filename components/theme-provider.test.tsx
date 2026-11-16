// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "./theme-provider";
import { ModeToggle } from "./theme-toggle";

function mockOsTheme(dark: boolean) {
  const query = Object.assign(new EventTarget(), { matches: dark });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => query)
  );
  return (nextDark: boolean) => {
    act(() => {
      query.matches = nextDark;
      query.dispatchEvent(new Event("change"));
    });
  };
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <ModeToggle label="Toggle theme" />
    </ThemeProvider>
  );
}

describe("ThemeProvider", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
  });

  it.each([null, "system"])(
    "tracks live OS changes with stored theme %s",
    (stored) => {
      if (stored) {
        localStorage.setItem("theme", stored);
      }
      const setOsDark = mockOsTheme(true);
      renderTheme();
      expect(document.documentElement.className).toBe("dark");

      setOsDark(false);
      expect(document.documentElement.className).toBe("light");
      expect(document.documentElement.style.colorScheme).toBe("light");
      setOsDark(true);
      expect(document.documentElement.className).toBe("dark");
    }
  );

  it.each(["light", "dark"])("keeps saved %s when the OS changes", (stored) => {
    localStorage.setItem("theme", stored);
    const setOsDark = mockOsTheme(stored !== "dark");
    renderTheme();
    expect(document.documentElement.className).toBe(stored);

    setOsDark(false);
    setOsDark(true);
    expect(document.documentElement.className).toBe(stored);
  });

  it("stops following the OS after a manual choice and restores it on remount", () => {
    const setOsDark = mockOsTheme(true);
    const { unmount } = renderTheme();
    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(localStorage.getItem("theme")).toBe("light");

    setOsDark(false);
    setOsDark(true);
    expect(document.documentElement.className).toBe("light");
    unmount();
    renderTheme();
    expect(document.documentElement.className).toBe("light");
  });

  it("keeps following the OS when storage access throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    const setOsDark = mockOsTheme(true);
    renderTheme();
    expect(document.documentElement.className).toBe("dark");

    setOsDark(false);
    expect(document.documentElement.className).toBe("light");
    setOsDark(true);
    expect(document.documentElement.className).toBe("dark");
  });

  it("removes the OS listener on unmount", () => {
    const setOsDark = mockOsTheme(false);
    const { unmount } = renderTheme();
    unmount();
    setOsDark(true);
    expect(document.documentElement.className).toBe("light");
  });
});
