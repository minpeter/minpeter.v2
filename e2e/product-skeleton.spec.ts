import { writeFileSync } from "node:fs";

import { expect, type Locator, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import DetailLoading from "../app/[locale]/products/[slug]/loading";
import ListLoading from "../app/[locale]/products/loading";

const detailMarkup = renderToStaticMarkup(createElement(DetailLoading));
const listMarkup = renderToStaticMarkup(createElement(ListLoading));
const LINK_HEADER_SEPARATOR = /,(?=\s*<)/;
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
        const shellFrame = await shell
          .locator(".store-media-stage")
          .getByTestId("product-media-skeleton")
          .boundingBox();
        expect(
          await shell
            .locator(".store-media-stage")
            .getByTestId("product-silhouette")
            .boundingBox()
        ).toEqual(shellFrame);
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
        expect(await ready.getByTestId("product-spin").boundingBox()).toEqual(
          shellFrame
        );
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
      await expect(
        skeleton.locator(".store-media-stage").getByTestId("product-silhouette")
      ).toHaveCount(1);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(
        skeleton
          .locator(".store-media-stage")
          .getByTestId("product-media-skeleton")
      ).toHaveCSS("animation-name", "none");
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
      const mediaBefore = await card.getByTestId("product-spin").boundingBox();
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
      expect(
        await page
          .getByTestId("product-list-skeleton")
          .getByTestId("product-silhouette")
          .boundingBox()
      ).toEqual(mediaBefore);
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
          {
            caption: captionBefore,
            locale,
            ready: before,
            skeleton: after,
            width,
          },
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
    await page.addInitScript(() => {
      const events: object[] = [];
      const record = (event: string) => {
        events.push({
          event,
          height: document.documentElement.scrollHeight,
          path: location.pathname,
          time: performance.now(),
          y: scrollY,
        });
        sessionStorage.setItem(
          "catalog-qa-scroll-events",
          JSON.stringify(events.slice(-100))
        );
      };
      addEventListener("scroll", () => record("scroll"));
      addEventListener("popstate", () => record("popstate"));
      addEventListener("DOMContentLoaded", () =>
        new ResizeObserver(() => record("resize")).observe(
          document.documentElement
        )
      );
    });
    await page.setViewportSize({ height: 360, width });
    await page.goto("/en/products");
    await expect(page.locator("html")).toHaveAttribute(
      "data-scroll-behavior",
      "smooth"
    );
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
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
    // Playwright may scroll a tall link into view before clicking it. Record the
    // actual departure, not the earlier setup position, just as history does.
    await card.evaluate((element) => {
      element.addEventListener(
        "click",
        () => {
          const {
            x,
            y,
            width: cardWidth,
            height,
          } = element.getBoundingClientRect();
          sessionStorage.setItem(
            "catalog-qa-departure",
            JSON.stringify({
              box: { height, width: cardWidth, x, y },
              scroll: scrollY,
            })
          );
        },
        { capture: true, once: true }
      );
    });
    await card.click({ position: { x: 10, y: 10 } });
    const departure = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("catalog-qa-departure") ?? "null")
    );
    expect(departure).not.toBeNull();
    const { scroll: scrollBefore, box: boxBefore } = departure;
    expect(scrollBefore).toBeGreaterThan(0);
    const detail = page.getByTestId("product-detail").filter({ visible: true });
    await expect(detail).toBeVisible();
    await expect(
      detail.getByTestId("product-spin").locator("canvas")
    ).toBeVisible({ timeout: 15_000 });
    await page.goBack();
    await expect(card).toBeVisible();
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: testInfo.outputPath("catalog-returned-before-assert.png"),
    });
    writeFileSync(
      testInfo.outputPath("scroll-diagnostics.json"),
      JSON.stringify(
        {
          departure,
          events: await page.evaluate(() =>
            JSON.parse(
              sessionStorage.getItem("catalog-qa-scroll-events") ?? "[]"
            )
          ),
          restored: await page.evaluate(() => ({
            height: document.documentElement.scrollHeight,
            y: scrollY,
          })),
        },
        null,
        2
      )
    );
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

