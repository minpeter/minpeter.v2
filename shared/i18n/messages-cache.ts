import { cacheLife, cacheTag } from "next/cache";
import { getMessages } from "next-intl/server";

import { routing } from "@/shared/i18n/routing";

type AppLocale = (typeof routing.locales)[number];

/**
 * Static message catalogs per locale — shared shell + every page under [locale].
 * Build id invalidates on deploy; tags allow on-demand revalidation if catalogs ever ship separately.
 */
export async function getCachedMessages(locale: string) {
  "use cache";
  cacheLife("max");
  cacheTag("i18n-messages", `i18n-messages-${locale}`);

  const resolved = (
    routing.locales.includes(locale as AppLocale)
      ? locale
      : routing.defaultLocale
  ) as AppLocale;

  return getMessages({ locale: resolved });
}
