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
    test("static shell preserves localized information and full-page geometry", async ({
      browser,
      page,
    }, testInfo) => {
      const prefix = scenario.locale === "ko" ? "" : `/${scenario.locale}`;
      const path = `${prefix}/products/maru60`;
      // Keep inline server-stream boundary swaps working, but block the client bundle.
      // This captures the real unhydrated shell, not an injected imitation.
      const shellContext = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        locale: scenario.locale,
        viewport: { height: 844, width: scenario.width },
      });
      try {
        await shellContext.route("**/_next/static/**/*.js", (route) =>
          route.abort()
        );
        const shellPage = await shellContext.newPage();
        await shellPage.goto(path);
        await shellPage.evaluate(() =>
          document.fonts.ready.then(() => undefined)
        );
        const shell = shellPage
          .getByTestId("product-detail")
          .filter({ visible: true });
        await expect(shell).toBeVisible();
        await expect(
          shell.getByTestId("product-customizer-skeleton")
        ).toBeVisible();
        await expect(shell.locator("h1")).toHaveText("Maru60");
        const shellInfo = await shell
          .locator(".store-product-info")
          .innerText();
        const shellGeometry = await geometry(shell);
        const shellBox = await shell.boundingBox();
        const shellHeight = await shellPage.evaluate(
          () => document.documentElement.scrollHeight
        );
        await shellPage.screenshot({
          animations: "disabled",
          fullPage: true,
          path: testInfo.outputPath("shell.png"),
        });

        await page.goto(path);
        const ready = page
          .getByTestId("product-detail")
          .filter({ visible: true });
        await expect(
          ready.getByTestId("product-spin").locator("canvas")
        ).toBeVisible({ timeout: 15_000 });
        const readyGeometry = await geometry(ready);
        const readyBox = await ready.boundingBox();
        const readyHeight = await page.evaluate(
          () => document.documentElement.scrollHeight
        );
        await page.screenshot({
          animations: "disabled",
          fullPage: true,
          path: testInfo.outputPath("ready.png"),
        });
        writeFileSync(
          testInfo.outputPath("shell-geometry.json"),
          JSON.stringify(
            {
              ready: readyGeometry,
              readyBox,
              readyHeight,
              scenario,
              shell: shellGeometry,
              shellBox,
              shellHeight,
            },
            null,
            2
          )
        );
        expect(await ready.locator(".store-product-info").innerText()).toBe(
          shellInfo
        );
        expect(shellGeometry).toEqual(readyGeometry);
        expect(shellBox).toEqual(readyBox);
        expect(shellHeight).toBe(readyHeight);
      } finally {
        await shellContext.close();
      }
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
        animations: "disabled",
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
        animations: "disabled",
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

for (const scenario of [
  ...[320, 390, 479, 480, 1023, 1024, 1440].map((width) => ({
    locale: "en",
    width,
  })),
  { locale: "ko", width: 390 },
  { locale: "ja", width: 390 },
]) {
  const { width, locale } = scenario;
  test.describe(`catalog ${width}px ${locale}`, () => {
    test.use({ locale });
    test(`catalog skeleton matches portrait card at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ height: 844, width });
      await page.goto(`${locale === "ko" ? "" : `/${locale}`}/products`);
      const card = page.getByTestId("product-link-maru60");
      await expect(card).toBeVisible();
      await expect(
        card.getByTestId("product-spin").locator("canvas")
      ).toBeVisible({ timeout: 15_000 });
      await card.focus();
      await expect(card.locator(".store-card-caption")).toHaveCSS(
        "opacity",
        "1"
      );
      const before = await card.boundingBox();
      const captionBefore = await card
        .locator(".store-card-caption")
        .boundingBox();
      await page.screenshot({
        animations: "disabled",
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
      const skeletonCard = page
        .getByTestId("product-list-skeleton")
        .locator(".store-card");
      expect(
        await skeletonCard.locator(".store-card-caption").boundingBox()
      ).toEqual(captionBefore);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      writeFileSync(
        testInfo.outputPath("catalog-geometry.json"),
        JSON.stringify(
          { caption: captionBefore, ready: before, skeleton: after, width },
          null,
          2
        )
      );
      await page.screenshot({
        animations: "disabled",
        fullPage: true,
        path: testInfo.outputPath("catalog-skeleton.png"),
      });
    });
  });
}

for (const width of [390, 1023, 1440]) {
  test(`catalog history restores layout and scroll at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 360, width });
    await page.goto("/en/products");
    const card = page.getByTestId("product-link-maru60");
    await expect(
      card.getByTestId("product-spin").locator("canvas")
    ).toBeVisible({ timeout: 15_000 });
    // Use a short viewport so even the current single-item catalog can scroll.
    await page.evaluate(() =>
      scrollTo(
        0,
        Math.min(100, document.documentElement.scrollHeight - innerHeight)
      )
    );
    const scrollBefore = await page.evaluate(() => scrollY);
    expect(scrollBefore).toBeGreaterThan(0);
    const boxBefore = await card.boundingBox();
    await card.click({ position: { x: 10, y: 10 } });
    const detail = page.getByTestId("product-detail").filter({ visible: true });
    await expect(detail).toBeVisible();
    await expect(
      detail.getByTestId("product-spin").locator("canvas")
    ).toBeVisible({ timeout: 15_000 });
    await page.goBack();
    await expect(card).toBeVisible();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(scrollBefore);
    expect(await card.boundingBox()).toEqual(boxBefore);
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: testInfo.outputPath("catalog-returned.png"),
    });
    await page.goForward();
    await expect(detail).toBeVisible();
    await expect(
      detail.getByTestId("product-spin").locator("canvas")
    ).toBeVisible({ timeout: 15_000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    writeFileSync(
      testInfo.outputPath("history.json"),
      JSON.stringify({ restoredBox: boxBefore, scrollBefore, width }, null, 2)
    );
  });
}
