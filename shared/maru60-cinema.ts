type Maru60CinemaActId = "profile" | "assembly" | "surface" | "lineup";

type Maru60CinemaBeatId =
  | "profileFront"
  | "profileUsb"
  | "profileBackplate"
  | "assemblyExploded"
  | "assemblySnap"
  | "assemblyHero"
  | "surfaceMacro"
  | "lineupDarkGreen"
  | "lineupIceBlue"
  | "lineupCharcoal"
  | "lineupBoneWhite"
  | "lineupTransparent"
  | "lineupAshGray"
  | "lineupLilacPurple"
  | "lineupWhiteMarble";

export interface Maru60CinemaBeat {
  readonly act: Maru60CinemaActId;
  readonly endFrame: number;
  readonly id: Maru60CinemaBeatId;
  /** 0-based index into the 8-unit lineup indicator during Act IV. */
  readonly lineupIndex?: number;
  readonly startFrame: number;
}

export const MARU60_SCROLL_SEQUENCE = {
  basePath: "/assets/products/maru60/cinema",
  frameCount: 120,
  height: 1800,
  /** Frame where the Act II -> III 3D arc dive begins blending toward full-bleed macro. */
  macroBlendStartFrame: 63,
  /** First frame of full-bleed Acts III–IV where edge feathering reaches 100%. */
  macroStartFrame: 70,
  version: "b61a6ca6",
  width: 1440,
} as const;

export function getMaru60CinemaFrameSrc(index: number): string {
  const clamped = Math.max(
    0,
    Math.min(MARU60_SCROLL_SEQUENCE.frameCount - 1, Math.round(index))
  );
  return `${MARU60_SCROLL_SEQUENCE.basePath}/f${String(clamped).padStart(2, "0")}.webp`;
}

/**
 * Exact frame-to-caption beats matching `scripts/import-maru60-cinema.py`.
 * Covers every frame from `0` through `119` with zero gaps or overlaps.
 */
export const MARU60_CINEMA_BEATS: readonly Maru60CinemaBeat[] = [
  {
    act: "profile",
    endFrame: 8,
    id: "profileFront",
    startFrame: 0,
  },
  {
    act: "profile",
    endFrame: 16,
    id: "profileUsb",
    startFrame: 9,
  },
  {
    act: "profile",
    endFrame: 31,
    id: "profileBackplate",
    startFrame: 17,
  },
  {
    act: "assembly",
    endFrame: 46,
    id: "assemblyExploded",
    startFrame: 32,
  },
  {
    act: "assembly",
    endFrame: 54,
    id: "assemblySnap",
    startFrame: 47,
  },
  {
    act: "assembly",
    endFrame: 65,
    id: "assemblyHero",
    startFrame: 55,
  },
  {
    act: "surface",
    endFrame: 87,
    id: "surfaceMacro",
    startFrame: 66,
  },
  {
    act: "lineup",
    endFrame: 91,
    id: "lineupDarkGreen",
    lineupIndex: 0,
    startFrame: 88,
  },
  {
    act: "lineup",
    endFrame: 95,
    id: "lineupIceBlue",
    lineupIndex: 1,
    startFrame: 92,
  },
  {
    act: "lineup",
    endFrame: 99,
    id: "lineupCharcoal",
    lineupIndex: 2,
    startFrame: 96,
  },
  {
    act: "lineup",
    endFrame: 103,
    id: "lineupBoneWhite",
    lineupIndex: 3,
    startFrame: 100,
  },
  {
    act: "lineup",
    endFrame: 107,
    id: "lineupTransparent",
    lineupIndex: 4,
    startFrame: 104,
  },
  {
    act: "lineup",
    endFrame: 111,
    id: "lineupAshGray",
    lineupIndex: 5,
    startFrame: 108,
  },
  {
    act: "lineup",
    endFrame: 115,
    id: "lineupLilacPurple",
    lineupIndex: 6,
    startFrame: 112,
  },
  {
    act: "lineup",
    endFrame: 119,
    id: "lineupWhiteMarble",
    lineupIndex: 7,
    startFrame: 116,
  },
];

export function getMaru60CinemaBeat(frameIndex: number): Maru60CinemaBeat {
  const clamped = Math.max(
    0,
    Math.min(MARU60_SCROLL_SEQUENCE.frameCount - 1, Math.round(frameIndex))
  );
  for (const beat of MARU60_CINEMA_BEATS) {
    if (clamped >= beat.startFrame && clamped <= beat.endFrame) {
      return beat;
    }
  }
  return MARU60_CINEMA_BEATS[0];
}
