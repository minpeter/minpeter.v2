import Link from "next/link";

import { cn } from "@/shared/utils/tailwind";

import { ModeToggle } from "./theme-toggle";

export default function Footer({
  className,
  locale,
}: {
  className?: string;
  locale: string;
}) {
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
          notes
        </Link>
        {" / "}
        <a
          className="underline decoration-foreground/30 underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="https://github.com/minpeter/minpeter.v2"
          rel="noopener noreferrer"
          target="_blank"
        >
          source
        </a>
      </p>
      <ModeToggle />
    </footer>
  );
}
