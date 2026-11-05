import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const OG_GIF = new URL(
  "../public/assets/products/rule60-hhkb-unibody/og.gif",
  import.meta.url
);

// Unfurlers (X, Slack, Discord) fetch og:image eagerly; keep the animated
// preview light. Regenerate with gifsicle --lossy rather than raising this.
const MAX_GIF_BYTES = 3.5 * 1024 * 1024;

const GIF_TRAILER = 0x3b;
const IMAGE_DESCRIPTOR = 0x2c;
const EXTENSION = 0x21;
const GRAPHIC_CONTROL = 0xf9;
const APPLICATION = 0xff;

/** Skips a chain of GIF data sub-blocks, returning the offset after the 0 terminator. */
function skipSubBlocks(bytes: Buffer, offset: number): number {
  let cursor = offset;
  while (bytes[cursor] !== 0) {
    cursor += bytes[cursor] + 1;
  }
  return cursor + 1;
}

function colorTableSize(packed: number): number {
  // biome-ignore lint/suspicious/noBitwiseOperators: GIF packed-field flags.
  return packed & 0x80 ? 3 * 2 ** ((packed & 0x07) + 1) : 0;
}

function parseGif(bytes: Buffer) {
  const width = bytes.readUInt16LE(6);
  const height = bytes.readUInt16LE(8);
  let cursor = 13 + colorTableSize(bytes[10]);
  let frames = 0;
  let totalDelayCs = 0;
  let loops: number | undefined;

  while (bytes[cursor] !== GIF_TRAILER) {
    const block = bytes[cursor];
    if (block === EXTENSION) {
      const label = bytes[cursor + 1];
      if (label === GRAPHIC_CONTROL) {
        totalDelayCs += bytes.readUInt16LE(cursor + 4);
      }
      if (
        label === APPLICATION &&
        bytes.toString("ascii", cursor + 3, cursor + 14) === "NETSCAPE2.0"
      ) {
        loops = bytes.readUInt16LE(cursor + 16);
      }
      cursor = skipSubBlocks(bytes, cursor + 2);
    } else if (block === IMAGE_DESCRIPTOR) {
      frames += 1;
      cursor += 10 + colorTableSize(bytes[cursor + 9]);
      // LZW minimum code size, then the image data sub-blocks.
      cursor = skipSubBlocks(bytes, cursor + 1);
    } else {
      throw new Error(`Unexpected GIF block 0x${block.toString(16)}`);
    }
  }

  return { frames, height, loops, totalDelayCs, width };
}

describe("MARU60 animated OG image", () => {
  const bytes = readFileSync(OG_GIF);

  it("stays under the size budget", () => {
    expect(bytes.byteLength).toBeLessThanOrEqual(MAX_GIF_BYTES);
  });

  it("matches the 1200×630, 6 s, 10 fps infinitely looping clip", () => {
    expect(bytes.toString("ascii", 0, 6)).toBe("GIF89a");
    expect(parseGif(bytes)).toEqual({
      frames: 60,
      height: 630,
      loops: 0,
      totalDelayCs: 600,
      width: 1200,
    });
  });
});
