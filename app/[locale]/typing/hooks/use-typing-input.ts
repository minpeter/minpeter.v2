import { useCallback, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const resetInput = useCallback(() => {
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
  }, []);

  const focusInput = useCallback(() => {
    if (!isTransitioning) {
      inputRef.current?.focus();
    }
  }, [isTransitioning]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const nativeEvent = e.nativeEvent as InputEvent;

      if (isTransitioning) {
        e.preventDefault();
        return;
      }

      const input = e.currentTarget.value;

      if (nativeEvent.isComposing || isComposing) {
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
    },
    [isTransitioning, isComposing, userInput, composingText, currentSentence]
  );

  const handleCompositionStart = useCallback(() => {
    if (!isTransitioning) {
      setIsComposing(true);
      setComposingText("");
    }
  }, [isTransitioning]);

  const handleCompositionUpdate = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      if (!isTransitioning) {
        setComposingText(e.data || "");
      }
    },
    [isTransitioning]
  );

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
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
    },
    [isTransitioning, composingText, userInput, currentSentence]
  );

  const handleBackspace = useCallback(() => {
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

  const handleSelectAll = useCallback(() => {
    setIsAllSelected(true);
  }, []);

  const currentInputWithComposition = isComposing
    ? userInput + composingText
    : userInput;

  return {
    userInput,
    isComposing,
    composingText,
    isAllSelected,
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
  };
}
