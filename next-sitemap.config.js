/** @type {import('next-sitemap').IConfig} */

// Regex for matching internal Next.js hash paths
const hashPathPattern = /^(\/ko)?\/[a-f0-9]{32,}/;

/**
 * Get priority based on path
 * @param {string} path
 * @returns {number}
 */
function getPriority(path) {
  if (path === "/") {
    return 1.0;
  }
  if (path.startsWith("/blog")) {
    return 0.8;
  }
  return 0.7;
}

const config = {
  siteUrl: process.env.SITE_URL || "https://minpeter.uk",
  generateRobotsTxt: true,
  generateIndexSitemap: false,

  // Transform function to handle localePrefix: "as-needed"
  // Korean (default) has no prefix, English and Japanese have prefixes
  transform: (config, path) => {
    // Skip /en/* and /ja/* paths - only include clean Korean URLs
    if (path.startsWith("/en") || path.startsWith("/ja")) {
      return null;
    }

    // Skip internal Next.js paths (hash-like paths, _next, etc.)
    if (hashPathPattern.test(path)) {
      return null;
    }

    // Remove /ko prefix if present (Korean should have no prefix)
    let cleanPath = path;
    if (path.startsWith("/ko/")) {
      cleanPath = path.slice(3);
    } else if (path === "/ko") {
      cleanPath = "/";
    }

    return {
      loc: cleanPath,
      changefreq: cleanPath === "/" ? "daily" : "weekly",
      priority: getPriority(cleanPath),
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },

  // Manually add homepage (sometimes missed by auto-discovery)
  additionalPaths: () => [
    {
      loc: "/",
      changefreq: "daily",
      priority: 1.0,
      lastmod: new Date().toISOString(),
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
