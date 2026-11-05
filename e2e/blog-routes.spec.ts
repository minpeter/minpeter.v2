import { expect, test as it, test } from "@playwright/test";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

test.describe("blog routes found by responsive QA", () => {
  for (const path of [
    "/blog/og/ai-sdk",
    "/en/blog/og/ai-sdk",
    "/og/not-found",
    "/ja/og/not-found",
  ]) {
    it(`cached OG route ${path} serves a PNG`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
      expect([...(await response.body()).subarray(0, 4)]).toStrictEqual(
        PNG_SIGNATURE
      );
    });
  }

  for (const path of [
    "/blog/tiny-ko:wandb",
    "/blog/tiny-ko%3Awandb",
    "/en/blog/google-calendar-agent-1:friendli",
    "/ja/blog/google-calendar-agent-1%3Afriendli",
  ]) {
    it(`external post ${path} renders its redirect shell`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId("blog-post-shell")).toBeVisible();
    });
  }

  it("content images with reserved URL characters load", async ({ page }) => {
    await page.goto("/blog/jekyll-github-pages");
    const image = page.getByRole("img", {
      name: "RVM zsh and oh-my-zsh compatibility warning",
    });
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth)
      )
      .toBeGreaterThan(0);
  });
});
