"use client";

import Header from "@/components/header";
import { useCurrentLocale, useI18n } from "@/locales/client";
import type { Route } from "next";

export default function NotFound() {
  const t = useI18n();
  const locale = useCurrentLocale();
  return (
    <section>
      <Header
        title="404"
        description={t("404")}
        link={{ href: `/${locale}` as Route, text: "" }}
      />
    </section>
  );
}