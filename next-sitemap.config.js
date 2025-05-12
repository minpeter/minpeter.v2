/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // NOTE: The value does not include the protocol scheme "https://"
  // https://vercel.com/docs/environment-variables/system-environment-variables#VERCEL_PROJECT_PRODUCTION_URL
  siteUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL
    : "https://minpeter.uk",
  generateRobotsTxt: true,
  generateIndexSitemap: false,

  transform: async (config, path) => {
    if (path.includes("/ko")) {
      return {
        loc: path.replace("/ko", ""),
        changefreq: config.changefreq,
        priority: config.priority,
      };
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
    };
  },
};
