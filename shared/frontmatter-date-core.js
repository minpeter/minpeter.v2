// @ts-check
/**
 * Shared KST author-zone date parser.
 *
 * Plain JavaScript (with `@ts-check`) so both `next-sitemap.config.js` (loaded
 * directly by Node) and `shared/frontmatter-date.ts` (bundled by Next/Vite)
 * share a single source of truth.
 */

/** `YYYY-MM-DD HH:MM[:SS]` or `YYYY-MM-DDTHH:MM[:SS]` with no offset or `Z`. */
const LOCAL_DATE_TIME =
  /^(?<date>\d{4}-\d{2}-\d{2})[ T](?<time>\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/u;

/** Posts are authored in KST; offset-less timestamps mean Seoul wall time. */
const AUTHOR_UTC_OFFSET = "+09:00";

/**
 * `new Date("2022-10-03 20:19:00")` uses the build machine's zone (UTC on
 * Vercel), which shifts KST evening posts to the next Seoul day. Pin
 * offset-less timestamps to the author's zone. Date-only values stay UTC
 * midnight, matching their calendar day in every zone we format with.
 *
 * @param {string} value
 * @returns {Date}
 */
export function toAuthorDate(value) {
  const groups = LOCAL_DATE_TIME.exec(value.trim())?.groups;
  if (groups) {
    return new Date(`${groups.date}T${groups.time}${AUTHOR_UTC_OFFSET}`);
  }
  return new Date(value);
}
