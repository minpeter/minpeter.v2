import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const env = createEnv({
  /**
   * Server-side environment variables schema
   * These are only available on the server
   */
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]),
    PORT: z.coerce.number().optional().default(3000),

    // Site URL configuration
    PUBLIC_BASE_URL: z.url().optional(),
    VERCEL_URL: z.string().optional(),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),

    // Feature flags (Statsig)
    FLAGS_SECRET: z.string().optional(),
    STATSIG_CONSOLE_API_KEY: z.string().optional(),
    STATSIG_PROJECT_ID: z.string().optional(),

    // Build-time flags
    ANALYZE: z
      .string()
      .optional()
      .default("false")
      .transform((val) => val === "true"),
  },

  /**
   * Client-side environment variables schema
   * Must be prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_VERCEL_ENV: z
      .enum(["production", "preview", "development"])
      .optional(),
  },

  /**
   * Manual destructuring for Next.js edge/client bundling
   * @see https://env.t3.gg/docs/nextjs#manual-destructuring
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    FLAGS_SECRET: process.env.FLAGS_SECRET,
    STATSIG_CONSOLE_API_KEY: process.env.STATSIG_CONSOLE_API_KEY,
    STATSIG_PROJECT_ID: process.env.STATSIG_PROJECT_ID,
    ANALYZE: process.env.ANALYZE,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  },

  /**
   * Skip validation in certain environments
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined
   */
  emptyStringAsUndefined: true,
});

/**
 * Get the base URL for the current environment
 * @returns The appropriate base URL (production, preview, or local)
 */
export function getBaseUrl(): string {
  // Explicit production URL takes priority
  if (env.PUBLIC_BASE_URL) {
    return env.PUBLIC_BASE_URL;
  }

  // Vercel deployment URL
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }

  // Local development fallback
  return `http://localhost:${env.PORT}`;
}

/**
 * Get the website URL based on environment
 * Uses production URL for production, Vercel URL for preview, local for dev
 */
export function getCurrentWebsiteUrl(): string {
  const PRODUCTION_URL = "https://minpeter.uk";
  const LOCAL_URL = `http://localhost:${env.PORT}`;

  // Server-side check
  const vercelEnv = env.VERCEL_ENV ?? env.NEXT_PUBLIC_VERCEL_ENV;

  if (vercelEnv === "production") {
    return PRODUCTION_URL;
  }

  if (vercelEnv === "preview" && env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }

  return LOCAL_URL;
}
