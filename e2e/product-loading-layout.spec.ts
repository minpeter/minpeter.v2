import { readFileSync, writeFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import en from "../shared/i18n/en.json" with { type: "json" };
import ja from "../shared/i18n/ja.json" with { type: "json" };

const ko: typeof en = JSON.parse(
  readFileSync(new URL("../shared/i18n/ko.json", import.meta.url), "utf8")
);

const englishLabels = en.products.customization;

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

async function expectFeedbackInsideStage(page: Page) {
  const geometry = await page.evaluate(() => {
    const stage = document
      .querySelector(".store-media-stage")
      ?.getBoundingClientRect();
    const feedback = document
      .querySelector(".store-custom-feedback")
      ?.getBoundingClientRect();
    const controls = document
      .querySelector(".store-custom-controls")
      ?.getBoundingClientRect();
    if (!(stage && feedback && controls)) {
      throw new Error("Missing preview feedback geometry");
    }
    return {
      clearOfControls: feedback.bottom < controls.top,
      contained:
        feedback.left >= stage.left &&
        feedback.right <= stage.right &&
        feedback.top >= stage.top &&
        feedback.bottom <= stage.bottom,
      noHorizontalOverflow:
        document.documentElement.scrollWidth <= window.innerWidth,
    };
  });
  expect(geometry).toEqual({
    clearOfControls: true,
    contained: true,
    noHorizontalOverflow: true,
  });
}

for (const viewport of [
  { height: 1000, width: 1440 },
  { height: 844, width: 390 },
  { height: 640, width: 320 },
  { height: 900, width: 1023 },
  { height: 900, width: 1024 },
  { height: 844, locale: "ko", width: 390 },
  { height: 844, locale: "ja", width: 390 },
]) {
  test(`loading, failure, retry and personal selection keep controls stable at ${viewport.width}px ${viewport.locale ?? "en"}`, async ({
    page,
  }, testInfo) => {
    const messages = { en, ja, ko }[
      (viewport.locale ?? "en") as "ko" | "ja" | "en"
    ];
    const labels = messages.products.customization;
    const prefix =
      viewport.locale === "ko" ? "" : `/${viewport.locale ?? "en"}`;
    await page.setViewportSize(viewport);
    await page.setExtraHTTPHeaders({
      "Accept-Language": viewport.locale ?? "en",
    });
    await page.goto(
      `${prefix}/products/maru60?housing=ash-gray&keycaps=nicepbt-bow-retail`
    );
    const status = page.locator(".store-custom-preview").getByRole("status");
    await expect(status).toHaveText(labels.ready, { timeout: 15_000 });
    const before = await layout(page);
    const phases = {
      before,
      error: {},
      loading: {},
      personal: {},
      retried: {},
    };
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
    phases.loading = await layout(page);
    await expectFeedbackInsideStage(page);
    expect(await layout(page)).toEqual(before);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("loading.png"),
    });
    release();
    await expect(status).toHaveText(labels.loadError);
    phases.error = await layout(page);
    await expectFeedbackInsideStage(page);
    expect(await layout(page)).toEqual(before);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("error.png"),
    });
    await page.unroute("**/assembled/**/charcoal--nicepbt-bow-retail/**");
    await page.getByRole("button", { name: labels.retry }).click();
    await expect(status).toHaveText(labels.ready, { timeout: 15_000 });
    phases.retried = await layout(page);
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
    phases.personal = await layout(page);
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
      JSON.stringify({ after, ...phases, viewport }, null, 2)
    );
  });
}

for (const width of [390, 1023, 1024, 1440]) {
  test(`delayed completion and cached selections preserve focus and scroll at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 844, width });
    await page.goto(
      "/en/products/maru60?housing=ash-gray&keycaps=nicepbt-bow-retail"
    );
    const status = page.locator(".store-custom-preview").getByRole("status");
    await expect(status).toHaveText(englishLabels.ready, { timeout: 15_000 });
    let release: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      "**/assembled/**/charcoal--nicepbt-bow-retail/**",
      async (route) => {
        await pending;
        await route.continue();
      }
    );
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    const radio = page.locator('input[name="housing"][value="charcoal"]');
    await page.locator("label").filter({ has: radio }).click();
    await expect(status).toHaveText(englishLabels.loading);
    await expect(radio).toBeFocused();
    const during = await layout(page);
    const scroll = await page.evaluate(() => window.scrollY);
    await expectFeedbackInsideStage(page);
    release();
    await expect(status).toHaveText(englishLabels.ready, { timeout: 15_000 });
    expect(await layout(page)).toEqual(during);
    expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
    await expect(radio).toBeFocused();
    await page.goBack();
    await expect(status).toHaveText(englishLabels.ready, { timeout: 15_000 });
    expect(await layout(page)).toEqual(during);
    await page.goForward();
    await expect(status).toHaveText(englishLabels.ready, { timeout: 15_000 });
    expect(await layout(page)).toEqual(during);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("cached-ready.png"),
    });
    writeFileSync(
      testInfo.outputPath("focus-scroll.json"),
      JSON.stringify(
        {
          after: await layout(page),
          during,
          scrollAfter: await page.evaluate(() => window.scrollY),
          scrollDuring: scroll,
          width,
        },
        null,
        2
      )
    );
  });
}
