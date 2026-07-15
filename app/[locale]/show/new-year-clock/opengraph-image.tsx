import { createOgImageResponse } from "@/shared/og-image";

export const alt = "minpeter | new year clock";
export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return createOgImageResponse({ locale, title: "minpeter | new year clock" });
}
