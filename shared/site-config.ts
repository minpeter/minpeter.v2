import type { routing } from "@/shared/i18n/routing";

type Locale = (typeof routing.locales)[number];

export const siteConfig = {
  author: "minpeter",
  description: {
    en: "minpeter's blog - Stories about development, web, and cloud",
    ja: "minpeterのブログ - 開発、ウェブ、クラウドについての話",
    ko: "minpeter의 블로그 - 개발, 웹, 클라우드에 대한 이야기",
  } satisfies Record<Locale, string>,
  keywords: [
    "minpeter",
    "blog",
    "development",
    "web",
    "frontend",
    "backend",
    "server",
    "cloud",
    "k8s",
  ] as string[],
  title: "minpeter",
} as const;

export function getSiteDescription(locale: Locale): string {
  return siteConfig.description[locale];
}
