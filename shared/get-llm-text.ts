import { getCurrentWebsiteUrl } from "@/shared/env";
import type { blogType } from "./source";

export async function getLLMText(page: blogType, full = false) {
  if (!page) {
    return "";
  }

  let processedContent: string;

  if (full) {
    // Get the raw markdown content for full mode
    const rawContent = await page.data.getText("processed");
    processedContent = (rawContent || "").trim();
  } else {
    // Get the structured content for summary mode
    const content = page.data.structuredData?.contents || "";
    processedContent =
      typeof content === "string" ? content : JSON.stringify(content, null, 2);
  }

  // Build the header sections
  const sections = [`# ${page.data.title}`, `URL: ${page.url}`];

  // Add source URL only for summary mode
  if (!full) {
    sections.push(`Source: ${getCurrentWebsiteUrl()}${page.url}.md`);
  }

  // Add metadata
  sections.push(
    `Published: ${page.data.date.toISOString()}`,
    "", // Empty line separator
    processedContent
  );

  return sections.join("\n");
}
