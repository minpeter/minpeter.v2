import { useCallback, useEffect, useState } from "react";
import { calculateAccuracy, calculateWPM } from "../utils/stats";

const MILLISECONDS_PER_SECOND = 1000;

export function useTypingStats(
  userInput: string,
  composingText: string,
  currentSentence: string
) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [lastWpm, setLastWpm] = useState(0);
  const [lastAccuracy, setLastAccuracy] = useState(0);

  const currentInput = userInput + composingText;

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

  const fullReset = useCallback(() => {
    setStartTime(null);
    setWpm(0);
    setAccuracy(0);
    setLastWpm(0);
    setLastAccuracy(0);
  }, []);

  const cancelStats = useCallback(() => {
    setStartTime(null);
    setWpm(0);
    setAccuracy(0);
  }, []);

  return {
    wpm,
    accuracy,
    lastWpm,
    lastAccuracy,
    displayWpm: wpm > 0 ? wpm : lastWpm,
    displayAccuracy: accuracy > 0 ? accuracy : lastAccuracy,
    shouldShowStats: wpm > 0 || lastWpm > 0,
    resetStats,
    fullReset,
    cancelStats,
  };
}
