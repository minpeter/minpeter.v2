import { readFileSync, writeFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";
import en from "../shared/i18n/en.json" with { type: "json" };
import ja from "../shared/i18n/ja.json" with { type: "json" };
import spinOutlines from "../shared/maru60-retail-silhouettes.json" with {
  type: "json",
};

import {
  captureSilhouette,
  expectSilhouettePixels,
} from "./product-silhouette-pixels";

function desktopHeight(width: number) {
  if (width >= 3840) {
    return 2160;
  }
  if (width >= 2560) {
    return 1440;
  }
  if (width >= 1920) {
    return 1080;
  }
  return 844;
}

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
  { height: 1080, width: 1920 },
  { height: 1440, width: 2560 },
  { height: 1440, width: 3440 },
  { height: 2160, width: 3840 },
  { height: 844, width: 390 },
  { height: 640, width: 320 },
  { height: 390, width: 844 },
  { height: 900, width: 1023 },
  { height: 900, width: 1024 },
  { height: 844, locale: "ko", width: 390 },
  { height: 844, locale: "ja", width: 390 },
]) {
  test.describe(`${viewport.width}px ${viewport.locale ?? "en"} loading layout`, () => {
    test.use({ locale: viewport.locale ?? "en" });
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
      await page.emulateMedia({ reducedMotion: "reduce" });
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
        .filter({
          has: page.locator('input[name="housing"][value="charcoal"]'),
        })
        .click();
      await expect(status).toHaveText(labels.loading);
      await expect(status).toHaveClass("sr-only");
      const shape = page.getByTestId("product-spin-loading");
      await expect(shape).toBeVisible();
      expect(await shape.boundingBox()).toEqual(
        await page.getByTestId("product-spin").boundingBox()
      );
      await expect(shape.getByTestId("product-media-skeleton")).toHaveCSS(
        "animation-name",
        "none"
      );
      const savedSilhouette = await captureSilhouette(shape);
      phases.loading = await layout(page);
      await expectFeedbackInsideStage(page);
      expect(await layout(page)).toEqual(before);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("loading.png"),
      });
      release();
      await expect(status).toHaveText(labels.loadError);
      await expect(page.getByTestId("product-spin-loading")).toHaveCount(0);
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
      await expect(page.getByTestId("product-spin-loading")).toHaveCount(0);
      const pixelAlignment = await expectSilhouettePixels(
        page,
        savedSilhouette
      );
      writeFileSync(
        testInfo.outputPath("pixel-alignment.json"),
        JSON.stringify(pixelAlignment, null, 2)
      );
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
      await expect(
        page.getByTestId("product-spin").locator("canvas")
      ).toBeVisible({ timeout: 15_000 });
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
  });
}

for (const width of [390, 1023, 1024, 1440]) {
  test(`delayed completion and cached selections preserve focus and scroll at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: desktopHeight(width), width });
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

for (const width of [390, 1440]) {
  test(`current-angle loading silhouette survives rapid cached selection at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: desktopHeight(width), width });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      "/en/products/maru60?housing=ash-gray&keycaps=nicepbt-bow-retail"
    );
    const status = page.locator(".store-custom-preview").getByRole("status");
    await expect(status).toHaveText(englishLabels.ready, { timeout: 15_000 });
    const spin = page.getByTestId("product-spin");
    await spin.press("ArrowRight");
    await spin.press("ArrowRight");
    await spin.press("ArrowRight");
    await expect(spin).toHaveAttribute("aria-valuetext", "90°");
    await expect(spin).toHaveAttribute("data-displayed-frame", "3");
    const before = await layout(page);
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let settled = 0;
    await page.route(
      "**/assembled/**/charcoal--nicepbt-bow-retail/**",
      async (route) => {
        await held;
        await route.abort();
        settled += 1;
      }
    );
    await page
      .locator("label")
      .filter({ has: page.locator('input[name="housing"][value="charcoal"]') })
      .click();
    await expect(status).toHaveText(englishLabels.loading);
    const outline = page.getByTestId("product-spin-loading");
    await expect(outline).toBeVisible();
    await expect(spin).toHaveAttribute("aria-valuetext", "90°");
    const savedSilhouette = await captureSilhouette(outline);
    const points = await outline.locator("polygon").getAttribute("points");
    expect(points).toBe(spinOutlines.frame_090.polygons[0]);
    expect(await layout(page)).toEqual(before);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("angle90-loading.png"),
    });
    await page
      .locator("label")
      .filter({ has: page.locator('input[name="housing"][value="ash-gray"]') })
      .click();
    await expect(status).toHaveText(englishLabels.ready);
    await expect(outline).toHaveCount(0);
    release();
    await expect.poll(() => settled).toBeGreaterThan(0);
    await expect(page.locator(".store-custom-preview")).toHaveAttribute(
      "data-combination",
      "ash-gray--nicepbt-bow-retail"
    );
    await expect(status).toHaveText(englishLabels.ready);
    await expect(outline).toHaveCount(0);
    expect(await layout(page)).toEqual(before);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("angle90-cached-ready.png"),
    });
    const pixels = await expectSilhouettePixels(page, savedSilhouette);
    writeFileSync(
      testInfo.outputPath("angle90-pixels.json"),
      JSON.stringify(pixels, null, 2)
    );
  });
}

