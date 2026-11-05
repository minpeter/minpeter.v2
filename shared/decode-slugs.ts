/**
 * Route params can arrive percent-encoded (prerender passes `a%3Ab` for slug
 * `a:b`), but fumadocs indexes raw slugs, so decode before lookup. A segment
 * that would decode to contain `/` stays encoded: `getPage` joins segments
 * with `/`, so decoding `%2F` would let one segment alias a nested post.
 */
export function decodeSlugs(slugs: readonly string[] = []): string[] {
  return slugs.map((segment) => {
    try {
      const decoded = decodeURIComponent(segment);
      return decoded.includes("/") ? segment : decoded;
    } catch {
      return segment;
    }
  });
}
