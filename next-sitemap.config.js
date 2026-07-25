/** @type {import('next-sitemap').IConfig} */

import { defaultLocale, locales } from "./shared/i18n/locales.js";

const SITE_URL = process.env.SITE_URL || "https://minpeter.com";

const defaultLocalePrefix = `/${defaultLocale}`;

// Internal Next.js hash paths (e.g. the unlisted poem route), optionally
// locale-prefixed, must stay out of the sitemap.
const hashPathPattern = new RegExp(
  `^(/(${locales.join("|")}))?/[a-f0-9]{32,}`,
  "u"
);

/**
 * Get priority based on path
 * @param {string} path
 * @returns {number}
 */
function getPriority(path) {
  if (homepagePaths.has(path)) {
    return 1;
  }
  if (path.includes("/blog")) {
    return 0.8;
  }
  return 0.7;
}

/**
 * Extract the base path without locale prefix
 * @param {string} path
 * @returns {string}
 */
function getBasePath(path) {
  for (const locale of locales) {
    if (path === `/${locale}`) {
      return "/";
    }
    if (path.startsWith(`/${locale}/`)) {
      return path.slice(locale.length + 1);
    }
  }
  return path;
}

/**
 * Get the URL for a specific locale
 * @param {string} basePath
 * @param {string} locale
 * @returns {string}
 */
function getLocalizedPath(basePath, locale) {
  if (locale === defaultLocale) {
    return basePath;
  }
  return basePath === "/" ? `/${locale}` : `/${locale}${basePath}`;
}

// `localePrefix: "as-needed"` means the default locale is served unprefixed, so
// the homepage exists once per locale: "/", "/en", "/ja".
const homepagePaths = new Set(
  locales.map((locale) => getLocalizedPath("/", locale))
);

/**
 * Generate alternateRefs for hreflang tags
 * @param {string} basePath
 * @returns {Array}
 */
function getAlternateRefs(basePath) {
  const refs = locales.map((locale) => ({
    href: `${SITE_URL}${getLocalizedPath(basePath, locale)}`,
    hrefIsAbsolute: true,
    hreflang: locale,
  }));

  // Add x-default pointing to default locale for users without language preference
  refs.push({
    href: `${SITE_URL}${getLocalizedPath(basePath, defaultLocale)}`,
    hrefIsAbsolute: true,
    hreflang: "x-default",
  });

  return refs;
}

const config = {
  // Manually add homepage (sometimes missed by auto-discovery)
  additionalPaths: () => [
    {
      alternateRefs: getAlternateRefs("/"),
      changefreq: "daily",
      lastmod: new Date().toISOString(),
      loc: "/",
      priority: 1,
    },
  ],
  generateIndexSitemap: false,
  generateRobotsTxt: true,

  robotsTxtOptions: {
    policies: [
      {
        allow: "/",
        userAgent: "*",
      },
    ],
  },
  siteUrl: SITE_URL,

  // Transform function to handle localePrefix: "as-needed"
  // The default locale has no prefix, every other locale keeps one
  transform: (sitemapConfig, path) => {
    // Skip internal Next.js paths (hash-like paths, _next, etc.)
    if (hashPathPattern.test(path)) {
      return null;
    }

    // Strip the default-locale prefix: "/ko/blog/post" -> "/blog/post"
    let loc = path;
    if (path === defaultLocalePrefix) {
      loc = "/";
    } else if (path.startsWith(`${defaultLocalePrefix}/`)) {
      loc = path.slice(defaultLocalePrefix.length);
    }

    const basePath = getBasePath(path);

    return {
      alternateRefs: getAlternateRefs(basePath),
      changefreq: loc === "/" ? "daily" : "weekly",
      lastmod: sitemapConfig.autoLastmod ? new Date().toISOString() : undefined,
      loc,
      priority: getPriority(loc),
    };
  },
};

export default config;
