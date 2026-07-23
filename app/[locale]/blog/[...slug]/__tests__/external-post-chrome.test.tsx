// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type * as fumadocsPage from "fumadocs-ui/page";
import type * as intlServer from "next-intl/server";
import { describe, expect, it, vi } from "vitest";

import type * as sourceModule from "@/shared/source";

import type * as mdxComponentsModule from "../mdx-components";
import Page from "../page";

vi.mock(import("next-intl/server"), () => ({
  getTranslations: vi.fn(() => (key: string) => {
    const messages: Record<string, string> = {
      backToBlog: "글 목록으로",
    };
    return messages[key] ?? key;
  }),
}) as unknown as Partial<typeof intlServer>);

vi.mock(import("@/shared/source"), () => ({
  blog: {
    getPage: vi.fn(() => ({
      data: {
        external_url: "https://example.com/external-post",
        published: "2024-01-01",
        title: "External Post",
      },
      slugs: ["external-post"],
      url: "/blog/external-post",
    })),
  },
}) as unknown as Partial<typeof sourceModule>);

vi.mock(import("@/components/language-selector"), () => ({
  LanguageSelector: () => <div />,
}));

vi.mock(import("@/shared/styles/stagger-fade-in.module.css"), () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}));

vi.mock(import("fumadocs-ui/page"), () => ({
  DocsBody: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}) as unknown as Partial<typeof fumadocsPage>);

vi.mock(import("../mdx-components"), () => ({
  createBlogMdxComponents: () => ({}),
}) as unknown as Partial<typeof mdxComponentsModule>);

vi.mock(import("../post-footer"), () => ({ PostFooter: () => <div /> }));
vi.mock(import("../post-toc"), () => ({ PostToc: () => <div /> }));

describe("app/[locale]/blog/[...slug]/page.tsx external-linked post", () => {
  it("keeps the header chrome with a back-to-blog link around the redirect", async () => {
    const ui = await Page({
      params: Promise.resolve({ locale: "ko", slug: ["external-post"] }),
      searchParams: Promise.resolve({}),
    });

    render(
      <NextIntlClientProvider
        locale="ko"
        messages={{
          externalRedirect: {
            link: "자동으로 이동하지 않으면 여기를 누르세요.",
            message: "{count}초 후 외부 링크로 이동합니다…",
          },
        }}
      >
        {ui}
      </NextIntlClientProvider>
    );

    const backLink = screen.getByRole("link", { name: "글 목록으로" });
    expect(backLink.getAttribute("href")).toBe("/ko/blog");
  });

  it("keeps the redirect panel inside one viewport under the header", async () => {
    const ui = await Page({
      params: Promise.resolve({ locale: "ko", slug: ["external-post"] }),
      searchParams: Promise.resolve({}),
    });

    const { container } = render(
      <NextIntlClientProvider
        locale="ko"
        messages={{
          externalRedirect: {
            link: "자동으로 이동하지 않으면 여기를 누르세요.",
            message: "{count}초 후 외부 링크로 이동합니다…",
          },
        }}
      >
        {ui}
      </NextIntlClientProvider>
    );

    const section = container.querySelector("section");
    expect(section?.className).toContain("flex-1");
    expect(section?.className).toContain("flex-col");
    expect(section?.className).not.toContain("min-h-dvh");
    // The page fragment must not force its own viewport height: the layout
    // body (min-h-screen) owns the viewport, and the section flex-1 fills
    // the space between header and footer without adding scroll.
    expect(container.querySelectorAll(".min-h-dvh")).toHaveLength(0);

    const countdown = screen.getByText(/초 후 외부 링크로 이동합니다/);
    const panel = countdown.closest("div.flex-1");
    expect(panel).not.toBeNull();
    expect(panel?.className).not.toContain("min-h-dvh");
  });
});
