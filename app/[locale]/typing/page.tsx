"use client";

import type { Route } from "next";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useState } from "react";
import Header from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import { useTypingInput } from "./hooks/use-typing-input";
import { useTypingSentences } from "./hooks/use-typing-sentences";
import { useTypingStats } from "./hooks/use-typing-stats";
import { TypingHints, TypingStatus } from "./typing-status";
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
    fetchMoreSentences,
    hasNext,
  } = useTypingSentences(locale, () => t("typingFetchError"));

  const {
    userInput,
    isComposing,
    composingText,
    typingStartedAt,
    typingUpdatedAt,
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
    clearStats,
  } = useTypingStats(
    userInput,
    composingText,
    currentSentence,
    typingStartedAt,
    typingUpdatedAt
  );

  const scheduleSentenceAdvance = () => {
    setTimeout(() => {
      resetInput();
      resetStats();
      advanceToNextSentence();
      setIsTransitioning(false);
    }, TRANSITION_DELAY_MS);
  };
  const scheduleSentenceAdvanceFromEffect = useEffectEvent(
    scheduleSentenceAdvance
  );

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
    scheduleSentenceAdvanceFromEffect();
  }, [
    accuracy,
    currentInputWithComposition,
    currentSentence,
    hasNext,
    isTransitioning,
  ]);

  const handleEnterPress = () => {
    if (!hasNext) {
      fetchMoreSentences();
      return true;
    }

    setIsTransitioning(true);
    scheduleSentenceAdvance();
    return true;
  };

  const handleReset = () => {
    resetInput();
    clearStats();
    setIsTransitioning(false);
  };

  const handleNavigateAway = (e: React.MouseEvent) => {
    if (userInput.length > 0) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (userInput.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [userInput.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  };

  return (
    <section className={`${styles.stagger_container} flex flex-col gap-12`}>
      <Header
        description={t("typingDescription")}
        link={{
          href: `/${locale}` as Route,
          text: t("backToHome"),
          onNavigate: handleNavigateAway,
        }}
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

          <TypingStatus
            accuracyText={t("typingAccuracy")}
            currentPosition={currentSentenceIndex + 1}
            displayAccuracy={displayAccuracy}
            displayValue={displayValue}
            fetchError={fetchError}
            generatingText={t("typingGenerating")}
            isFetching={isFetching}
            sentenceCount={sentences.length}
            shouldShowStats={shouldShowStats}
            unitText={t(unitLabel)}
          />

          <TypingHints
            enterText={t("typingHintEnter")}
            resetText={t("typingHintEsc")}
          />
        </button>

        <input
          aria-label="Typing input"
          autoComplete="off"
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
