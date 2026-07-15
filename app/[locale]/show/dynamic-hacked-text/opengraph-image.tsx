import { createOgImageResponse } from "@/shared/og-image";

export const alt = "minpeter | dynamic hacked text";
export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return createOgImageResponse({
    locale,
    title: "minpeter | dynamic hacked text",
  });
}
