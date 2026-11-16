import { cn } from "@/shared/utils/tailwind";

import { SiteIntro, SiteNav } from "./site-nav";

interface ShowcaseDetailHeaderProps {
  backLabel: string;
  className?: string;
  description: string;
  /** Locale-agnostic pathname; the locale prefix is applied by next-intl. */
  href: string;
  kicker: string;
  navigationLabel: string;
  title: string;
}

export function ShowcaseDetailHeader({
  backLabel,
  className,
  description,
  href,
  kicker,
  navigationLabel,
  title,
}: ShowcaseDetailHeaderProps) {
  return (
    <header className={cn("showcase-header", className)}>
      {/* On a detail page the logo is the way back to the index. */}
      <SiteNav
        home={{ href, label: backLabel }}
        navigationLabel={navigationLabel}
      />
      <SiteIntro description={description} kicker={kicker} title={title} />
    </header>
  );
}
