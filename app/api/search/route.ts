import { createFromSource } from "fumadocs-core/search/server";
import { blog } from "@/shared/source";

export const { GET } = createFromSource(blog, {
  // Orama doesn't support ko/ja natively, fallback to english for tokenization
  localeMap: {
    ko: "english",
    en: "english",
    ja: "english",
  },
});
