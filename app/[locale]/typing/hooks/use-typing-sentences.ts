import { useEffect, useEffectEvent, useRef, useState } from "react";
import { nextSentencesGenerator } from "../action";

const SENTENCE_PREFETCH_THRESHOLD = 3;

const shouldPrefetchSentences = (
  currentIndex: number,
  totalSentences: number
) => currentIndex >= totalSentences - SENTENCE_PREFETCH_THRESHOLD;

const hasNextSentence = (currentIndex: number, totalSentences: number) =>
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
  const isFetchingRef = useRef(false);

  const currentSentence = sentences[currentSentenceIndex] ?? "";
  const isInitialLoading = sentences.length === 0 && !fetchError;

  const fetchNewSentences = async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsFetching(true);
    setFetchError(null);

    try {
      const generatorLocale = locale === "ko" ? "ko" : "en";
      const [sentence1, sentence2] = await Promise.all([
        nextSentencesGenerator(generatorLocale),
        nextSentencesGenerator(generatorLocale),
      ]);
      setSentences((prev) => [...prev, sentence1, sentence2]);
      isFetchingRef.current = false;
      setIsFetching(false);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      setFetchError(getErrorMessage());
      isFetchingRef.current = false;
      setIsFetching(false);
    }
  };

  const fetchInitialSentences = useEffectEvent(fetchNewSentences);

  const advanceToNextSentence = () => {
    const nextIndex = currentSentenceIndex + 1;
    setCurrentSentenceIndex(nextIndex);

    if (shouldPrefetchSentences(nextIndex, sentences.length)) {
      fetchNewSentences();
    }
  };

  useEffect(() => {
    if (!hasFetchedInitial.current) {
      hasFetchedInitial.current = true;
      fetchInitialSentences();
    }
  }, []);

  return {
    sentences,
    currentSentence,
    currentSentenceIndex,
    isFetching,
    isInitialLoading,
    fetchError,
    advanceToNextSentence,
    shouldPrefetch: shouldPrefetchSentences(
      currentSentenceIndex,
      sentences.length
    ),
    hasNext: hasNextSentence(currentSentenceIndex, sentences.length),
  };
}
