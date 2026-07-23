"use client";

import { ErrorPanel } from "@/components/error-panel";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BlogListErrorBoundary({
  error,
  reset,
}: ErrorPageProps) {
  return <ErrorPanel error={error} namespace="blogList" reset={reset} />;
}
