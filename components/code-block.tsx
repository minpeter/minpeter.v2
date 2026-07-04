"use client";

import { highlight } from "sugar-high";
import {
  COPY_ERROR_LABEL,
  copyToClipboard,
  ModCodeBlock as EditableCodeBlock,
  getCopyLabel,
  useCopyStatus,
} from "./mod-code-block";

const MULTILINE_SEPARATOR = "\n";

export const ModCodeBlock = EditableCodeBlock;

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
