"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ{}</>믾쾹쵭퀴섫뤱윤チェ・ソユン";

// original source: https://github.com/wiscaksono/wiscaksono-site/blob/master/src/components/molecules/animated-name.tsx
// license: on github.com/wiscaksono/wiscaksono-site

export default function AnimatedText({ data }: { data: string }) {
  const [text, setText] = useState(data);
  const [intervalId] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const ref = useRef<HTMLHeadingElement | null>(null);

  const handleMouseOver = useCallback(() => {
    if (isAnimating) return;

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
            return letters[Math.floor(Math.random() * letters.length)];
          })
          .join("")
      );

      if (iteration < text.length) {
        iteration += 1 / 3;
        setTimeout(animate, 300 / data.length);
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
  }, [handleMouseOver, ref]);

  return (
    <span className="font-bold text-lg" ref={ref}>
      {text}
    </span>
  );
}
