import { writeFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import en from "../shared/i18n/en.json" with { type: "json" };

const labels = en.products.customization;

async function layout(page: Page) {
  return await page.evaluate(() =>
    Object.fromEntries(
      [
        ".store-custom-controls",
        ".store-media-stage",
        "[data-testid=product-spin]",
      ].map((selector) => {
        const element = document.querySelector(selector);
        if (!element) {
          throw new Error(`Missing ${selector}`);
        }
        const rect = element.getBoundingClientRect();
        return [
          selector,
          {
            height: selector === ".store-custom-controls" ? 0 : rect.height,
            width: rect.width,
            y: rect.y + window.scrollY,
          },
        ];
      })
    )
  );
}

for (const viewport of [
  { height: 1000, width: 1440 },
  { height: 844, width: 390 },
]) {
  test(`loading, failure, retry and personal selection keep controls stable at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto(
      "/en/products/maru60?housing=ash-gray&keycaps=nicepbt-bow-retail"
    );
    const status = page.locator(".store-custom-preview").getByRole("status");
    await expect(status).toHaveText(labels.ready, { timeout: 15_000 });
    const before = await layout(page);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("before.png"),
    });
    let release: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      "**/assembled/**/charcoal--nicepbt-bow-retail/**",
      async (route) => {
        await pending;
        await route.abort();
      }
    );
    await page
      .locator("label")
      .filter({ has: page.locator('input[name="housing"][value="charcoal"]') })
      .click();
    await expect(status).toHaveText(labels.loading);
    expect(await layout(page)).toEqual(before);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("loading.png"),
    });
    release();
    await expect(status).toHaveText(labels.loadError);
    expect(await layout(page)).toEqual(before);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("error.png"),
    });
    await page.unroute("**/assembled/**/charcoal--nicepbt-bow-retail/**");
    await page.getByRole("button", { name: labels.retry }).click();
    await expect(status).toHaveText(labels.ready, { timeout: 15_000 });
    expect(await layout(page)).toEqual(before);
    await page
      .locator("label")
      .filter({
        has: page.locator('input[name="housing"][value="transparent"]'),
      })
      .click();
    await expect(page.getByTestId("product-customizer")).toHaveAttribute(
      "data-configuration",
      "personal"
    );
    expect(await layout(page)).toEqual(before);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("personal.png"),
    });
    await page.goBack();
    await expect(status).toHaveText(labels.ready, { timeout: 15_000 });
    const after = await layout(page);
    expect(after).toEqual(before);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("ready.png"),
    });
    writeFileSync(
      testInfo.outputPath("layout.json"),
      JSON.stringify({ after, before, viewport }, null, 2)
    );
  });
}
