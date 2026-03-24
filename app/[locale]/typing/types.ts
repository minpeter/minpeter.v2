export interface CharRenderParams {
  char: string;
  composingText: string;
  currentSentenceIndex: number;
  index: number;
  isComposing: boolean;
  userInput: string;
}

export interface CharRenderState {
  className: string;
  display: string;
  key: string;
}

export interface DisplayCharOptions {
  baseChar: string;
  composingText: string;
  isComposingHere: boolean;
  isSpace: boolean;
  isTyped: boolean;
  isTypedSpace: boolean;
  isWrongSpace: boolean;
  typedChar: string;
}

export interface TypingStats {
  accuracy: number;
  lastAccuracy: number;
  lastWpm: number;
  wpm: number;
}

export interface TypingInputState {
  composingText: string;
  isAllSelected: boolean;
  isComposing: boolean;
  isTransitioning: boolean;
  userInput: string;
}
