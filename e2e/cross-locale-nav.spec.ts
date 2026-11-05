import { expect, test } from "@playwright/test";

// A saved non-default locale (cookie) must not hijack client-side navigation on
// unprefixed Korean URLs: a cross-locale redirect hands the router a tree for a
// different root layout, which it merges into the page (two <main>s, mixed lang).
const BLOG_LIST_URL = /\/blog$/u;
const KO_POST_HREF = /^\/blog\//u;
const KO_POST_URL = /^[^?#]*\/\/[^/]+\/blog\/[^/]+$/u;

test.use({ locale: "ko-KR" });

for (const savedLocale of ["en", "ja"] as const) {
  test(`blog soft-nav stays Korean after visiting /${savedLocale}/products`, async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/");
    await page.goto(`/${savedLocale}/products`);
    await expect(page.getByTestId("products-page")).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId("home-page")).toBeVisible();

    await page.locator('a[href="/blog"]').first().click();
    await expect(page).toHaveURL(BLOG_LIST_URL);
    const firstPost = page.getByTestId("blog-post-link").first();
    await expect(firstPost).toHaveAttribute("href", KO_POST_HREF);
    await firstPost.click();

    await expect(page).toHaveURL(KO_POST_URL);
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(
      page.locator('[data-testid="blog-post-shell"]:not([aria-busy="true"])')
    ).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
}
