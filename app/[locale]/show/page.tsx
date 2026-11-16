import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { SiteIntro, SiteNav } from "@/components/site-nav";
import { Link } from "@/shared/i18n/navigation";
import { createMetadata, createSectionImage } from "@/shared/utils/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const title = `minpeter | ${t("showcase.kicker")}`;

  return createMetadata({
    description: t("showcase.description"),
    image: createSectionImage(locale, "/show", title),
    locale,
    path: "/show",
    title,
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
    <section className="site-page">
      <header>
        <SiteNav
          home={{ href: "/", label: t("backToHome") }}
          navigationLabel={t("showcase.navigationLabel")}
        />
        <SiteIntro
          description={t("showcase.description")}
          kicker={t("showcase.kicker")}
          title={t("showcase.title")}
        />
      </header>

      <div className="space-y-8">
        {SHOWCASE_GROUPS.map(({ key: group, items }) => (
          <section key={group}>
            <h2 className="site-kicker" id={`showcase-${group}`}>
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
