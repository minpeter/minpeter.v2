"use client";

import type { CSSProperties } from "react";
import { Fragment, useCallback } from "react";
import { generate, tokenize } from "sugar-high";
import {
  COPY_ERROR_LABEL,
  copyToClipboard,
  ModCodeBlock as EditableCodeBlock,
  getCopyLabel,
  useCopyStatus,
} from "./mod-code-block";

const MULTILINE_SEPARATOR = "\n";

interface HighlightTextNode {
  value: string;
}

interface HighlightTokenNode {
  children: HighlightTextNode[];
  properties: {
    className: string;
    style?: CSSProperties;
  };
}

interface HighlightLineNode {
  children: HighlightTokenNode[];
  properties: {
    className: string;
  };
}

function HighlightedCode({ code }: { code: string }) {
  const lines = generate(tokenize(code)) as HighlightLineNode[];
  const lastLine = lines.at(-1);
  let lineOffset = 0;

  return lines.map((line) => {
    const lineKey = `line-${lineOffset}`;
    let tokenOffset = 0;
    const renderedTokens = line.children.map((token) => {
      const tokenText = token.children.map(({ value }) => value).join("");
      const tokenKey = `${lineKey}-token-${tokenOffset}`;
      tokenOffset += tokenText.length + 1;

      return (
        <span
          className={token.properties.className}
          key={tokenKey}
          style={token.properties.style}
        >
          {tokenText}
        </span>
      );
    });

    lineOffset += tokenOffset + 1;

    return (
      <Fragment key={lineKey}>
        <span className={line.properties.className}>{renderedTokens}</span>
        {line === lastLine ? null : "\n"}
      </Fragment>
    );
  });
}

export const ModCodeBlock = EditableCodeBlock;

export function CodeBlock({ code }: { code: string; language?: string }) {
  const { status, markCopied, markError } = useCopyStatus();
  const isMultiline = code.includes(MULTILINE_SEPARATOR);
  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(code);
      markCopied();
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      markError();
    }
  }, [code, markCopied, markError]);

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
          <code>
            <HighlightedCode code={code} />
          </code>
        </pre>
      ) : (
        <code>
          <HighlightedCode code={code} />
        </code>
      )}
      {status === "error" && (
        <output className="mt-2 text-destructive text-xs">
          {COPY_ERROR_LABEL}
        </output>
      )}
    </div>
  );
}
