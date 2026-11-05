import type * as intlServer from "next-intl/server";
import { describe, expect, it, vi } from "vitest";

import { generateMetadata } from "../page";

let mockLocale = "ko";

vi.mock(
  import("next-intl/server"),
  () =>
    ({
      getLocale: vi.fn(() => Promise.resolve(mockLocale)),
      getTranslations: vi.fn(
        (namespace?: string) => (key: string) =>
          namespace ? `${namespace}.${key}` : key
      ),
    }) as unknown as Partial<typeof intlServer>
);

const metadataFor = (slug: string) =>
  generateMetadata({
    params: Promise.resolve({ locale: mockLocale, slug }),
  } as Parameters<typeof generateMetadata>[0]);

describe("app/[locale]/products/[slug]/page.tsx generateMetadata", () => {
  it.each([
    ["ko", "/og/not-found"],
    ["en", "/en/og/not-found"],
    ["ja", "/ja/og/not-found"],
  ])(
    "uses the shared 404 metadata for an unknown slug (%s)",
    async (locale, image) => {
      mockLocale = locale;
      const metadata = await metadataFor("does-not-exist");

      expect(metadata.title).toBe("minpeter | 404");
      expect(metadata.description).toBe("notFound.description");
      expect(metadata.openGraph).toMatchObject({
        images: { alt: "minpeter | 404", url: image },
      });
      expect(metadata.twitter).toMatchObject({
        images: { alt: "minpeter | 404", url: image },
      });
    }
  );

  it("keeps product metadata for a known slug", async () => {
    mockLocale = "en";
    const metadata = await metadataFor("maru60");

    expect(metadata.title).toBe("minpeter | Maru60");
    expect(metadata.description).toBe("products.items.rule60.description");
  });
});
