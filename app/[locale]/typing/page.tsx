"use client";

import type { Route } from "next";
import { useCallback, useEffect, useRef, useState } from "react";

import Header from "@/components/header";
import { useCurrentLocale, useI18n } from "@/shared/i18n-legacy/client";
import styles from "@/shared/styles/stagger-fade-in.module.css";

import { nextSentencesGenerator } from "./action";

const HANGUL_SYLLABLE_START = 0xac_00;
const HANGUL_SYLLABLE_END = 0xd7_a3;
const HANGUL_JAMO_START = 0x31_31;
const HANGUL_JAMO_END = 0x31_8e;
const SPECIAL_CHAR_PATTERN = /[.,!?]/;

const MIN_ACCURACY_THRESHOLD = 85;
const PERCENTAGE_MULTIPLIER = 100;
const SENTENCE_PREFETCH_THRESHOLD = 3;
const TRANSITION_DELAY_MS = 300;
const INPUT_FOCUS_DELAY_MS = 50;
const WPM_WORD_LENGTH = 5;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

// Add utility function to check Korean characters
const isKorean = (char: string) => {
  const code = char.charCodeAt(0);
  return (
    (code >= HANGUL_SYLLABLE_START && code <= HANGUL_SYLLABLE_END) || // 완성형 한글
    (code >= HANGUL_JAMO_START && code <= HANGUL_JAMO_END) // 자음/모음
  );
};

// Add utility function to check special characters after isKorean function
const isSpecialChar = (char: string) => SPECIAL_CHAR_PATTERN.test(char);

const getLastChar = (value: string) => value.at(-1) ?? "";

const shouldPrefetchSentences = (
  currentIndex: number,
  totalSentences: number
) => currentIndex >= totalSentences - SENTENCE_PREFETCH_THRESHOLD;

const hasNextSentence = (currentIndex: number, totalSentences: number) =>
  currentIndex < totalSentences - 1;

const mergeInputWithComposition = (
  currentInput: string,
  composition: string,
  incoming: string
) => {
  if (!composition) {
    return incoming.length === 1 ? currentInput + incoming : currentInput;
  }

  const lastComposingChar = getLastChar(composition);
  const shouldAttachSpecial =
    incoming.length > 0 &&
    lastComposingChar &&
    isSpecialChar(incoming) &&
    isKorean(lastComposingChar);

  const composedSegment = shouldAttachSpecial
    ? composition + incoming
    : composition;

  return currentInput + composedSegment;
};

const buildFinalInputAfterComposition = (
  currentInput: string,
  composition: string,
  targetSentence: string
) => {
  const baseInput = currentInput + composition;

  if (baseInput.length >= targetSentence.length) {
    return baseInput;
  }

  const nextChar = targetSentence[baseInput.length];
  const lastComposingChar = getLastChar(composition);

  if (
    nextChar &&
    lastComposingChar &&
    isSpecialChar(nextChar) &&
    isKorean(lastComposingChar)
  ) {
    const appendedInput = baseInput + nextChar;
    return appendedInput.length <= targetSentence.length
      ? appendedInput
      : baseInput;
  }

  return baseInput;
};

type CharRenderParams = {
  char: string;
  index: number;
  userInput: string;
  isComposing: boolean;
  composingText: string;
  currentSentenceIndex: number;
};

type CharRenderState = {
  key: string;
  display: string;
  className: string;
};

type DisplayCharOptions = {
  baseChar: string;
  typedChar: string;
  isTyped: boolean;
  isComposingHere: boolean;
  isSpace: boolean;
  isWrongSpace: boolean;
  isTypedSpace: boolean;
  composingText: string;
};

const resolveDisplayChar = ({
  baseChar,
  typedChar,
  isTyped,
  isComposingHere,
  isSpace,
  isWrongSpace,
  isTypedSpace,
  composingText,
}: DisplayCharOptions) => {
  if (isComposingHere) {
    return composingText || baseChar;
  }

  if (isTyped) {
    return isWrongSpace || isTypedSpace ? "_" : typedChar;
  }

  if (isSpace) {
    return " ";
  }

  return baseChar;
};

