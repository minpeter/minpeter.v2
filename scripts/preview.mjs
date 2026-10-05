import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { constants } from "node:os";
import path from "node:path";

// Keep every running preview independent of subsequent builds in this checkout.
const root = path.resolve(import.meta.dirname, "..");
const previews = path.join(root, ".amp/in/previews");
await mkdir(previews, { recursive: true });
const snapshot = await mkdtemp(path.join(previews, "build-"));
let server;
let stopping = false;

function stop(signal) {
  stopping = true;
  process.exitCode = 128 + constants.signals[signal];
  server?.kill(signal);
}

// A signal during copying still reaches finally, without starting a server.
process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));

try {
  await cp(path.join(root, ".next/standalone"), snapshot, {
    recursive: true,
    verbatimSymlinks: true,
  });
  await cp(
    path.join(root, ".next/static"),
    path.join(snapshot, ".next/static"),
    {
      recursive: true,
    }
  );
  await cp(path.join(root, "public"), path.join(snapshot, "public"), {
    recursive: true,
  });

  if (!stopping) {
    server = spawn(process.execPath, [path.join(snapshot, "server.js")], {
      env: {
        ...process.env,
        HOSTNAME: "0.0.0.0",
        PORT: process.env.PORT ?? "8321",
      },
      stdio: "inherit",
    });
    // once() rejects on spawn errors, so finally also handles failed starts.
    const [code, signal] = await once(server, "exit");
    if (!stopping) {
      process.exitCode = signal ? 128 + constants.signals[signal] : (code ?? 1);
    }
  }
} finally {
  await rm(snapshot, { force: true, recursive: true });
}
