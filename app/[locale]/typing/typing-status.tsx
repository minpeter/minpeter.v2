interface TypingStatusProps {
  readonly accuracyText: string;
  readonly currentPosition: number;
  readonly displayAccuracy: number;
  readonly displayValue: number;
  readonly fetchError: string | null;
  readonly generatingText: string;
  readonly isFetching: boolean;
  readonly sentenceCount: number;
  readonly shouldShowStats: boolean;
  readonly unitText: string;
}

interface TypingHintsProps {
  readonly enterText: string;
  readonly resetText: string;
}

export function TypingStatus({
  currentPosition,
  sentenceCount,
  shouldShowStats,
  displayValue,
  unitText,
  displayAccuracy,
  accuracyText,
  isFetching,
  generatingText,
  fetchError,
}: TypingStatusProps) {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <span>
        {currentPosition} / {sentenceCount}
      </span>
      {shouldShowStats ? (
        <>
          <span className="text-gray-500">•</span>
          <span>
            {displayValue} {unitText}
          </span>
          <span className="text-gray-500">•</span>
          <span>
            {displayAccuracy}% {accuracyText}
          </span>
        </>
      ) : null}
      {isFetching ? (
        <>
          <span className="text-gray-500">•</span>
          <span>{generatingText}</span>
        </>
      ) : null}
      {fetchError ? (
        <>
          <span className="text-gray-500">•</span>
          <span className="text-pink-400">{fetchError}</span>
        </>
      ) : null}
    </div>
  );
}

export function TypingHints({ enterText, resetText }: TypingHintsProps) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-3 text-gray-500 text-xs">
      <span>
        <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-gray-300">
          Enter
        </kbd>{" "}
        {enterText}
      </span>
      <span>
        <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-gray-300">
          Esc
        </kbd>{" "}
        {resetText}
      </span>
    </div>
  );
}
