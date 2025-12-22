import { useCallback, useEffect, useRef, useState } from "react";
import { nextSentencesGenerator } from "../action";

const SENTENCE_PREFETCH_THRESHOLD = 3;

const shouldPrefetchSentences = (
  currentIndex: number,
  totalSentences: number
) => currentIndex >= totalSentences - SENTENCE_PREFETCH_THRESHOLD;

export const hasNextSentence = (currentIndex: number, totalSentences: number) =>
  currentIndex < totalSentences - 1;

export function useTypingSentences(
  locale: string,
  getErrorMessage: () => string
) {
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasFetchedInitial = useRef(false);

  const currentSentence = sentences[currentSentenceIndex] ?? "";
  const isInitialLoading = sentences.length === 0 && !fetchError;

  const fetchNewSentences = useCallback(async () => {
    if (isFetching) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);
      const [sentence1, sentence2] = await Promise.all([
        nextSentencesGenerator(locale as "ko" | "en"),
        nextSentencesGenerator(locale as "ko" | "en"),
      ]);
      setSentences((prev) => [...prev, sentence1, sentence2]);
    } catch {
      setFetchError(getErrorMessage());
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, locale, getErrorMessage]);

  const advanceToNextSentence = useCallback(() => {
    setCurrentSentenceIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!hasFetchedInitial.current) {
      hasFetchedInitial.current = true;
      fetchNewSentences();
    }
  }, [fetchNewSentences]);

  useEffect(() => {
    if (
      sentences.length > 0 &&
      shouldPrefetchSentences(currentSentenceIndex, sentences.length) &&
      !isFetching
    ) {
      fetchNewSentences();
    }
  }, [currentSentenceIndex, sentences.length, isFetching, fetchNewSentences]);

  return {
    sentences,
    currentSentence,
    currentSentenceIndex,
    isFetching,
    isInitialLoading,
    fetchError,
    advanceToNextSentence,
    fetchNewSentences,
    shouldPrefetch: shouldPrefetchSentences(
      currentSentenceIndex,
      sentences.length
    ),
    hasNext: hasNextSentence(currentSentenceIndex, sentences.length),
  };
}
