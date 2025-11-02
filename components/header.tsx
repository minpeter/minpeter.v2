"use client";

import type { Route } from "next";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/shared/i18n/navigation";
import { routing } from "@/shared/i18n/routing";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import { cn } from "@/shared/utils/tailwind";
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
  const locale = useLocale();
  const pathname = usePathname();

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
          {routing.locales.map((l) => {
            const isActive = locale === l;
            const label = l === "ko" ? "Korean" : "English";

            return (
              <Link
                className={cn(
                  "animation:enter w-fit rounded-md px-0.5 text-sm underline hover:bg-secondary",
                  {
                    "text-primary": isActive,
                    "text-gray-400": !isActive,
                  }
                )}
                href={pathname}
                key={l}
                locale={l}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
      {description && (
        <p className="w-full text-gray-400 text-sm">{description}</p>
      )}
    </header>
  );
}
