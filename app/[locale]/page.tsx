import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { SiteNav } from "@/components/site-nav";
import { Link } from "@/shared/i18n/navigation";
import { SOCIAL_LINKS } from "@/shared/social-links";

import { RecentPosts } from "./recent-posts";

const SECTIONS = [
  {
    descriptionKey: "sections.developmentNotes.description",
    href: "/blog",
    titleKey: "sections.developmentNotes.title",
  },
  {
    descriptionKey: "sections.products.description",
    href: "/products",
    titleKey: "sections.products.title",
  },
  {
    descriptionKey: "sections.interactiveExperiments.description",
    href: "/show",
    titleKey: "sections.interactiveExperiments.title",
  },
  {
    descriptionKey: "sections.resume.description",
    href: "/resume",
    titleKey: "sections.resume.title",
  },
] as const;

export default function Page() {
  const t = useTranslations();

  return (
    <section
      className="site-page home-page flex flex-1 flex-col pb-12"
      data-testid="home-page"
    >
      <header className="mb-16">
        <SiteNav
          className="mb-6"
          home={{ href: "/", label: t("home.homeLabel") }}
          navigationLabel={t("common.siteNavigation")}
        />
        <h1 className="text-base leading-tight tracking-tight">
          <span className="text-foreground font-semibold">MINPETER</span>
          <span className="text-muted-foreground"> — {t("home.role")}</span>
        </h1>
        <p className="text-foreground/85 mt-4 max-w-md text-sm leading-snug">
          {t("home.introduction")}
        </p>
      </header>

      <nav aria-label={t("home.exploreLabel")} className="home-links">
        {SECTIONS.map(({ descriptionKey, href, titleKey }) => (
          <Link
            className="home-link"
            data-testid={`home-link-${href.slice(1)}`}
            href={href}
            key={href}
            // Runtime prefetch only where destination has `"use cache"` data
            // (blog list). Default Partial Prefetching already warms App Shell.
            // See: next-partial-prefetching-adoption step 5 / runtime-prefetching.
            prefetch={href === "/blog" ? true : undefined}
          >
            <span className="home-link-title">{t(`home.${titleKey}`)}</span>
            <span className="home-link-description">
              {t(`home.${descriptionKey}`)}
            </span>
          </Link>
        ))}
      </nav>

      <Suspense fallback={null}>
        <RecentPosts />
      </Suspense>

      <section aria-labelledby="connect-title" className="mt-16">
        <h2 className="home-section-label mb-5" id="connect-title">
          {t("home.socialTitle")}
        </h2>
        <nav aria-label={t("home.socialLabel")} className="home-social-links">
          {SOCIAL_LINKS.map(({ href, label, slug }) => (
            <a
              className="home-social-link tap-target"
              href={href}
              key={href}
              rel="noreferrer"
              target="_blank"
            >
              <span>{label}</span>
              <span className="text-muted-foreground">{slug}</span>
            </a>
          ))}
        </nav>
      </section>
    </section>
  );
}
