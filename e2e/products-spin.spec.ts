// biome-ignore-all lint/performance/noAwaitInLoops: Gesture and gallery steps must run sequentially to exercise intermediate UI states.
import { expect, test } from "@playwright/test";

const DETAIL = "/products/rule60-hhkb-unibody";
const FRAME_URL = /\/assets\/products\/rule60-hhkb-unibody\/spin\/\d+\.webp$/;

for (const width of [1440, 393, 320]) {
  for (const prefix of ["", "/en", "/ja"]) {
    test(`portrait render and gallery: ${prefix || "ko"}, ${width}px`, async ({
      page,
    }, testInfo) => {
      const height = width === 1440 ? 900 : 852;
      await page.setViewportSize({ height, width });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`${prefix}/products`);
      const grid = page.locator(".store-grid");
      await expect(grid).toBeVisible();
      const columns = await grid.evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length
      );
      expect(columns).toBe(width >= 1024 ? 4 : 2);
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        "rgb(0, 0, 0)"
      );
      await page.goto(`${prefix}${DETAIL}`);
      const slider = page.getByRole("slider");
      await expect(slider).toHaveAttribute("aria-valuemax", "71");
      await expect(slider).toHaveCSS("touch-action", "pan-y");
      await expect(slider.locator("img").first()).toHaveCSS(
        "object-fit",
        "contain"
      );
      const bounds = await slider.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds?.height).toBeLessThanOrEqual(height * 0.72 + 1);
      expect((bounds?.width ?? 0) / (bounds?.height ?? 1)).toBeCloseTo(
        2 / 3,
        2
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      await slider.focus();
      await expect(slider).toHaveAttribute("data-displayed-frame", "0");
      await slider.press("ArrowLeft");
      await expect(slider).toHaveAttribute("data-frame", "71");
      await expect(slider).toHaveAttribute("data-displayed-frame", "71");
      await slider.press("ArrowRight");
      await expect(slider).toHaveAttribute("data-displayed-frame", "0");
      const stage = page.locator(".store-media-stage");
      const stageHeight = (await stage.boundingBox())?.height;
      const dots = page.locator(".store-media-dot");
      await expect(dots).toHaveCount(5);
      for (let slide = 1; slide < 5; slide += 1) {
        await dots.nth(slide).click();
        await expect(dots.nth(slide)).toHaveAttribute("aria-current", "true");
        await expect(page.locator(".store-media-render img")).toHaveCSS(
          "object-fit",
          "contain"
        );
        expect((await stage.boundingBox())?.height).toBe(stageHeight);
      }
      await page.locator(".store-media-arrow.right-0").click();
      await expect(dots.first()).toHaveAttribute("aria-current", "true");
      await page.locator(".store-media-arrow.left-0").click();
      await expect(dots.last()).toHaveAttribute("aria-current", "true");
      await dots.first().click();
      await expect(slider).toBeVisible();
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(
          `render-${prefix.replace("/", "") || "ko"}-${width}.png`
        ),
      });
    });
  }
}

test("bounded requests and decoded fallback survive slow, stale, and failed frames", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requested = new Set<string>();
  page.on("request", (request) => {
    if (FRAME_URL.test(request.url())) {
      requested.add(request.url());
    }
  });
  let releaseSlow: (() => void) | undefined;
  const slow = new Promise<void>((resolve) => {
    releaseSlow = resolve;
  });
  await page.route("**/spin/04.webp", async (route) => {
    await slow;
    await route.continue();
  });
  await page.route("**/spin/11.webp", (route) => route.abort());
  await page.goto(DETAIL);
  const slider = page.getByRole("slider");
  await slider.focus();
  await expect(slider).toHaveAttribute("data-displayed-frame", "0");
  await expect.poll(() => requested.size).toBe(3);
  await expect(slider.locator("img[data-index]")).toHaveCount(3);
  for (let frame = 1; frame <= 2; frame += 1) {
    await slider.press("ArrowRight");
    await expect(slider).toHaveAttribute("data-displayed-frame", String(frame));
  }
  await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("data-frame", "3");
  await expect(slider).toHaveAttribute("data-displayed-frame", "2");
  await expect(slider.locator('img[data-index="2"]')).toBeVisible();
  for (let frame = 4; frame <= 6; frame += 1) {
    await slider.press("ArrowRight");
    expect(await slider.locator("img[data-index]").count()).toBeLessThanOrEqual(
      4
    );
  }
  await expect(slider).toHaveAttribute("data-displayed-frame", "6");
  releaseSlow?.();
  await expect(slider).toHaveAttribute("data-displayed-frame", "6");
  for (let frame = 7; frame <= 9; frame += 1) {
    await slider.press("ArrowRight");
    await expect(slider).toHaveAttribute("data-displayed-frame", String(frame));
  }
  await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("data-frame", "10");
  await expect(slider).toHaveAttribute("data-displayed-frame", "9");
  await expect(slider.locator('img[data-index="9"]')).toBeVisible();
  expect(await slider.locator("img[data-index]").count()).toBeLessThanOrEqual(
    4
  );
  expect(requested.size).toBeLessThan(20);
});

test("touch keeps vertical page scrolling and supports deliberate horizontal rotation", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
    viewport: { height: 852, width: 393 },
  });
  const page = await context.newPage();
  try {
    await page.goto(DETAIL);
    const slider = page.getByRole("slider");
    await expect(slider).toBeVisible();
    const session = await context.newCDPSession(page);
    const bounds = await slider.boundingBox();
    if (!bounds) {
      throw new Error("Missing touch stage");
    }
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height * 0.8;
    await session.send("Input.dispatchTouchEvent", {
      touchPoints: [{ x, y }],
      type: "touchStart",
    });
    for (let step = 1; step <= 8; step += 1) {
      await session.send("Input.dispatchTouchEvent", {
        touchPoints: [{ x, y: y - step * 25 }],
        type: "touchMove",
      });
    }
    await session.send("Input.dispatchTouchEvent", {
      touchPoints: [],
      type: "touchEnd",
    });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await expect(slider).toHaveAttribute("data-frame", "0");
    await page.evaluate(() => scrollTo(0, 0));
    await session.send("Input.dispatchTouchEvent", {
      touchPoints: [{ x: x - 40, y }],
      type: "touchStart",
    });
    for (let step = 1; step <= 8; step += 1) {
      await session.send("Input.dispatchTouchEvent", {
        touchPoints: [{ x: x - 40 + step * 10, y }],
        type: "touchMove",
      });
    }
    await session.send("Input.dispatchTouchEvent", {
      touchPoints: [],
      type: "touchEnd",
    });
    await expect(slider).not.toHaveAttribute("data-frame", "0");
    expect(await slider.locator("img[data-index]").count()).toBeLessThanOrEqual(
      4
    );
  } finally {
    await context.close();
  }
});
