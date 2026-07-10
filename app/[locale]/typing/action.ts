"use server";

import { friendli } from "@friendliai/ai-provider";
import { generateText } from "ai";

const fallbackSentences = {
  en: [
    "Small improvements become a better experience over time.",
    "Practice typing with steady focus and clear intention.",
    "A calm rhythm helps accuracy grow before speed follows.",
    "Every careful keystroke makes the next sentence easier.",
  ],
  ko: [
    "작은 개선이 쌓이면 어느 날 훨씬 나은 경험이 됩니다.",
    "차분하게 읽고 정확하게 입력하는 습관을 연습합니다.",
    "오늘의 집중은 내일의 속도와 정확도를 함께 키웁니다.",
    "천천히 시작해도 끝까지 이어가면 분명한 변화가 남습니다.",
  ],
} as const;

type TypingLocale = keyof typeof fallbackSentences;

const HASH_MULTIPLIER = 31;
const HASH_MODULUS = 1_000_000_007;

const koreanConfig = {
  maxTokens: 50,
  model: friendli("meta-llama-3.1-8b-instruct"),
  prompt: "Please create a phrase for typing practice, just one sentence.",
  providerOptions: {
    friendli: {
      regex: "[ ,.?!0-9\uac00-\ud7af]*",
    },
  },
  system: `Please use only Korean.
You are a beautiful sentence generator for typing practice.
Don't write too short or too long sentences.
When writing sentences, write in a way that inspires the reader.`,
  temperature: 1.5,
  topP: 0.1,
};

const englishConfig = {
  maxTokens: 50,
  model: friendli("meta-llama-3.1-8b-instruct"),
  prompt: "Please create a phrase for typing practice, just one sentence.",
  providerOptions: {
    friendli: {
      regex: "[ ,.?!0-9a-zA-Z]*",
    },
  },
  system: "You are a beautiful sentence generator for typing practice.",
  temperature: 1,
  topP: 1,
};

function getContentHash(values: readonly string[]) {
  return values
    .join("\n")
    .split("")
    .reduce(
      (hash, char) =>
        (hash * HASH_MULTIPLIER + char.charCodeAt(0)) % HASH_MODULUS,
      0
    );
}

function getFallbackSentence(
  locale: TypingLocale,
  excludedSentences: readonly string[]
) {
  const sentences = fallbackSentences[locale];
  const excludedSet = new Set(excludedSentences);
  const availableSentences = sentences.filter(
    (sentence) => !excludedSet.has(sentence)
  );
  const candidates =
    availableSentences.length > 0
      ? availableSentences
      : sentences.filter((sentence) => sentence !== excludedSentences.at(-1));
  const index = Math.abs(getContentHash(excludedSentences)) % candidates.length;

  return candidates[index] ?? sentences[0];
}

export async function nextSentencesGenerator(
  locale: TypingLocale,
  excludedSentences: readonly string[] = []
) {
  if (!process.env.FRIENDLI_TOKEN) {
    return getFallbackSentence(locale, excludedSentences);
  }

  const { text } = await generateText({
    ...(locale === "ko" ? koreanConfig : englishConfig),
  });

  return text;
}
