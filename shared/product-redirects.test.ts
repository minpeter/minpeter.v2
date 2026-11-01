import {
  getRedirectUrl,
  unstable_getResponseFromNextConfig,
} from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { productRedirects } from "./product-redirects.js";
import { getProduct } from "./products";
import { createMetadata } from "./utils/metadata";

describe("canonical Maru60 product routes", () => {
  it.each(["", "/ko", "/en", "/ja"])(
    "permanently redirects %s legacy URLs with their complete query",
    async (prefix) => {
      const query =
        "housing=ice-blue&keycaps=nicepbt-bow-retail&angle=270&campaign=hello%20world";
      const response = await unstable_getResponseFromNextConfig({
        nextConfig: { redirects: () => productRedirects },
        url: `https://minpeter.com${prefix}/products/rule60-hhkb-unibody?${query}`,
      });
      expect(response.status).toBe(308);
      const target = new URL(getRedirectUrl(response) ?? "");
      expect(target.pathname).toBe(`${prefix}/products/maru60`);
      expect([...target.searchParams]).toEqual([...new URLSearchParams(query)]);
    }
  );

  it.each(["ko", "en", "ja"] as const)(
    "uses the canonical product slug for %s metadata",
    (locale) => {
      const product = getProduct("maru60");
      expect(product?.name).toBe("Maru60");
      expect(getProduct("rule60-hhkb-unibody")).toBeUndefined();
      const metadata = createMetadata({
        locale,
        path: `/products/${product?.slug}`,
        title: "Maru60",
      });
      expect(metadata.alternates?.canonical).toBe(
        `https://minpeter.com${locale === "ko" ? "" : `/${locale}`}/products/maru60`
      );
    }
  );
});
