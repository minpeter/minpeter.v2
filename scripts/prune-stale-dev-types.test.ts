import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { pruneStaleDevTypes } from "./prune-stale-dev-types.mjs";

const roots: string[] = [];

function projectWithDevTypes(lockPid?: number) {
  const root = mkdtempSync(join(tmpdir(), "prune-dev-types-"));
  roots.push(root);
  mkdirSync(join(root, ".next/dev/types"), { recursive: true });
  writeFileSync(join(root, ".next/dev/types/validator.ts"), "export {};\n");
  if (lockPid !== undefined) {
    writeFileSync(
      join(root, ".next/dev/lock"),
      JSON.stringify({ pid: lockPid, port: 3000 })
    );
  }
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe("pruneStaleDevTypes", () => {
  it("removes dev types when no next dev lock exists", () => {
    const root = projectWithDevTypes();

    expect(pruneStaleDevTypes(root)).toBe(true);
    expect(existsSync(join(root, ".next/dev/types"))).toBe(false);
  });

  it("removes dev types when the locked dev server has exited", () => {
    const exitedPid = spawnSync(process.execPath, ["-e", ""]).pid;
    const root = projectWithDevTypes(exitedPid);

    expect(pruneStaleDevTypes(root)).toBe(true);
    expect(existsSync(join(root, ".next/dev/types"))).toBe(false);
  });

  it("keeps dev types owned by a running next dev", () => {
    const root = projectWithDevTypes(process.pid);

    expect(pruneStaleDevTypes(root)).toBe(false);
    expect(existsSync(join(root, ".next/dev/types/validator.ts"))).toBe(true);
  });
});
