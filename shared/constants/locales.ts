import type { routing } from "@/shared/i18n/routing";

export type LocaleCode = (typeof routing.locales)[number];

export interface LocaleLabel {
  native: string;
  short: string;
}

export const LOCALE_LABELS: Record<LocaleCode, LocaleLabel> = {
  en: { native: "English", short: "EN" },
  ja: { native: "日本語", short: "JA" },
  ko: { native: "한국어", short: "KO" },
};
