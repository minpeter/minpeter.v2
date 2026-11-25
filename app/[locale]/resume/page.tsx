import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { SiteNav } from "@/components/site-nav";
import { Link } from "@/shared/i18n/navigation";
import {
  RESUME_NAME,
  RESUME_NATIVE_NAME,
  RESUME_PRESENT,
  RESUME_SECTIONS,
  RESUME_SUMMARY,
  type ResumeEntry,
  type ResumePeriod,
} from "@/shared/resume";
import { SOCIAL_LINKS } from "@/shared/social-links";
import { formatMonthLong } from "@/shared/utils/date";
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

function formatPeriod({ end, start }: ResumePeriod) {
  if (!end) {
    return formatMonthLong(start);
  }
  const until = end === "present" ? RESUME_PRESENT : formatMonthLong(end);
  return `${formatMonthLong(start)} – ${until}`;
}

/** Name, period and summary; one link target when the entry leads somewhere. */
function ResumeEntryRow({ entry }: { entry: ResumeEntry }) {
  const { detail, href, name, path, period } = entry;
  const body = (
    <>
      <div className="resume-row">
        <h3 className="resume-organization">
          {name}
          {href || path ? (
            <span aria-hidden="true" className="resume-link-arrow">
              ↗
            </span>
          ) : null}
        </h3>
        <span className="resume-period">{formatPeriod(period)}</span>
      </div>
      {detail ? <p className="resume-detail">{detail}</p> : null}
    </>
  );

  if (path) {
    return (
      <Link className="resume-entry resume-entry-link" href={path}>
        {body}
      </Link>
    );
  }
  if (href) {
    return (
      <a
        className="resume-entry resume-entry-link"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {body}
      </a>
    );
  }
  return <div className="resume-entry">{body}</div>;
}

export default async function Page() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return (
    <section className="site-page resume-page">
      <header>
        <SiteNav
          home={{ href: "/", label: t("backToHome") }}
          navigationLabel={t("resume.navigationLabel")}
        />
        <div className="site-intro" lang="en">
          <p className="site-kicker" lang={locale}>
            {t("resume.kicker")}
          </p>
          <div className="resume-intro">
            <div className="resume-identity">
              <h1 className="site-title">
                {RESUME_NAME}
                {locale === "ko" ? (
                  <span className="resume-native-name" lang="ko">
                    {RESUME_NATIVE_NAME}
                  </span>
                ) : null}
              </h1>
              <p className="site-description">{RESUME_SUMMARY}</p>
            </div>
            <ul className="resume-contact">
              {SOCIAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a
                    className="resume-contact-link tap-target"
                    href={href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <div className="resume-sections" lang="en">
        {RESUME_SECTIONS.map(({ entries, key, label }) => (
          <section aria-labelledby={`resume-${key}`} key={key}>
            <h2 className="site-kicker" id={`resume-${key}`}>
              {label}
            </h2>
            <ol className="resume-list" data-testid={`resume-${key}`}>
              {entries.map((entry) => (
                <li key={entry.name}>
                  <ResumeEntryRow entry={entry} />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section className="resume-message">
        <Link className="resume-home-link tap-target" href="/">
          {t("resume.homeLabel")} <span aria-hidden="true">→</span>
        </Link>
      </section>
    </section>
  );
}
