"use client";

import type { CSSProperties } from "react";
import { Fragment, useCallback } from "react";
import { generate, type ParseOptions, parse } from "sugar-high/core";
import { tokenize } from "sugar-high/lang/javascript";

import {
  COPY_ERROR_LABEL,
  copyToClipboard,
  getCopyLabel,
  useCopyStatus,
} from "./code-block-copy";

const MULTILINE_SEPARATOR = "\n";

type JavaScriptTokenizeOptions = NonNullable<Parameters<typeof tokenize>[1]>;

// sugar-high 2.5 types the JS preset's `onCommentEnd` with 4 args, while
// `ParseOptions` declares 5 (extra `start`). Only that field is cast; every
// other option stays type-checked. The preset spreads options over its
// defaults, so the key must be omitted (not `undefined`) when unset.
const tokenizeJavaScript: NonNullable<ParseOptions["tokenize"]> = (
  input,
  { onCommentEnd, ...options }
) =>
  tokenize(input, {
    ...options,
    ...(onCommentEnd && {
      onCommentEnd: onCommentEnd as JavaScriptTokenizeOptions["onCommentEnd"],
    }),
  });

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
  const lines = generate(
    parse(code, { tokenize: tokenizeJavaScript })
  ) as HighlightLineNode[];
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
