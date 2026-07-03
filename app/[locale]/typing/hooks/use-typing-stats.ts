import { useLocale } from "next-intl";
import { useState } from "react";
import {
  calculateAccuracy,
  calculateCPM,
  calculateWPM,
  TYPING_UNITS,
} from "../utils/stats";

const MILLISECONDS_PER_SECOND = 1000;

export function useTypingStats(
  userInput: string,
  composingText: string,
  currentSentence: string,
  typingStartedAt: number | null,
  typingUpdatedAt: number | null
) {
  const locale = useLocale();
  const [lastWpm, setLastWpm] = useState(0);
  const [lastAccuracy, setLastAccuracy] = useState(0);

  const currentInput = userInput + composingText;
  const hasCurrentInput = currentInput.length > 0;

  const unitConfig =
    TYPING_UNITS[locale as keyof typeof TYPING_UNITS] || TYPING_UNITS.en;
  const unitLabel = unitConfig.unit;

  const elapsedSeconds =
    typingStartedAt === null || typingUpdatedAt === null
      ? 0
      : (typingUpdatedAt - typingStartedAt) / MILLISECONDS_PER_SECOND;
  const wpm = calculateWPM(currentInput, elapsedSeconds);
  const accuracy = calculateAccuracy(currentInput, currentSentence);

  const getDisplayValue = (wpmValue: number) =>
    unitLabel === "CPM" ? calculateCPM(wpmValue) : wpmValue;

  const resetStats = () => {
    if (hasCurrentInput) {
      setLastWpm(wpm);
      setLastAccuracy(accuracy);
    }
  };

  const clearStats = () => {
    setLastWpm(0);
    setLastAccuracy(0);
  };

  const currentDisplayValue = getDisplayValue(wpm);
  const lastDisplayValue = getDisplayValue(lastWpm);
  const displayValue = hasCurrentInput ? currentDisplayValue : lastDisplayValue;

  return {
    wpm,
    accuracy,
    lastWpm,
    lastAccuracy,
    displayValue,
    displayAccuracy: hasCurrentInput ? accuracy : lastAccuracy,
    unitLabel,
    shouldShowStats: hasCurrentInput || lastWpm > 0,
    resetStats,
    clearStats,
  };
}
