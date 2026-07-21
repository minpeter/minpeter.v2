"use client";

import { useTranslations } from "next-intl";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { useState } from "react";

import { copyToClipboard, useCopyStatus } from "./code-block-copy";

const TEMPLATE_TOKEN_REGEX = /{{([^}]+)}}/g;
const LEADING_NEWLINE = "\n";
const TAB_PLACEHOLDER = "%TAB";
const TAB_REPLACEMENT = "    ";
const EDITABLE_INPUT_PADDING_CH = 2;
const MIN_EDITABLE_CONTENT_LENGTH = 1;

type TemplateSegment =
  | { id: string; type: "static"; content: string }
  | { id: string; type: "dynamic"; content: string };

function parseTemplate(template: string): TemplateSegment[] {
  const normalizedTemplate = template.startsWith(LEADING_NEWLINE)
    ? template.slice(1)
    : template;

  const segments: TemplateSegment[] = [];
  let lastIndex = 0;

  for (const match of normalizedTemplate.matchAll(TEMPLATE_TOKEN_REGEX)) {
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      segments.push({
        content: normalizedTemplate.slice(lastIndex, matchIndex),
        id: `static-${segments.length}`,
        type: "static",
      });
    }

    segments.push({
      content: match[1],
      id: `dynamic-${segments.length}`,
      type: "dynamic",
    });
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < normalizedTemplate.length) {
    segments.push({
      content: normalizedTemplate.slice(lastIndex),
      id: `static-${segments.length}`,
      type: "static",
    });
  }

  return segments;
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

function handleSegmentKeyDown(event: KeyboardEvent<HTMLInputElement>) {
  if (event.nativeEvent.isComposing) {
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.blur();
  }
}

export function ModCodeBlock({
  template,
  data,
}: {
  template: string;
  data: Record<string, string>;
}) {
  const t = useTranslations("modCodeBlock");
  const segments = parseTemplate(template);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(
    null
  );
  const { status, markCopied, markError } = useCopyStatus();
  const visibleActiveSegmentIndex =
    activeSegmentIndex === null || activeSegmentIndex >= segments.length
      ? null
      : activeSegmentIndex;

  const handleCopy = async () => {
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
  };

  const handleSegmentBlur = () => {
    setActiveSegmentIndex(null);
  };

  const handleSegmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { segmentKey } = event.currentTarget.dataset;
    if (!segmentKey) {
      return;
    }
    const { value } = event.currentTarget;
    setEditedValues((previousValues) => ({
      ...previousValues,
      [segmentKey]: value,
    }));
  };

  const handleSegmentActivate = (event: MouseEvent<HTMLButtonElement>) => {
    const segmentIndex = Number(event.currentTarget.dataset.segmentIndex);
    if (Number.isSafeInteger(segmentIndex)) {
      setActiveSegmentIndex(segmentIndex);
    }
  };

  let copyLabel = t("copy");
  if (status === "copied") {
    copyLabel = t("copied");
  } else if (status === "error") {
    copyLabel = t("retryCopy");
  }

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
                    aria-label={t("valueFor", { name: segment.content })}
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

              const displayValue =
                segmentValue || t("enterValue", { name: segment.content });

              return (
                <button
                  className="cursor-pointer rounded-md bg-secondary px-1 py-0.5 text-blue-700 hover:bg-blue-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-blue-400 dark:hover:bg-blue-500"
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
      <p className="mb-4 pl-1 text-muted-foreground text-xs">
        *{t("instruction")}
      </p>
      {status === "error" && (
        <output className="pl-1 text-destructive text-xs">
          {t("copyFailed")}
        </output>
      )}
    </div>
  );
}
