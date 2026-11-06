import { expect, test } from "@playwright/test";

// A saved non-default locale (cookie) must not hijack client-side navigation on
// unprefixed Korean URLs: a cross-locale redirect hands the router a tree for a
// different root layout, which it merges into the page (two <main>s, mixed lang).
const BLOG_LIST_URL = /\/blog$/u;
const KO_POST_HREF = /^\/blog\//u;
const KO_POST_URL = /^[^?#]*\/\/[^/]+\/blog\/[^/]+$/u;
const AI_SDK_URL = /\/blog\/ai-sdk$/u;
const EN_HOME_URL = /\/en$/u;

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

for (const [path, link, target, label] of [
  [
    "/blog",
    '[data-testid=blog-post-link][href="/blog/ai-sdk"]',
    "/en/blog/ai-sdk",
    "English",
  ],
  [
    "/show",
    'main a[href="/show/the-load-balancer"]',
    "/ja/show/the-load-balancer",
    "日本語",
  ],
] as const) {
  test(`Back after switching ${path} to ${label} returns to the Korean page`, async ({
    page,
  }) => {
    // Wait for hydration so the click is a client-router push, not a full load.
    await page.goto(path, { waitUntil: "networkidle" });
    const entry = page.locator(link).filter({ visible: true }).first();
    const koreanUrl = (await entry.getAttribute("href")) ?? "";
    await entry.click();
    await expect(page).toHaveURL(koreanUrl);
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
    // The post streams in after the URL changes; let it settle before switching.
    await page.waitForLoadState("networkidle");

    const trigger = page
      .getByTestId("language-selector")
      .filter({ visible: true });
    const item = page.getByRole("menuitem", { name: label });
    // Re-open if a late render closes the menu between the two clicks.
    await expect(async () => {
      if (!(await item.isVisible())) {
        await trigger.click();
      }
      await item.click({ timeout: 2000 });
    }).toPass();
    await expect(page).toHaveURL(target);

    // The saved locale must not bounce Back to the page just left.
    await page.goBack();
    await expect(page).toHaveURL(koreanUrl);
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  });
}

test("a saved locale only redirects the site root", async ({
  context,
  page,
}) => {
  await page.goto("/blog");
  await context.addCookies([
    {
      name: "MINPETER-LOCATE",
      url: new URL("/", page.url()).href,
      value: "en",
    },
  ]);
  // Fresh document loads, not client-router navigations.
  await page.goto("/blog/ai-sdk");
  await expect(page).toHaveURL(AI_SDK_URL);
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  const root = await page.request.get("/", { maxRedirects: 0 });
  expect(root.status()).toBe(307);
  expect(root.headers().location).toMatch(EN_HOME_URL);
});

for (const path of [
  "/en/blog/2025-retro",
  "/ja/blog/terminal-ime-key-search",
]) {
  test(`untranslated post ${path} is a 404, not a duplicate Korean page`, async ({
    request,
  }) => {
    expect((await request.get(path)).status()).toBe(404);
  });
}

test("uppercase paths 308 to the lowercase URL", async ({ request }) => {
  const response = await request.get("/Blog/AI-SDK", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toMatch(AI_SDK_URL);
});
