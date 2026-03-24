"use server";

import { friendli } from "@friendliai/ai-provider";
import { generateText } from "ai";
import { after } from "next/server";

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

export async function nextSentencesGenerator(locale: "ko" | "en") {
  const startTime = Date.now();
  const { text } = await generateText({
    ...(locale === "ko" ? koreanConfig : englishConfig),
  });

  after(() => {
    const duration = Date.now() - startTime;
    console.info("[typing-action]", {
      locale,
      duration,
      timestamp: new Date().toISOString(),
    });
  });

  return text;
}
