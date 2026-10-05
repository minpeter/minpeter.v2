"use client";

import { ErrorPanel } from "@/components/error-panel";

interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function LocaleErrorBoundary({ error, retry }: ErrorPageProps) {
  return <ErrorPanel error={error} namespace="general" retry={retry} />;
}
