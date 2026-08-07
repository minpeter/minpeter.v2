import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

/**
 * Soft-nav instant() guards. Run against a production build with
 * EXPOSE_TESTING_API=1 (see instant-nav.rig.md). Public site — no auth.
 */

test.describe("instant soft-nav: home → blog", () => {
  test("blog list shell commits under instant()", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByTestId("home-link-blog");
    await expect(trigger).toBeVisible({ timeout: 20_000 });

    await instant(page, async () => {
      await trigger.click();
      await expect(page.getByTestId("blog-list-shell")).toBeVisible();
    });
  });
});

test.describe("instant soft-nav: blog → post", () => {
  test("blog post shell commits under instant()", async ({ page }) => {
    await page.goto("/blog");
    // Prefer an in-app post link (external_url posts open a new origin).
    const trigger = page.locator('a[data-testid="blog-post-link"]').first();
    await expect(trigger).toBeVisible({ timeout: 20_000 });

    await instant(page, async () => {
      await trigger.click();
      await expect(page.getByTestId("blog-post-shell")).toBeVisible();
    });
  });
});

test.describe("instant soft-nav: show → tech-stack-ball", () => {
  test("showcase shell commits under instant()", async ({ page }) => {
    await page.goto("/show");
    const trigger = page
      .locator('a[href*="/show/tech-stack-ball"]')
      .or(page.getByTestId("showcase-link-techStack"))
      .first();
    await expect(trigger).toBeVisible({ timeout: 20_000 });

    await instant(page, async () => {
      await trigger.click();
      await expect(page.getByTestId("showcase-detail-shell")).toBeVisible();
    });
  });
});
