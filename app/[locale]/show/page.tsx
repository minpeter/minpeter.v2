import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { LanguageSelector } from "@/components/language-selector";
import { Link } from "@/shared/i18n/navigation";
import { createMetadata } from "@/shared/utils/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return createMetadata({
    description: t("showcase.description"),
    locale,
    path: "/show",
    title: "minpeter | showcase",
  });
}

const SHOWCASE_GROUPS = [
  {
    items: [
      {
        key: "loadBalancer",
        path: "/show/the-load-balancer",
      },
      {
        key: "wrench",
        path: "/show/project-wrench",
      },
    ],
    key: "projects",
  },
  {
    items: [
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
    ],
    key: "experiments",
  },
] as const;

export default async function Page(_props: PageProps<"/[locale]/show">) {
  const t = await getTranslations();
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
          <p className="showcase-kicker">{t("showcase.kicker")}</p>
          <h1 className="showcase-title">{t("showcase.title")}</h1>
          <p className="showcase-description">{t("showcase.description")}</p>
        </div>
      </header>

      <div className="space-y-8">
        {SHOWCASE_GROUPS.map(({ key: group, items }) => (
          <section key={group}>
            <h2 className="showcase-kicker" id={`showcase-${group}`}>
              {t(`showcase.${group}Label`)}
            </h2>
            <nav
              aria-labelledby={`showcase-${group}`}
              className="showcase-list"
            >
              {items.map(({ key, path }) => (
                <Link
                  className="showcase-item-link"
                  data-testid={`showcase-link-${key}`}
                  href={path}
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
            </nav>
          </section>
        ))}
      </div>
    </section>
  );
}
