"use client";

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
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-2xl items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-xl border border-border/60 bg-secondary/50 p-6 shadow-sm sm:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-sm">
              Blog error
            </p>
            <h1 className="text-2xl text-foreground tracking-tight">
              글을 불러오지 못했습니다
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              요청한 글을 표시하는 중 문제가 발생했습니다. 다시 시도하거나 글
              목록으로 돌아가세요.
            </p>
          </div>

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
              href="/blog"
            >
              글 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
