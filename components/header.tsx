"use client";

import { routing } from "@/shared/i18n/routing";
import { useLocale } from "next-intl";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { ViewTransition } from "@/components/view-transition";
import { cn } from "@/shared/utils/tailwind";

import { LanguageSelector } from "./language-selector";
import { Backlink } from "./link";

import styles from "@/shared/styles/stagger-fade-in.module.css";

interface HeaderProps {
  description?: string;
  link?: {
    href: Route;
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
  const locale = useLocale();
  const resolvedTitle = title || "minpeter";

  return (
    <header
      className={cn(
        "relative z-10 mx-auto mb-16 w-full max-w-2xl border-foreground/20 border-b pb-10 sm:mb-20",
        styles.stagger_container
      )}
    >
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[-0.05em]">
        {link ? (
          <Backlink
            href={link.href}
            onNavigate={link.onNavigate}
            text={link.text}
          />
        ) : (
          <Link
            href={
              locale === routing.defaultLocale
                ? ("/" as Route)
                : (`/${locale}` as Route)
            }
          >
            minpeter
          </Link>
        )}
        <div className="flex items-center gap-2 text-foreground/80">
          {rightContent}
          {rightContent ? <span>·</span> : null}
          <LanguageSelector />
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
