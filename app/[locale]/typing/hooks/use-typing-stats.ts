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
    if (wpm > 0) {
      setLastWpm(wpm);
    }
    if (accuracy > 0) {
      setLastAccuracy(accuracy);
    }
  };

  const currentDisplayValue = getDisplayValue(wpm);
  const lastDisplayValue = getDisplayValue(lastWpm);
  const displayValue = wpm > 0 ? currentDisplayValue : lastDisplayValue;

  return {
    wpm,
    accuracy,
    lastWpm,
    lastAccuracy,
    displayValue,
    displayAccuracy: accuracy > 0 ? accuracy : lastAccuracy,
    unitLabel,
    shouldShowStats: wpm > 0 || lastWpm > 0,
    resetStats,
  };
}
