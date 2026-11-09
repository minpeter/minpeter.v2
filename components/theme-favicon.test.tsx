// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ThemeFavicon } from "./theme-favicon";
import { ThemeProvider } from "./theme-provider";
import { ModeToggle } from "./theme-toggle";

describe("ThemeFavicon", () => {
  afterEach(() => {
    cleanup();
    document.head.innerHTML = "";
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
    localStorage.clear();
  });

  it("hoists a single <meta name='theme-color'> and updates it across theme changes", () => {
    localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeFavicon />
        <ModeToggle label="Toggle theme" />
      </ThemeProvider>
    );

    const metas = document.head.querySelectorAll('meta[name="theme-color"]');
    expect(metas).toHaveLength(1);
    expect(metas[0]?.getAttribute("content")).toBe("#0a0a0b");
    expect(
      document.head
        .querySelector<HTMLLinkElement>("link[data-theme-favicon]")
        ?.getAttribute("href")
    ).toBe("/assets/favicon-dark.svg?theme=dark");

    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(
      document.head.querySelectorAll('meta[name="theme-color"]')
    ).toHaveLength(1);
    expect(
      document.head
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content")
    ).toBe("#ffffff");
  });
});
