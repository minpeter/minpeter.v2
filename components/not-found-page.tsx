import type { Route } from "next";
import Image from "next/image";

import { LanguageSelector } from "@/components/language-selector";

interface NotFoundPageProps {
  backHref: Route;
  backLabel: string;
  description: string;
  navigationLabel: string;
  showLanguageSelector?: boolean;
  title: string;
}

export function NotFoundPage({
  backHref,
  backLabel,
  description,
  navigationLabel,
  showLanguageSelector = true,
  title,
}: NotFoundPageProps) {
  return (
    <section className="showcase-page">
      <header className="showcase-header">
        <nav aria-label={navigationLabel} className="fieldnotes-nav">
          {/* A hard navigation escapes the stale not-found route tree. */}
          <a
            aria-label={backLabel}
            className="fieldnotes-logo-link"
            href={backHref}
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
          </a>
          {showLanguageSelector ? <LanguageSelector /> : null}
        </nav>
        <div className="showcase-intro">
          <p className="showcase-kicker">404</p>
          <h1 className="showcase-title">{title}</h1>
          <p className="showcase-description">{description}</p>
        </div>
      </header>

      <div className="resume-message">
        <a className="resume-home-link mt-0" href={backHref}>
          {backLabel} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
