"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BlogPostErrorBoundary({
  error,
  reset,
}: ErrorPageProps) {
  const locale = useLocale();
  const t = useTranslations("errors.blog");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-2xl items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-xl border border-border/60 bg-secondary/50 p-6 shadow-sm sm:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-sm">
              {t("kicker")}
            </p>
            <h1 className="text-2xl text-foreground tracking-tight">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={reset}
              type="button"
            >
              {t("retry")}
            </button>
            <Link
              className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-background px-4 py-2 font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`/${locale}/blog`}
            >
              {t("back")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
