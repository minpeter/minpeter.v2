"use server";

import { friendli } from "@friendliai/ai-provider";
import { generateText } from "ai";

const fallbackSentences = {
  ko: [
    "작은 개선이 쌓이면 어느 날 훨씬 나은 경험이 됩니다.",
    "차분하게 읽고 정확하게 입력하는 습관을 연습합니다.",
  ],
  en: [
    "Small improvements become a better experience over time.",
    "Practice typing with steady focus and clear intention.",
  ],
} as const;

const koreanConfig = {
  model: friendli("meta-llama-3.1-8b-instruct"),
  temperature: 1.5,
  topP: 0.1,
  maxTokens: 50,
  system: `Please use only Korean.
You are a beautiful sentence generator for typing practice.
Don't write too short or too long sentences.
When writing sentences, write in a way that inspires the reader.`,
  prompt: "Please create a phrase for typing practice, just one sentence.",
  providerOptions: {
    friendli: {
      regex: "[ ,.?!0-9\uac00-\ud7af]*",
    },
  },
};

const englishConfig = {
  model: friendli("meta-llama-3.1-8b-instruct"),
  temperature: 1,
  topP: 1,
  maxTokens: 50,
  system: "You are a beautiful sentence generator for typing practice.",
  prompt: "Please create a phrase for typing practice, just one sentence.",
  providerOptions: {
    friendli: {
      regex: "[ ,.?!0-9a-zA-Z]*",
    },
  },
};

function getFallbackSentence(locale: "ko" | "en") {
  const sentences = fallbackSentences[locale];
  const index = Math.floor(Math.random() * sentences.length);
  return sentences[index] ?? sentences[0];
}

export async function nextSentencesGenerator(locale: "ko" | "en") {
  if (!process.env.FRIENDLI_TOKEN) {
    return getFallbackSentence(locale);
  }

  const { text } = await generateText({
    ...(locale === "ko" ? koreanConfig : englishConfig),
  });

  return text;
}
