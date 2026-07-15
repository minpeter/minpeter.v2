import Link from "next/link";

import { cn } from "@/shared/utils/tailwind";

import { ModeToggle } from "./theme-toggle";

const FOOTER_LABELS = {
  en: { notes: "notes", source: "source", toggleTheme: "Toggle theme" },
  ja: {
    notes: "記事",
    source: "ソース",
    toggleTheme: "テーマを切り替え",
  },
  ko: { notes: "글", source: "소스", toggleTheme: "테마 전환" },
} as const;

export default function Footer({
  className,
  locale,
}: {
  className?: string;
  locale: string;
}) {
  const labels =
    FOOTER_LABELS[locale as keyof typeof FOOTER_LABELS] ?? FOOTER_LABELS.ko;

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
          className="underline decoration-foreground/30 underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={locale === "ko" ? "/blog" : `/${locale}/blog`}
        >
          {labels.notes}
        </Link>
        {" / "}
        <a
          className="underline decoration-foreground/30 underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="https://github.com/minpeter/minpeter.v2"
          rel="noopener noreferrer"
          target="_blank"
        >
          {labels.source}
        </a>
      </p>
      <ModeToggle label={labels.toggleTheme} />
    </footer>
  );
}
