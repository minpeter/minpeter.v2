"use client";

import { ErrorPanel } from "@/components/error-panel";

interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function BlogListErrorBoundary({
  error,
  retry,
}: ErrorPageProps) {
  return <ErrorPanel error={error} namespace="blogList" retry={retry} />;
}
