"use client";

import copy from "clipboard-copy";
import { useEffect, useState } from "react";

const COPY_STATUS_RESET_DELAY_MS = 1000;

export const COPY_ERROR_LABEL = "Copy failed";

type CopyStatus = "idle" | "copied" | "error";

export async function copyToClipboard(content: string) {
  await copy(content);
}

export function useCopyStatus() {
  const [status, setStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setStatus("idle");
    }, COPY_STATUS_RESET_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  const markCopied = () => {
    setStatus("copied");
  };

  const markError = () => {
    setStatus("error");
  };

  return { markCopied, markError, status };
}

export function getCopyLabel(status: CopyStatus) {
  if (status === "copied") {
    return "Copied";
  }
  if (status === "error") {
    return "Retry copy";
  }
  return "Copy";
}
