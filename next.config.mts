import bundleAnalyzer from "@next/bundle-analyzer";
import { withVercelToolbar as vercelToolbar } from "@vercel/toolbar/plugins/next";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  cacheComponents: false,
  experimental: {
    globalNotFound: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "react-icons",
      "@react-three/drei",
      "@react-three/fiber",
    ],
    prefetchInlining: true,
    turbopackFileSystemCacheForDev: true,
    viewTransition: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        hostname: "user-images.githubusercontent.com",
        pathname: "/**/*",
        port: "",
        protocol: "https",
      },
    ],
  },
  logging: {
    browserToTerminal: "error",
    fetches: {
      fullUrl: true,
    },
  },
  poweredByHeader: false,
  reactCompiler: true,

  rewrites: () => [
    // AI/LLM endpoints for blog content
    {
      destination: "/:locale/blog/llms.md/:path*",
      source: "/:locale/blog/:path*.md",
    },
  ],
  turbopack: {
    root: process.cwd(),
  },
  typedRoutes: true,
};

const withMDX = createMDX();
const withVercelToolbar = vercelToolbar();
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});
const withNextIntl = createNextIntlPlugin({
  experimental: {
    // Provide the path to the messages that you're using in `AppConfig`
    createMessagesDeclaration: "./shared/i18n/ko.json",
  },
  requestConfig: "./shared/i18n/request.ts",
});

export default withBundleAnalyzer(
  withVercelToolbar(withMDX(withNextIntl(nextConfig)))
);
