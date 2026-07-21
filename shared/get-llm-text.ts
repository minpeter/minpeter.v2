import { getBaseUrl } from "@/shared/env";

import type { blogType } from "./source";

export async function getLLMText(
  page: NonNullable<blogType>,
  full = false
): Promise<string> {
  let processedContent: string;

  if (full) {
    const rawContent = await page.data.getText("processed");
    processedContent = rawContent.trim();
  } else {
    const content = page.data.structuredData?.contents || "";
    processedContent =
      typeof content === "string" ? content : JSON.stringify(content, null, 2);
  }

  const sections = [`# ${page.data.title}`, `URL: ${page.url}`];

  if (!full) {
    sections.push(`Source: ${getBaseUrl()}${page.url}.md`);
  }

  sections.push(
    `Published: ${page.data.published.toISOString()}`,
    "",
    processedContent
  );

  return sections.join("\n");
}