const isRenderCorrect = (
  baseChar: string,
  typedChar: string,
  isTyped: boolean
) => {
  if (!isTyped) {
    return true;
  }

  if (isKorean(baseChar) || isKorean(typedChar)) {
    return baseChar === typedChar;
  }

  return baseChar.toLowerCase() === typedChar.toLowerCase();
};

const buildClassName = (
  isTyped: boolean,
  isCurrentTyping: boolean,
  isComposingHere: boolean,
  isCorrect: boolean
) => {
  const classes = ["transition-all"];

  if (isTyped) {
    classes.push(
      isCorrect ? "text-emerald-400" : "text-pink-400",
      "opacity-100"
    );
  } else if (isCurrentTyping) {
    classes.push("opacity-100");
  } else {
    classes.push("opacity-30");
  }

  if (isComposingHere) {
    classes.push("border-b-2");
  }

  return classes.join(" ");
};

const buildCharRenderState = ({
  char,
  index,
  userInput,
  isComposing,
  composingText,
  currentSentenceIndex,
}: CharRenderParams): CharRenderState => {
  const isTyped = index < userInput.length;
  const typedChar = userInput[index] ?? "";
  const isCurrentTyping = index === userInput.length;
  const isComposingHere = isCurrentTyping && isComposing;
  const isSpace = char === " ";
  const isWrongSpace = isTyped && isSpace && typedChar !== " ";
  const isTypedSpace = isTyped && !isSpace && typedChar === " ";

  const display = resolveDisplayChar({
    baseChar: char,
    typedChar,
    isTyped,
    isComposingHere,
    isSpace,
    isWrongSpace,
    isTypedSpace,
    composingText,
  });

  const isCorrect = isRenderCorrect(char, typedChar, isTyped);
  const className = buildClassName(
    isTyped,
    isCurrentTyping,
    isComposingHere,
    isCorrect
  );

  return {
    key: `${currentSentenceIndex}-${index}-${char}`,
    display,
    className,
  };
};

