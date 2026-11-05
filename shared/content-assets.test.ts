import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const CONTENT_ROOT = path.join(process.cwd(), "content");
// `/_next/image?url=` decodes `+` as a space (400), and `#`, `?`, `%`, `&`
// change URL meaning, so MDX-imported assets must avoid them.
const URL_RESERVED = /[+#?%&]/u;

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

describe("content assets", () => {
  it("use URL-safe filenames", () => {
    const unsafe = listFiles(CONTENT_ROOT)
      .filter((file) => !(file.endsWith(".mdx") || file.endsWith(".json")))
      .filter((file) => URL_RESERVED.test(path.basename(file)))
      .map((file) => path.relative(CONTENT_ROOT, file));
    expect(unsafe).toStrictEqual([]);
  });
});
