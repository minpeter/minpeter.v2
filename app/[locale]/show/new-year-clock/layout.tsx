import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { createMetadata } from "@/shared/utils/metadata";

// Deliberate Block: client-only interaction (canvas / Date.now / Math.random / network).
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface Props {
  children: ReactNode;
}

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

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
