import { cacheLife } from "next/cache";

import { createOgImageResponse } from "@/shared/og-image";

async function getNotFoundOgImage(locale: string) {
  "use cache";
  cacheLife("days");

  return await createOgImageResponse({
    locale,
    title: "minpeter | 404",
  });
}

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
) => {
  const { locale } = await params;

  return getNotFoundOgImage(locale);
};
