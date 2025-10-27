"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";

import Header from "@/components/header";
import { useCurrentLocale } from "@/locales/client";

export default function Page() {
  const locale = useCurrentLocale();
  return (
    <section className="flex flex-col gap-3">
      <Header
        description="Countdown to the next year"
        link={{ href: `/${locale}/show` as Route, text: "Back" }}
        title="/show/new-year-clock"
      />

      <Countdown />
    </section>
  );
}

function Countdown() {
  interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }

  const calculateTimeLeft = (): TimeLeft => {
    const difference =
      +new Date(`01/01/${new Date().getFullYear() + 1}`) - +new Date();
    let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  return (
    <div className="whitespace-pre-wrap rounded-xl text-sm">
      {Object.keys(timeLeft).length ? (
        <>
          {timeLeft.days}일 {timeLeft.hours}시간 {timeLeft.minutes}분{" "}
          {timeLeft.seconds}초
        </>
      ) : (
        "Happy New Year!"
      )}
    </div>
  );
}
