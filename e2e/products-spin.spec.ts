// biome-ignore-all lint/performance/noAwaitInLoops: Gesture and selection steps must run sequentially to exercise intermediate UI states.
import { readFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const DETAIL = "/products/maru60";
const OG_ASSETS = "/assets/products/rule60-hhkb-unibody";

test("OG player decodes and loops the latest six-second render", async ({
  page,
  request,
}) => {
  await page.goto(`${OG_ASSETS}/player.html`);
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(5, 5, 5)"
  );
  const video = page.locator("video");
  await expect(video).toHaveJSProperty("videoWidth", 1200);
  await expect(video).toHaveJSProperty("videoHeight", 630);
  await expect(video).toHaveJSProperty("duration", 6);
  await expect(video).toHaveJSProperty("muted", true);
  await expect(video).toHaveJSProperty("loop", true);
  await expect(video).toHaveJSProperty("playsInline", true);
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.currentTime)
    )
    .toBeGreaterThan(0.1);
  await video.evaluate((element: HTMLVideoElement) => {
    element.currentTime = 5.8;
  });
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.currentTime)
    )
    .toBeLessThan(2);
  const poster = await request.get(`${OG_ASSETS}/og.png`);
  expect(poster.ok()).toBe(true);
  expect(poster.headers()["content-type"]).toContain("image/png");
  const gif = await request.get(`${OG_ASSETS}/og.gif`);
  expect(gif.ok()).toBe(true);
  expect(gif.headers()["content-type"]).toContain("image/gif");
});

const FRAME_URL =
  /\/assets\/products\/maru60\/assembled\/v1\/transparent--inventor\/frame_\d{3}\.webp(?:\?.*)?$/u;

for (const width of [1440, 393, 320]) {
  for (const prefix of ["", "/en", "/ja"]) {
    test(`single portrait turntable: ${prefix || "ko"}, ${width}px`, async ({
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
      await expect(slider).toHaveAttribute("aria-valuemax", "11");
      await expect(slider).toHaveCSS("touch-action", "pan-y");
      await expect(slider.locator("canvas")).toHaveCSS("object-fit", "contain");
      const bounds = await slider.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds?.height).toBeLessThanOrEqual(
        height * (width >= 1024 ? 0.82 : 0.62) + 1
      );
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
      await expect(slider).toHaveAttribute("data-loaded-count", "12", {
        timeout: 15_000,
      });
      await slider.press("ArrowLeft");
      await expect(slider).toHaveAttribute("data-frame", "11");
      await expect(slider).toHaveAttribute("data-displayed-frame", "11");
      await slider.press("ArrowRight");
      await expect(slider).toHaveAttribute("data-displayed-frame", "0");
      await expect(slider).toBeVisible();
      await expect(
        page.getByTestId("product-customizer").locator("canvas")
      ).toHaveCount(1);
      await expect(slider.locator("img")).toHaveCount(0);
      await expect(
        page.locator(
          ".store-media-arrow, .store-media-dot, .store-media-dots, .store-media-render"
        )
      ).toHaveCount(0);
      expect((await slider.boundingBox())?.height).toBe(bounds?.height);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(
          `render-${prefix.replace("/", "") || "ko"}-${width}.png`
        ),
      });
    });
  }
}

function gate() {
  let release: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release: () => release() };
}

async function frameBodies() {
  // Read actual published artifacts only at test runtime, never synthetic substitutes.
  const manifest = JSON.parse(
    await readFile(
      path.join(process.cwd(), "shared/maru60-personal-manifest.json"),
      "utf8"
    )
  );
  if (manifest?.frames?.length !== 12) {
    throw new Error(
      "Reviewed personal twelve-frame manifest must be published before browser QA"
    );
  }
  return Promise.all(
    Array.from({ length: 12 }, (_, index) => {
      const expected = `/assets/products/maru60/assembled/v1/transparent--inventor/frame_${String(index * 30).padStart(3, "0")}.webp`;
      expect(manifest.frames[index].src).toBe(expected);
      expect(manifest.frames[index].angleDegrees).toBe(index * 30);
      return readFile(path.join(process.cwd(), "public", expected));
    })
  );
}

function requestedIndex(url: string) {
  return (
    Number(
      path.basename(new URL(url).pathname, ".webp").replace("frame_", "")
    ) / 30
  );
}
const COARSE = Array.from({ length: 12 }, (_, index) => index);

