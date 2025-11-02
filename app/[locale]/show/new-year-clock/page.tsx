"use client";

import type { Route } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";

import Header from "@/components/header";
import { useCurrentLocale } from "@/shared/i18n/client";

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

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const TIMER_INTERVAL_MS = MILLISECONDS_PER_SECOND;

const ZERO_TIME_LEFT: TimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const JANUARY_INDEX = 0;
const FIRST_DAY = 1;
const NEXT_YEAR_OFFSET = 1;

function Countdown() {
  const targetTimestamp = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return new Date(
      currentYear + NEXT_YEAR_OFFSET,
      JANUARY_INDEX,
      FIRST_DAY
    ).getTime();
  }, []);

  const calculateTimeLeft = useCallback((): TimeLeft => {
    const now = Date.now();
    const difference = targetTimestamp - now;

    if (difference <= 0) {
      return ZERO_TIME_LEFT;
    }

    const millisecondsPerMinute = MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE;
    const millisecondsPerHour = millisecondsPerMinute * MINUTES_PER_HOUR;
    const millisecondsPerDay = millisecondsPerHour * HOURS_PER_DAY;

    return {
      days: Math.floor(difference / millisecondsPerDay),
      hours: Math.floor((difference / millisecondsPerHour) % HOURS_PER_DAY),
      minutes: Math.floor(
        (difference / millisecondsPerMinute) % SECONDS_PER_MINUTE
      ),
      seconds: Math.floor(
        (difference / MILLISECONDS_PER_SECOND) % SECONDS_PER_MINUTE
      ),
    };
  }, [targetTimestamp]);

  const [remainingTime, setRemainingTime] =
    useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRemainingTime(calculateTimeLeft());
    }, TIMER_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [calculateTimeLeft]);

  const hasTimeLeft = useMemo(
    () => Object.values(remainingTime).some((value) => value > 0),
    [remainingTime]
  );

  return (
    <div className="whitespace-pre-wrap rounded-xl text-sm">
      {hasTimeLeft ? (
        <>
          {remainingTime.days}일 {remainingTime.hours}시간{" "}
          {remainingTime.minutes}분 {remainingTime.seconds}초
        </>
      ) : (
        "Happy New Year!"
      )}
    </div>
  );
}
