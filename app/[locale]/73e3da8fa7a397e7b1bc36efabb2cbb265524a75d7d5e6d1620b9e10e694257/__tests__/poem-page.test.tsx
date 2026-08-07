// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type * as intlServer from "next-intl/server";
import { describe, expect, it, vi } from "vitest";

import Page from "../page";

vi.mock(
  import("next-intl/server"),
  () =>
    ({
      getLocale: vi.fn(() => Promise.resolve("ko")),
      getTranslations: vi.fn(() => (key: string) => key),
    }) as unknown as Partial<typeof intlServer>
);

vi.mock(import("@/shared/styles/stagger-fade-in.module.css"), () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}));

describe("app/[locale]/73e3da.../page.tsx poem", () => {
  it("separates the backlink from the poem content with clear spacing", async () => {
    const ui = await Page();

    // The backlink resolves its locale prefix through next-intl navigation.
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={{}}>
        {ui}
      </NextIntlClientProvider>
    );
    const section = container.querySelector("section");

    expect(section?.className).toContain("gap-6");
  });
});
