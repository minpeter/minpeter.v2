import { z } from "zod";

import manifests from "./keyboard-customization-manifests.json";
import type { ProductSpin } from "./products";

const HOUSING_SOURCE =
  "https://store.bblcdn.eu/s8/default/f131f643495b417197832b291fc7b068/Bambu_PLA_Matte_Hex_Code.pdf";

/** Manufacturer color references, not calibrated predictions of printed material. */
export const HOUSING_OPTIONS = (
  [
    { hex: "#CBC6B8", id: "bone-white", name: "Bone White", sku: "11103" },
    { hex: "#9B9EA0", id: "ash-gray", name: "Ash Gray", sku: "11102" },
    { hex: "#000000", id: "charcoal", name: "Charcoal", sku: "11101" },
    { hex: "#A3D8E1", id: "ice-blue", name: "Ice Blue", sku: "11601" },
    { hex: "#AE96D4", id: "lilac-purple", name: "Lilac Purple", sku: "11700" },
    { hex: "#68724D", id: "dark-green", name: "Dark Green", sku: "11501" },
    { hex: "#F7F3F0", id: "white-marble", name: "White Marble", sku: "13103" },
  ] as const
).map((option) => ({
  ...option,
  material: option.id === "white-marble" ? "PLA Marble" : "PLA Matte",
  materialCalibration: "approximate" as const,
  sourceUrl:
    option.id === "white-marble"
      ? "https://bambu-lab-global.myshopify.com/products/pla-marble"
      : HOUSING_SOURCE,
}));

/** Full retail sets only; personal custom logo caps are showcase-only, never options. */
export const KEYCAP_OPTIONS = [
  {
    compatibility: "unverified",
    id: "retro-programmer-retail",
    name: "Retro Programmer (retail set)",
    personalLogos: false,
  },
  {
    compatibility: "unverified",
    id: "nicepbt-bow-retail",
    legendMethod: "dye-sublimation",
    material: "PBT",
    name: "NicePBT BoW (retail set)",
    personalLogos: false,
    profile: "Cherry",
    sourceUrl: "https://cannonkeys.com/products/nicepbt-bow",
    thicknessMm: 1.7,
  },
  {
    compatibility: "unverified",
    id: "pbtfans-wob-retail",
    name: "PBTfans WoB — Base Text Modifiers",
    personalLogos: false,
    sku: "PT04-1",
    sourceUrl:
      "https://kbdfans.com/products/pbtfans-doubleshot-wob?variant=40342537273483",
  },
  {
    compatibility: "unverified",
    id: "nicepbt-noel-latin-retail",
    name: "NicePBT Noel — Latin",
    personalLogos: false,
    sku: "NICEPBT-NOEL-LTN",
    sourceUrl:
      "https://cannonkeys.com/products/nicepbt-noel?variant=41071476801647",
  },
  {
    compatibility: "unverified",
    id: "nicepbt-purple-chonkers-retail",
    name: "NicePBT Purple Chonkers — Text Keys",
    personalLogos: false,
    sku: "NICEPBT-PRPL-CHONK",
    sourceUrl:
      "https://cannonkeys.com/products/nicepbt-purple-chonkers?variant=41995100356719",
  },
] as const;

export type HousingId = (typeof HOUSING_OPTIONS)[number]["id"];
export type KeycapId = (typeof KEYCAP_OPTIONS)[number]["id"];

const angles = Array.from({ length: 12 }, (_, index) => index * 30);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const qaReview = {
  reviewedAt: z.iso.datetime({ offset: true }),
  reviewer: z.string().trim().min(1),
};
const combinationSchema = z
  .object({
    frames: z
      .array(
        z.object({
          angleDegrees: z.number().int(),
          height: z.literal(1536),
          sha256: digest,
          src: z.string(),
          width: z.literal(1024),
        })
      )
      .length(12),
    housingId: z.enum(HOUSING_OPTIONS.map((option) => option.id)),
    id: z.string(),
    keycapId: z.enum(KEYCAP_OPTIONS.map((option) => option.id)),
    kitQa: z.object({
      ...qaReview,
      keys: z
        .array(
          z.object({ passed: z.literal(true), position: z.string().min(1) })
        )
        .length(60),
      status: z.literal("60-of-60-passed"),
    }),
    kitQaStatus: z.literal("60-of-60-passed"),
    materialCalibration: z.literal("approximate"),
    renderer: z.string().trim().min(1),
    sourceDigest: digest,
    status: z.literal("validated"),
    visualQa: z.object({
      ...qaReview,
      angles: z.array(z.number()).length(12),
      status: z.literal("passed"),
    }),
  })
  .refine((value) => value.id === `${value.housingId}--${value.keycapId}`)
  .refine(
    (value) => new Set(value.kitQa.keys.map((key) => key.position)).size === 60
  )
  .refine((value) =>
    value.frames.every(
      (frame, index) =>
        frame.angleDegrees === angles[index] &&
        frame.src ===
          `/assets/products/rule60-hhkb-unibody/customization/v1/${value.id}/frame_${String(angles[index]).padStart(3, "0")}.webp`
    )
  )
  .refine((value) =>
    value.visualQa.angles.every((angle, index) => angle === angles[index])
  );

export type ValidatedCombination = z.infer<typeof combinationSchema>;

/** Metadata gate only. Repository tests additionally verify each published file's bytes. */
export function validateCombination(
  input: unknown
): ValidatedCombination | null {
  const parsed = combinationSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

// Published manifests are immutable build inputs. Validate once, not for every option on every render.
const publishedCombinations = manifests.map(validateCombination);

export function getValidatedCombination(
  housingId: string,
  keycapId: string,
  candidates?: readonly unknown[]
): ValidatedCombination | null {
  const validated = candidates
    ? candidates.map(validateCombination)
    : publishedCombinations;
  const matches = validated.filter(
    (candidate) =>
      candidate?.housingId === housingId && candidate.keycapId === keycapId
  );
  return matches.length === 1 ? matches[0] : null;
}

export function combinationToSpin(
  combination: ValidatedCombination
): ProductSpin {
  const validated = validateCombination(combination);
  if (!validated) {
    throw new Error("Only validated retail combinations can become a spin");
  }
  const frameSources = validated.frames.map(
    (frame) => `${frame.src}?v=${frame.sha256}`
  );
  return {
    basePath: `/assets/products/rule60-hhkb-unibody/customization/v1/${validated.id}`,
    defaultFrame: 0,
    frameCount: 12,
    frameSources,
    height: 1536,
    poster: frameSources[0],
    width: 1024,
  };
}
