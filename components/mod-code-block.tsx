"use client";

import copy from "clipboard-copy";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

const TEMPLATE_TOKEN_REGEX = /{{([^}]+)}}/g;
const LEADING_NEWLINE = "\n";
const TAB_PLACEHOLDER = "%TAB";
const TAB_REPLACEMENT = "    ";
const COPY_STATUS_RESET_DELAY_MS = 1000;
const EDITABLE_INPUT_PADDING_CH = 2;
const MIN_EDITABLE_CONTENT_LENGTH = 1;
export const COPY_ERROR_LABEL = "Copy failed";

type CopyStatus = "idle" | "copied" | "error";

type TemplateSegment =
  | { id: string; type: "static"; content: string }
  | { id: string; type: "dynamic"; content: string };

export async function copyToClipboard(content: string) {
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
        content: normalizedTemplate.slice(lastIndex, matchIndex),
        id: `static-${segmentIndex}`,
        type: "static",
      });
      segmentIndex += 1;
    }

    segments.push({
      content: match[1],
      id: `dynamic-${segmentIndex}`,
      type: "dynamic",
    });
    segmentIndex += 1;
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < normalizedTemplate.length) {
    segments.push({
      content: normalizedTemplate.slice(lastIndex),
      id: `static-${segmentIndex}`,
      type: "static",
    });
  }

  return segments;
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

  const markCopied = useCallback(() => {
    setStatus("copied");
  }, []);

  const markError = useCallback(() => {
    setStatus("error");
  }, []);

  return { markCopied, markError, status };
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

export function getCopyLabel(status: CopyStatus) {
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
  data: Record<string, string>;
}) {
  const segments = useMemo(() => parseTemplate(template), [template]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(
    null
  );
  const { status, markCopied, markError } = useCopyStatus();
  const visibleActiveSegmentIndex =
    activeSegmentIndex === null || activeSegmentIndex >= segments.length
      ? null
      : activeSegmentIndex;

  const handleCopy = useCallback(async () => {
    const values = { ...data, ...editedValues };
    const compiled = buildTemplateOutput(segments, values);

    try {
      await copyToClipboard(compiled);
      markCopied();
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      markError();
    }
  }, [data, editedValues, markCopied, markError, segments]);

  const handleSegmentBlur = useCallback(() => {
    setActiveSegmentIndex(null);
  }, []);

  const handleSegmentChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { segmentKey } = event.currentTarget.dataset;
      if (!segmentKey) {
        return;
      }
      const { value } = event.currentTarget;
      setEditedValues((previousValues) => ({
        ...previousValues,
        [segmentKey]: value,
      }));
    },
    []
  );

  const handleSegmentKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    []
  );

  const handleSegmentActivate = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const segmentIndex = Number(event.currentTarget.dataset.segmentIndex);
      if (Number.isSafeInteger(segmentIndex)) {
        setActiveSegmentIndex(segmentIndex);
      }
    },
    []
  );

  const copyLabel = getCopyLabel(status);

  return (
    <div className="relative flex flex-col gap-1">
      <button
        className="absolute top-3 right-3 rounded-md border bg-card px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={handleCopy}
        type="button"
      >
        {copyLabel}
      </button>
      <div style={{ overflowX: "auto" }}>
        <pre className="mb-0">
          <code>
            {segments.map((segment, index) => {
              if (segment.type === "static") {
                return <span key={segment.id}>{segment.content}</span>;
              }

              if (segment.content === TAB_PLACEHOLDER) {
                return (
                  <span key={segment.id}>
                    {TAB_REPLACEMENT.replaceAll(" ", "\u00A0")}
                  </span>
                );
              }

              const segmentValue =
                editedValues[segment.content] ?? data[segment.content] ?? "";
              if (visibleActiveSegmentIndex === index) {
                return (
                  <input
                    aria-label={`Value for ${segment.content}`}
                    autoComplete="off"
                    autoFocus
                    className="inline h-5 rounded-md bg-secondary px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-segment-key={segment.content}
                    key={segment.id}
                    onBlur={handleSegmentBlur}
                    onChange={handleSegmentChange}
                    onKeyDown={handleSegmentKeyDown}
                    style={{ width: getInputWidth(segmentValue) }}
                    type="text"
                    value={segmentValue}
                  />
                );
              }

              const displayValue = segmentValue || `Enter ${segment.content}`;

              return (
                <button
                  className="cursor-pointer rounded-md bg-secondary px-1 py-0.5 text-blue-500 hover:bg-blue-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  data-segment-index={index}
                  key={segment.id}
                  onClick={handleSegmentActivate}
                  type="button"
                >
                  {displayValue}
                </button>
              );
            })}
          </code>
        </pre>
      </div>
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
