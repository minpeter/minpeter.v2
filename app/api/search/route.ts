import { createFromSource } from "fumadocs-core/search/server";
import { after } from "next/server";
import { blog } from "@/shared/source";

const { GET: baseGET } = createFromSource(blog, {
  // Orama doesn't support ko/ja natively, fallback to english for tokenization
  localeMap: {
    ko: "english",
    en: "english",
    ja: "english",
  },
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query") ?? "";
  const locale = url.searchParams.get("locale") ?? "ko";

  after(() => {
    console.info("[search]", {
      query,
      locale,
      timestamp: new Date().toISOString(),
    });
  });

  return await baseGET(request);
}
