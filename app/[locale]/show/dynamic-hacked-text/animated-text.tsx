"use client";

import { useRef, useState } from "react";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ{}</>믾쾹쵭퀴섫뤱윤チェ・ソユン";
const ITERATION_STEPS_PER_CHARACTER = 3;
const ITERATION_INCREMENT = 1 / ITERATION_STEPS_PER_CHARACTER;
const TIMEOUT_BASE_MS = 300;

// original source: https://github.com/wiscaksono/wiscaksono-site/blob/master/src/components/molecules/animated-name.tsx
// license: on github.com/wiscaksono/wiscaksono-site

export default function AnimatedText({ data }: { data: string }) {
  "use no memo";
  const [animatedText, setAnimatedText] = useState<string | null>(null);
  const isAnimatingRef = useRef(false);
  const displayText = animatedText ?? data;

  const handleMouseOver = () => {
    if (isAnimatingRef.current) {
      return;
    }

    let iteration = 0;
    isAnimatingRef.current = true;

    const animate = () => {
      setAnimatedText(
        [...data]
          .map((_, index) => {
            if (index < iteration) {
              return data[index];
            }
            return letters[
              Math.floor(
                Math.random() * letters.length
              )
            ];
          })
          .join("")
      );

      if (iteration < data.length) {
        iteration += ITERATION_INCREMENT;
        setTimeout(animate, TIMEOUT_BASE_MS / data.length);
      } else {
        setAnimatedText(null);
        isAnimatingRef.current = false;
      }
    };

    animate();
  };

  return (
    <button
      className="cursor-pointer rounded-md px-3 py-2 font-mono font-medium text-2xl tracking-[-0.04em] sm:text-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onFocus={handleMouseOver}
      onMouseOver={handleMouseOver}
      type="button"
    >
      {displayText}
    </button>
  );
}
