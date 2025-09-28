import bundleAnalyzer from "@next/bundle-analyzer";
import { withVercelToolbar } from "@vercel/toolbar/plugins/next";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,

  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",

  compiler: {
    // Remove console logs only in production, excluding error logs
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },

  // For additional debugging in Lighthouse
  productionBrowserSourceMaps: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  reactStrictMode: true,
  eslint: {
    // !WARN!
    // This allows production builds to successfully complete
    // even if project has ESLint errors.
    // !WARN!
    ignoreDuringBuilds: true,
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

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withMDX = createMDX();

export default withVercelToolbar()(withBundleAnalyzer(withMDX(nextConfig)));
