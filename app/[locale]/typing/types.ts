export interface CharRenderParams {
  char: string;
  index: number;
  userInput: string;
  isComposing: boolean;
  composingText: string;
  currentSentenceIndex: number;
}

export interface CharRenderState {
  key: string;
  display: string;
  className: string;
}

export interface DisplayCharOptions {
  baseChar: string;
  typedChar: string;
  isTyped: boolean;
  isComposingHere: boolean;
  isSpace: boolean;
  isWrongSpace: boolean;
  isTypedSpace: boolean;
  composingText: string;
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  lastWpm: number;
  lastAccuracy: number;
}

export interface TypingInputState {
  userInput: string;
  isComposing: boolean;
  composingText: string;
  isAllSelected: boolean;
  isTransitioning: boolean;
}
