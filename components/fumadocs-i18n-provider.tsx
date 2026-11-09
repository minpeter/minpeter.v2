"use client";

import { I18nProvider } from "fumadocs-ui/contexts/i18n";
import type { ReactNode } from "react";

const FUMADOCS_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {},
  ja: {
    "Close(image zoom)(aria-label)": "閉じる",
    "Copied Anchor Link(heading anchor)(aria-label)":
      "見出しリンクをコピー済み",
    "Copied Text(code block)(aria-label)": "コードをコピー済み",
    "Copy Anchor Link(heading anchor)(aria-label)": "見出しリンクをコピー",
    "Copy Text(code block)(aria-label)": "コードをコピー",
    "Image Viewer(image zoom)(aria-label)": "画像ビューアー",
    "Next Image(image zoom)(aria-label)": "次の画像",
    "Previous Image(image zoom)(aria-label)": "前の画像",
  },
  ko: {
    "Close(image zoom)(aria-label)": "닫기",
    "Copied Anchor Link(heading anchor)(aria-label)": "섹션 링크 복사됨",
    "Copied Text(code block)(aria-label)": "코드 복사됨",
    "Copy Anchor Link(heading anchor)(aria-label)": "섹션 링크 복사",
    "Copy Text(code block)(aria-label)": "코드 복사",
    "Image Viewer(image zoom)(aria-label)": "이미지 뷰어",
    "Next Image(image zoom)(aria-label)": "다음 이미지",
    "Previous Image(image zoom)(aria-label)": "이전 이미지",
  },
};

export function FumadocsI18nProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  return (
    <I18nProvider
      locale={locale}
      translations={FUMADOCS_TRANSLATIONS[locale] ?? FUMADOCS_TRANSLATIONS.en}
    >
      {children}
    </I18nProvider>
  );
}
