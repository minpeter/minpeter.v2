// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type * as intlServer from "next-intl/server";
import { describe, expect, it, vi } from "vitest";

import Page from "../page";

vi.mock(import("next-intl/server"), () => ({
  getTranslations: vi.fn(() => (key: string) => key),
}) as unknown as Partial<typeof intlServer>);

vi.mock(import("@/shared/styles/stagger-fade-in.module.css"), () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}));

describe("app/[locale]/73e3da.../page.tsx poem", () => {
  it("separates the backlink from the poem content with clear spacing", async () => {
    const ui = await Page({
      params: Promise.resolve({ locale: "ko" }),
      searchParams: Promise.resolve({}),
    });

    const { container } = render(ui);
    const section = container.querySelector("section");

    expect(section?.className).toContain("gap-6");
  });
});
