import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";

// Keep every running preview independent of subsequent builds in this checkout.
const root = path.resolve(import.meta.dirname, "..");
const previews = path.join(root, ".amp/in/previews");
await mkdir(previews, { recursive: true });
const snapshot = await mkdtemp(path.join(previews, "build-"));

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

  const server = spawn(process.execPath, [path.join(snapshot, "server.js")], {
    env: {
      ...process.env,
      HOSTNAME: "0.0.0.0",
      PORT: process.env.PORT ?? "8321",
    },
    stdio: "inherit",
  });
  process.once("SIGINT", () => server.kill("SIGINT"));
  process.once("SIGTERM", () => server.kill("SIGTERM"));
  const [code] = await once(server, "exit");
  process.exitCode = code ?? 1;
} finally {
  await rm(snapshot, { force: true, recursive: true });
}
