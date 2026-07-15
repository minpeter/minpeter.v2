import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/shared/utils/tailwind";

import { LanguageSelector } from "./language-selector";

interface ShowcaseDetailHeaderProps {
  backLabel: string;
  className?: string;
  description: string;
  href: Route;
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
      <nav aria-label={navigationLabel} className="fieldnotes-nav">
        <Link
          aria-label={backLabel}
          className="fieldnotes-logo-link"
          href={href}
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
        <p className="showcase-kicker">{kicker}</p>
        <h1 className="showcase-title">{title}</h1>
        <p className="showcase-description">{description}</p>
      </div>
    </header>
  );
}
