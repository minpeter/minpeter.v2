// @ts-check
/**
 * Single source of truth for the locales this site serves.
 *
 * Deliberately plain JavaScript: `next-sitemap.config.js` is loaded by Node
 * itself and cannot import TypeScript, while `shared/i18n/routing.ts` needs the
 * string literals to survive so `(typeof routing.locales)[number]` stays a
 * union rather than `string`.
 *
 * `@ts-check` is load-bearing: the repo compiles with `checkJs: false`, so
 * without it TypeScript would trust the annotations blindly and a value/type
 * mismatch below could ship silently.
 */

/** @type {readonly ["en", "ko", "ja"]} */
export const locales = ["en", "ko", "ja"];

/** @type {"ko"} */
export const defaultLocale = "ko";
