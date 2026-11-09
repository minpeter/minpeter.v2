import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { LanguageSelector } from "@/components/language-selector";
import { Link } from "@/shared/i18n/navigation";
import { createMetadata, createSectionImage } from "@/shared/utils/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const title = `minpeter | ${t("resume.kicker")}`;

  return createMetadata({
    description: t("resume.metadataDescription"),
    image: createSectionImage(locale, "/resume", title),
    locale,
    path: "/resume",
    title,
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
            className="fieldnotes-logo-link tap-target"
            href="/"
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
        <Link className="resume-home-link tap-target" href="/">
          {t("resume.homeLabel")} <span aria-hidden="true">→</span>
        </Link>
      </section>
    </section>
  );
}
