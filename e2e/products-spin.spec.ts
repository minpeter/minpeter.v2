// biome-ignore-all lint/performance/noAwaitInLoops: Gesture and gallery steps must run sequentially to exercise intermediate UI states.
import { readFile } from "node:fs/promises";
import path from "node:path";

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
      await expect(slider).toHaveAttribute("data-loaded-count", "72", {
        timeout: 15_000,
      });
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

function gate() {
  let release: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release: () => release() };
}

function frameBodies() {
  return Promise.all(
    Array.from({ length: 72 }, (_, index) =>
      readFile(
        path.join(
          process.cwd(),
          "public/assets/products/rule60-hhkb-unibody/spin",
          `${String(index + 1).padStart(2, "0")}.webp`
        )
      )
    )
  );
}

const COARSE = Array.from({ length: 12 }, (_, index) => index * 6);
const MEDIUM = Array.from({ length: 12 }, (_, index) => index * 6 + 3);
const FINE = Array.from({ length: 72 }, (_, index) => index).filter(
  (index) => index % 3 !== 0
);

test("whole-turn tiers settle before refinement, with bounded network and bitmap memory", async ({
  page,
}) => {
  const bodies = await frameBodies();
  const coarseTail = gate();
  const medium = gate();
  const fine = gate();
  const requested: number[] = [];
  const settled = new Set<number>();
  const tierViolations: number[] = [];
  let pending = 0;
  let peakPending = 0;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(FRAME_URL, async (route) => {
    const index =
      Number(path.basename(new URL(route.request().url()).pathname, ".webp")) -
      1;
    requested.push(index);
    pending += 1;
    peakPending = Math.max(peakPending, pending);
    if (
      (index % 6 === 3 && !COARSE.every((value) => settled.has(value))) ||
      (index % 3 !== 0 &&
        ![...COARSE, ...MEDIUM].every((value) => settled.has(value)))
    ) {
      tierViolations.push(index);
    }
    try {
      if (index === 66) {
        await coarseTail.promise;
      }
      if (index % 6 === 3) {
        await medium.promise;
      }
      if (index % 3 !== 0) {
        await fine.promise;
      }
      await route.fulfill({ body: bodies[index], contentType: "image/webp" });
    } finally {
      pending -= 1;
      settled.add(index);
    }
  });
  try {
    await page.goto(DETAIL);
    const slider = page.getByRole("slider");
    await slider.focus();
    await expect(slider).toHaveAttribute("data-loaded-count", "11");
    expect(requested).toEqual(COARSE);
    expect(pending).toBe(1);
    coarseTail.release();
    await expect(slider).toHaveAttribute("data-ready-count", "12");
    await expect(slider.locator("img")).toHaveCount(1);
    await expect(slider.locator("canvas")).toHaveCount(1);
    await expect(slider.locator("img[data-index]")).toHaveCount(0);
    const canvas = slider.locator("canvas");
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute("width", "1024");
    await expect(canvas).toHaveAttribute("height", "1536");
    await expect(canvas).toHaveCSS("object-fit", "contain");
    await expect.poll(() => requested.length).toBe(15);
    const requestsBeforeFullResolution = requested.length;
    await expect(slider).toHaveAttribute("data-resolution", "full");
    expect(requested).toHaveLength(requestsBeforeFullResolution);
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
    await expect(slider).toHaveAttribute("data-frame", "71");
    await expect(slider).toHaveAttribute("data-displayed-frame", "0");
    await slider.press("ArrowRight");
    for (const index of COARSE.slice(1)) {
      for (let step = 0; step < 6; step += 1) {
        await slider.press("ArrowRight");
      }
      await expect(slider).toHaveAttribute(
        "data-displayed-frame",
        String(index)
      );
    }
    for (let step = 0; step < 9; step += 1) {
      await slider.press("ArrowRight");
    }
    await expect(slider).toHaveAttribute("data-frame", "3");
    await expect(slider).toHaveAttribute("data-displayed-frame", "0");
    medium.release();
    await expect(slider).toHaveAttribute("data-loaded-count", "24");
    await expect(slider).toHaveAttribute("data-displayed-frame", "3");
    await slider.press("ArrowLeft");
    await slider.press("ArrowLeft");
    await expect(slider).toHaveAttribute("data-frame", "1");
    await expect(slider).toHaveAttribute("data-displayed-frame", "0");
    fine.release();
    await expect(slider).toHaveAttribute("data-loaded-count", "72", {
      timeout: 15_000,
    });
    await expect(slider).toHaveAttribute("data-displayed-frame", "1");
    expect(requested).toEqual([...COARSE, ...MEDIUM, ...FINE]);
    expect(tierViolations).toEqual([]);
    expect(peakPending).toBeLessThanOrEqual(3);
    for (let step = 0; step < 18; step += 1) {
      await slider.press(step % 2 === 0 ? "ArrowLeft" : "ArrowRight");
      expect(
        Number(await slider.getAttribute("data-ready-count"))
      ).toBeLessThanOrEqual(20);
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const box = await slider.boundingBox();
    if (!box) {
      throw new Error("Missing pointer stage");
    }
    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2);
    await page.mouse.move(0, 0);
    const dots = page.locator(".store-media-dot");
    await dots.nth(1).click();
    await dots.first().click();
    await expect(slider).toHaveAttribute("data-loaded-count", "72");
    await expect(slider.locator("img")).toHaveCount(1);
    await expect(slider.locator("canvas")).toHaveCount(1);
    expect(
      Number(await slider.getAttribute("data-ready-count"))
    ).toBeLessThanOrEqual(20);
    expect(requested).toHaveLength(72);
    expect(new Set(requested).size).toBe(72);
  } finally {
    coarseTail.release();
    medium.release();
    fine.release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("a failed coarse frame does not stall later tiers or duplicate requests", async ({
  page,
}) => {
  const bodies = await frameBodies();
  const requested: number[] = [];
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(FRAME_URL, async (route) => {
    const index =
      Number(path.basename(new URL(route.request().url()).pathname, ".webp")) -
      1;
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
  await expect(slider).toHaveAttribute("data-loaded-count", "71", {
    timeout: 15_000,
  });
  await slider.press("ArrowLeft");
  await expect(slider).toHaveAttribute("data-displayed-frame", "71");
  expect(requested).toEqual([...COARSE, ...MEDIUM, ...FINE]);
  expect(new Set(requested).size).toBe(72);
  expect(
    Number(await slider.getAttribute("data-ready-count"))
  ).toBeLessThanOrEqual(20);
  await expect(slider.locator("img[data-index]")).toHaveCount(0);
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
