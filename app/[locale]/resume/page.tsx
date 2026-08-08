import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { LanguageSelector } from "@/components/language-selector";
import { Link } from "@/shared/i18n/navigation";
import { createMetadata } from "@/shared/utils/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations();

  return createMetadata({
    description: t("resume.metadataDescription"),
    locale,
    path: "/resume",
    title: "minpeter | resume",
  });
}

export default async function Page() {
  const t = await getTranslations();

  return (
    <section className="showcase-page resume-page">
      <header className="showcase-header">
        <nav
          aria-label={t("resume.navigationLabel")}
          className="fieldnotes-nav"
        >
          <Link
            aria-label={t("backToHome")}
            className="fieldnotes-logo-link"
            href="/"
            prefetch={true}
          >
            <Image
              alt=""
              aria-hidden="true"
              className="fieldnotes-logo"
              height={32}
              priority
              src="/assets/signature-mark.svg"
              width={32}
            />
          </Link>
          <LanguageSelector />
        </nav>
        <div className="showcase-intro">
          <p className="showcase-kicker">{t("resume.kicker")}</p>
          <h1 className="showcase-title">{t("resume.title")}</h1>
          <p className="showcase-description">{t("resume.description")}</p>
        </div>
      </header>

      <section aria-labelledby="resume-status" className="resume-message">
        <h2 className="resume-message-title" id="resume-status">
          {t("resume.statusTitle")}
        </h2>
        <p className="resume-message-description">
          {t("resume.statusDescription")}
        </p>
        <Link className="resume-home-link" href="/" prefetch={true}>
          {t("resume.homeLabel")} <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </section>
  );
}
