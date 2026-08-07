import bundleAnalyzer from "@next/bundle-analyzer";
import { withVercelToolbar as vercelToolbar } from "@vercel/toolbar/plugins/next";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    globalNotFound: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "react-icons",
    ],
    useTypeScriptCli: true,
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
  partialPrefetching: true,
  poweredByHeader: false,
  reactCompiler: true,
  rewrites: () => [
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
    createMessagesDeclaration: "./shared/i18n/ko.json",
  },
  requestConfig: "./shared/i18n/request.ts",
});

export default withBundleAnalyzer(
  withVercelToolbar(withMDX(withNextIntl(nextConfig)))
);
