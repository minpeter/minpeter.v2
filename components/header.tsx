"use client";

import type { Route } from "next";

import styles from "@/lib/styles/stagger-fade-in.module.css";
import { cn } from "@/lib/utils/tailwind";
import { useChangeLocale, useCurrentLocale } from "@/locales/client";

import { Backlink } from "./link";

type HeaderProps = {
  title?: string;
  description?: string;
  link?: {
    href: Route;
    text: string;
  };
};

export default function Header({ title, description, link }: HeaderProps) {
  const changeLocale = useChangeLocale();
  const locale = useCurrentLocale();

  return (
    <header className={cn("mb-10 space-y-1", styles.stagger_container)}>
      {link ? (
        <div>
          <Backlink href={link.href} text={link.text} />
        </div>
      ) : (
        <div className="invisible">.</div>
      )}
      <div className="flex flex-row justify-between">
        <h1 className="flex flex-wrap items-center break-all text-bold">
          {title || "minpeter"}
        </h1>

        <div className="flex space-x-1">
          <button
            className={cn(
              "animation:enter w-fit rounded-md px-0.5 text-gray-400 text-sm underline hover:bg-secondary",
              {
                "text-primary": locale === "ko",
              }
            )}
            onClick={() => changeLocale("ko")}
            type="button"
          >
            Korean
          </button>
          <button
            className={cn(
              "animation:enter w-fit rounded-md px-0.5 text-gray-400 text-sm underline hover:bg-secondary",
              {
                "text-primary": locale === "en",
              }
            )}
            onClick={() => changeLocale("en")}
            type="button"
          >
            English
          </button>
        </div>
      </div>
      {description && (
        <p className="w-full text-gray-400 text-sm">{description}</p>
      )}
    </header>
  );
}
