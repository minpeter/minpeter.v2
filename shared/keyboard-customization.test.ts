import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
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
import previousManifests from "./keyboard-customization-manifests.json";
import manifests from "./maru60-assembled-manifests.json";

/** Synthetic structure, not evidence of visual or physical QA. */
function fixture() {
  const housingId = "bone-white";
  const keycapId = "nicepbt-bow-retail";
  const id = `${housingId}--${keycapId}`;
  return {
    frames: Array.from({ length: 12 }, (_, index) => ({
      angleDegrees: index * 30,
      height: 1536,
      sha256: "a".repeat(64),
      src: `/assets/products/maru60/assembled/v1/${id}/frame_${String(index * 30).padStart(3, "0")}.webp`,
      width: 1024,
    })),
    housingId,
    id,
    keycapId,
    orderable: false,
  };
}

describe("public retail manifest structural gates", () => {
  it("publishes only minimal assembled retail structures and no previous retail assets", () => {
    expect(previousManifests).toEqual([]);
    expect(
      existsSync("public/assets/products/rule60-hhkb-unibody/customization")
    ).toBe(false);
    expect(manifests.length).toBeGreaterThan(0);
    for (const entry of manifests) {
      expect(Object.keys(entry).sort()).toEqual([
        "frames",
        "housingId",
        "id",
        "keycapId",
        "orderable",
      ]);
    }
  });
  it("keeps personal choices separate and preserves all selector options", () => {
    expect(HOUSING_OPTIONS).toHaveLength(7);
    expect(KEYCAP_OPTIONS).toHaveLength(5);
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
    }
    for (const kit of KEYCAP_OPTIONS) {
      expect(isUnsupportedPersonalPair("transparent", kit.id)).toBe(true);
    }
  });
  it("makes availability exactly match complete public entries", () => {
    for (const housing of HOUSING_OPTIONS) {
      for (const kit of KEYCAP_OPTIONS) {
        expect(Boolean(getValidatedCombination(housing.id, kit.id))).toBe(
          manifests.some(
            (entry) =>
              entry.housingId === housing.id && entry.keycapId === kit.id
          )
        );
      }
    }
  });
  it("rejects incomplete, orderable, unknown-field, mismatched and duplicate entries", () => {
    const input = fixture();
    for (const invalid of [
      null,
      {},
      { ...input, orderable: true },
      { ...input, orderable: undefined },
      { ...input, id: "wrong" },
      { ...input, extra: "not-public" },
      { ...input, frames: input.frames.slice(1) },
    ]) {
      expect(validateCombination(invalid)).toBeNull();
    }
    expect(
      getValidatedCombination(input.housingId, input.keycapId, [input, input])
    ).toBeNull();
    expect(
      getValidatedCombination(input.housingId, input.keycapId, [
        { ...input, frames: [] },
      ])
    ).toBeNull();
    expect(
      getValidatedCombination("charcoal", input.keycapId, [input])
    ).toBeNull();
  });
  it("requires exact ordered paths, dimensions and frame digests", () => {
    const input = fixture();
    const [frame] = input.frames;
    for (const frames of [
      [...input.frames].reverse(),
      ...[
        { ...frame, angleDegrees: 5 },
        { ...frame, sha256: "bad" },
        { ...frame, width: 512 },
        { ...frame, height: 768 },
        { ...frame, extra: true },
        { ...frame, src: frame.src.replace("bone-white", "charcoal") },
        {
          ...frame,
          src: frame.src.replace(
            "maru60/assembled",
            "rule60-hhkb-unibody/customization"
          ),
        },
      ].map((bad) => [bad, ...input.frames.slice(1)]),
    ]) {
      expect(validateCombination({ ...input, frames })).toBeNull();
    }
  });
  it("derives hash-versioned frame identity and exact first poster", () => {
    const input = validateCombination(fixture());
    if (!input) {
      throw new Error("Synthetic fixture should be structurally complete");
    }
    const spin = combinationToSpin(input);
    expect(spin).toMatchObject({
      defaultFrame: 0,
      frameCount: 12,
      geometryRevision: "assembled-draft",
      height: 1536,
      width: 1024,
    });
    expect(spin.frameSources).toEqual(
      input.frames.map((frame) => `${frame.src}?v=${frame.sha256}`)
    );
    expect(spin.poster).toBe(spin.frameSources?.[0]);
    expect(() => combinationToSpin({ ...input, frames: [] })).toThrow();
  });
  it("verifies actual published bytes, dimensions, alpha and public manifests", () => {
    const ids = new Set<string>();
    for (const input of manifests) {
      const candidate = validateCombination(input);
      if (!candidate) {
        throw new Error("Published manifest must be structurally complete");
      }
      expect(ids.has(candidate.id)).toBe(false);
      ids.add(candidate.id);
      expect(
        getValidatedCombination(candidate.housingId, candidate.keycapId)
      ).toEqual(candidate);
      const file = JSON.parse(
        readFileSync(
          new URL(
            `../public${combinationToSpin(candidate).basePath}/manifest.json`,
            import.meta.url
          ),
          "utf8"
        )
      );
      expect(file).toEqual(input);
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
