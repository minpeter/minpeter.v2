import bundleAnalyzer from "@next/bundle-analyzer";
import { withVercelToolbar as vercelToolbar } from "@vercel/toolbar/plugins/next";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Hostnames only (no scheme/port). Extra LAN hosts via ALLOWED_DEV_ORIGINS. */
function resolveAllowedDevOrigins(): string[] {
  const defaults = ["127.0.0.1", "minpeter.localhost", "*.localhost"];
  const extra =
    process.env.ALLOWED_DEV_ORIGINS?.split(",")
      .map((host) => host.trim())
      .filter(Boolean) ?? [];
  return [...new Set([...defaults, ...extra])];
}

const nextConfig: NextConfig = {
  // Next 16 blockCrossSiteDEV: allowlisted origins may load /_next in dev.
  allowedDevOrigins: resolveAllowedDevOrigins(),
  cacheComponents: true,
  experimental: {
    // Only for local/CI measured production builds used by @next/playwright instant().
    // Never enable in real production deploys.
    exposeTestingApiInProductionBuild: process.env.EXPOSE_TESTING_API === "1",
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
