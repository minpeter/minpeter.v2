"use client";

import { ErrorPanel } from "@/components/error-panel";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BlogPostErrorBoundary({
  error,
  reset,
}: ErrorPageProps) {
  return <ErrorPanel error={error} namespace="blog" reset={reset} />;
}
