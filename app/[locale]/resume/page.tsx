import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { LanguageSelector } from "@/components/language-selector";
import NewMetadata from "@/shared/utils/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/resume">
): Promise<Metadata> {
  const { locale } = await props.params;

  return NewMetadata({
    description: "Work history and background — coming soon.",
    locale,
    path: "/resume",
    title: "minpeter | resume",
  });
}

export default async function Page(props: PageProps<"/[locale]/resume">) {
  const { locale } = await props.params;

  return (
    <section className="showcase-page resume-page">
      <header className="showcase-header">
        <nav aria-label="Resume navigation" className="fieldnotes-nav">
          <Link
            aria-label="Back to home"
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
          <p className="showcase-kicker">Resume</p>
          <h1 className="showcase-title">Work in progress</h1>
          <p className="showcase-description">
            I&apos;m still assembling the useful version of this page.
          </p>
        </div>
      </header>

      <section aria-labelledby="resume-status" className="resume-message">
        <h2 className="resume-message-title" id="resume-status">
          Coming soon.
        </h2>
        <p className="resume-message-description">
          For now, the site is a better record of what I&apos;m working on.
        </p>
        <Link className="resume-home-link" href={`/${locale}` as Route}>
          Back home <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </section>
  );
}
