import { createOgImageResponse } from "@/shared/og-image";

export const alt = "minpeter — software engineer";
export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

export default function Image() {
  return createOgImageResponse({ locale: "ko", title: "minpeter" });
}
