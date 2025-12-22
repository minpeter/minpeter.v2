import { useCallback, useEffect, useState } from "react";
import { nextSentencesGenerator } from "../action";

const SENTENCE_PREFETCH_THRESHOLD = 3;

const shouldPrefetchSentences = (
  currentIndex: number,
  totalSentences: number
) => currentIndex >= totalSentences - SENTENCE_PREFETCH_THRESHOLD;

export const hasNextSentence = (currentIndex: number, totalSentences: number) =>
  currentIndex < totalSentences - 1;

export function useTypingSentences(
  initialSentences: string[],
  locale: string,
  t: (key: string) => string
) {
  const [sentences, setSentences] = useState(initialSentences);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const currentSentence = sentences[currentSentenceIndex];

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
      setFetchError(t("typingFetchError"));
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, locale, t]);

  const advanceToNextSentence = useCallback(() => {
    setCurrentSentenceIndex((prev) => prev + 1);
  }, []);

  const resetToBeginning = useCallback(() => {
    setCurrentSentenceIndex(0);
    setSentences(initialSentences);
    setFetchError(null);
  }, [initialSentences]);

  useEffect(() => {
    if (
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
    fetchError,
    advanceToNextSentence,
    resetToBeginning,
    fetchNewSentences,
    shouldPrefetch: shouldPrefetchSentences(
      currentSentenceIndex,
      sentences.length
    ),
    hasNext: hasNextSentence(currentSentenceIndex, sentences.length),
  };
}
