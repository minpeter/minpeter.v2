"use client";
import { useEffect, useState } from "react";

export default function Typing({
  staticText,
  dynamic,
}: {
  staticText: string;
  dynamic: string[];
}) {
  const [text, setText] = useState("");
  const [count, setCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const speed = 200;

  const postfix = " . . .";

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isDeleting) {
        setText((dynamic[count] + postfix).substring(0, text.length - 1));
      } else {
        setText((dynamic[count] + postfix).substring(0, text.length + 1));
      }

      if (!isDeleting && text === dynamic[count] + postfix) {
        setIsDeleting(true);
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setCount((count + 1) % dynamic.length);
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, count, dynamic]);

  return (
    <>
      {staticText}
      {isClient ? text : dynamic[0]}
    </>
  );
}
