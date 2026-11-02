import { writeFileSync } from "node:fs";

import { expect, type Locator, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import DetailLoading from "../app/[locale]/products/[slug]/loading";
import ListLoading from "../app/[locale]/products/loading";

const detailMarkup = renderToStaticMarkup(createElement(DetailLoading));
const listMarkup = renderToStaticMarkup(createElement(ListLoading));
const selectors = [
  ".store-media-stage",
  ".store-custom-controls",
  ".store-custom-swatches",
  ".store-custom-kits",
  ".store-custom-details",
];

async function geometry(root: Locator) {
  return await root.evaluate((container, targets) => {
    const boxes = Object.fromEntries(
      targets.map((selector) => {
        const element = container.querySelector(selector);
        if (!element) {
          throw new Error(`Missing ${selector}`);
        }
        const rect = element.getBoundingClientRect();
        return [
          selector,
          {
            height: rect.height,
            width: rect.width,
            x: rect.x,
            y: rect.y + scrollY,
          },
        ];
      })
    );
    return {
      boxes,
      infoTop: container
        .querySelector(".store-product-info")
        ?.getBoundingClientRect().top,
      noOverflow: document.documentElement.scrollWidth <= innerWidth,
    };
  }, selectors);
}

for (const scenario of [
  { locale: "en", width: 320 },
  { locale: "ko", width: 390 },
  { locale: "ja", width: 390 },
  { locale: "en", width: 479 },
  { locale: "en", width: 480 },
  { locale: "en", width: 1023 },
  { locale: "en", width: 1024 },
  { locale: "en", width: 1440 },
]) {
  test.describe(`product skeleton ${scenario.width}px ${scenario.locale}`, () => {
    test.use({
      locale: scenario.locale,
      viewport: { height: 844, width: scenario.width },
    });
    test("matches ready customizer geometry and responsive wraps", async ({
      page,
    }, testInfo) => {
      const prefix = scenario.locale === "ko" ? "" : `/${scenario.locale}`;
      await page.goto(`${prefix}/products/maru60`);
      const ready = page
        .getByTestId("product-detail")
        .filter({ visible: true });
      await expect(ready).toBeVisible();
      await expect(
        ready.getByTestId("product-spin").locator("canvas")
      ).toBeVisible({ timeout: 15_000 });
      const readyGeometry = await geometry(ready);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("ready.png"),
      });
      // Render the actual route fallback under the ready route's fonts/CSS. This measures
      // both states deterministically without adding a test-only public application route.
      await ready.evaluate((element, markup) => {
        element.outerHTML = markup;
      }, detailMarkup);
      const skeleton = page
        .getByTestId("product-detail-skeleton")
        .filter({ visible: true });
      await expect(skeleton).toHaveAttribute("aria-busy", "true");
      await expect(skeleton.locator(".store-custom-color")).toHaveCount(8);
      await expect(skeleton.locator(".store-custom-kit")).toHaveCount(6);
      await expect(skeleton.locator("input,button,a,summary")).toHaveCount(0);
      const skeletonGeometry = await geometry(skeleton);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("skeleton.png"),
      });
      writeFileSync(
        testInfo.outputPath("geometry.json"),
        JSON.stringify(
          { ready: readyGeometry, scenario, skeleton: skeletonGeometry },
          null,
          2
        )
      );
      expect(skeletonGeometry.boxes).toEqual(readyGeometry.boxes);
      expect(skeletonGeometry.infoTop).toBe(readyGeometry.infoTop);
      expect(skeletonGeometry.noOverflow).toBe(true);
    });
  });
}

for (const width of [390, 1440]) {
  test(`catalog skeleton matches portrait card at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 844, width });
    await page.goto("/en/products");
    const card = page.getByTestId("product-link-maru60");
    await expect(card).toBeVisible();
    const before = await card.boundingBox();
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("catalog-ready.png"),
    });
    await page.getByTestId("products-page").evaluate((element, markup) => {
      element.outerHTML = markup;
    }, listMarkup);
    const after = await page
      .getByTestId("product-list-skeleton")
      .locator(".store-card")
      .boundingBox();
    expect(after).toEqual(before);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("catalog-skeleton.png"),
    });
  });
}
