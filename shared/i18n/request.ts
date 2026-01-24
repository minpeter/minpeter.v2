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

  // If current locale is not the default, merge with fallback messages
  // This ensures missing translations fall back to the default locale (ko)
  // ref: https://next-intl-80nf5cxec-amann.vercel.app/docs/usage/error-handling#fallbacks-from-other-locales
  if (locale === routing.defaultLocale) {
    const messages = (await import(`./${locale}.json`)).default;
    return {
      locale,
      messages,
    };
  }

  const [{ default: currentMessages }, { default: defaultMessages }] =
    await Promise.all([
      import(`./${locale}.json`),
      import(`./${routing.defaultLocale}.json`),
    ]);
  const messages = deepmerge(defaultMessages, currentMessages, {
    arrayMerge: (_destination, source) => source,
  });
  return {
    locale,
    messages,
  };
});
