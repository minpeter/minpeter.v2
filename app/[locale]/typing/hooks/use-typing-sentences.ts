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
  const hasAdvancedSentence = useRef(false);
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
      const sentence1 = await nextSentencesGenerator(
        generatorLocale,
        sentences
      );
      const sentence2 = await nextSentencesGenerator(generatorLocale, [
        ...sentences,
        sentence1,
      ]);
      setSentences((prev) => [...prev, sentence1, sentence2]);
    } catch {
      setFetchError(getErrorMessage());
    } finally {
      isFetchingRef.current = false;
      setIsFetching(false);
    }
  };

  const fetchInitialSentences = useEffectEvent(fetchNewSentences);
  const fetchPrefetchSentences = useEffectEvent((sentenceIndex: number) => {
    if (shouldPrefetchSentences(sentenceIndex, sentences.length)) {
      fetchNewSentences();
    }
  });

  const advanceToNextSentence = () => {
    hasAdvancedSentence.current = true;
    setCurrentSentenceIndex((currentIndex) => currentIndex + 1);
  };

  useEffect(() => {
    if (!hasFetchedInitial.current) {
      hasFetchedInitial.current = true;
      fetchInitialSentences();
    }
  }, []);

  useEffect(() => {
    if (hasAdvancedSentence.current) {
      fetchPrefetchSentences(currentSentenceIndex);
    }
  }, [currentSentenceIndex]);

  return {
    sentences,
    currentSentence,
    currentSentenceIndex,
    isFetching,
    isInitialLoading,
    fetchError,
    advanceToNextSentence,
    fetchMoreSentences: fetchNewSentences,
    shouldPrefetch: shouldPrefetchSentences(
      currentSentenceIndex,
      sentences.length
    ),
    hasNext: hasNextSentence(currentSentenceIndex, sentences.length),
  };
}
