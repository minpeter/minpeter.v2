import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { getBaseUrl } from "@/shared/env";
import { createMetadata, getLocalizedPath } from "@/shared/utils/metadata";

import "./globals.css";
import { RootDocument } from "./root-document";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  return createMetadata({
    description: "Page not found :/",
    image: {
      alt: "minpeter | 404",
      url: new URL(
        getLocalizedPath(locale, "/og/not-found"),
        getBaseUrl()
      ).toString(),
    },
    locale,
    title: "minpeter | 404",
  });
}

export default async function GlobalNotFound() {
  const locale = await getLocale();

  return (
    <RootDocument lang={locale}>
      <section>
        404: I don&apos;t expect people to come here (if they bypass i18n by
        going through a proxy)
      </section>
    </RootDocument>
  );
}
