import { z } from "zod";

import manifest from "./maru60-personal-manifest.json";
import type { ProductSpin } from "./products";

const angles = Array.from({ length: 12 }, (_, index) => index * 30);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const basePath = "/assets/products/maru60/assembled/v1/transparent--inventor";

/** Public structure only; no QA evidence or orderability claims are encoded here. */
const personalManifestSchema = z
  .strictObject({
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
    housingId: z.literal("transparent"),
    id: z.literal("transparent--inventor"),
    keycapId: z.literal("inventor"),
    orderable: z.literal(false),
  })
  .refine((value) =>
    value.frames.every(
      (frame, index) =>
        frame.angleDegrees === angles[index] &&
        frame.src ===
          `${basePath}/frame_${String(angles[index]).padStart(3, "0")}.webp`
    )
  );

export type ValidatedPersonalManifest = z.infer<typeof personalManifestSchema>;

export function validatePersonalManifest(
  input: unknown
): ValidatedPersonalManifest | null {
  const parsed = personalManifestSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

/** Null until a structurally complete public personal manifest is present. */
export const validatedPersonalManifest = validatePersonalManifest(manifest);

export function personalManifestToSpin(
  input: ValidatedPersonalManifest
): ProductSpin {
  const validated = validatePersonalManifest(input);
  if (!validated) {
    throw new Error("Only validated personal manifests can become a spin");
  }
  const frameSources = validated.frames.map(
    (frame) => `${frame.src}?v=${frame.sha256}`
  );
  return {
    basePath,
    defaultFrame: 0,
    frameCount: 12,
    frameSources,
    geometryRevision: "assembled-draft",
    height: 1536,
    poster: frameSources[0],
    width: 1024,
  };
}
