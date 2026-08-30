import { afterEach, describe, expect, it, vi } from "vitest";

const ENVIRONMENT_KEYS = [
  "ANALYZE",
  "NEXT_PUBLIC_VERCEL_ENV",
  "NODE_ENV",
  "PORT",
  "PUBLIC_BASE_URL",
  "SKIP_ENV_VALIDATION",
  "VERCEL_ENV",
  "VERCEL_URL",
] as const;

type EnvironmentOverrides = Readonly<
  Partial<Record<(typeof ENVIRONMENT_KEYS)[number], string>>
>;

function loadEnvironment(overrides: EnvironmentOverrides = {}) {
  vi.resetModules();
  vi.unstubAllEnvs();

  for (const key of ENVIRONMENT_KEYS) {
    vi.stubEnv(key, undefined);
  }
  vi.stubEnv("NODE_ENV", "test");

  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value);
  }

  return import("./env");
}

describe("environment configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each([
    { expected: false, value: undefined },
    { expected: false, value: "false" },
    { expected: false, value: "TRUE" },
    { expected: true, value: "true" },
  ])("parses ANALYZE=$value as $expected", async ({ expected, value }) => {
    const overrides = value === undefined ? {} : { ANALYZE: value };

    const { env } = await loadEnvironment(overrides);

    expect(env.ANALYZE).toBe(expected);
  });

  it("prefers PUBLIC_BASE_URL over environment-derived URLs", async () => {
    const { getBaseUrl } = await loadEnvironment({
      PUBLIC_BASE_URL: "https://preview.example.com",
      VERCEL_ENV: "production",
    });

    expect(getBaseUrl()).toBe("https://preview.example.com");
  });

  it("uses the canonical production URL", async () => {
    const { getBaseUrl } = await loadEnvironment({
      VERCEL_ENV: "production",
    });

    expect(getBaseUrl()).toBe("https://minpeter.com");
  });

  it("uses VERCEL_URL for preview deployments", async () => {
    const { getBaseUrl } = await loadEnvironment({
      VERCEL_ENV: "preview",
      VERCEL_URL: "branch.example.vercel.app",
    });

    expect(getBaseUrl()).toBe("https://branch.example.vercel.app");
  });

  it("falls back to NEXT_PUBLIC_VERCEL_ENV", async () => {
    const { getBaseUrl } = await loadEnvironment({
      NEXT_PUBLIC_VERCEL_ENV: "production",
    });

    expect(getBaseUrl()).toBe("https://minpeter.com");
  });

  it("uses the parsed PORT for the local URL", async () => {
    const { getBaseUrl } = await loadEnvironment({ PORT: "4173" });

    expect(getBaseUrl()).toBe("http://localhost:4173");
  });

  it("treats empty optional values as undefined", async () => {
    const { env, getBaseUrl } = await loadEnvironment({
      NEXT_PUBLIC_VERCEL_ENV: "",
      PUBLIC_BASE_URL: "",
      VERCEL_ENV: "",
      VERCEL_URL: "",
    });

    expect(env.NEXT_PUBLIC_VERCEL_ENV).toBeUndefined();
    expect(env.PUBLIC_BASE_URL).toBeUndefined();
    expect(env.VERCEL_ENV).toBeUndefined();
    expect(env.VERCEL_URL).toBeUndefined();
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("rejects invalid values when validation is enabled", async () => {
    await expect(
      loadEnvironment({ PUBLIC_BASE_URL: "not a URL" })
    ).rejects.toThrow();
  });

  it("allows invalid values when validation is skipped", async () => {
    const { env } = await loadEnvironment({
      PUBLIC_BASE_URL: "not a URL",
      SKIP_ENV_VALIDATION: "true",
    });

    expect(env.PUBLIC_BASE_URL).toBe("not a URL");
  });
});
