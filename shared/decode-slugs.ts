import { decodeSlugs as decodeSlugsCore } from "./decode-slugs-core.js";

export function decodeSlugs(slugs: readonly string[] = []): string[] {
  return decodeSlugsCore(slugs);
}
