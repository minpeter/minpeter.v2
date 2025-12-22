import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  TYPING_UNITS,
  calculateAccuracy,
  calculateCPM,
  calculateWPM,
} from "../utils/stats";

const MILLISECONDS_PER_SECOND = 1000;

export function useTypingStats(
  userInput: string,
  composingText: string,
  currentSentence: string
) {
  const locale = useLocale();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [lastWpm, setLastWpm] = useState(0);
  const [lastAccuracy, setLastAccuracy] = useState(0);

  const currentInput = userInput + composingText;

  const unitConfig =
    TYPING_UNITS[locale as keyof typeof TYPING_UNITS] || TYPING_UNITS.en;
  const unitLabel = unitConfig.unit;

  const getDisplayValue = useCallback(
    (wpmValue: number) => {
      return unitLabel === "CPM" ? calculateCPM(wpmValue) : wpmValue;
    },
    [unitLabel]
  );

  useEffect(() => {
    if (!startTime && currentInput.length > 0) {
      setStartTime(Date.now());
      setLastWpm(0);
      setLastAccuracy(0);
      return;
    }

    if (startTime && currentInput.length > 0) {
      const elapsedSeconds = (Date.now() - startTime) / MILLISECONDS_PER_SECOND;
      const currentWPM = calculateWPM(currentInput, elapsedSeconds);
      const currentAccuracy = calculateAccuracy(currentInput, currentSentence);
      setWpm(currentWPM);
      setAccuracy(currentAccuracy);
    }
  }, [startTime, currentSentence, currentInput]);

  const resetStats = useCallback(() => {
    if (wpm > 0) {
      setLastWpm(wpm);
    }
    if (accuracy > 0) {
      setLastAccuracy(accuracy);
    }
    setStartTime(null);
    setWpm(0);
    setAccuracy(0);
  }, [wpm, accuracy]);

  const cancelStats = useCallback(() => {
    setStartTime(null);
    setWpm(0);
    setAccuracy(0);
  }, []);

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
    cancelStats,
  };
}
