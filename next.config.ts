import bundleAnalyzer from "@next/bundle-analyzer";
import { withVercelToolbar } from "@vercel/toolbar/plugins/next";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withMDX = createMDX();

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
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "@react-three/drei",
      "@react-three/fiber",
      "matter-js",
      "three",
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
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
  // Ensure static assets are properly served
  trailingSlash: false,
  // Add headers for static assets
  async headers() {
    return [
      {
        source: "/:path*.(ttf|woff|woff2|eot|otf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*.(gltf|glb)",
        headers: [
          {
            key: "Content-Type",
            value: "model/gltf+json",
          },
        ],
      },
    ];
  },
};

export default withVercelToolbar()(withBundleAnalyzer(withMDX(nextConfig)));
