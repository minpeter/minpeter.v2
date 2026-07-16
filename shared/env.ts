import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
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
   * Treat empty strings as undefined
   */
  emptyStringAsUndefined: true,

  /**
   * Manual destructuring for Next.js edge/client bundling
   * @see https://env.t3.gg/docs/nextjs#manual-destructuring
   */
  runtimeEnv: {
    ANALYZE: process.env.ANALYZE,
    FLAGS_SECRET: process.env.FLAGS_SECRET,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
    STATSIG_CONSOLE_API_KEY: process.env.STATSIG_CONSOLE_API_KEY,
    STATSIG_PROJECT_ID: process.env.STATSIG_PROJECT_ID,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  },
  /**
   * Server-side environment variables schema
   * These are only available on the server
   */
  server: {
    // Build-time flags
    ANALYZE: z
      .string()
      .optional()
      .default("false")
      .transform((val) => val === "true"),

    // Feature flags (Statsig)
    FLAGS_SECRET: z.string().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]),
    PORT: z.coerce.number().optional().default(3000),

    // Site URL configuration
    PUBLIC_BASE_URL: z.url().optional(),
    STATSIG_CONSOLE_API_KEY: z.string().optional(),
    STATSIG_PROJECT_ID: z.string().optional(),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    VERCEL_URL: z.string().optional(),
  },

  /**
   * Skip validation in certain environments
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

/**
 * Get the base URL for the current environment
 * @returns The appropriate base URL (production, preview, or local)
 */
export function getBaseUrl(): string {
  if (env.PUBLIC_BASE_URL) {
    return env.PUBLIC_BASE_URL;
  }

  const vercelEnv = env.VERCEL_ENV ?? env.NEXT_PUBLIC_VERCEL_ENV;

  if (vercelEnv === "production") {
    return "https://minpeter.com";
  }

  if (vercelEnv === "preview" && env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }

  return `http://localhost:${env.PORT}`;
}

/**
 * Get the website URL based on environment
 * Uses production URL for production, Vercel URL for preview, local for dev
 */
export function getCurrentWebsiteUrl(): string {
  return getBaseUrl();
}
