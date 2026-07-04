"use client";
import { useEffect, useRef, useState } from "react";

export default function Typing({
  staticText,
  dynamic,
}: {
  staticText: string;
  dynamic: string[];
}) {
  const [text, setText] = useState(dynamic[0] ?? "");
  const textRef = useRef(dynamic[0] ?? "");
  const countRef = useRef(0);
  const isDeletingRef = useRef(false);

  const speed = 200;

  const postfix = " . . .";

  useEffect(() => {
    if (dynamic.length === 0) {
      textRef.current = "";
      countRef.current = 0;
      isDeletingRef.current = false;
      setText("");
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const count = countRef.current % dynamic.length;
      countRef.current = count;
      const dynamicText = dynamic[count] ?? "";
      const targetText = dynamicText + postfix;
      const currentText = textRef.current;
      let nextText: string;

      if (isDeletingRef.current) {
        if (currentText.length === 0) {
          isDeletingRef.current = false;
          const nextCount = (count + 1) % dynamic.length;
          countRef.current = nextCount;
          const nextDynamicText = dynamic[nextCount] ?? "";
          nextText = (nextDynamicText + postfix).slice(0, 1);
        } else {
          nextText = targetText.slice(0, currentText.length - 1);
        }
      } else if (currentText.length >= targetText.length) {
        isDeletingRef.current = true;
        nextText = targetText.slice(0, targetText.length - 1);
      } else {
        nextText = targetText.slice(0, currentText.length + 1);
      }

      textRef.current = nextText;
      setText(nextText);

      timeout = setTimeout(tick, speed);
    };

    timeout = setTimeout(tick, speed);

    return () => clearTimeout(timeout);
  }, [dynamic, postfix, speed]);

  return (
    <>
      {staticText}
      {dynamic.length === 0 ? "" : text}
    </>
  );
}
