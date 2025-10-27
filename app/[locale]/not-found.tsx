"use client";

import type { Route } from "next";

import Header from "@/components/header";
import { useCurrentLocale, useI18n } from "@/locales/client";

export default function NotFound() {
  const t = useI18n();
  const locale = useCurrentLocale();
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
