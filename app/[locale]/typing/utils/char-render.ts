import type {
  CharRenderParams,
  CharRenderState,
  DisplayCharOptions,
} from "../types";
import { isKorean } from "./korean";

export const resolveDisplayChar = ({
  baseChar,
  typedChar,
  isTyped,
  isComposingHere,
  isSpace,
  isWrongSpace,
  isTypedSpace,
  composingText,
}: DisplayCharOptions): string => {
  if (isComposingHere) {
    return composingText || baseChar;
  }

  if (isTyped) {
    return isWrongSpace || isTypedSpace ? "_" : typedChar;
  }

  if (isSpace) {
    return " ";
  }

  return baseChar;
};

export const isRenderCorrect = (
  baseChar: string,
  typedChar: string,
  isTyped: boolean
): boolean => {
  if (!isTyped) {
    return true;
  }

  if (isKorean(baseChar) || isKorean(typedChar)) {
    return baseChar === typedChar;
  }

  return baseChar.toLowerCase() === typedChar.toLowerCase();
};

export const buildClassName = (
  isTyped: boolean,
  isCurrentTyping: boolean,
  isComposingHere: boolean,
  isCorrect: boolean
): string => {
  const classes = ["transition-all"];

  if (isTyped) {
    classes.push(
      isCorrect ? "text-emerald-400" : "text-pink-400",
      "opacity-100"
    );
  } else if (isCurrentTyping) {
    classes.push("opacity-100");
  } else {
    classes.push("opacity-30");
  }

  if (isComposingHere) {
    classes.push("border-b-2");
  }

  return classes.join(" ");
};

export const buildCharRenderState = ({
  char,
  index,
  userInput,
  isComposing,
  composingText,
  currentSentenceIndex,
}: CharRenderParams): CharRenderState => {
  const isTyped = index < userInput.length;
  const typedChar = userInput[index] ?? "";
  const isCurrentTyping = index === userInput.length;
  const isComposingHere = isCurrentTyping && isComposing;
  const isSpace = char === " ";
  const isWrongSpace = isTyped && isSpace && typedChar !== " ";
  const isTypedSpace = isTyped && !isSpace && typedChar === " ";

  const display = resolveDisplayChar({
    baseChar: char,
    typedChar,
    isTyped,
    isComposingHere,
    isSpace,
    isWrongSpace,
    isTypedSpace,
    composingText,
  });

  const isCorrect = isRenderCorrect(char, typedChar, isTyped);
  const className = buildClassName(
    isTyped,
    isCurrentTyping,
    isComposingHere,
    isCorrect
  );

  return {
    key: `${currentSentenceIndex}-${index}-${char}`,
    display,
    className,
  };
};