test("twelve-frame coarse turn stays usable during slow loading with bounded requests and cached refinement", async ({
  page,
}) => {
  const bodies = await frameBodies();
  const tail = gate();
  const requested: number[] = [];
  let pending = 0;
  let peakPending = 0;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(FRAME_URL, async (route) => {
    const index = requestedIndex(route.request().url());
    requested.push(index);
    pending += 1;
    peakPending = Math.max(peakPending, pending);
    try {
      if (index === 11) {
        await tail.promise;
      }
      await route.fulfill({ body: bodies[index], contentType: "image/webp" });
    } finally {
      pending -= 1;
    }
  });
  try {
    await page.goto(DETAIL);
    const slider = page.getByRole("slider");
    await slider.focus();
    await expect(slider).toHaveAttribute("data-loaded-count", "11");
    expect(requested).toEqual(COARSE);
    expect(pending).toBe(1);
    await expect(slider).toHaveAttribute("data-displayed-frame", "0");
    await expect(slider.locator("img")).toHaveCount(0);
    await expect(slider.locator("canvas")).toHaveCount(1);
    const canvas = slider.locator("canvas");
    await expect(canvas).toHaveAttribute("width", "1024");
    await expect(canvas).toHaveAttribute("height", "1536");
    await expect(canvas).toHaveCSS("object-fit", "contain");
    await expect(slider).toHaveAttribute("data-resolution", "full");
    expect(requested).toHaveLength(12);
    const pixels = await canvas.evaluate((element: HTMLCanvasElement) => {
      const context = element.getContext("2d");
      if (!context) {
        throw new Error("Missing 2D render context");
      }
      const { data } = context.getImageData(
        0,
        0,
        element.width,
        element.height
      );
      let nontransparent = 0;
      for (let offset = 3; offset < data.length; offset += 4) {
        if (data[offset] > 0) {
          nontransparent += 1;
        }
      }
      return {
        firstCornerAlpha: data[3],
        lastCornerAlpha: data.at(-1),
        nontransparent,
      };
    });
    expect(pixels.nontransparent).toBeGreaterThan(1000);
    expect(pixels.nontransparent).toBeLessThan(1024 * 1536);
    expect(pixels.firstCornerAlpha).toBe(0);
    expect(pixels.lastCornerAlpha).toBe(0);
    await slider.press("ArrowLeft");
    await expect(slider).toHaveAttribute("data-frame", "11");
    await expect(slider).toHaveAttribute("data-displayed-frame", "0");
    await expect(canvas).toBeVisible();
    for (let step = 0; step < 6; step += 1) {
      await slider.press("ArrowRight");
    }
    await expect(slider).toHaveAttribute("data-frame", "5");
    await expect(slider).toHaveAttribute("data-displayed-frame", "5");
    tail.release();
    await expect(slider).toHaveAttribute("data-loaded-count", "12");
    // Late frame 11 must not overwrite the user's newer frame 5 selection.
    await expect(slider).toHaveAttribute("data-displayed-frame", "5");
    for (let step = 0; step < 12; step += 1) {
      await slider.press("ArrowRight");
      await expect(slider).toHaveAttribute(
        "data-displayed-frame",
        String((6 + step) % 12)
      );
      expect(
        Number(await slider.getAttribute("data-ready-count"))
      ).toBeLessThanOrEqual(12);
    }
    expect(peakPending).toBeLessThanOrEqual(3);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const box = await slider.boundingBox();
    if (!box) {
      throw new Error("Missing pointer stage");
    }
    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2);
    await page.mouse.move(0, 0);
    await page
      .locator(
        'label.store-custom-option:has(input[name="housing"][value="ice-blue"])'
      )
      .click();
    await expect(
      page.locator('input[name="housing"][value="ice-blue"]')
    ).toBeChecked();
    await page
      .locator(
        'label.store-custom-option:has(input[name="housing"][value="transparent"])'
      )
      .click();
    await expect(slider).toHaveAttribute("aria-valuemax", "11");
    await slider.scrollIntoViewIfNeeded();
    await slider.focus();
    await expect(
      page.locator(
        ".store-media-arrow, .store-media-dot, .store-media-dots, .store-media-render"
      )
    ).toHaveCount(0);
    await expect(slider).toHaveAttribute("data-loaded-count", "12");
    await expect(slider.locator("img")).toHaveCount(0);
    await expect(slider.locator("canvas")).toHaveCount(1);
    expect(requested).toEqual(COARSE);
    expect(new Set(requested).size).toBe(12);
  } finally {
    tail.release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("a failed coarse frame preserves decoded fallback without stalling or duplicate requests", async ({
  page,
}) => {
  const bodies = await frameBodies();
  const requested: number[] = [];
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(FRAME_URL, async (route) => {
    const index = requestedIndex(route.request().url());
    requested.push(index);
    if (index === 6) {
      await route.abort();
    } else {
      await route.fulfill({ body: bodies[index], contentType: "image/webp" });
    }
  });
  await page.goto(DETAIL);
  const slider = page.getByRole("slider");
  await slider.focus();
  await expect(slider).toHaveAttribute("data-loaded-count", "11", {
    timeout: 15_000,
  });
  for (let step = 0; step < 5; step += 1) {
    await slider.press("ArrowRight");
  }
  await expect(slider).toHaveAttribute("data-displayed-frame", "5");
  await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("data-frame", "6");
  await expect(slider).toHaveAttribute("data-displayed-frame", "5");
  await expect(slider.locator("canvas")).toBeVisible();
  for (let step = 0; step < 5; step += 1) {
    await slider.press("ArrowRight");
  }
  await expect(slider).toHaveAttribute("data-displayed-frame", "11");
  expect(requested).toEqual(COARSE);
  expect(new Set(requested).size).toBe(12);
  expect(
    Number(await slider.getAttribute("data-ready-count"))
  ).toBeLessThanOrEqual(12);
  await expect(slider.locator("img")).toHaveCount(0);
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
    await expect(slider.locator("img[data-index]")).toHaveCount(0);
    await expect(slider.locator("canvas")).toHaveCount(1);
    expect(
      Number(await slider.getAttribute("data-ready-count"))
    ).toBeLessThanOrEqual(20);
  } finally {
    await context.close();
  }
});
