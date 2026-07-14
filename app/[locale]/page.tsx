import type { Route } from "next";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

const SECTIONS = [
  {
    description:
      "Technical notes, tutorials, and lessons from building software.",
    href: "/blog",
    title: "Development notes",
  },
  {
    description: "Small prototypes, visual toys, and interface studies.",
    href: "/show",
    title: "Interactive experiments",
  },
  {
    description: "Work history and background — coming soon.",
    href: "/resume",
    title: "Resume (in progress)",
  },
] as const;

const SOCIAL_LINKS = [
  { href: "https://github.com/minpeter", label: "GitHub", slug: "/minpeter" },
  { href: "https://x.com/minpeterx", label: "X", slug: "/minpeterx" },
  {
    href: "https://linkedin.com/in/minpeter/",
    label: "LinkedIn",
    slug: "/in/minpeter",
  },
] as const;

export default function Page() {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <section className="home-page mx-auto flex w-full max-w-lg flex-1 flex-col pt-24 pb-12 sm:pt-28">
      <header className="mb-16">
        <Link
          aria-label="minpeter home"
          className="home-logo-link mb-6 inline-flex hover:opacity-60"
          href={`/${locale}` as Route}
        >
          <Image
            alt=""
            aria-hidden="true"
            className="home-logo"
            height={32}
            priority
            src="/assets/signature-mark.svg"
            width={32}
          />
        </Link>
        <h1 className="text-base leading-tight tracking-[-0.035em]">
          <span className="font-semibold text-foreground">MINPETER</span>
          <span className="text-muted-foreground"> — Software engineer</span>
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-[1.35] text-foreground/85 tracking-[-0.02em]">
          {t("siteDescription")} — building interfaces and websites for a
          living.
        </p>
      </header>

      <nav aria-label="Explore" className="home-links">
        {SECTIONS.map(({ description, href, title }) => (
          <Link
            className="home-link group"
            href={`/${locale}${href}` as Route}
            key={href}
          >
            <span className="home-link-title">{title}</span>
            <span className="home-link-description">{description}</span>
          </Link>
        ))}
      </nav>

      <section className="mt-16" aria-labelledby="connect-title">
        <h2
          className="mb-5 text-[13px] text-muted-foreground tracking-[-0.02em]"
          id="connect-title"
        >
          Connect
        </h2>
        <nav aria-label="Social links" className="flex flex-col gap-3">
          {SOCIAL_LINKS.map(({ href, label, slug }) => (
            <a
              className="home-social-link group"
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
