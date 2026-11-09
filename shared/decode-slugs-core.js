// @ts-check
/**
 * Shared percent-encoded route segment decoder.
 *
 * Plain JavaScript (with `@ts-check`) so both `next-sitemap.config.js` (loaded
 * directly by Node) and `shared/decode-slugs.ts` (bundled by Next/Vite) share
 * one source of truth.
 */

/**
 * Route params can arrive percent-encoded (prerender passes `a%3Ab` for slug
 * `a:b`), but fumadocs and filesystem indexes use raw slugs, so decode before
 * lookup. A segment that would decode to contain `/` stays encoded so `%2F`
 * never aliases a nested post.
 *
 * @param {readonly string[]} [slugs]
 * @returns {string[]}
 */
export function decodeSlugs(slugs = []) {
  return slugs.map((segment) => {
    try {
      const decoded = decodeURIComponent(segment);
      return decoded.includes("/") ? segment : decoded;
    } catch {
      return segment;
    }
  });
}
