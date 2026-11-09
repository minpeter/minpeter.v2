import { getTranslations } from "next-intl/server";

import { createOgImageResponse } from "@/shared/og-image";
import { resolveLocale } from "@/shared/utils/metadata";

export const alt = "minpeter | the load balancer";
export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const locale = resolveLocale(routeLocale);
  const t = await getTranslations({
    locale,
    namespace: "showcase.items.loadBalancer",
  });

  return createOgImageResponse({
    locale,
    title: `minpeter | ${t("title")}`,
  });
}
