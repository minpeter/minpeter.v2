"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";

import { ViewTransition } from "@/components/view-transition";
import { Link } from "@/shared/i18n/navigation";
import { cn } from "@/shared/utils/tailwind";

import { LanguageSelector } from "./language-selector";
import { Backlink } from "./link";

import styles from "@/shared/styles/stagger-fade-in.module.css";

interface HeaderProps {
  description?: string;
  link?: {
    /** Locale-agnostic pathname; the locale prefix is applied by next-intl. */
    href: string;
    text: string;
    onNavigate?: (e: React.MouseEvent) => void;
  };
  rightContent?: ReactNode;
  title?: string;
  titleTransitionName?: string;
}

export default function Header({
  title,
  titleTransitionName,
  description,
  link,
  rightContent,
}: HeaderProps) {
  const resolvedTitle = title || "minpeter";

  return (
    <header
      className={cn(
        "relative z-10 mx-auto mb-16 w-full max-w-2xl border-foreground/20 border-b pb-10 sm:mb-20",
        styles.stagger_container
      )}
      data-testid="site-header"
    >
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[-0.05em]">
        {link ? (
          <Backlink
            href={link.href}
            onNavigate={link.onNavigate}
            text={link.text}
          />
        ) : (
          <Link href="/">minpeter</Link>
        )}
        <div className="flex items-center gap-2 text-foreground/80">
          {rightContent}
          {rightContent ? <span>·</span> : null}
          <Suspense fallback={null}>
            <LanguageSelector />
          </Suspense>
        </div>
      </div>
      <div className="mt-12 sm:mt-16">
        <h1 className="home-section-title break-words">
          {titleTransitionName ? (
            <ViewTransition name={titleTransitionName}>
              {resolvedTitle}
            </ViewTransition>
          ) : (
            resolvedTitle
          )}
        </h1>
        {description ? (
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-foreground/80 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
