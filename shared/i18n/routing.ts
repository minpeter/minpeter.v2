import { defineRouting } from "next-intl/routing";

const LOCALE_COOKIE_NAME = "MINPETER-LOCATE";

const DAYS_IN_MONTH = 30;
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * DAYS_IN_MONTH;

export const routing = defineRouting({
  // Used when no locale matches
  defaultLocale: "ko",

  localeCookie: {
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    name: LOCALE_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: true,
  },

  localePrefix: "as-needed",
  // A list of all locales that are supported
  locales: ["en", "ko", "ja"],
});
