"use client";
import { useTranslations } from "next-intl";
import { useEffect, useReducer } from "react";

const DEFAULT_COUNTDOWN_START = 3;
const ONE_SECOND_MS = 1000;

interface ExternalRedirectProps {
  countdownStart?: number;
  url: string;
}

function countdownReducer(count: number) {
  return count - 1;
}

export default function ExternalRedirect({
  url,
  countdownStart = DEFAULT_COUNTDOWN_START,
}: ExternalRedirectProps) {
  const t = useTranslations("externalRedirect");
  const [count, decrementCount] = useReducer(countdownReducer, countdownStart);

  useEffect(() => {
    if (count <= 0) {
      window.location.href = url;
    } else {
      const timer = window.setTimeout(() => {
        decrementCount();
      }, ONE_SECOND_MS);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [count, url]);

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="space-y-4 text-center">
        <p className="text-lg">{t("message", { count: String(count) })}</p>
        <a className="text-primary underline" href={url}>
          {t("link")}
        </a>
      </div>
    </div>
  );
}
