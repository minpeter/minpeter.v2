"use client";

import copy from "clipboard-copy";
import { useEffect, useMemo, useState } from "react";
import { highlight } from "sugar-high";

const TEMPLATE_TOKEN_REGEX = /{{([^}]+)}}/g;
const LEADING_NEWLINE = "\n";
const TAB_PLACEHOLDER = "%TAB";
const TAB_REPLACEMENT = "    ";
const MULTILINE_SEPARATOR = "\n";
const COPY_STATUS_RESET_DELAY_MS = 1000;
const EDITABLE_INPUT_PADDING_CH = 2;
const MIN_EDITABLE_CONTENT_LENGTH = 1;
const COPY_ERROR_LABEL = "Copy failed";

type CopyStatus = "idle" | "copied" | "error";

type TemplateSegment =
  | { id: string; type: "static"; content: string }
  | { id: string; type: "dynamic"; content: string };

async function copyToClipboard(content: string) {
  await copy(content);
}

function parseTemplate(template: string): TemplateSegment[] {
  const normalizedTemplate = template.startsWith(LEADING_NEWLINE)
    ? template.slice(1)
    : template;

  const segments: TemplateSegment[] = [];
  let lastIndex = 0;
  let segmentIndex = 0;

  for (const match of normalizedTemplate.matchAll(TEMPLATE_TOKEN_REGEX)) {
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push({
        id: `static-${segmentIndex}`,
        type: "static",
        content: normalizedTemplate.slice(lastIndex, matchIndex),
      });
      segmentIndex += 1;
    }

    segments.push({
      id: `dynamic-${segmentIndex}`,
      type: "dynamic",
      content: match[1],
    });
    segmentIndex += 1;
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < normalizedTemplate.length) {
    segments.push({
      id: `static-${segmentIndex}`,
      type: "static",
      content: normalizedTemplate.slice(lastIndex),
    });
  }

  return segments;
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

function buildTemplateOutput(
  segments: TemplateSegment[],
  values: Record<string, string>
) {
  let compiled = "";

  for (const segment of segments) {
    if (segment.type === "static") {
      compiled += segment.content;
      continue;
    }

    if (segment.content === TAB_PLACEHOLDER) {
      compiled += TAB_REPLACEMENT;
      continue;
    }

    compiled += values[segment.content] ?? "";
  }

  return compiled;
}

function getInputWidth(value: string) {
  const effectiveLength = Math.max(value.length, MIN_EDITABLE_CONTENT_LENGTH);
  return `${effectiveLength + EDITABLE_INPUT_PADDING_CH}ch`;
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

export function ModCodeBlock({
  template,
  data,
}: {
  template: string;
  data: { [key: string]: string };
}) {
  const segments = useMemo(() => parseTemplate(template), [template]);
  const [values, setValues] = useState(data);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(
    null
  );
  const { status, markCopied, markError } = useCopyStatus();

  useEffect(() => {
    setValues(data);
  }, [data]);

  useEffect(() => {
    if (activeSegmentIndex === null) {
      return;
    }
    if (activeSegmentIndex >= segments.length) {
      setActiveSegmentIndex(null);
    }
  }, [activeSegmentIndex, segments.length]);

  const handleCopy = async () => {
    const compiled = buildTemplateOutput(segments, values);

    try {
      await copyToClipboard(compiled);
      markCopied();
    } catch {
      markError();
    }
  };

  const handleSegmentChange = (key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const copyLabel = getCopyLabel(status);

  return (
    <div className="relative flex flex-col gap-1">
      <button
        className="absolute top-3 right-3 rounded-md border bg-card px-2 py-1 text-xs focus-visible:outline-2"
        onClick={handleCopy}
        type="button"
      >
        {copyLabel}
      </button>
      <pre className="mb-0">
        <div style={{ overflowX: "auto" }}>
          <code>
            {segments.map((segment, index) => {
              if (segment.type === "static") {
                return <span key={segment.id}>{segment.content}</span>;
              }

              if (segment.content === TAB_PLACEHOLDER) {
                return (
                  <span key={segment.id}>
                    {TAB_REPLACEMENT.replace(/ /g, "\u00a0")}
                  </span>
                );
              }

              const segmentValue = values[segment.content] ?? "";
              if (activeSegmentIndex === index) {
                return (
                  <input
                    aria-label={`Value for ${segment.content}`}
                    autoFocus
                    className="inline h-5 rounded-md bg-secondary px-1 py-0.5"
                    key={segment.id}
                    onBlur={() => setActiveSegmentIndex(null)}
                    onChange={(event) => {
                      handleSegmentChange(segment.content, event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        (event.target as HTMLInputElement).blur();
                      }
                    }}
                    style={{ width: getInputWidth(segmentValue) }}
                    type="text"
                    value={segmentValue}
                  />
                );
              }

              const displayValue = segmentValue || `Enter ${segment.content}`;

              return (
                <button
                  className="cursor-pointer rounded-md bg-secondary px-1 py-0.5 text-blue-500 hover:bg-blue-500 hover:text-white"
                  key={segment.id}
                  onClick={() => setActiveSegmentIndex(index)}
                  type="button"
                >
                  {displayValue}
                </button>
              );
            })}
          </code>
        </div>
      </pre>
      <p className="mb-4 pl-1 text-gray-500 text-xs">
        *파란색 텍스트를 클릭하면 간편하게 수정 후 복사할 수 있습니다.
      </p>
      {status === "error" && (
        <output className="pl-1 text-destructive text-xs">
          {COPY_ERROR_LABEL}
        </output>
      )}
    </div>
  );
}

export function CodeBlock({ code }: { code: string; language?: string }) {
  const { status, markCopied, markError } = useCopyStatus();
  const isMultiline = code.includes(MULTILINE_SEPARATOR);
  const highlightedCode = useMemo(() => highlight(code), [code]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(code);
      markCopied();
    } catch {
      markError();
    }
  };

  const copyLabel = getCopyLabel(status);

  return (
    <div className="relative">
      <button
        className="absolute top-3 right-3 rounded-md border bg-card px-2 py-1 text-xs focus-visible:outline-2"
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
