"use client";
import { useEffect, useState } from "react";

interface ExternalRedirectProps {
  url: string;
  countdownStart?: number;
}

export default function ExternalRedirect({
  url,
  countdownStart = 3,
}: ExternalRedirectProps) {
  const [count, setCount] = useState(countdownStart);

  useEffect(() => {
    if (count <= 0) {
      window.location.href = url;
    } else {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
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
