import { SiteIntro, SiteNav } from "@/components/site-nav";

interface NotFoundPageProps {
  /**
   * Fully localized href: these are plain anchors on purpose (see below), so
   * the prefix must already be resolved via `getLocalizedPath`.
   */
  backHref: string;
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
    <section className="site-page">
      <header>
        {/* A hard navigation escapes the stale not-found route tree. */}
        <SiteNav
          home={{ hard: true, href: backHref, label: backLabel }}
          navigationLabel={navigationLabel}
          showLanguageSelector={showLanguageSelector}
        />
        <SiteIntro description={description} kicker="404" title={title} />
      </header>

      <div className="resume-message">
        <a className="resume-home-link tap-target" href={backHref}>
          {backLabel} <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