for (const frame of Array.from({ length: 12 }, (_, index) => index)) {
  for (const width of [390, 1024, 1440, 1920, 2560, 3440, 3840]) {
    if (width > 1920 && frame % 3 !== 0) {
      continue;
    }
    test(`painted silhouette fits selected frame ${frame * 30} degrees at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ height: desktopHeight(width), width });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(
        "/en/products/maru60?housing=ash-gray&keycaps=nicepbt-bow-retail"
      );
      const spin = page.getByTestId("product-spin");
      await expect(spin).toHaveAttribute("data-ready-count", "12", {
        timeout: 15_000,
      });
      for (let index = 0; index < frame; index += 1) {
        // biome-ignore lint/performance/noAwaitInLoops: keyboard turns must occur in order
        await spin.press("ArrowRight");
      }
      await expect(spin).toHaveAttribute("data-displayed-frame", String(frame));
      let release: () => void = () => undefined;
      const pending = new Promise<void>((resolve) => {
        release = resolve;
      });
      // Change keycaps, not only housing. Different keycap assets share the body envelope.
      await page.route(
        "**/assembled/**/ash-gray--pbtfans-wob-retail/**",
        async (route) => {
          await pending;
          await route.continue();
        }
      );
      await page.locator('label[title="PBTfans WoB"]').click();
      const loading = page.getByTestId("product-spin-loading");
      await expect(loading).toBeVisible();
      // Keycaps are below the fold on mobile. The loader intentionally pauses
      // offscreen previews; return to the actual viewport before measuring paint.
      await spin.scrollIntoViewIfNeeded();
      const saved = await captureSilhouette(loading);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("silhouette.png"),
      });
      release();
      await expect(spin).toHaveAttribute(
        "data-displayed-frame",
        String(frame),
        { timeout: 15_000 }
      );
      await expect(loading).toHaveCount(0);
      const pixels = await expectSilhouettePixels(page, saved);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("render.png"),
      });
      writeFileSync(
        testInfo.outputPath("pixels.json"),
        JSON.stringify({ frame, width, ...pixels }, null, 2)
      );
    });
  }
}

for (const width of [390, 1440]) {
  test(`other decoded angles cannot replace the selected loading silhouette at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: desktopHeight(width), width });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      "/en/products/maru60?housing=ash-gray&keycaps=nicepbt-bow-retail"
    );
    const spin = page.getByTestId("product-spin");
    await expect(spin).toHaveAttribute("data-ready-count", "12", {
      timeout: 15_000,
    });
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      "**/charcoal--nicepbt-bow-retail/frame_000.webp*",
      async (route) => {
        await held;
        await route.continue();
      }
    );
    await page
      .locator("label")
      .filter({ has: page.locator('input[name="housing"][value="charcoal"]') })
      .click();
    await spin.scrollIntoViewIfNeeded();
    await expect(spin).toHaveAttribute("data-ready-count", "11", {
      timeout: 15_000,
    });
    await expect(spin).toHaveAttribute("data-displayed-frame", "poster");
    const shape = page.getByTestId("product-spin-loading");
    await expect(shape).toBeVisible();
    const saved = await captureSilhouette(shape);
    await expect(spin.locator("canvas")).toBeHidden();
    await expect(
      page.locator(".store-custom-preview").getByRole("status")
    ).toHaveText(englishLabels.loading);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("other-angles-ready-silhouette.png"),
    });
    release();
    await expect(spin).toHaveAttribute("data-displayed-frame", "0", {
      timeout: 15_000,
    });
    const pixels = await expectSilhouettePixels(page, saved);
    writeFileSync(
      testInfo.outputPath("initial-angle-pixels.json"),
      JSON.stringify(pixels, null, 2)
    );
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("selected-angle-ready.png"),
    });
  });
}