export default function Page() {
  const t = useI18n();

  const initialSentences = [
    t("typingInitialSentences.0"),
    t("typingInitialSentences.1"),
    t("typingInitialSentences.2"),
  ];

  const locale = useCurrentLocale();

  // Add new states
  const [sentences, setSentences] = useState(initialSentences);
  const [isFetching, setIsFetching] = useState(false);
  const [lastWpm, setLastWpm] = useState(0); // Add this line after other state declarations
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 상태 관리
  const [userInput, setUserInput] = useState(""); // 사용자가 입력한 텍스트
  const [isComposing, setIsComposing] = useState(false); // 한글 조합 중인지 여부
  const [composingText, setComposingText] = useState(""); // 현재 조합 중인 한글
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0); // 현재 문장 인덱스
  const [isAllSelected, setIsAllSelected] = useState(false); // 전체 선택 상태
  const [isTransitioning, setIsTransitioning] = useState(false); // 다음 문장으로 전환 중인지 여부
  const inputRef = useRef<HTMLInputElement>(null); // 입력 필드 참조
  const [startTime, setStartTime] = useState<number | null>(null); // 타이핑 시작 시간
  const [wpm, setWpm] = useState(0); // 분당 타이핑 속도

  const currentSentence = sentences[currentSentenceIndex];

  const focusInputIfPossible = useCallback(() => {
    if (!isTransitioning) {
      inputRef.current?.focus();
    }
  }, [isTransitioning]);

  // 입력 상태 초기화 함수
  const resetInputStates = useCallback(() => {
    setUserInput("");
    setComposingText("");
    setIsComposing(false);
    setIsAllSelected(false);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.blur();
      setTimeout(() => {
        inputRef.current?.focus();
      }, INPUT_FOCUS_DELAY_MS);
    }
    // Store current WPM before resetting
    if (wpm > 0) {
      setLastWpm(wpm);
    }
    setStartTime(null);
    setWpm(0);
  }, [wpm]);

  const scheduleSentenceAdvance = useCallback(() => {
    setTimeout(() => {
      resetInputStates();
      setCurrentSentenceIndex((prev) => prev + 1);
      setIsTransitioning(false);
    }, TRANSITION_DELAY_MS);
  }, [resetInputStates]);

  // Modify WPM calculation to consider character types
  const calculateWPM = useCallback((input: string, elapsedSeconds: number) => {
    // Korean characters count as 2 characters, others as 1
    const effectiveLength = input
      .split("")
      .reduce((acc, char) => acc + (isKorean(char) ? 2 : 1), 0);

    const wordsTyped = effectiveLength / WPM_WORD_LENGTH;
    const minutes = elapsedSeconds / SECONDS_PER_MINUTE;
    return Math.round(wordsTyped / minutes);
  }, []);

  // Modify fetch function to get multiple sentences
  const fetchNewSentences = useCallback(async () => {
    if (isFetching) {
      return;
    }

    try {
      setIsFetching(true);
      setFetchError(null);
      const [sentence1, sentence2] = await Promise.all([
        nextSentencesGenerator(locale),
        nextSentencesGenerator(locale),
      ]);
      setSentences((prev) => [...prev, sentence1, sentence2]);
    } catch {
      setFetchError("문장을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, locale]);

  // Add accuracy calculation function
  const calculateAccuracy = useCallback((input: string, target: string) => {
    if (input.length === 0) {
      return 0;
    }

    let correctChars = 0;
    const inputLength = Math.min(input.length, target.length);

    for (let i = 0; i < inputLength; i += 1) {
      const targetChar = target[i];
      const inputChar = input[i];

      if (isKorean(targetChar) || isKorean(inputChar)) {
        if (targetChar === inputChar) {
          correctChars += 1;
        }
      } else if (targetChar.toLowerCase() === inputChar.toLowerCase()) {
        correctChars += 1;
      }
    }

    return Math.round((correctChars / inputLength) * PERCENTAGE_MULTIPLIER);
  }, []);

  useEffect(() => {
    if (
      shouldPrefetchSentences(currentSentenceIndex, sentences.length) &&
      !isFetching
    ) {
      fetchNewSentences();
    }
  }, [currentSentenceIndex, sentences.length, isFetching, fetchNewSentences]);

  useEffect(() => {
    if (isTransitioning) {
      return;
    }

    const currentInput = isComposing ? userInput + composingText : userInput;

    if (currentInput.length !== currentSentence.length) {
      return;
    }

    const meetsAccuracy =
      currentInput === currentSentence ||
      calculateAccuracy(currentInput, currentSentence) >=
        MIN_ACCURACY_THRESHOLD;

    if (!meetsAccuracy) {
      return;
    }

    if (!hasNextSentence(currentSentenceIndex, sentences.length)) {
      return;
    }

    setIsTransitioning(true);
    scheduleSentenceAdvance();
  }, [
    userInput,
    composingText,
    currentSentence,
    currentSentenceIndex,
    sentences.length,
    isComposing,
    isTransitioning,
    calculateAccuracy,
    scheduleSentenceAdvance,
  ]);

  // WPM 계산 효과
  useEffect(() => {
    // 첫 입력 시작 시 타이머 시작
    if (!startTime && (userInput.length > 0 || composingText.length > 0)) {
      setStartTime(Date.now());
      setLastWpm(0); // Reset lastWpm when new typing starts
      return;
    }

    // WPM 계산 (composingText도 길이에 포함)
    if (startTime && (userInput.length > 0 || composingText.length > 0)) {
      const currentInput = userInput + composingText;
      const elapsedSeconds = (Date.now() - startTime) / MILLISECONDS_PER_SECOND;
      const currentWPM = calculateWPM(currentInput, elapsedSeconds);
      setWpm(currentWPM);
    }
  }, [userInput, composingText, startTime, calculateWPM]);

  // 입력 처리 함수 수정
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;

    if (isTransitioning) {
      e.preventDefault();
      return;
    }

    const input = e.currentTarget.value;

    if (nativeEvent.isComposing || isComposing) {
      // 한글 조합 중일 때 특수문자가 아닌 경우에만 업데이트
      if (!isSpecialChar(input)) {
        setComposingText(input);
      }
      return;
    }

    const nextInput = mergeInputWithComposition(
      userInput,
      composingText,
      input
    );

    if (composingText) {
      setComposingText("");
    }

    if (nextInput.length <= currentSentence.length) {
      setUserInput(nextInput);
    }

    e.currentTarget.value = "";
  };

  // onCompositionEnd 이벤트 핸들러 수정
  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    if (isTransitioning) {
      return;
    }

    setIsComposing(false);

    if (composingText) {
      const finalInput = buildFinalInputAfterComposition(
        userInput,
        composingText,
        currentSentence
      );

      if (finalInput.length <= currentSentence.length) {
        setUserInput(finalInput);
      }

      setComposingText("");
    }

    e.currentTarget.value = "";
  };

  // onCompositionStart 이벤트 핸들러
  const handleCompositionStart = () => {
    if (!isTransitioning) {
      setIsComposing(true);
      setComposingText("");
    }
  };

  const handleEnterPress = useCallback(() => {
    if (!hasNextSentence(currentSentenceIndex, sentences.length)) {
      return false;
    }

    setIsTransitioning(true);

    if (shouldPrefetchSentences(currentSentenceIndex, sentences.length)) {
      fetchNewSentences();
    }

    scheduleSentenceAdvance();
    return true;
  }, [
    currentSentenceIndex,
    sentences.length,
    fetchNewSentences,
    scheduleSentenceAdvance,
  ]);

  const handleBackspacePress = useCallback(() => {
    if (isComposing || userInput.length === 0) {
      return false;
    }

    if (isAllSelected) {
      setUserInput("");
      setIsAllSelected(false);
    } else {
      setUserInput((prev) => prev.slice(0, -1));
    }

    return true;
  }, [isComposing, userInput, isAllSelected]);

  // Update handleKeyDown to prevent early Enter presses
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "Enter":
          if (!isTransitioning && handleEnterPress()) {
            e.preventDefault();
          }
          break;
        case "Backspace":
          if (handleBackspacePress()) {
            e.preventDefault();
          }
          break;
        case "a":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsAllSelected(true);
          }
          break;
        default:
      }
    },
    [handleEnterPress, handleBackspacePress, isTransitioning]
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
          onClick={focusInputIfPossible}
          type="button"
        >
          <div className="font-mono text-2xl">
            {currentSentence.split("").map((char, index) => {
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
            })}
          </div>

          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>
              {currentSentenceIndex + 1} / {sentences.length}
            </span>
            {(wpm > 0 || lastWpm > 0) && (
              <>
                <span className="text-gray-500">•</span>
                <span>{wpm > 0 ? wpm : lastWpm} WPM</span>
              </>
            )}
            {isFetching && (
              <>
                <span className="text-gray-500">•</span>
                <span>생성중...</span>
              </>
            )}
            {fetchError && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-pink-400">{fetchError}</span>
              </>
            )}
          </div>
        </button>

        <input
          autoFocus
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          onCompositionEnd={handleCompositionEnd}
          onCompositionStart={handleCompositionStart}
          onCompositionUpdate={(e) => {
            if (!isTransitioning) {
              setComposingText(e.data || "");
            }
          }}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          type="text"
        />
      </div>
    </section>
  );
}
