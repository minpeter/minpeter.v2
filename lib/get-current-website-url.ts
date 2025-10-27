const websiteUrl = {
  production: "https://minpeter.uk",
  development: "http://localhost:8200",
};

/**
 * Get the appropriate website URL based on environment parameters
 * @param options - Environment detection options
 * @returns The website URL for the current environment
 */
export function getCurrentWebsiteUrl(options?: {
  /** Vercel environment (production, preview, development) */
  vercelEnv?: string;
  /** Vercel URL for preview deployments */
  vercelUrl?: string;
}): string {
  const vercelEnv =
    options?.vercelEnv ||
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.VERCEL_ENV;
  const vercelUrl = options?.vercelUrl || process.env.VERCEL_URL;

  // Use the same logic as metadata.tsx
  if (vercelEnv === "production") {
    return websiteUrl.production; // vercel production
  }
  if (vercelEnv === "preview" && vercelUrl) {
    return `https://${vercelUrl}`; // vercel preview
  }
  return websiteUrl.development; // local development
}
