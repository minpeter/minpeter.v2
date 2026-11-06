/**
 * fumadocs falls back to the default-locale file when a post has no
 * translation (`a/index.mdx` served for `en`). Such a page is the same Korean
 * article under another URL, so it must not be advertised as a translation.
 */

/** File-path suffix fumadocs' "dot" parser uses per locale (`index.en.mdx`). */
const localeSuffix = (locale: string, defaultLocale: string) =>
  locale === defaultLocale ? "" : `.${locale}`;

const MDX_EXTENSION = /\.mdx?$/u;
const stripExtension = (path: string) => path.replace(MDX_EXTENSION, "");

interface ResolvedPost {
  data?: { lang?: readonly string[] };
  path: string;
}

/**
 * True when `page` is a real edition for `locale`: its own translation file,
 * or a single-file post whose frontmatter `lang` explicitly lists the locale
 * (external posts link out and are language-neutral).
 */
export function isTranslated(
  page: ResolvedPost,
  locale: string,
  defaultLocale: string
): boolean {
  if (locale === defaultLocale) {
    return true;
  }
  if (stripExtension(page.path).endsWith(localeSuffix(locale, defaultLocale))) {
    return true;
  }
  return page.data?.lang?.includes(locale) ?? false;
}

/** Locales in `locales` whose own translation of this post exists. */
export function getTranslatedLocales<L extends string>(
  resolve: (locale: L) => ResolvedPost | undefined,
  locales: readonly L[],
  defaultLocale: L
): L[] {
  return locales.filter((locale) => {
    const page = resolve(locale);
    return page !== undefined && isTranslated(page, locale, defaultLocale);
  });
}
