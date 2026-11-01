import { expect, test } from "@playwright/test";

for (const locale of ["ko", "en", "ja"]) {
  test(`legacy product redirects preserve ${locale} selections and query`, async ({
    page,
    request,
  }) => {
    const prefix = locale === "ko" ? "" : `/${locale}`;
    const query =
      "housing=ice-blue&keycaps=nicepbt-bow-retail&angle=270&campaign=redirect-test";
    const response = await request.get(
      `${prefix}/products/rule60-hhkb-unibody?${query}`,
      { maxRedirects: 0 }
    );
    expect(response.status()).toBe(308);
    const destination = new URL(response.headers().location, response.url());
    expect(destination.pathname).toBe(`${prefix}/products/maru60`);
    expect([...destination.searchParams]).toEqual([
      ...new URLSearchParams(query),
    ]);
    await page.goto(`${prefix}/products/rule60-hhkb-unibody?${query}`);
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `${prefix}/products/maru60` &&
        url.searchParams.get("angle") === "270" &&
        url.searchParams.get("campaign") === "redirect-test"
    );
    // Next may retain the previous route under a hidden Activity boundary.
    // Assert the one visible destination, not retained inactive page DOM.
    const detail = page.locator('[data-testid="product-detail"]:visible');
    await expect(detail).toHaveCount(1);
    await expect(detail.getByTestId("product-customizer")).toBeVisible();
    await expect(
      detail.locator('input[name="housing"][value="ice-blue"]')
    ).toBeChecked();
    await expect(
      detail.locator('input[name="keycaps"][value="nicepbt-bow-retail"]')
    ).toBeChecked();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://minpeter.com${prefix}/products/maru60`
    );
    await page.goto(`${prefix}/products/maru60`);
    await expect(detail).toHaveCount(1);
    await expect(detail.getByTestId("product-customizer")).toBeVisible();
    await expect(
      detail.locator('input[name="housing"][value="transparent"]')
    ).toBeChecked();
  });
}

test("explicit Korean legacy prefix redirects before canonical locale normalization", async ({
  request,
}) => {
  const response = await request.get(
    "/ko/products/rule60-hhkb-unibody?housing=transparent&keycaps=inventor&angle=90",
    { maxRedirects: 0 }
  );
  expect(response.status()).toBe(308);
  const target = new URL(response.headers().location, response.url());
  expect(target.pathname).toBe("/ko/products/maru60");
  expect(target.searchParams.get("angle")).toBe("90");
});
