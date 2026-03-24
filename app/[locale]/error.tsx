"use client";

import Link from "next/link";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleErrorBoundary({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-2xl items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-xl border border-border/60 bg-secondary/50 p-6 shadow-sm sm:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-sm">
              Error boundary
            </p>
            <h1 className="text-2xl text-foreground tracking-tight">
              오류가 발생했습니다
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              잠시 후 다시 시도하거나 홈으로 이동해 다른 페이지를 확인해 주세요.
            </p>
          </div>

          {error.digest ? (
            <div className="rounded-lg bg-background/70 px-4 py-3">
              <p className="text-muted-foreground text-xs">오류 ID</p>
              <p className="font-mono text-sm">{error.digest}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={reset}
              type="button"
            >
              다시 시도
            </button>
            <Link
              className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-background px-4 py-2 font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
