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
      // The streamed loading fallback shares the test id until React swaps it out.
      await expect(
        page.locator('[data-testid="blog-post-shell"]:not([aria-busy="true"])')
      ).toBeVisible();
    });
  }

  for (const path of [
    "/blog/does-not-exist",
    "/en/blog/does-not-exist",
    "/ja/blog/does-not-exist",
    "/blog/%EC%95%84%EB%AC%B4%EA%B1%B0%EB%82%98",
    "/blog/a%2Fb",
    "/blog/ai-sdk/extra",
    "/products/does-not-exist",
    "/en/products/does-not-exist",
  ]) {
    it(`unknown path ${path} responds with HTTP 404`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page).toHaveTitle("minpeter | 404");
    });
  }

  for (const path of ["/blog/ai-sdk", "/en/blog/ai-sdk", "/products/maru60"]) {
    it(`known path ${path} still responds with HTTP 200`, async ({
      request,
    }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
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

test.describe("touch targets", () => {
  it.use({
    hasTouch: true,
    isMobile: true,
    // Pin Korean so the unprefixed paths render the default-locale labels.
    locale: "ko-KR",
    // Entry animations translate the header; measure the settled layout.
    reducedMotion: "reduce",
    viewport: { height: 800, width: 375 },
  });

  for (const [path, name] of [
    ["/blog/ai-sdk", "글 목록으로"],
    ["/products", "minpeter"],
    ["/resume", "홈으로"],
    ["/blog/does-not-exist", "글 목록으로"],
  ] as const) {
    it(`${path} "${name}" link is tappable 20px off its text`, async ({
      page,
    }) => {
      await page.goto(path);
      const link = page.locator(".tap-target", { hasText: name }).first();
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      const hits = await page.evaluate(
        ({ x, y }) =>
          [y - 20, y + 20].map(
            (offsetY) =>
              document.elementFromPoint(x, offsetY)?.closest("a")?.textContent
          ),
        {
          x: (box?.x ?? 0) + (box?.width ?? 0) / 2,
          y: (box?.y ?? 0) + (box?.height ?? 0) / 2,
        }
      );
      for (const text of hits) {
        expect(text).toContain(name);
      }
    });
  }
});
