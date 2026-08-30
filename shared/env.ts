import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_VERCEL_ENV: z
      .enum(["production", "preview", "development"])
      .optional(),
  },

  emptyStringAsUndefined: true,

  experimental__runtimeEnv: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  },
  server: {
    // Build-time flags
    ANALYZE: z
      .string()
      .default("false")
      .transform((val) => val === "true"),

    NODE_ENV: z.enum(["development", "production", "test"]),
    PORT: z.coerce.number().default(3000),

    // Site URL configuration
    PUBLIC_BASE_URL: z.url().optional(),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    VERCEL_URL: z.string().optional(),
  },

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
