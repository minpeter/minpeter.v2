import { isKorean } from "./korean";

const WPM_WORD_LENGTH = 5;
const SECONDS_PER_MINUTE = 60;
const PERCENTAGE_MULTIPLIER = 100;

export const calculateWPM = (input: string, elapsedSeconds: number): number => {
  if (elapsedSeconds <= 0 || input.length === 0) {
    return 0;
  }

  const effectiveLength = input
    .split("")
    .reduce((acc, char) => acc + (isKorean(char) ? 2 : 1), 0);

  const wordsTyped = effectiveLength / WPM_WORD_LENGTH;
  const minutes = elapsedSeconds / SECONDS_PER_MINUTE;
  return Math.round(wordsTyped / minutes);
};

export const calculateAccuracy = (input: string, target: string): number => {
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
};
