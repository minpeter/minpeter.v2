import { useRef, useState } from "react";

import {
  buildFinalInputAfterComposition,
  isSpecialChar,
  mergeInputWithComposition,
} from "../utils/korean";

const INPUT_FOCUS_DELAY_MS = 50;

export function useTypingInput(
  currentSentence: string,
  isTransitioning: boolean
) {
  const [userInput, setUserInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [composingText, setComposingText] = useState("");
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [typingStartedAt, setTypingStartedAt] = useState<number | null>(null);
  const [typingUpdatedAt, setTypingUpdatedAt] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const markTypingUpdated = () => {
    const now = Date.now();
    setTypingStartedAt((current) => current ?? now);
    setTypingUpdatedAt(now);
  };

  const clearTypingClock = () => {
    setTypingStartedAt(null);
    setTypingUpdatedAt(null);
  };

  const resetInput = () => {
    setUserInput("");
    setComposingText("");
    setIsComposing(false);
    setIsAllSelected(false);
    clearTypingClock();
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.blur();
      setTimeout(() => {
        inputRef.current?.focus();
      }, INPUT_FOCUS_DELAY_MS);
    }
  };

  const focusInput = () => {
    if (!isTransitioning) {
      inputRef.current?.focus();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;

    if (isTransitioning) {
      e.preventDefault();
      return;
    }

    const input = e.currentTarget.value;

    if (nativeEvent.isComposing || isComposing) {
      if (!isSpecialChar(input)) {
        markTypingUpdated();
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
      if (nextInput.length === 0) {
        clearTypingClock();
      } else {
        markTypingUpdated();
      }
      setUserInput(nextInput);
    }

    e.currentTarget.value = "";
  };

  const handleCompositionStart = () => {
    if (!isTransitioning) {
      setIsComposing(true);
      setComposingText("");
    }
  };

  const handleCompositionUpdate = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    if (!isTransitioning) {
      if (e.data) {
        markTypingUpdated();
      }
      setComposingText(e.data || "");
    }
  };

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
        if (finalInput.length === 0) {
          clearTypingClock();
        } else {
          markTypingUpdated();
        }
        setUserInput(finalInput);
      }

      setComposingText("");
    }

    e.currentTarget.value = "";
  };

  const handleBackspace = () => {
    if (isComposing || userInput.length === 0) {
      return false;
    }

    if (isAllSelected) {
      setUserInput("");
      setIsAllSelected(false);
      clearTypingClock();
    } else {
      const nextInput = userInput.slice(0, -1);
      if (nextInput.length === 0) {
        clearTypingClock();
      } else {
        markTypingUpdated();
      }
      setUserInput(nextInput);
    }

    return true;
  };

  const handleSelectAll = () => {
    setIsAllSelected(true);
  };

  const currentInputWithComposition = isComposing
    ? userInput + composingText
    : userInput;

  return {
    composingText,
    currentInputWithComposition,
    focusInput,
    handleBackspace,
    handleCompositionEnd,
    handleCompositionStart,
    handleCompositionUpdate,
    handleInput,
    handleSelectAll,
    inputRef,
    isAllSelected,
    isComposing,
    resetInput,
    typingStartedAt,
    typingUpdatedAt,
    userInput,
  };
}
