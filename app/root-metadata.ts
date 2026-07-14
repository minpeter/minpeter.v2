import type { Viewport } from "next";

import NewMetadata from "@/shared/utils/metadata";

export const metadata = NewMetadata({
  description: "이 웹에서 가장 멋진 사이트가 될거야~",
  title: "minpeter",
});

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { color: "#ffffff", media: "(prefers-color-scheme: light)" },
    { color: "#0a0a0b", media: "(prefers-color-scheme: dark)" },
  ],
};