test("records initial spin transfer and cached catalog-to-detail reuse", async ({
  page,
}, testInfo) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (
      request.url().includes("/assets/products/maru60/assembled/") &&
      request.url().includes("/frame_")
    ) {
      requests.push(request.url());
    }
  });
  await page.goto("/en/products");
  const card = page.getByTestId("product-link-maru60");
  const spin = card.getByTestId("product-spin");
  await expect(spin.locator("canvas")).toBeVisible({ timeout: 15_000 });
  const firstCanvasVisibleMs = await page.evaluate(() => performance.now());
  const requestsAtFirstCanvas = [...requests];
  await expect(spin).toHaveAttribute("data-loaded-count", "12", {
    timeout: 20_000,
  });
  const resources = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter(
        (entry) =>
          entry.name.includes("/assets/products/maru60/assembled/") &&
          entry.name.includes("/frame_")
      )
      .map((entry) => {
        const resource = entry as PerformanceResourceTiming;
        return {
          duration: resource.duration,
          encodedBodySize: resource.encodedBodySize,
          initiatorType: resource.initiatorType,
          responseEnd: resource.responseEnd,
          startTime: resource.startTime,
          transferSize: resource.transferSize,
          url: resource.name,
        };
      })
  );
  const loadedRequests = requests.length;
  const navigationStart = await page.evaluate(() => performance.now());
  await card.click();
  const detail = page.getByTestId("product-detail").filter({ visible: true });
  await expect(
    detail.getByTestId("product-spin").locator("canvas")
  ).toBeVisible({ timeout: 15_000 });
  const cachedCanvasVisibleMs =
    (await page.evaluate(() => performance.now())) - navigationStart;
  writeFileSync(
    testInfo.outputPath("spin-loading-profile.json"),
    JSON.stringify(
      {
        cachedCanvasVisibleMs,
        completedInitialRequests: loadedRequests,
        duplicateRequests: requests.filter(
          (url, index) => requests.indexOf(url) !== index
        ),
        encodedBytes: resources.reduce(
          (sum, entry) => sum + entry.encodedBodySize,
          0
        ),
        firstCanvasVisibleMs,
        note: "Chromium production localhost sample; canvas-visible timing, not LCP or a field benchmark.",
        requestsAfterCachedNavigation: requests.length,
        requestsAtFirstCanvas,
        resources,
        transferBytes: resources.reduce(
          (sum, entry) => sum + entry.transferSize,
          0
        ),
      },
      null,
      2
    )
  );
  expect(resources.length).toBeGreaterThan(0);
});

