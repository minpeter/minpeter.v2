import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  combinationToSpin,
  getValidatedCombination,
  HOUSING_OPTIONS,
  isPersonalConfiguration,
  isUnsupportedPersonalPair,
  KEYCAP_OPTIONS,
  SELECTION_HOUSING_OPTIONS,
  SELECTION_KEYCAP_OPTIONS,
  validateCombination,
} from "./keyboard-customization";
import manifests from "./keyboard-customization-manifests.json";

function fixture() {
  const id = "bone-white--nicepbt-bow-retail";
  const angles = Array.from({ length: 12 }, (_, index) => index * 30);
  const review = { reviewedAt: "2026-10-31T00:00:00Z", reviewer: "test-only" };
  return {
    frames: angles.map((angleDegrees) => ({
      angleDegrees,
      height: 1536,
      sha256: "a".repeat(64),
      src: `/assets/products/rule60-hhkb-unibody/customization/v1/${id}/frame_${String(angleDegrees).padStart(3, "0")}.webp`,
      width: 1024,
    })),
    housingId: "bone-white",
    id,
    keycapId: "nicepbt-bow-retail",
    kitQa: {
      ...review,
      keys: Array.from({ length: 60 }, (_, i) => ({
        passed: true,
        position: `key-${i}`,
      })),
      status: "60-of-60-passed",
    },
    kitQaStatus: "60-of-60-passed",
    materialCalibration: "approximate",
    renderer: "test-fixture-not-production",
    sourceDigest: "b".repeat(64),
    status: "validated",
    visualQa: { ...review, angles, status: "passed" },
  };
}

describe("keyboard customization availability gates", () => {
  it("keeps Inventor and Transparent paired outside every retail manifest", () => {
    expect(SELECTION_HOUSING_OPTIONS).toHaveLength(8);
    expect(SELECTION_KEYCAP_OPTIONS).toHaveLength(6);
    expect(isPersonalConfiguration("transparent", "inventor")).toBe(true);
    expect(isUnsupportedPersonalPair("transparent", "inventor")).toBe(false);
    expect(getValidatedCombination("transparent", "inventor")).toBeNull();
    expect(
      validateCombination({
        ...fixture(),
        housingId: "transparent",
        id: "transparent--inventor",
        keycapId: "inventor",
      })
    ).toBeNull();
    for (const housing of HOUSING_OPTIONS) {
      expect(isUnsupportedPersonalPair(housing.id, "inventor")).toBe(true);
      expect(isPersonalConfiguration(housing.id, "inventor")).toBe(false);
    }
    for (const kit of KEYCAP_OPTIONS) {
      expect(isUnsupportedPersonalPair("transparent", kit.id)).toBe(true);
      expect(isPersonalConfiguration("transparent", kit.id)).toBe(false);
    }
  });

  it("keeps seven material approximations and five logo-free retail candidates independently gated", () => {
    expect(HOUSING_OPTIONS).toHaveLength(7);
    expect(KEYCAP_OPTIONS).toHaveLength(5);
    expect(
      HOUSING_OPTIONS.find((option) => option.id === "white-marble")
    ).toMatchObject({ hex: "#F7F3F0", material: "PLA Marble", sku: "13103" });
    for (const housing of HOUSING_OPTIONS) {
      expect(housing.materialCalibration).toBe("approximate");
      for (const keycap of KEYCAP_OPTIONS) {
        expect(keycap.personalLogos).toBe(false);
        expect(keycap.compatibility).toBe("unverified");
        const expected = manifests.find(
          (item) => item.housingId === housing.id && item.keycapId === keycap.id
        );
        expect(Boolean(getValidatedCombination(housing.id, keycap.id))).toBe(
          Boolean(expected)
        );
      }
    }
  });

  it("rejects missing, partial, pending, malformed, and duplicate combinations", () => {
    for (const input of [
      null,
      {},
      { ...fixture(), status: "pending" },
      { ...fixture(), kitQa: undefined },
      { ...fixture(), visualQa: undefined },
      { ...fixture(), sourceDigest: "bad" },
      { ...fixture(), id: "wrong" },
    ]) {
      expect(validateCombination(input)).toBeNull();
    }
    const candidate = fixture();
    expect(
      getValidatedCombination(candidate.housingId, candidate.keycapId, [
        candidate,
        candidate,
      ])
    ).toBeNull();
    expect(
      getValidatedCombination("charcoal", candidate.keycapId, [candidate])
    ).toBeNull();
  });

  it("rejects missing angles, reordered frames, wrong paths, and incomplete QA", () => {
    const missing = fixture();
    missing.frames.pop();
    expect(validateCombination(missing)).toBeNull();
    const reordered = fixture();
    reordered.frames.reverse();
    expect(validateCombination(reordered)).toBeNull();
    const badPath = fixture();
    badPath.frames[0].src = badPath.frames[0].src.replace(
      "bone-white",
      "charcoal"
    );
    expect(validateCombination(badPath)).toBeNull();
    const duplicateKey = fixture();
    duplicateKey.kitQa.keys[1].position = duplicateKey.kitQa.keys[0].position;
    expect(validateCombination(duplicateKey)).toBeNull();
    const badQa = fixture();
    badQa.visualQa.angles[0] = 330;
    expect(validateCombination(badQa)).toBeNull();
  });

  it("derives cache-versioned explicit frame sources and the exact first poster", () => {
    const candidate = fixture();
    const validated = getValidatedCombination(
      candidate.housingId,
      candidate.keycapId,
      [candidate]
    );
    expect(validated).not.toBeNull();
    if (!validated) {
      throw new Error("Fixture should validate");
    }
    const spin = combinationToSpin(validated);
    expect(spin).toMatchObject({
      defaultFrame: 0,
      frameCount: 12,
      height: 1536,
      width: 1024,
    });
    expect(spin.frameSources).toHaveLength(12);
    expect(spin.poster).toBe(
      `${candidate.frames[0].src}?v=${candidate.frames[0].sha256}`
    );
    expect(spin.frameSources?.[11]).toContain("frame_330.webp?v=");
  });

  it("verifies real files for every published manifest, never trusting metadata alone", () => {
    const ids = new Set<string>();
    for (const input of manifests) {
      const candidate = validateCombination(input);
      expect(candidate).not.toBeNull();
      if (!candidate) {
        throw new Error("Invalid production combination manifest");
      }
      expect(ids.has(candidate.id)).toBe(false);
      ids.add(candidate.id);
      const publishedManifest = JSON.parse(
        readFileSync(
          new URL(
            `../public/assets/products/rule60-hhkb-unibody/customization/v1/${candidate.id}/manifest.json`,
            import.meta.url
          ),
          "utf8"
        )
      );
      expect(publishedManifest).toEqual(input);
      for (const frame of candidate.frames) {
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
    }
  });
});
