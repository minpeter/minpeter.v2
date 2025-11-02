import bundleAnalyzer from "@next/bundle-analyzer";
import { withVercelToolbar as vercelToolbar } from "@vercel/toolbar/plugins/next";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  cacheComponents: false,
  reactCompiler: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "user-images.githubusercontent.com",
        port: "",
        pathname: "/**/*",
      },
    ],
  },

  rewrites: async () => {
    return [
      // AI/LLM endpoints for blog content
      {
        source: "/:locale/blog/:path*.md",
        destination: "/:locale/blog/llms.md/:path*",
      },
    ];
  },
};

const withMDX = createMDX();
const withVercelToolbar = vercelToolbar();
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});
const withNextIntl = createNextIntlPlugin({
  requestConfig: "./shared/i18n/request.ts",
  experimental: {
    // Provide the path to the messages that you're using in `AppConfig`
    createMessagesDeclaration: "./shared/i18n/ko.json",
  },
});

export default withBundleAnalyzer(
  withVercelToolbar(withMDX(withNextIntl(nextConfig)))
);
