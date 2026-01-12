/** @type {import('next-sitemap').IConfig} */

const SITE_URL = process.env.SITE_URL || "https://minpeter.uk";

// IMPORTANT: Keep in sync with shared/i18n/routing.ts
// These values are duplicated here because next-sitemap.config.js is CommonJS
const locales = ["en", "ko", "ja"];
const defaultLocale = "ko";

// Regex for matching internal Next.js hash paths
const hashPathPattern = /^(\/(ko|en|ja))?\/[a-f0-9]{32,}/;

/**
 * Get priority based on path
 * @param {string} path
 * @returns {number}
 */
function getPriority(path) {
  if (path === "/" || path === "/en" || path === "/ja") {
    return 1.0;
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

/**
 * Generate alternateRefs for hreflang tags
 * @param {string} basePath
 * @returns {Array}
 */
function getAlternateRefs(basePath) {
  const refs = locales.map((locale) => ({
    href: `${SITE_URL}${getLocalizedPath(basePath, locale)}`,
    hreflang: locale,
    hrefIsAbsolute: true,
  }));

  // Add x-default pointing to default locale for users without language preference
  refs.push({
    href: `${SITE_URL}${getLocalizedPath(basePath, defaultLocale)}`,
    hreflang: "x-default",
    hrefIsAbsolute: true,
  });

  return refs;
}

const config = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  generateIndexSitemap: false,

  // Transform function to handle localePrefix: "as-needed"
  // Korean (default) has no prefix, English and Japanese have prefixes
  transform: (config, path) => {
    // Skip internal Next.js paths (hash-like paths, _next, etc.)
    if (hashPathPattern.test(path)) {
      return null;
    }

    // Transform /ko/* paths to paths without prefix (Korean is default locale)
    let loc = path;
    if (path.startsWith("/ko/")) {
      loc = path.slice(3); // "/ko/blog/post" -> "/blog/post"
    } else if (path === "/ko") {
      loc = "/";
    }

    const basePath = getBasePath(path);

    return {
      loc,
      changefreq: loc === "/" ? "daily" : "weekly",
      priority: getPriority(loc),
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: getAlternateRefs(basePath),
    };
  },

  // Manually add homepage (sometimes missed by auto-discovery)
  additionalPaths: () => [
    {
      loc: "/",
      changefreq: "daily",
      priority: 1.0,
      lastmod: new Date().toISOString(),
      alternateRefs: getAlternateRefs("/"),
    },
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
  },
};

export default config;
