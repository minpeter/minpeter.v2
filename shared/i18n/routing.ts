import { defineRouting } from "next-intl/routing";

export const LOCALE_COOKIE_NAME = "MINPETER-LOCATE";

const DAYS_IN_MONTH = 30;
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * DAYS_IN_MONTH;

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "ko"],

  // Used when no locale matches
  defaultLocale: "ko",

  localePrefix: "never",

  localeCookie: {
    name: LOCALE_COOKIE_NAME,
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: true,
  },
});
