import { cacheLife } from "next/cache";
import { getMessages } from "next-intl/server";

/** Mirrors `shared/i18n/locales.js` — keep in sync with `routing.locales`. */
type AppLocale = "en" | "ja" | "ko";

/**
 * Static message catalogs per locale (layout shell).
 * Caller must pass a validated locale (see `[locale]/layout` + `hasLocale`).
 */
export async function getCachedMessages(locale: AppLocale) {
  "use cache";
  cacheLife("max");

  return await getMessages({ locale });
}