for (const width of [390, 1440]) {
  test(`keycap outlines preserve loading/error/ready frames at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 844, width });
    await page.emulateMedia({ reducedMotion: "reduce" });
    let release: () => void = () => undefined;
    const delayed = new Promise<void>((resolve) => {
      release = resolve;
    });
    const pattern =
      "**/assets/products/maru60/keycaps/v1/nicepbt-bow-retail.webp";
    let requests = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/nicepbt-bow-retail.webp")) {
        requests += 1;
      }
    });
    await page.route(pattern, async (route) => {
      await delayed;
      await route.abort();
    });
    await page.goto("/en/products/maru60", { waitUntil: "domcontentloaded" });
    const thumb = page
      .getByTestId("keycap-thumbnail-nicepbt-bow-retail")
      .filter({ visible: true });
    await thumb.scrollIntoViewIfNeeded();
    await expect(thumb).toHaveAttribute("data-state", "loading");
    const before = await thumb.boundingBox();
    expect(await thumb.getByTestId("product-silhouette").boundingBox()).toEqual(
      before
    );
    await expect(thumb.getByTestId("product-media-skeleton")).toHaveCSS(
      "animation-name",
      "none"
    );
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: testInfo.outputPath("keycap-loading.png"),
    });
    release();
    await expect(thumb).toHaveAttribute("data-state", "error");
    expect(await thumb.boundingBox()).toEqual(before);
    await expect(thumb.locator("img")).toHaveCSS("opacity", "0");
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: testInfo.outputPath("keycap-error.png"),
    });
    await page.unroute(pattern);
    await page.reload();
    await expect(thumb).toHaveAttribute("data-state", "ready");
    await expect(thumb.locator("img")).toHaveCSS("opacity", "1");
    const readyBox = await thumb.boundingBox();
    expect(readyBox?.width).toBe(before?.width);
    expect(readyBox?.height).toBe(before?.height);
    const completedRequests = requests;
    const bow = page.getByRole("radio", { exact: true, name: "NicePBT BoW" });
    await page.locator(".store-custom-kit").filter({ has: bow }).click();
    await expect(bow).toBeChecked();
    await expect(thumb).toHaveAttribute("data-state", "ready");
    expect(requests).toBe(completedRequests);
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: testInfo.outputPath("keycap-ready.png"),
    });
    writeFileSync(
      testInfo.outputPath("keycap-geometry.json"),
      JSON.stringify(
        {
          loading: before,
          noRefetchOnSelection: requests === completedRequests,
          ready: readyBox,
          requests,
          width,
        },
        null,
        2
      )
    );
  });
}

// Same production build, cold contexts, same resource responses. The baseline
// removes only the server hint; its first-frame initiator must remain fetch.
test("compares first-frame-only preload with a cold no-hint baseline", async ({
  browser,
}, testInfo) => {
  test.setTimeout(180_000);
  const samples: Record<string, unknown>[] = [];
  for (const delayed of [false, true]) {
    for (const repeat of [0, 1]) {
      for (const preload of [false, true]) {
        // biome-ignore lint/performance/noAwaitInLoops: Isolate cold A/B samples; concurrent loads contaminate timing.
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.addInitScript(() => {
          const observeFrame = () => {
            const canvas = document.querySelector(".store-card canvas");
            if (canvas) {
              const style = getComputedStyle(canvas);
              const rect = canvas.getBoundingClientRect();
              if (
                style.visibility === "visible" &&
                style.display !== "none" &&
                rect.width > 0 &&
                rect.height > 0
              ) {
                Reflect.set(
                  window,
                  "__maruFirstCanvasVisibleMs",
                  performance.now()
                );
                return;
              }
            }
            requestAnimationFrame(observeFrame);
          };
          requestAnimationFrame(observeFrame);
        });
        const frameRequests: string[] = [];
        page.on("request", (request) => {
          if (
            request.url().includes("/assembled/") &&
            request.url().includes("/frame_")
          ) {
            frameRequests.push(request.url());
          }
        });
        await page.route("**/en/products", async (route) => {
          const response = await route.fetch();
          const headers = response.headers();
          // Prevent a response-header hint from contaminating the no-hint arm.
          if (!preload && headers.link) {
            headers.link = headers.link
              .split(LINK_HEADER_SEPARATOR)
              .filter((hint) => !hint.includes("/frame_"))
              .join(",");
          }
          const body = await response.text();
          await route.fulfill({
            body: preload
              ? body
              : body.replace(
                  /<link\b[^>]*href="[^"]*\/frame_[^"]*"[^>]*>/g,
                  ""
                ),
            headers,
            response,
          });
        });
        await page.route("**/_next/static/**/*.js", async (route) => {
          if (delayed) {
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
          await route.continue();
        });
        await page.route(
          "**/assets/products/maru60/assembled/**",
          async (route) => {
            if (delayed) {
              await new Promise((resolve) => setTimeout(resolve, 150));
            }
            await route.continue();
          }
        );
        await page.goto("/en/products", { waitUntil: "domcontentloaded" });
        const spin = page
          .getByTestId("product-link-maru60")
          .getByTestId("product-spin");
        await expect(spin.locator("canvas")).toBeVisible({ timeout: 20_000 });
        await expect
          .poll(() =>
            page.evaluate(() =>
              Reflect.get(window, "__maruFirstCanvasVisibleMs")
            )
          )
          .toBeGreaterThan(0);
        const firstCanvasVisibleMs = await page.evaluate(
          () => Reflect.get(window, "__maruFirstCanvasVisibleMs") as number
        );
        await expect(spin).toHaveAttribute("data-loaded-count", "12", {
          timeout: 20_000,
        });
        const resources = await page.evaluate(() =>
          performance
            .getEntriesByType("resource")
            .filter(
              (entry) =>
                entry.name.includes("/assembled/") &&
                entry.name.includes("/frame_")
            )
            .map((entry) => {
              const resource = entry as PerformanceResourceTiming;
              return {
                encodedBodySize: resource.encodedBodySize,
                initiatorType: resource.initiatorType,
                responseEnd: resource.responseEnd,
                startTime: resource.startTime,
                transferSize: resource.transferSize,
                url: resource.name,
              };
            })
        );
        const duplicates = frameRequests.filter(
          (url, index) => frameRequests.indexOf(url) !== index
        );
        const first = resources.find((entry) =>
          new URL(entry.url).pathname.endsWith("/frame_000.webp")
        );
        samples.push({
          delayed,
          duplicates,
          encodedBytes: resources.reduce(
            (sum, item) => sum + item.encodedBodySize,
            0
          ),
          firstCanvasVisibleMs,
          preload,
          repeat,
          requests: frameRequests.length,
          resources,
          transferBytes: resources.reduce(
            (sum, item) => sum + item.transferSize,
            0
          ),
        });
        writeFileSync(
          testInfo.outputPath("first-frame-preload-ab.json"),
          JSON.stringify(
            {
              note: "Cold production localhost samples; delayed arm adds 250ms to JS and 150ms to frames. First visible canvas is timestamped in requestAnimationFrame from document start, independently of DOMContentLoaded; not LCP or field data.",
              samples,
            },
            null,
            2
          )
        );
        expect(first?.initiatorType).toBe(preload ? "link" : "fetch");
        expect(duplicates).toEqual([]);
        expect(frameRequests).toHaveLength(12);
        await context.close();
      }
    }
  }
});
