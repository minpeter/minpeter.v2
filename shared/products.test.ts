import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PRODUCTS } from "./products";

interface SpinManifest {
  angle_step_degrees: number;
  count: number;
  frames: {
    angle_degrees: number;
    bytes: number;
    file: string;
    index: number;
    sha256: string;
    source_file: string;
  }[];
  height: number;
  poster: string;
  type: string;
  width: number;
}

const spinDirectory = new URL(
  "../public/assets/products/rule60-hhkb-unibody/spin/",
  import.meta.url
);
const manifest: SpinManifest = JSON.parse(
  readFileSync(new URL("manifest.json", spinDirectory), "utf8")
);

// These RGBA WebPs use the extended VP8X header. Its canvas dimensions are
// stored as unsigned, little-endian 24-bit integers minus one.
function webpCanvas(bytes: Buffer) {
  return {
    height: bytes.readUIntLE(27, 3) + 1,
    width: bytes.readUIntLE(24, 3) + 1,
  };
}

describe("Rule 60 reconstructed turntable assets", () => {
  it("keeps the catalog and manifest aligned with the 72-frame render", () => {
    const product = PRODUCTS.find(
      (item) => item.slug === "rule60-hhkb-unibody"
    );
    expect(product?.spin).toMatchObject({
      basePath: "/assets/products/rule60-hhkb-unibody/spin",
      defaultFrame: 0,
      frameCount: 72,
      height: 1536,
      width: 1024,
    });
    expect(product?.renders).toHaveLength(4);
    expect(manifest).toMatchObject({
      angle_step_degrees: 5,
      count: 72,
      height: 1536,
      poster: "01.webp",
      type: "reconstructed_3d_render_not_photograph",
      width: 1024,
    });
    expect(manifest.frames).toHaveLength(72);
  });

  it("ships exactly the ordered 01 through 72 frame files", () => {
    const expectedFiles = Array.from(
      { length: 72 },
      (_, index) => `${String(index + 1).padStart(2, "0")}.webp`
    );
    expect(
      readdirSync(spinDirectory)
        .filter((file) => file.endsWith(".webp"))
        .sort()
    ).toEqual(expectedFiles);
    expect(manifest.frames.map((frame) => frame.file)).toEqual(expectedFiles);
    expect(manifest.frames.map((frame) => frame.index)).toEqual(
      Array.from({ length: 72 }, (_, index) => index)
    );
  });

  it.each(manifest.frames)(
    "$file retains its source hash, angle, dimensions, and alpha channel",
    (frame) => {
      const bytes = readFileSync(new URL(frame.file, spinDirectory));
      expect(frame.angle_degrees).toBe(frame.index * 5);
      expect(frame.source_file).toBe(
        `frame_${String(frame.index).padStart(3, "0")}.webp`
      );
      expect(bytes.length).toBe(frame.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        frame.sha256
      );
      expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
      expect(bytes.toString("ascii", 8, 16)).toBe("WEBPVP8X");
      // biome-ignore lint/suspicious/noBitwiseOperators: VP8X alpha is a binary header flag.
      expect(bytes[20] & 0x10).toBe(0x10);
      expect(webpCanvas(bytes)).toEqual({ height: 1536, width: 1024 });
    }
  );

  it("uses the exact first render for the static poster", () => {
    const poster = readFileSync(
      new URL("./assets/products/rule60-spin-poster.webp", import.meta.url)
    );
    expect(poster.equals(readFileSync(new URL("01.webp", spinDirectory)))).toBe(
      true
    );
  });
});
