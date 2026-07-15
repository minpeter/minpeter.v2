import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { createMetadata, resolveLocale } from "@/shared/utils/metadata";

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: routeLocale } = await params;
  const locale = resolveLocale(routeLocale);
  const t = await getTranslations({ locale });

  return createMetadata({
    description: t("showcase.items.newYear.summary"),
    locale,
    path: "/show/new-year-clock",
    title: "minpeter | new year clock",
  });
}

export default function NewYearClockLayout({ children }: Readonly<Props>) {
  return children;
}
