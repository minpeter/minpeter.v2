import { z } from "zod";

import type { ProductSpin } from "./products";
import standManifests from "./skateboard-stand-manifests.json";

const MATTE_SOURCE =
  "https://store.bblcdn.eu/s8/default/f131f643495b417197832b291fc7b068/Bambu_PLA_Matte_Hex_Code.pdf";
const MARBLE_SOURCE =
  "https://bambu-lab-global.myshopify.com/products/pla-marble";

/** Manufacturer color references, not calibrated predictions of printed material. */
export const STAND_COLOR_OPTIONS = (
  [
    { hex: "#CBC6B8", id: "bone-white", name: "Bone White", sku: "11103" },
    { hex: "#1B56C6", id: "cobalt-blue", name: "Cobalt Blue", sku: "11602" },
    { hex: "#000000", id: "charcoal", name: "Charcoal", sku: "11101" },
    { hex: "#9B9EA0", id: "ash-gray", name: "Ash Gray", sku: "11102" },
    { hex: "#A3D8E1", id: "ice-blue", name: "Ice Blue", sku: "11601" },
    { hex: "#68724D", id: "dark-green", name: "Dark Green", sku: "11501" },
    { hex: "#F7F3F0", id: "white-marble", name: "White Marble", sku: "13103" },
  ] as const
).map((option) => ({
  ...option,
  material: option.id === "white-marble" ? "PLA Marble" : "PLA Matte",
  materialCalibration: "approximate" as const,
  sourceUrl: option.id === "white-marble" ? MARBLE_SOURCE : MATTE_SOURCE,
}));

export const STAND_VIEW_OPTIONS = [{ id: "board" }, { id: "stand" }] as const;

export type StandColorId = (typeof STAND_COLOR_OPTIONS)[number]["id"];
export type StandViewId = (typeof STAND_VIEW_OPTIONS)[number]["id"];

interface StandUsageScene {
  height: number;
  id: "real" | "side" | "slot" | "top" | "underside" | "wall";
  src: string;
  version: string;
  width: number;
}

export const STAND_SCROLL_SEQUENCE = {
  basePath: "/assets/products/skateboard-stand/sequence",
  frameCount: 60,
  height: 1440,
  posterFrame: 25,
  version: "qhd1",
  width: 2560,
} as const;

export function getScrollSequenceFrameSrc(index: number): string {
  const clamped = Math.max(
    0,
    Math.min(STAND_SCROLL_SEQUENCE.frameCount - 1, Math.round(index))
  );
  return `${STAND_SCROLL_SEQUENCE.basePath}/frame_${String(clamped).padStart(3, "0")}.webp`;
}

export const STAND_USAGE_SCENES: readonly StandUsageScene[] = [
  {
    height: 1440,
    id: "wall",
    src: "/assets/products/skateboard-stand/scenes/scene-wall.webp",
    version: "ebb0abda",
    width: 2160,
  },
  {
    height: 1600,
    id: "real",
    src: "/assets/products/skateboard-stand/scenes/scene-real.webp",
    version: "1080e0a1",
    width: 1200,
  },
  {
    height: 960,
    id: "slot",
    src: "/assets/products/skateboard-stand/scenes/scene-slot.webp",
    version: "e1c0293a",
    width: 1440,
  },
  {
    height: 1440,
    id: "top",
    src: "/assets/products/skateboard-stand/scenes/scene-top.webp",
    version: "a3249a67",
    width: 2160,
  },
  {
    height: 1440,
    id: "side",
    src: "/assets/products/skateboard-stand/scenes/scene-side.webp",
    version: "fbc825fc",
    width: 2160,
  },
  {
    height: 1440,
    id: "underside",
    src: "/assets/products/skateboard-stand/scenes/scene-underside.webp",
    version: "fdea8951",
    width: 2160,
  },
];

const angles = Array.from({ length: 12 }, (_, index) => index * 30);
const digest = z.string().regex(/^[a-f0-9]{64}$/u);

const standSetSchema = z
  .strictObject({
    colorId: z.enum(STAND_COLOR_OPTIONS.map((option) => option.id)),
    frames: z
      .array(
        z.strictObject({
          angleDegrees: z.number().int(),
          height: z.literal(1536),
          sha256: digest,
          src: z.string(),
          width: z.literal(1024),
        })
      )
      .length(12),
    id: z.string(),
    viewId: z.enum(STAND_VIEW_OPTIONS.map((option) => option.id)),
  })
  .refine((value) => value.id === `${value.viewId}--${value.colorId}`)
  .refine((value) => {
    const folder = value.viewId === "board" ? "with-board" : "stand";
    return value.frames.every(
      (frame, index) =>
        frame.angleDegrees === angles[index] &&
        frame.src ===
          `/assets/products/skateboard-stand/turntable/${folder}/${value.colorId}/frame_${String(angles[index]).padStart(3, "0")}.webp`
    );
  });

export type ValidatedStandSet = z.infer<typeof standSetSchema>;

function validateStandSet(input: unknown): ValidatedStandSet | null {
  const parsed = standSetSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

const publishedStandSets = standManifests.map(validateStandSet);

export function getValidatedStandSet(
  viewId: StandViewId,
  colorId: StandColorId,
  candidates?: readonly unknown[]
): ValidatedStandSet | null {
  const validated = candidates
    ? candidates.map(validateStandSet)
    : publishedStandSets;
  const matches = validated.filter(
    (candidate) => candidate?.viewId === viewId && candidate.colorId === colorId
  );
  return matches.length === 1 ? matches[0] : null;
}

export function standSetToSpin(set: ValidatedStandSet): ProductSpin {
  const validated = validateStandSet(set);
  if (!validated) {
    throw new Error("Only validated stand render sets can become a spin");
  }
  const frameSources = validated.frames.map(
    (frame) => `${frame.src}?v=${frame.sha256}`
  );
  return {
    basePath: validated.frames[0].src.slice(
      0,
      validated.frames[0].src.lastIndexOf("/")
    ),
    defaultFrame: 0,
    frameCount: 12,
    frameSources,
    height: 1536,
    poster: frameSources[0],
    width: 1024,
  };
}

export function getDefaultStandSpin(): ProductSpin {
  const defaultSet = getValidatedStandSet("board", "bone-white");
  if (defaultSet) {
    return standSetToSpin(defaultSet);
  }
  return {
    basePath:
      "/assets/products/skateboard-stand/turntable/with-board/bone-white",
    defaultFrame: 0,
    frameCount: 12,
    height: 1536,
    poster:
      "/assets/products/skateboard-stand/turntable/with-board/bone-white/frame_000.webp",
    width: 1024,
  };
}
