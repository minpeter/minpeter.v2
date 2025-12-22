import {
  HANGUL_JAMO_END,
  HANGUL_JAMO_START,
  HANGUL_SYLLABLE_END,
  HANGUL_SYLLABLE_START,
} from "./hangul";

const SPECIAL_CHAR_PATTERN = /[.,!?]/;

export const isKorean = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (
    (code >= HANGUL_SYLLABLE_START && code <= HANGUL_SYLLABLE_END) ||
    (code >= HANGUL_JAMO_START && code <= HANGUL_JAMO_END)
  );
};

export const isSpecialChar = (char: string): boolean =>
  SPECIAL_CHAR_PATTERN.test(char);

export const getLastChar = (value: string): string => value.at(-1) ?? "";

export const mergeInputWithComposition = (
  currentInput: string,
  composition: string,
  incoming: string
): string => {
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

export const buildFinalInputAfterComposition = (
  currentInput: string,
  composition: string,
  targetSentence: string
): string => {
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
