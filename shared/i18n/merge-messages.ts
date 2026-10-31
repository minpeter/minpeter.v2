import type { AbstractIntlMessages } from "next-intl";

const isMessageTree = (
  value: AbstractIntlMessages[string] | undefined
): value is AbstractIntlMessages => typeof value === "object" && value !== null;

/**
 * Deep-merges locale messages so keys missing from `current` fall back to `fallback`.
 * Builds fresh objects with `Object.fromEntries`, so a `__proto__` key stays an own property
 * instead of rewriting the prototype.
 */
export function mergeMessages(
  fallback: AbstractIntlMessages,
  current: AbstractIntlMessages
): AbstractIntlMessages {
  const overrides = Object.entries(current).map(([key, value]) => {
    const base = Object.hasOwn(fallback, key) ? fallback[key] : undefined;

    return [
      key,
      isMessageTree(base) && isMessageTree(value)
        ? mergeMessages(base, value)
        : value,
    ] as const;
  });

  // Later entries win, so overrides replace fallback values in place.
  return Object.fromEntries([...Object.entries(fallback), ...overrides]);
}
