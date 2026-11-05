/**
 * Route params can arrive percent-encoded (prerender passes `a%3Ab` for slug
 * `a:b`), but fumadocs indexes raw slugs, so decode before lookup.
 */
export function decodeSlugs(slugs: readonly string[] = []): string[] {
  return slugs.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
}
