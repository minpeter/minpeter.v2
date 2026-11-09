/** @type {import('next-sitemap').IConfig} */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";

import { decodeSlugs } from "./shared/decode-slugs-core.js";
import { toAuthorDate } from "./shared/frontmatter-date-core.js";
import { defaultLocale, locales } from "./shared/i18n/locales.js";

const SITE_URL = process.env.SITE_URL || "https://minpeter.com";

const defaultLocalePrefix = `/${defaultLocale}`;

// Internal Next.js hash paths (e.g. the unlisted poem route), optionally
// locale-prefixed, must stay out of the sitemap.
const hashPathPattern = new RegExp(
  `^(/(${locales.join("|")}))?/[a-f0-9]{32,}`,
  "u"
);
const frontmatterBlockPattern = /^---\r?\n(?<block>[\s\S]*?)\r?\n---/u;
const publishedLinePattern =
  /^published:\s*['"]?(?<published>[^'"\r\n]+)['"]?\s*$/mu;
const COMMIT_PREFIX = "__COMMIT__";

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
 * Extract the locale and base path without locale prefix
 * @param {string} path
 * @returns {{ basePath: string; locale: string }}
 */
function parseLocalizedPath(path) {
  for (const locale of locales) {
    if (path === `/${locale}`) {
      return { basePath: "/", locale };
    }
    if (path.startsWith(`/${locale}/`)) {
      return { basePath: path.slice(locale.length + 1), locale };
    }
  }
  return { basePath: path, locale: defaultLocale };
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

const PRERENDER_MANIFEST = ".next/prerender-manifest.json";

/**
 * Every prerendered app path (`/ko/blog/x`, `/en/blog/x`, ...). Untranslated
 * posts are not prerendered under other locales, so this is the set of
 * editions that really exist.
 * @returns {Set<string> | undefined}
 */
function readPrerenderedPaths() {
  if (!existsSync(PRERENDER_MANIFEST)) {
    return;
  }
  const manifest = JSON.parse(readFileSync(PRERENDER_MANIFEST, "utf8"));
  return new Set(Object.keys(manifest.routes ?? {}));
}

/** @type {Set<string> | undefined | null} */
let prerenderedPaths = null;

/** @type {Map<string, Date> | null} */
let gitLastModifiedByFile = null;

/**
 * Batch-read latest git commit dates for `content/blog` in a single git call.
 * @returns {Map<string, Date>}
 */
function getGitLastModifiedMap() {
  if (gitLastModifiedByFile !== null) {
    return gitLastModifiedByFile;
  }
  const map = new Map();
  try {
    const output = execFileSync(
      "git",
      [
        "-c",
        "core.quotePath=false",
        "log",
        `--format=${COMMIT_PREFIX}%cI`,
        "--name-only",
        "--",
        "content/blog",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
    /** @type {Date | null} */
    let currentCommitDate = null;
    for (const rawLine of output.split("\n")) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }
      if (line.startsWith(COMMIT_PREFIX)) {
        const parsed = new Date(line.slice(COMMIT_PREFIX.length));
        currentCommitDate = Number.isNaN(parsed.getTime()) ? null : parsed;
        continue;
      }
      if (currentCommitDate && !map.has(line)) {
        map.set(line, currentCommitDate);
      }
    }
  } catch {
    // Non-git directories (e.g. unit test temp dirs) fall back to frontmatter.
  }
  gitLastModifiedByFile = map;
  return map;
}

/**
 * Parse frontmatter `published:` date using KST (+09:00) for offset-less values.
 * @param {string} filePath
 * @returns {Date | undefined}
 */
function readFrontmatterPublishedDate(filePath) {
  try {
    const raw = readFileSync(filePath, "utf8");
    const block = frontmatterBlockPattern.exec(raw)?.groups?.block;
    const value = block
      ? publishedLinePattern.exec(block)?.groups?.published?.trim()
      : undefined;
    if (!value) {
      return;
    }
    const date = toAuthorDate(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  } catch {
    // Unreadable MDX files omit lastmod rather than failing sitemap generation.
  }
}

const routeGroupFolderPattern = /^\([^/]+\)$/u;
const localeSuffixPattern = new RegExp(
  `\\.(?<locale>${locales.join("|")})$`,
  "u"
);

/** @type {Map<string, string> | null} */
let blogMdxIndex = null;

/**
 * Index `content/blog/**\/*.mdx` by `${slug}:${locale}`, stripping Fumadocs
 * `(group)` folder segments such as `(awa)`, `(external)`, `(k8s-via-proxmox)`.
 * @returns {Map<string, string>}
 */
function getBlogMdxIndex() {
  if (blogMdxIndex !== null) {
    return blogMdxIndex;
  }
  const index = new Map();
  if (!existsSync("content/blog")) {
    blogMdxIndex = index;
    return index;
  }
  const entries = readdirSync("content/blog", { recursive: true });
  for (const entry of entries) {
    const rel = String(entry).replaceAll("\\", "/");
    if (!rel.endsWith(".mdx")) {
      continue;
    }
    const withoutGroups = rel
      .slice(0, -4)
      .split("/")
      .filter((segment) => segment && !routeGroupFolderPattern.test(segment))
      .join("/");
    const localeMatch = localeSuffixPattern.exec(withoutGroups);
    const fileLocale = localeMatch?.groups?.locale ?? defaultLocale;
    const stem = localeMatch
      ? withoutGroups.slice(0, -localeMatch[0].length)
      : withoutGroups;
    let slug = stem;
    if (stem === "index") {
      slug = "";
    } else if (stem.endsWith("/index")) {
      slug = stem.slice(0, -6);
    }
    if (slug) {
      index.set(`${slug}:${fileLocale}`, `content/blog/${rel}`);
    }
  }
  blogMdxIndex = index;
  return index;
}

/**
 * Resolve the MDX file backing a blog post URL and return its ISO lastmod timestamp.
 * @param {string} basePath
 * @param {string} locale
 * @returns {string | undefined}
 */
function getBlogPostLastmod(basePath, locale) {
  if (!basePath.startsWith("/blog/")) {
    return;
  }
  const slug = decodeSlugs(basePath.slice("/blog/".length).split("/")).join(
    "/"
  );
  if (!slug || slug.startsWith("og/") || slug.startsWith("llms.md/")) {
    return;
  }
  const index = getBlogMdxIndex();
  const mdxFile =
    index.get(`${slug}:${locale}`) ?? index.get(`${slug}:${defaultLocale}`);
  if (!mdxFile) {
    return;
  }

  const gitDate = getGitLastModifiedMap().get(mdxFile);
  const publishedDate = readFrontmatterPublishedDate(mdxFile);
  if (gitDate && publishedDate) {
    return new Date(
      Math.max(gitDate.getTime(), publishedDate.getTime())
    ).toISOString();
  }
  return (gitDate ?? publishedDate)?.toISOString();
}

/**
 * Locales that have `basePath`. Only blog posts can be partial; everything else
 * (and runs without a build, e.g. unit tests) lists all locales.
 * @param {string} basePath
 * @returns {readonly string[]}
 */
function getAvailableLocales(basePath) {
  if (!basePath.startsWith("/blog/")) {
    return locales;
  }
  if (prerenderedPaths === null) {
    prerenderedPaths = readPrerenderedPaths();
  }
  const known = prerenderedPaths;
  if (!known) {
    return locales;
  }
  return locales.filter((locale) => known.has(`/${locale}${basePath}`));
}

/**
 * Generate alternateRefs for hreflang tags
 * @param {string} basePath
 * @param {readonly string[]} [available]
 * @returns {Array}
 */
function getAlternateRefs(basePath, available = locales) {
  const refs = available.map((locale) => ({
    href: `${SITE_URL}${getLocalizedPath(basePath, locale)}`,
    hrefIsAbsolute: true,
    hreflang: locale,
  }));

  // Add x-default pointing to default locale for users without language preference
  if (available.includes(defaultLocale)) {
    refs.push({
      href: `${SITE_URL}${getLocalizedPath(basePath, defaultLocale)}`,
      hrefIsAbsolute: true,
      hreflang: "x-default",
    });
  }

  // A lone self-reference is not an alternate set.
  return available.length > 1 ? refs : [];
}

const config = {
  // Manually add homepage (sometimes missed by auto-discovery)
  additionalPaths: () => [
    {
      alternateRefs: getAlternateRefs("/"),
      changefreq: "daily",
      loc: "/",
      priority: 1,
    },
  ],
  autoLastmod: false,
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
  transform: (_sitemapConfig, path) => {
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

    const { basePath, locale } = parseLocalizedPath(path);
    if (basePath === "/products/rule60-hhkb-unibody") {
      return null;
    }

    return {
      alternateRefs: getAlternateRefs(basePath, getAvailableLocales(basePath)),
      changefreq: loc === "/" ? "daily" : "weekly",
      lastmod: getBlogPostLastmod(basePath, locale),
      loc,
      priority: getPriority(loc),
    };
  },
};

export default config;
