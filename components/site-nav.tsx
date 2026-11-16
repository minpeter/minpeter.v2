import Image from "next/image";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { Link } from "@/shared/i18n/navigation";
import { cn } from "@/shared/utils/tailwind";

import { LanguageSelector } from "./language-selector";
import { Skeleton } from "./ui/skeleton";

function SiteLogo() {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className="site-logo"
      height={32}
      priority
      src="/assets/signature-mark.svg"
      width={32}
    />
  );
}

interface SiteNavProps {
  className?: string;
  /**
   * Where the logo leads: home on index pages, one level up on detail pages.
   * `hard` renders a plain anchor whose `href` must already carry its locale
   * prefix; a hard navigation is how the not-found pages escape their stale
   * route tree.
   */
  home: { hard?: boolean; href: string; label: string };
  navigationLabel: string;
  showLanguageSelector?: boolean;
  /** Page-specific tools placed before the language selector. */
  tools?: ReactNode;
}

/** The bar on top of a page column: the logo link, then tools and language. */
export function SiteNav({
  className,
  home,
  navigationLabel,
  showLanguageSelector = true,
  tools,
}: SiteNavProps) {
  return (
    <nav
      aria-label={navigationLabel}
      className={cn("site-nav", className)}
      data-testid="site-header"
    >
      {home.hard ? (
        <a
          aria-label={home.label}
          className="site-logo-link tap-target"
          href={home.href}
        >
          <SiteLogo />
        </a>
      ) : (
        <Link
          aria-label={home.label}
          className="site-logo-link tap-target"
          href={home.href}
        >
          <SiteLogo />
        </Link>
      )}
      <div className="site-nav-tools">
        {tools}
        {tools && showLanguageSelector ? (
          <span aria-hidden="true">·</span>
        ) : null}
        {showLanguageSelector ? (
          <Suspense fallback={null}>
            <LanguageSelector />
          </Suspense>
        ) : null}
      </div>
    </nav>
  );
}

/** Loading-state stand-in that reserves the same bar height. */
export function SiteNavSkeleton({ tools = false }: { tools?: boolean }) {
  return (
    <div className="site-nav">
      <div aria-hidden="true" className="site-logo-link">
        <SiteLogo />
      </div>
      {tools ? (
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>
      ) : (
        <Skeleton className="h-3 w-12" />
      )}
    </div>
  );
}

/** Kicker, title and summary under the bar on index-style pages. */
export function SiteIntro({
  description,
  kicker,
  title,
}: {
  description: string;
  kicker: string;
  title: string;
}) {
  return (
    <div className="site-intro">
      <p className="site-kicker">{kicker}</p>
      <h1 className="site-title">{title}</h1>
      <p className="site-description">{description}</p>
    </div>
  );
}

/** Loading-state stand-in for `SiteIntro`. */
export function SiteIntroSkeleton() {
  return (
    <div className="site-intro">
      <Skeleton className="mb-3 h-3 w-16 rounded-sm" />
      <Skeleton className="mb-3 h-6 w-48 rounded-sm" />
      <Skeleton className="h-4 w-full max-w-sm rounded-sm" />
    </div>
  );
}
