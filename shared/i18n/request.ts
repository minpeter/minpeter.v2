import deepmerge from "deepmerge";
import type { Formats } from "next-intl";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export const formats = {
  dateTime: {
    short: {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  },
  number: {
    precise: {
      maximumFractionDigits: 5,
    },
  },
  list: {
    enumeration: {
      style: "long",
      type: "conjunction",
    },
  },
} satisfies Formats;

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Load current locale messages
  const currentMessages = (await import(`./${locale}.json`)).default;

  // If current locale is not the default, merge with fallback messages
  // This ensures missing translations fall back to the default locale (ko)
  // ref: https://next-intl-80nf5cxec-amann.vercel.app/docs/usage/error-handling#fallbacks-from-other-locales
  let messages = currentMessages;
  if (locale !== routing.defaultLocale) {
    const defaultMessages = (await import(`./${routing.defaultLocale}.json`))
      .default;
    messages = deepmerge(defaultMessages, currentMessages);
  }

  return {
    locale,
    messages,
  };
});
