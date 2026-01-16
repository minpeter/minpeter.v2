"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ{}</>믾쾹쵭퀴섫뤱윤チェ・ソユン";
const ITERATION_STEPS_PER_CHARACTER = 3;
const ITERATION_INCREMENT = 1 / ITERATION_STEPS_PER_CHARACTER;
const TIMEOUT_BASE_MS = 300;
const RANDOM_LETTER_MULTIPLIER = 1;

// original source: https://github.com/wiscaksono/wiscaksono-site/blob/master/src/components/molecules/animated-name.tsx
// license: on github.com/wiscaksono/wiscaksono-site

export default function AnimatedText({ data }: { data: string }) {
  const [text, setText] = useState(data);
  const [intervalId] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const ref = useRef<HTMLButtonElement | null>(null);

  const handleMouseOver = useCallback(() => {
    if (isAnimating) {
      return;
    }

    let iteration = 0;

    if (intervalId !== null) {
      clearTimeout(intervalId);
    }

    const animate = () => {
      setIsAnimating(true);
      setText((prevText) =>
        prevText
          .split("")
          .map((_, index) => {
            if (index < iteration) {
              return text[index];
            }
            return letters[
              Math.floor(
                Math.random() * RANDOM_LETTER_MULTIPLIER * letters.length
              )
            ];
          })
          .join("")
      );

      if (iteration < text.length) {
        iteration += ITERATION_INCREMENT;
        setTimeout(animate, TIMEOUT_BASE_MS / data.length);
      } else {
        setIsAnimating(false);
      }
    };

    animate();
  }, [intervalId, isAnimating, text, data]);

  useEffect(() => {
    const currentRef = ref.current;

    if (currentRef) {
      currentRef.addEventListener("mouseover", handleMouseOver);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("mouseover", handleMouseOver);
      }
    };
  }, [handleMouseOver]);

  return (
    <button
      className="cursor-pointer rounded font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onFocus={handleMouseOver}
      ref={ref}
      type="button"
    >
      {text}
    </button>
  );
}
