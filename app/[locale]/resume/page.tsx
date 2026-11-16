import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { SiteIntro, SiteNav } from "@/components/site-nav";
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
    <section className="site-page resume-page">
      <header>
        <SiteNav
          home={{ href: "/", label: t("backToHome") }}
          navigationLabel={t("resume.navigationLabel")}
        />
        <SiteIntro
          description={t("resume.description")}
          kicker={t("resume.kicker")}
          title={t("resume.title")}
        />
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
