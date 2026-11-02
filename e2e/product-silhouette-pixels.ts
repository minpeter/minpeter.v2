import { expect, type Locator, type Page } from "@playwright/test";

/** Save the real SVG viewport and pixels before the loading DOM disappears. */
export async function captureSilhouette(shape: Locator) {
  return await shape.evaluate((element) => {
    const svg = element.querySelector("svg");
    if (!svg) {
      throw new Error("Missing loading silhouette");
    }
    const rect = svg.getBoundingClientRect();
    return {
      frame:
        element
          .closest("[data-testid=product-spin]")
          ?.getAttribute("data-frame") ?? "0",
      height: rect.height,
      svg: svg.outerHTML,
      width: rect.width,
    };
  });
}

/** Compare painted alpha, not just equal outer DOM boxes. Interior holes are intentional. */
export async function expectSilhouettePixels(
  page: Page,
  saved: Awaited<ReturnType<typeof captureSilhouette>>
) {
  await expect(page.getByTestId("product-spin")).toHaveAttribute(
    "data-displayed-frame",
    saved.frame,
    { timeout: 15_000 }
  );
  const pixels = await page
    .getByTestId("product-spin")
    .locator("canvas")
    .evaluate(async (element, shape) => {
      const actual = element as HTMLCanvasElement;
      const rect = actual.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      const render = document.createElement("canvas");
      render.width = width;
      render.height = height;
      const context = render.getContext("2d");
      if (!context) {
        throw new Error("Missing pixel context");
      }
      context.drawImage(actual, 0, 0, width, height);
      const ready = context.getImageData(0, 0, width, height).data;
      const svg = new DOMParser().parseFromString(
        shape.svg,
        "image/svg+xml"
      ).documentElement;
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      // Test the actual polygon geometry at full opacity, independent of pulse phase/theme.
      svg.setAttribute("style", "fill:white");
      const image = new Image();
      image.src = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
      await image.decode();
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      const mask = context.getImageData(0, 0, width, height).data;
      const bounds = (data: Uint8ClampedArray) => {
        let left = width,
          top = height,
          right = -1,
          bottom = -1;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            if (data[(y * width + x) * 4 + 3] < 128) {
              continue;
            }
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
          }
        }
        return [left, top, right, bottom];
      };
      const coveredAt = (x: number, y: number) => {
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const xx = x + dx,
              yy = y + dy;
            if (
              xx >= 0 &&
              xx < width &&
              yy >= 0 &&
              yy < height &&
              mask[(yy * width + xx) * 4 + 3] >= 128
            ) {
              return true;
            }
          }
        }
        return false;
      };
      const coverage = () => {
        let foreground = 0,
          outsideOnePixel = 0;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            if (ready[(y * width + x) * 4 + 3] < 128) {
              continue;
            }
            foreground += 1;
            if (!coveredAt(x, y)) {
              outsideOnePixel += 1;
            }
          }
        }
        return { foreground, outsideOnePixel };
      };
      return {
        canvasSize: [rect.width, rect.height],
        ...coverage(),
        ready: bounds(ready),
        silhouette: bounds(mask),
        silhouetteSize: [shape.width, shape.height],
        viewport: {
          dpr: devicePixelRatio,
          height: innerHeight,
          width: innerWidth,
          zoom: visualViewport?.scale ?? 1,
        },
      };
    }, saved);
  expect(pixels.canvasSize).toEqual(pixels.silhouetteSize);
  expect(pixels.foreground).toBeGreaterThan(100);
  expect(pixels.viewport.dpr).toBe(1);
  expect(pixels.viewport.zoom).toBe(1);
  for (let i = 0; i < 4; i += 1) {
    expect(
      Math.abs(pixels.ready[i] - pixels.silhouette[i])
    ).toBeLessThanOrEqual(1);
  }
  expect(pixels.outsideOnePixel).toBe(0);
  return pixels;
}
