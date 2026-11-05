import { cacheLife } from "next/cache";

import { createOgImageBytes, ogImageBytesResponse } from "@/shared/og-image";

async function getNotFoundOgImage(locale: string) {
  "use cache";
  cacheLife("days");

  return await createOgImageBytes({
    locale,
    title: "minpeter | 404",
  });
}

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
) => {
  const { locale } = await params;

  return ogImageBytesResponse(await getNotFoundOgImage(locale));
};
