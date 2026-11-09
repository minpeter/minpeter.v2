// @ts-check
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * `next dev` writes route types to `.next/dev/types`, which tsconfig must
 * include (Next re-adds the glob on every dev/build). Next's own type checker
 * skips that folder during builds, but `experimental.useTypeScriptCli` and
 * `pnpm check:types` run plain `tsc`, so types left by an old dev session
 * break on routes deleted since. Remove them unless a live `next dev` still
 * owns them (its `.next/dev/lock` records the server PID).
 *
 * @param {string} root project directory
 * @returns {boolean} whether stale types were removed
 */
export function pruneStaleDevTypes(root) {
  const devDir = path.join(root, ".next", "dev");
  const typesDir = path.join(devDir, "types");
  if (!existsSync(typesDir) || isDevServerRunning(devDir)) {
    return false;
  }
  rmSync(typesDir, { force: true, recursive: true });
  return true;
}

/** @param {string} devDir */
function isDevServerRunning(devDir) {
  let pid;
  try {
    ({ pid } = JSON.parse(readFileSync(path.join(devDir, "lock"), "utf8")));
  } catch {
    return false;
  }
  if (!Number.isInteger(pid)) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: the process exists but belongs to another user.
    return /** @type {NodeJS.ErrnoException} */ (error).code === "EPERM";
  }
}

if (
  process.argv[1] === fileURLToPath(import.meta.url) &&
  pruneStaleDevTypes(process.cwd())
) {
  console.log("Removed stale .next/dev/types (no running next dev).");
}
