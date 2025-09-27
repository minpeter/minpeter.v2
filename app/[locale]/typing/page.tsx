"use client";

import type { Route } from "next";
import { useState, useRef, useEffect, useCallback } from "react";

import Header from "@/components/header";
import { useCurrentLocale, useI18n } from "@/locales/client";

import { nextSentencesGenerator } from "./action";

// Add utility function to check Korean characters
const isKorean = (char: string) => {
  const code = char.charCodeAt(0);
  return (
    (code >= 0xac00 && code <= 0xd7a3) || // 완성형 한글
    (code >= 0x3131 && code <= 0x318e) // 자음/모음
  );
};

// Add utility function to check special characters after isKorean function
const isSpecialChar = (char: string) => {
  return /[.,!?]/.test(char);
};

// Initial sentences array

const MIN_ACCURACY_THRESHOLD = 85; // 85% accuracy threshold

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

  // 입력 상태 초기화 함수
  const resetInputStates = () => {
    setUserInput("");
    setComposingText("");
    setIsComposing(false);
    setIsAllSelected(false);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.blur();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
    // Store current WPM before resetting
    if (wpm > 0) {
      setLastWpm(wpm);
    }
    setStartTime(null);
    setWpm(0);
  };

  // Modify WPM calculation to consider character types
  const calculateWPM = useCallback((input: string, elapsedSeconds: number) => {
    // Korean characters count as 2 characters, others as 1
    const effectiveLength = input.split("").reduce((acc, char) => {
      return acc + (isKorean(char) ? 2 : 1);
    }, 0);

    const wordsTyped = effectiveLength / 5;
    const minutes = elapsedSeconds / 60;
    return Math.round(wordsTyped / minutes);
  }, []);

  // Modify fetch function to get multiple sentences
  const fetchNewSentences = async () => {
    if (isFetching) return;

    try {
      setIsFetching(true);
      const [sentence1, sentence2] = await Promise.all([
        nextSentencesGenerator(locale),
        nextSentencesGenerator(locale),
      ]);
      setSentences((prev) => [...prev, sentence1, sentence2]);
    } catch (error) {
      console.error("Failed to fetch new sentences:", error);
    } finally {
      setIsFetching(false);
    }
  };

  // Add accuracy calculation function
  const calculateAccuracy = useCallback((input: string, target: string) => {
    if (input.length === 0) return 0;

    let correctChars = 0;
    const inputLength = Math.min(input.length, target.length);

    for (let i = 0; i < inputLength; i++) {
      const targetChar = target[i];
      const inputChar = input[i];

      if (isKorean(targetChar) || isKorean(inputChar)) {
        if (targetChar === inputChar) correctChars++;
      } else {
        if (targetChar.toLowerCase() === inputChar.toLowerCase())
          correctChars++;
      }
    }

    return Math.round((correctChars / inputLength) * 100);
  }, []);

  // Replace existing completion check effect
  useEffect(() => {
    const checkCompletion = async () => {
      const currentInput = isComposing ? userInput + composingText : userInput;

      // Start fetching when running low on sentences
      if (currentSentenceIndex >= sentences.length - 3 && !isFetching) {
        fetchNewSentences();
      }

      // Check if input length matches target and accuracy is above threshold
      if (
        !isTransitioning &&
        currentInput.length === currentSentence.length &&
        (currentInput === currentSentence ||
          calculateAccuracy(currentInput, currentSentence) >=
            MIN_ACCURACY_THRESHOLD)
      ) {
        setIsTransitioning(true);

        if (currentSentenceIndex < sentences.length - 1) {
          setTimeout(() => {
            resetInputStates();
            setCurrentSentenceIndex((prev) => prev + 1);
            setIsTransitioning(false);
          }, 300);
        }
      }
    };

    checkCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userInput,
    composingText,
    currentSentence,
    currentSentenceIndex,
    sentences.length,
    isComposing,
    isTransitioning,
    calculateAccuracy,
    isFetching,
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
      const elapsedSeconds = (Date.now() - startTime) / 1000;
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

    let newInput = userInput;

    if (composingText) {
      // 조합이 끝난 한글 뒤에 특수문자가 오는 경우 처리
      if (
        isSpecialChar(input) &&
        isKorean(composingText[composingText.length - 1])
      ) {
        newInput += composingText + input;
      } else {
        newInput += composingText;
      }
      setComposingText("");
    } else if (input.length === 1) {
      newInput += input;
    }

    if (newInput.length <= currentSentence.length) {
      setUserInput(newInput);
    }

    e.currentTarget.value = "";
  };

  // onCompositionEnd 이벤트 핸들러 수정
  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    if (!isTransitioning) {
      setIsComposing(false);

      // 조합 중인 텍스트를 userInput에 추가
      if (composingText) {
        const newInput = userInput + composingText;

        // 문장의 마지막 글자가 한글이고, 다음에 특수문자가 와야 하는 경우 처리
        if (newInput.length < currentSentence.length) {
          const nextChar = currentSentence[newInput.length];
          if (
            isSpecialChar(nextChar) &&
            isKorean(composingText[composingText.length - 1])
          ) {
            const finalInput = newInput + nextChar;
            if (finalInput.length <= currentSentence.length) {
              setUserInput(finalInput);
            }
          } else {
            setUserInput(newInput);
          }
        } else {
          setUserInput(newInput);
        }

        setComposingText("");
      }

      e.currentTarget.value = "";
    }
  };

  // onCompositionStart 이벤트 핸들러
  const handleCompositionStart = () => {
    if (!isTransitioning) {
      setIsComposing(true);
      setComposingText("");
    }
  };

  // Update handleKeyDown to prevent early Enter presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isTransitioning) {
      e.preventDefault();
      // 강제로 다음 문장으로 진행 (다음 문장이 있을 때만)
      if (currentSentenceIndex < sentences.length - 1) {
        setIsTransitioning(true);
        if (currentSentenceIndex >= sentences.length - 3) {
          fetchNewSentences();
        }
        setTimeout(() => {
          resetInputStates();
          setCurrentSentenceIndex((prev) => prev + 1);
          setIsTransitioning(false);
        }, 300);
      }
      return;
    }

    if (e.key === "Backspace") {
      if (!isComposing && userInput.length > 0) {
        e.preventDefault();
        if (isAllSelected) {
          setUserInput("");
          setIsAllSelected(false);
        } else {
          setUserInput((prev) => prev.slice(0, -1));
        }
      }
    } else if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setIsAllSelected(true);
    }
  };

  return (
    <section data-animate className="flex flex-col gap-12">
      <Header
        title="Peter's Typing practice"
        description={t("typingDescription")}
        link={{ href: `/${locale}` as Route, text: t("backToHome") }}
      />
      <div
        className="relative flex flex-col items-center justify-center gap-4 p-4"
        onClick={() => !isTransitioning && inputRef.current?.focus()}
      >
        {/* 숨겨진 입력 필드 */}
        <input
          ref={inputRef}
          type="text"
          className="absolute opacity-0"
          onCompositionStart={handleCompositionStart}
          onCompositionUpdate={(e) => {
            if (!isTransitioning) {
              setComposingText(e.data || "");
            }
          }}
          onCompositionEnd={handleCompositionEnd}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        {/* 타이핑 텍스트 표시 */}
        <div className="font-mono text-2xl">
          {currentSentence.split("").map((char, index) => {
            const isTyped = index < userInput.length;
            const typedChar = userInput[index];
            const isCurrentTyping = index === userInput.length;
            const isComposingHere = isCurrentTyping && isComposing;
            const isSpace = char === " ";
            const isWrongSpace = isTyped && isSpace && typedChar !== " ";
            const isTypedSpace = isTyped && !isSpace && typedChar === " ";

            // Modified accuracy check logic
            const isCorrect = (() => {
              if (!isTyped) return true;
              if (isKorean(char) || isKorean(typedChar)) {
                return char === typedChar;
              }
              return char.toLowerCase() === typedChar?.toLowerCase();
            })();

            return (
              <span
                key={index}
                className={`transition-all ${
                  isTyped
                    ? isCorrect
                      ? "text-emerald-400 opacity-100"
                      : "text-pink-400 opacity-100"
                    : isCurrentTyping
                      ? "opacity-100"
                      : "opacity-30"
                } ${isComposingHere ? "border-b-2" : ""}`}
              >
                {isComposingHere
                  ? composingText
                  : isTyped
                    ? isWrongSpace || isTypedSpace
                      ? "_"
                      : typedChar
                    : isSpace
                      ? " "
                      : char}
              </span>
            );
          })}
        </div>

        {/* Update progress display to include fetching indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
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
        </div>
      </div>
    </section>
  );
}
