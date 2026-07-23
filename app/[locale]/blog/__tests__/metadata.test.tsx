import { readFileSync } from "node:fs";

import type * as intlServer from "next-intl/server";
import { describe, expect, it, vi } from "vitest";

import type * as sourceModule from "@/shared/source";

import type * as rssLinkModule from "../rss-link";

import { generateMetadata } from "../page";

const readMessages = (locale: string): Record<string, unknown> =>
  JSON.parse(
    readFileSync(
      new URL(`../../../../shared/i18n/${locale}.json`, import.meta.url),
      "utf-8"
    )
  ) as Record<string, unknown>;

const dictionaries: Record<string, Record<string, unknown>> = {
  en: readMessages("en"),
  ja: readMessages("ja"),
  ko: readMessages("ko"),
};

vi.mock(import("next-intl/server"), () => ({
  getTranslations: vi.fn((options?: { locale?: string }) => {
    const dict = dictionaries[options?.locale ?? "en"] ?? dictionaries.en;
    return (key: string): string => {
      const value = key
        .split(".")
        .reduce<unknown>(
          (node, part) =>
            node && typeof node === "object"
              ? (node as Record<string, unknown>)[part]
              : undefined,
          dict
        );
      return typeof value === "string" ? value : key;
    };
  }),
}) as unknown as Partial<typeof intlServer>);

vi.mock(import("../list"), () => ({ BlogList: () => <div /> }));
vi.mock(import("../list-fallback"), () => ({
  BlogListFallback: () => <div />,
  BlogSearchShell: () => <div />,
}));
vi.mock(import("../rss-link"), () => ({
  RssLink: () => <div />,
}) as unknown as Partial<typeof rssLinkModule>);
vi.mock(import("@/components/language-selector"), () => ({
  LanguageSelector: () => <div />,
}));
vi.mock(import("@/shared/source"), () => ({
  blog: { getPages: vi.fn(() => []) },
  getPostsMetadata: vi.fn(() => []),
}) as unknown as Partial<typeof sourceModule>);

describe("app/[locale]/blog/page.tsx generateMetadata", () => {
  it.each([
    ["ko", dictionaries.ko.blogPageTitle],
    ["en", dictionaries.en.blogPageTitle],
    ["ja", dictionaries.ja.blogPageTitle],
  ])(
    "keeps the site-wide brand prefix and localizes the title for locale %s",
    async (locale, localizedTitle) => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale }),
        searchParams: Promise.resolve({}),
      });

      expect(metadata.title).toBe(`minpeter | ${localizedTitle}`);
    }
  );
});
