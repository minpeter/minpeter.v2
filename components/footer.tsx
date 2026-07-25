import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { routing } from "@/shared/i18n/routing";
import { resolveLocale } from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

import { ModeToggle } from "./theme-toggle";

const linkClassName =
  "underline decoration-foreground/30 underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function Footer({
  className,
  locale,
}: {
  className?: string;
  locale: string;
}) {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({ locale: resolvedLocale });

  return (
    <footer
      className={cn(
        className,
        "mx-auto flex w-full max-w-lg flex-wrap items-center gap-x-1 gap-y-0 px-5 py-4 font-mono text-[11px] text-muted-foreground sm:px-0"
      )}
    >
      <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
        © {new Date().getFullYear()} Woonggi Min ·
        <Link
          className={linkClassName}
          href={
            resolvedLocale === routing.defaultLocale
              ? "/blog"
              : `/${resolvedLocale}/blog`
          }
        >
          {t("common.notes")}
        </Link>
        {" / "}
        <a
          className={linkClassName}
          href="https://github.com/minpeter/minpeter.v2"
          rel="noopener noreferrer"
          target="_blank"
        >
          {t("common.source")}
        </a>
      </p>
      <ModeToggle label={t("common.toggleTheme")} />
    </footer>
  );
}
