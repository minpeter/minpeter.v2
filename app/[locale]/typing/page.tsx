"use client";

import type { Route } from "next";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import Header from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import { useTypingInput } from "./hooks/use-typing-input";
import { useTypingSentences } from "./hooks/use-typing-sentences";
import { useTypingStats } from "./hooks/use-typing-stats";
import { buildCharRenderState } from "./utils/char-render";

const MIN_ACCURACY_THRESHOLD = 85;
const TRANSITION_DELAY_MS = 300;

export default function Page() {
  const t = useTranslations();
  const locale = useLocale();

  const [isTransitioning, setIsTransitioning] = useState(false);

  const {
    sentences,
    currentSentence,
    currentSentenceIndex,
    isFetching,
    isInitialLoading,
    fetchError,
    advanceToNextSentence,
    fetchNewSentences,
    shouldPrefetch,
    hasNext,
  } = useTypingSentences(locale, () => t("typingFetchError"));

  const {
    userInput,
    isComposing,
    composingText,
    inputRef,
    currentInputWithComposition,
    resetInput,
    focusInput,
    handleInput,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
    handleBackspace,
    handleSelectAll,
  } = useTypingInput(currentSentence, isTransitioning);

  const {
    accuracy,
    displayValue,
    displayAccuracy,
    unitLabel,
    shouldShowStats,
    resetStats,
    cancelStats,
  } = useTypingStats(userInput, composingText, currentSentence);

  const scheduleSentenceAdvance = useCallback(() => {
    setTimeout(() => {
      resetInput();
      resetStats();
      advanceToNextSentence();
      setIsTransitioning(false);
    }, TRANSITION_DELAY_MS);
  }, [resetInput, resetStats, advanceToNextSentence]);

  useEffect(() => {
    if (isTransitioning) {
      return;
    }

    if (currentInputWithComposition.length !== currentSentence.length) {
      return;
    }

    const meetsAccuracy =
      currentInputWithComposition === currentSentence ||
      accuracy >= MIN_ACCURACY_THRESHOLD;

    if (!meetsAccuracy) {
      return;
    }

    if (!hasNext) {
      return;
    }

    setIsTransitioning(true);
    scheduleSentenceAdvance();
  }, [
    accuracy,
    currentInputWithComposition,
    currentSentence,
    hasNext,
    isTransitioning,
    scheduleSentenceAdvance,
  ]);

  const handleEnterPress = useCallback(() => {
    if (!hasNext) {
      return false;
    }

    setIsTransitioning(true);

    if (shouldPrefetch) {
      fetchNewSentences();
    }

    scheduleSentenceAdvance();
    return true;
  }, [hasNext, shouldPrefetch, fetchNewSentences, scheduleSentenceAdvance]);

  const handleReset = useCallback(() => {
    resetInput();
    cancelStats();
    setIsTransitioning(false);
  }, [resetInput, cancelStats]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "Enter":
          if (!isTransitioning && handleEnterPress()) {
            e.preventDefault();
          }
          break;
        case "Backspace":
          if (handleBackspace()) {
            e.preventDefault();
          }
          break;
        case "a":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSelectAll();
          }
          break;
        case "Escape":
          e.preventDefault();
          handleReset();
          break;
        default:
      }
    },
    [
      handleEnterPress,
      handleBackspace,
      handleSelectAll,
      handleReset,
      isTransitioning,
    ]
  );

  return (
    <section className={`${styles.stagger_container} flex flex-col gap-12`}>
      <Header
        description={t("typingDescription")}
        link={{ href: `/${locale}` as Route, text: t("backToHome") }}
        title="Peter's Typing practice"
      />
      <div className="relative flex w-full flex-col items-center justify-center">
        <button
          className="flex w-full flex-col items-center justify-center gap-4 rounded-md p-4 text-left outline-none focus-visible:ring-2"
          onClick={focusInput}
          type="button"
        >
          <div className="font-mono text-2xl">
            {isInitialLoading ? (
              <div className="flex flex-wrap justify-center gap-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-28" />
              </div>
            ) : (
              currentSentence.split("").map((char, index) => {
                const { key, display, className } = buildCharRenderState({
                  char,
                  index,
                  userInput,
                  isComposing,
                  composingText,
                  currentSentenceIndex,
                });

                return (
                  <span className={className} key={key}>
                    {display}
                  </span>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>
              {currentSentenceIndex + 1} / {sentences.length}
            </span>
            {shouldShowStats ? (
              <>
                <span className="text-gray-500">•</span>
                <span>
                  {displayValue} {t(unitLabel)}
                </span>
                <span className="text-gray-500">•</span>
                <span>
                  {displayAccuracy}% {t("typingAccuracy")}
                </span>
              </>
            ) : null}
            {isFetching ? (
              <>
                <span className="text-gray-500">•</span>
                <span>{t("typingGenerating")}</span>
              </>
            ) : null}
            {fetchError ? (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-pink-400">{fetchError}</span>
              </>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap justify-center gap-3 text-gray-500 text-xs">
            <span>
              <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-gray-300">
                Enter
              </kbd>{" "}
              {t("typingHintEnter")}
            </span>
            <span>
              <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-gray-300">
                Esc
              </kbd>{" "}
              {t("typingHintEsc")}
            </span>
          </div>
        </button>

        <input
          autoFocus
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          onCompositionEnd={handleCompositionEnd}
          onCompositionStart={handleCompositionStart}
          onCompositionUpdate={handleCompositionUpdate}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          type="text"
        />
      </div>
    </section>
  );
}
