"use client";

import type { Route } from "next";
import { useLocale, useTranslations } from "next-intl";
import Header from "@/components/header";

export default function NotFound() {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <section>
      <Header
        description={t("404")}
        link={{ href: `/${locale}` as Route, text: "" }}
        title="404"
      />
    </section>
  );
}
