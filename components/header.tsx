"use client";

import type { Route } from "next";
import type { FC, ReactNode } from "react";
import { ViewTransition as _ViewTransition } from "react";

const ViewTransition = _ViewTransition as unknown as FC<{
  name: string;
  children?: ReactNode;
}>;

import styles from "@/shared/styles/stagger-fade-in.module.css";
import { cn } from "@/shared/utils/tailwind";

import { LanguageSelector } from "./language-selector";
import { Backlink } from "./link";

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
  return (
    <header
      className={cn("relative z-10 mb-10 space-y-1", styles.stagger_container)}
    >
      {link ? (
        <div>
          <Backlink
            href={link.href}
            onNavigate={link.onNavigate}
            text={link.text}
          />
        </div>
      ) : (
        <div className="invisible">.</div>
      )}
      <div className="flex flex-row justify-between">
        <h1 className="flex flex-wrap items-center break-all text-bold">
          {titleTransitionName ? (
            <ViewTransition name={titleTransitionName}>
              {title || "minpeter"}
            </ViewTransition>
          ) : (
            title || "minpeter"
          )}
        </h1>

        <div className="flex items-center gap-1 text-gray-500">
          {rightContent}
          {rightContent && <span>/</span>}
          <LanguageSelector />
        </div>
      </div>
      {description ? (
        <p className="w-full text-gray-400 text-sm">{description}</p>
      ) : null}
    </header>
  );
}
