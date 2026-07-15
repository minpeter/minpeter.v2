import type { Metadata, Route } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import { LanguageSelector } from "@/components/language-selector";
import { createFeatureGate } from "@/shared/flags";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/show">
): Promise<Metadata> {
  const { locale: routeLocale } = await props.params;
  const locale = resolveLocale(routeLocale);
  const t = await getTranslations({ locale });

  return createMetadata({
    description: t("showcase.description"),
    locale,
    path: "/show",
    title: "minpeter | showcase",
  });
}

const SHOWCASE_ITEMS = [
  {
    key: "tempfiles",
    path: "/show/yet-another-tempfiles",
  },
  {
    key: "techStack",
    path: "/show/tech-stack-ball",
  },
  {
    key: "dynamicText",
    path: "/show/dynamic-hacked-text",
  },
  {
    key: "newYear",
    path: "/show/new-year-clock",
  },
  {
    key: "modelCard",
    path: "/show/model-card-artwork",
  },
  {
    key: "unstructured",
    path: "/show/unstructured",
  },
] as const;

export default async function Page(props: PageProps<"/[locale]/show">) {
  const [{ locale }, enabled, t] = await Promise.all([
    props.params,
    createFeatureGate("test_flag")(), //Disabled by default, edit in the Statsig console
    getTranslations(),
  ]);
  return (
    <section className="showcase-page">
      <header className="showcase-header">
        <nav
          aria-label={t("showcase.navigationLabel")}
          className="fieldnotes-nav"
        >
          <Link
            aria-label={t("backToHome")}
            className="fieldnotes-logo-link"
            href={`/${locale}` as Route}
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
          <p className="showcase-kicker">{t("showcase.kicker")}</p>
          <h1 className="showcase-title">{t("showcase.title")}</h1>
          <p className="showcase-description">{t("showcase.description")}</p>
        </div>
      </header>

      <nav aria-label={t("showcase.projectsLabel")} className="showcase-list">
        {SHOWCASE_ITEMS.map(({ key, path }) => (
          <Link
            className="showcase-item-link"
            href={`/${locale}${path}` as Route}
            key={path}
          >
            <span className="showcase-item-top">
              <span className="showcase-item-title">
                {t(`showcase.items.${key}.title`)}
              </span>
              <span aria-hidden="true" className="showcase-item-arrow">
                ↗
              </span>
            </span>
            <span className="showcase-item-description">
              {t(`showcase.items.${key}.summary`)}
            </span>
          </Link>
        ))}

        {enabled ? (
          <div className="showcase-flag-status">
            {t("showcase.featureEnabled")}
          </div>
        ) : null}
      </nav>
    </section>
  );
}
