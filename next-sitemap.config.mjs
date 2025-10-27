/** @type {import('next-sitemap').IConfig} */
const config = {
  // NOTE: The value does not include the protocol scheme "https://"
  // https://vercel.com/docs/environment-variables/system-environment-variables#VERCEL_PROJECT_PRODUCTION_URL
  siteUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://minpeter.uk",
  generateRobotsTxt: true,
  generateIndexSitemap: false,

  transform: (entry, path) => {
    if (path.includes("/ko")) {
      return {
        loc: path.replace("/ko", ""),
        changefreq: entry.changefreq,
        priority: entry.priority,
      };
    }

    return {
      loc: path,
      changefreq: entry.changefreq,
      priority: entry.priority,
    };
  },
};

export default config;
