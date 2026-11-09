import type * as fumadocsPage from "fumadocs-ui/page";
import type * as intlServer from "next-intl/server";
import { describe, expect, it, vi } from "vitest";

import type * as sourceModule from "@/shared/source";

import type * as mdxComponentsModule from "../mdx-components";
import { generateMetadata } from "../page";

vi.mock(
  import("next-intl/server"),
  () =>
    ({
      getLocale: vi.fn(() => Promise.resolve("en")),
      getTranslations: vi.fn(() => (key: string) => key),
    }) as unknown as Partial<typeof intlServer>
);

vi.mock(
  import("@/shared/source"),
  () =>
    ({
      getLocalizedPost: vi.fn(() => ({
        data: {
          description: "Post description",
          published: "2025-01-15",
          title: "Tiny KO WandB",
        },
        slugs: ["tiny-ko:wandb"],
        url: "/en/blog/tiny-ko:wandb",
      })),
      getPostLocales: vi.fn(() => ["ko", "en"] as const),
    }) as unknown as Partial<typeof sourceModule>
);

vi.mock(import("@/shared/styles/stagger-fade-in.module.css"), () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}));

vi.mock(
  import("fumadocs-ui/page"),
  () =>
    ({
      DocsBody: () => null,
    }) as unknown as Partial<typeof fumadocsPage>
);

vi.mock(
  import("../mdx-components"),
  () =>
    ({
      createBlogMdxComponents: () => ({}),
    }) as unknown as Partial<typeof mdxComponentsModule>
);

describe("app/[locale]/blog/[...slug]/page.tsx generateMetadata", () => {
  it("builds canonical, alternate, and OG URLs from decoded page.slugs when request slug is percent-encoded", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: ["tiny-ko%3Awandb"] }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://minpeter.com/en/blog/tiny-ko:wandb"
    );
    expect(metadata.alternates?.languages).toEqual({
      en: "/en/blog/tiny-ko:wandb",
      ko: "/blog/tiny-ko:wandb",
      "x-default": "/blog/tiny-ko:wandb",
    });
    expect(metadata.openGraph?.url).toBe("/en/blog/tiny-ko:wandb");
    expect(metadata.openGraph?.images).toEqual(
      expect.objectContaining({
        url: "/en/blog/og/tiny-ko:wandb",
      })
    );
  });
});
