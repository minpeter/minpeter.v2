import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  personalManifestToSpin,
  validatedPersonalManifest,
  validatePersonalManifest,
} from "./maru60-personal";
import manifest from "./maru60-personal-manifest.json";

/** Synthetic metadata only. These digests do not claim to identify real artifacts. */
function fixture() {
  return {
    frames: Array.from({ length: 12 }, (_, index) => ({
      angleDegrees: index * 30,
      height: 1536,
      sha256: "a".repeat(64),
      src: `/assets/products/maru60/assembled/v1/transparent--inventor/frame_${String(index * 30).padStart(3, "0")}.webp`,
      width: 1024,
    })),
    housingId: "transparent",
    id: "transparent--inventor",
    keycapId: "inventor",
    orderable: false,
  };
}

describe("independent Maru60 personal manifest gate", () => {
  it("verifies every actual personal frame and exact poster in the published manifest", () => {
    expect(validatedPersonalManifest).not.toBeNull();
    if (!validatedPersonalManifest) {
      throw new Error(
        "Published personal manifest must be structurally complete"
      );
    }
    const spin = personalManifestToSpin(validatedPersonalManifest);
    expect(spin.poster).toBe(
      `${validatedPersonalManifest.frames[0].src}?v=${validatedPersonalManifest.frames[0].sha256}`
    );
    for (const frame of validatedPersonalManifest.frames) {
      const bytes = readFileSync(
        new URL(`../public${frame.src}`, import.meta.url)
      );
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        frame.sha256
      );
      expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
      expect(bytes.toString("ascii", 8, 16)).toBe("WEBPVP8X");
      expect(bytes.readUIntLE(24, 3) + 1).toBe(1024);
      expect(bytes.readUIntLE(27, 3) + 1).toBe(1536);
      // biome-ignore lint/suspicious/noBitwiseOperators: VP8X alpha is a binary header flag.
      expect(bytes[20] & 0x10).toBe(0x10);
    }
  });

  it("fails closed for absent metadata and validates the immutable registry independently", () => {
    expect(validatePersonalManifest(null)).toBeNull();
    expect(validatePersonalManifest({})).toBeNull();
    expect(validatedPersonalManifest).toEqual(
      validatePersonalManifest(manifest)
    );
  });

  it("requires only exact personal identity, non-orderability and public structure", () => {
    const input = fixture();
    expect(validatePersonalManifest(input)).not.toBeNull();
    for (const invalid of [
      { ...input, orderable: true },
      { ...input, orderable: undefined },
      { ...input, id: "ice-blue--inventor" },
      { ...input, housingId: "ice-blue" },
      { ...input, keycapId: "nicepbt-bow-retail" },
      { ...input, extra: "not-public" },
    ]) {
      expect(validatePersonalManifest(invalid)).toBeNull();
    }
    expect(Object.keys(manifest).sort()).toEqual([
      "frames",
      "housingId",
      "id",
      "keycapId",
      "orderable",
    ]);
  });

  it("rejects partial, reordered, mixed-path, wrong-dimension and unversionable frames", () => {
    const input = fixture();
    const [frame] = input.frames;
    for (const frames of [
      input.frames.slice(1),
      [...input.frames].reverse(),
      [...input.frames, frame],
      ...[
        { ...frame, angleDegrees: 5 },
        { ...frame, width: 512 },
        { ...frame, height: 768 },
        { ...frame, sha256: "bad" },
        {
          ...frame,
          src: frame.src.replace(
            "transparent--inventor",
            "ice-blue--nicepbt-bow-retail"
          ),
        },
        {
          ...frame,
          src: frame.src.replace(
            "maru60/assembled",
            "rule60-hhkb-unibody/customization"
          ),
        },
        { ...frame, src: `${frame.src}?v=untrusted` },
      ].map((bad) => [bad, ...input.frames.slice(1)]),
    ]) {
      expect(validatePersonalManifest({ ...input, frames })).toBeNull();
    }
  });

  it("creates a hash-versioned 12-frame assembled spin and rejects unchecked conversion", () => {
    const input = validatePersonalManifest(fixture());
    if (!input) {
      throw new Error("Synthetic fixture should validate");
    }
    const spin = personalManifestToSpin(input);
    expect(spin).toMatchObject({
      defaultFrame: 0,
      frameCount: 12,
      geometryRevision: "assembled-draft",
      height: 1536,
      width: 1024,
    });
    expect(spin.basePath).toBe(
      "/assets/products/maru60/assembled/v1/transparent--inventor"
    );
    expect(spin.frameSources).toEqual(
      input.frames.map((frame) => `${frame.src}?v=${frame.sha256}`)
    );
    expect(spin.poster).toBe(spin.frameSources?.[0]);
    expect(() => personalManifestToSpin({ ...input, frames: [] })).toThrow(
      "Only validated personal manifests"
    );
  });
});
