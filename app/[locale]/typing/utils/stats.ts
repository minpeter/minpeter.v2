import { disassembleString, getCharStrokeCount } from "./hangul";

const WPM_WORD_LENGTH = 5;
const SECONDS_PER_MINUTE = 60;
const PERCENTAGE_MULTIPLIER = 100;

export const TYPING_UNITS = {
  ko: { unit: "CPM", scale: 5 },
  en: { unit: "WPM", scale: 1 },
  ja: { unit: "CPM", scale: 5 },
} as const;

export type TypingUnit =
  (typeof TYPING_UNITS)[keyof typeof TYPING_UNITS]["unit"];

export const calculateWPM = (input: string, elapsedSeconds: number): number => {
  if (elapsedSeconds <= 0 || input.length === 0) {
    return 0;
  }

  const effectiveLength = input
    .split("")
    .reduce((acc, char) => acc + getCharStrokeCount(char), 0);

  const wordsTyped = effectiveLength / WPM_WORD_LENGTH;
  const minutes = elapsedSeconds / SECONDS_PER_MINUTE;
  return Math.round(wordsTyped / minutes);
};

export const calculateCPM = (wpm: number): number => {
  return Math.round(wpm * WPM_WORD_LENGTH);
};

export const calculateAccuracy = (input: string, target: string): number => {
  if (input.length === 0) {
    return 0;
  }

  const inputJaso = disassembleString(input);
  const targetJaso = disassembleString(target);

  const length = Math.min(inputJaso.length, targetJaso.length);
  let correctCount = 0;

  for (let i = 0; i < length; i += 1) {
    if (
      inputJaso[i] === targetJaso[i] ||
      inputJaso[i].toLowerCase() === targetJaso[i].toLowerCase()
    ) {
      correctCount += 1;
    }
  }

  return Math.round((correctCount / inputJaso.length) * PERCENTAGE_MULTIPLIER);
};
