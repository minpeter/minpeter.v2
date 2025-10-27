"use client";
import { useEffect, useState } from "react";

const DEFAULT_COUNTDOWN_START = 3;
const ONE_SECOND_MS = 1000;
const COUNTDOWN_DECREMENT = 1;

type ExternalRedirectProps = {
  url: string;
  countdownStart?: number;
};

export default function ExternalRedirect({
  url,
  countdownStart = DEFAULT_COUNTDOWN_START,
}: ExternalRedirectProps) {
  const [count, setCount] = useState(countdownStart);

  useEffect(() => {
    if (count <= 0) {
      window.location.href = url;
    } else {
      const timer = window.setTimeout(() => {
        setCount((previous) => previous - COUNTDOWN_DECREMENT);
      }, ONE_SECOND_MS);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [count, url]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="space-y-4 text-center">
        <p className="text-lg">
          Redirecting to external link in <strong>{count}</strong> seconds...
        </p>
        <a className="text-primary underline" href={url}>
          Click here if you are not redirected.
        </a>
      </div>
    </div>
  );
}
