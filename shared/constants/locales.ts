import type { routing } from "@/shared/i18n/routing";

export type LocaleCode = (typeof routing.locales)[number];

export interface LocaleLabel {
  short: string;
  native: string;
}

export const LOCALE_LABELS: Record<LocaleCode, LocaleLabel> = {
  ko: { short: "KO", native: "한국어" },
  en: { short: "EN", native: "English" },
  ja: { short: "JA", native: "日本語" },
};
