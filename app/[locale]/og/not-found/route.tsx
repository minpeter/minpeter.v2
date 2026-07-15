import { createOgImageResponse } from "@/shared/og-image";

export const dynamic = "force-static";
export const revalidate = 86_400;
export const runtime = "nodejs";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
) => {
  const { locale } = await params;

  return createOgImageResponse({
    locale,
    title: "minpeter | 404",
  });
};
