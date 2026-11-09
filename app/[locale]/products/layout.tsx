import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { LanguageSelector } from "@/components/language-selector";
import { StoreThemeColor } from "@/components/store-theme-color";
import { Link } from "@/shared/i18n/navigation";

export default async function ProductsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("products");

  return (
    // `dark` scopes Tailwind dark variants; data-store switches the page tokens (products.css).
    <div className="store dark" data-store>
      <StoreThemeColor />
      <header className="store-header">
        <Link className="store-header-home store-label tap-target" href="/">
          minpeter
        </Link>
        <Link
          aria-label={t("navigationLabel")}
          className="tap-target inline-flex"
          href="/products"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="fieldnotes-logo"
            height={28}
            priority
            src="/assets/signature-mark.svg"
            width={28}
          />
        </Link>
        <Suspense fallback={null}>
          <LanguageSelector className="text-xs" />
        </Suspense>
      </header>
      {children}
    </div>
  );
}
