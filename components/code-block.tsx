"use client";

import copy from "clipboard-copy";
import { useEffect, useState } from "react";
import { highlight } from "sugar-high";
import { ModCodeBlock as EditableCodeBlock } from "./mod-code-block";

const MULTILINE_SEPARATOR = "\n";
const COPY_STATUS_RESET_DELAY_MS = 1000;
const COPY_ERROR_LABEL = "Copy failed";

type CopyStatus = "idle" | "copied" | "error";

export const ModCodeBlock = EditableCodeBlock;

async function copyToClipboard(content: string) {
  await copy(content);
}

function useCopyStatus() {
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

  return { status, markCopied, markError };
}

function getCopyLabel(status: CopyStatus) {
  if (status === "copied") {
    return "Copied";
  }
  if (status === "error") {
    return "Retry copy";
  }
  return "Copy";
}

export function CodeBlock({ code }: { code: string; language?: string }) {
  const { status, markCopied, markError } = useCopyStatus();
  const isMultiline = code.includes(MULTILINE_SEPARATOR);
  const highlightedCode = highlight(code);

  const handleCopy = async () => {
    try {
      await copyToClipboard(code);
      markCopied();
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      markError();
    }
  };

  const copyLabel = getCopyLabel(status);

  return (
    <div className="relative">
      <button
        className="absolute top-3 right-3 rounded-md border bg-card px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={handleCopy}
        type="button"
      >
        {copyLabel}
      </button>
      {isMultiline ? (
        <pre style={{ overflowX: "auto" }}>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: sugar-high output is sanitized */}
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      ) : (
        /* biome-ignore lint/security/noDangerouslySetInnerHtml: sugar-high output is sanitized */
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      )}
      {status === "error" && (
        <output className="mt-2 text-destructive text-xs">
          {COPY_ERROR_LABEL}
        </output>
      )}
    </div>
  );
}
