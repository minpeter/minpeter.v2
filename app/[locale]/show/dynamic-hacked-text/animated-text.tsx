"use client";

import { useCallback, useRef, useState } from "react";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ{}</>믾쾹쵭퀴섫뤱윤チェ・ソユン";
const ITERATION_STEPS_PER_CHARACTER = 3;
const ITERATION_INCREMENT = 1 / ITERATION_STEPS_PER_CHARACTER;
const TIMEOUT_BASE_MS = 300;
const RANDOM_LETTER_MULTIPLIER = 1;

// original source: https://github.com/wiscaksono/wiscaksono-site/blob/master/src/components/molecules/animated-name.tsx
// license: on github.com/wiscaksono/wiscaksono-site

export default function AnimatedText({ data }: { data: string }) {
  const [displayText, setDisplayText] = useState(data);
  const isAnimatingRef = useRef(false);

  const handleMouseOver = useCallback(() => {
    if (isAnimatingRef.current) {
      return;
    }

    let iteration = 0;
    isAnimatingRef.current = true;

    const animate = () => {
      setDisplayText(
        data
          .split("")
          .map((_, index) => {
            if (index < iteration) {
              return data[index];
            }
            return letters[
              Math.floor(
                Math.random() * RANDOM_LETTER_MULTIPLIER * letters.length
              )
            ];
          })
          .join("")
      );

      if (iteration < data.length) {
        iteration += ITERATION_INCREMENT;
        setTimeout(animate, TIMEOUT_BASE_MS / data.length);
      } else {
        isAnimatingRef.current = false;
      }
    };

    animate();
  }, [data]);

  return (
    <button
      className="cursor-pointer rounded font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onFocus={handleMouseOver}
      onMouseOver={handleMouseOver}
      type="button"
    >
      {displayText}
    </button>
  );
}
