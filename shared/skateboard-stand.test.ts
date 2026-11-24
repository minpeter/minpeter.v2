import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getProduct } from "./products";
import {
  getScrollSequenceFrameSrc,
  getValidatedStandSet,
  STAND_COLOR_OPTIONS,
  STAND_SCROLL_SEQUENCE,
  STAND_USAGE_SCENES,
  STAND_VIEW_OPTIONS,
} from "./skateboard-stand";

describe("Skateboard Stand catalog and rendered assets", () => {
  it("configures Skateboard Stand as a Naver Smart Store coming-soon product without public STL links", () => {
    const product = getProduct("skateboard-stand");
    expect(product).toBeDefined();
    expect(product?.name).toBe("Skateboard Stand");
    expect(product?.customizer).toBe("skateboard-stand");
    expect(product?.sourceHref).toBeUndefined();
    expect(product?.downloadHref).toBeUndefined();
    expect(product?.upcomingPrice).toBeUndefined();
    expect(product?.storeChannel).toEqual({ kind: "naver-smart-store" });
    expect(product?.preview?.image).toBe(
      "/assets/products/skateboard-stand/og.png"
    );

    const ogFile = new URL(
      "../public/assets/products/skateboard-stand/og.png",
      import.meta.url
    );
    expect(existsSync(ogFile)).toBe(true);
  });

  it("validates every view × color 12-frame turntable manifest and RGBA WebP files", () => {
    for (const view of STAND_VIEW_OPTIONS) {
      for (const color of STAND_COLOR_OPTIONS) {
        const set = getValidatedStandSet(view.id, color.id);
        expect(
          set,
          `Missing manifest for ${view.id}--${color.id}`
        ).not.toBeNull();
        expect(set?.frames).toHaveLength(12);
        for (const frame of set?.frames ?? []) {
          const assetUrl = new URL(`../public${frame.src}`, import.meta.url);
          const bytes = readFileSync(assetUrl);
          expect(createHash("sha256").update(bytes).digest("hex")).toBe(
            frame.sha256
          );
          expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
          expect(bytes.toString("ascii", 8, 16)).toBe("WEBPVP8X");
          // biome-ignore lint/suspicious/noBitwiseOperators: VP8X alpha flag.
          expect(bytes[20] & 0x10).toBe(0x10);
        }
      }
    }
  });

  it("ships all six usage showcase scenes and 60-frame scroll cinema sequence", () => {
    expect(STAND_USAGE_SCENES).toHaveLength(6);
    for (const scene of STAND_USAGE_SCENES) {
      const assetUrl = new URL(`../public${scene.src}`, import.meta.url);
      expect(existsSync(assetUrl)).toBe(true);
    }
    expect(STAND_SCROLL_SEQUENCE.frameCount).toBe(60);
    for (let i = 0; i < STAND_SCROLL_SEQUENCE.frameCount; i += 1) {
      const assetUrl = new URL(
        `../public${getScrollSequenceFrameSrc(i)}`,
        import.meta.url
      );
      expect(existsSync(assetUrl), `Missing sequence frame ${i}`).toBe(true);
    }
  });

  it("includes complete ko/en/ja copy without exposing STL downloads", () => {
    for (const locale of ["ko", "en", "ja"]) {
      const messages = JSON.parse(
        readFileSync(new URL(`./i18n/${locale}.json`, import.meta.url), "utf8")
      );
      expect(
        messages.products.items.skateboardStand.intro.length
      ).toBeGreaterThan(10);
      expect(
        messages.products.items.skateboardStand.details.size.length
      ).toBeGreaterThan(0);
      for (const scene of STAND_USAGE_SCENES) {
        expect(
          messages.products.standCustomization.showcase.scenes[scene.id].title
            .length
        ).toBeGreaterThan(0);
      }
    }
  });
});
