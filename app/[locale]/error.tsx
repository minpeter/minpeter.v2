"use client";

import { ErrorPanel } from "@/components/error-panel";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleErrorBoundary({ error, reset }: ErrorPageProps) {
  return <ErrorPanel error={error} namespace="general" reset={reset} />;
}
