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

  return createMetadata({
    description: "A graveyard of components made with care but never used",
    locale,
    path: "/show",
    title: "minpeter | showcase",
  });
}

const SHOWCASE_ITEMS = [
  {
    description: "A simpler frontend for temporary files.",
    path: "/show/yet-another-tempfiles",
    title: "Yet another tempfiles",
  },
  {
    description: "A spinning inventory of the tools behind this site.",
    path: "/show/tech-stack-ball",
    title: "Tech stack ball",
  },
  {
    description: "Hover over the letters and watch them react.",
    path: "/show/dynamic-hacked-text",
    title: "Dynamic hacked text",
  },
  {
    description: "A live countdown to the next year.",
    path: "/show/new-year-clock",
    title: "New year clock",
  },
  {
    description: "Artwork studies for language model cards.",
    path: "/show/model-card-artwork",
    title: "Model card artwork",
  },
  {
    description: "Experiments in layered motion and depth.",
    path: "/show/unstructured",
    title: "Unstructured",
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
        <nav aria-label="Showcase navigation" className="fieldnotes-nav">
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
          <p className="showcase-kicker">Showcase</p>
          <h1 className="showcase-title">Small experiments</h1>
          <p className="showcase-description">
            Interactive pieces, prototypes, and things made for the fun of it.
          </p>
        </div>
      </header>

      <nav aria-label="Projects" className="showcase-list">
        {SHOWCASE_ITEMS.map(({ description, path, title }) => (
          <Link
            className="showcase-item-link"
            href={`/${locale}${path}` as Route}
            key={path}
          >
            <span className="showcase-item-top">
              <span className="showcase-item-title">{title}</span>
              <span aria-hidden="true" className="showcase-item-arrow">
                ↗
              </span>
            </span>
            <span className="showcase-item-description">{description}</span>
          </Link>
        ))}

        {enabled ? (
          <div className="showcase-flag-status">test flag is on</div>
        ) : null}
      </nav>
    </section>
  );
}
