// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type * as intlServer from "next-intl/server";
import { describe, expect, it, vi } from "vitest";

import Footer from "../footer";

const messages: Record<string, string> = {
  "common.notes": "notes",
  "common.source": "source",
  "common.toggleTheme": "Toggle theme",
};

vi.mock(
  import("next-intl/server"),
  () =>
    ({
      getTranslations: vi.fn<() => Promise<(key: string) => string>>(() =>
        Promise.resolve((key: string) => messages[key] ?? key)
      ),
    }) as unknown as Partial<typeof intlServer>
);

const renderFooter = async (locale: string) => render(await Footer({ locale }));

describe("components/footer.tsx", () => {
  it("labels itself from the message catalog instead of a local map", async () => {
    await renderFooter("en");

    expect(screen.getByRole("link", { name: "notes" })).toBeDefined();
    expect(screen.getByRole("link", { name: "source" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeDefined();
  });

  it("prefixes the notes link for non-default locales only", async () => {
    const { unmount } = await renderFooter("en");
    expect(
      screen.getByRole("link", { name: "notes" }).getAttribute("href")
    ).toBe("/en/blog");
    unmount();

    await renderFooter("ko");
    expect(
      screen.getByRole("link", { name: "notes" }).getAttribute("href")
    ).toBe("/blog");
  });

  it("falls back to the default locale for unknown locale segments", async () => {
    await renderFooter("de");

    expect(
      screen.getByRole("link", { name: "notes" }).getAttribute("href")
    ).toBe("/blog");
  });
});
