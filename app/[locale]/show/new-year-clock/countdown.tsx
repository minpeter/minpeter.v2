"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

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

function getNextYearTimestamp() {
  const currentYear = new Date().getFullYear();
  return new Date(
    currentYear + NEXT_YEAR_OFFSET,
    JANUARY_INDEX,
    FIRST_DAY
  ).getTime();
}

function calculateTimeLeft(targetTimestamp: number): TimeLeft {
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
}

export function Countdown() {
  "use no memo";
  const [targetTimestamp] = useState(getNextYearTimestamp);
  const [remainingTime, setRemainingTime] = useState<TimeLeft>(() =>
    calculateTimeLeft(targetTimestamp)
  );

  useEffect(() => {
    const updateRemainingTime = () => {
      setRemainingTime(calculateTimeLeft(targetTimestamp));
    };

    updateRemainingTime();
    const intervalId = window.setInterval(
      updateRemainingTime,
      TIMER_INTERVAL_MS
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetTimestamp]);

  const hasTimeLeft = Object.values(remainingTime).some((value) => value > 0);
  const units = [
    { label: "Days", value: remainingTime.days },
    { label: "Hours", value: remainingTime.hours },
    { label: "Minutes", value: remainingTime.minutes },
    { label: "Seconds", value: remainingTime.seconds },
  ] as const;

  if (!hasTimeLeft) {
    return (
      <div className="rounded-lg border border-foreground/10 bg-secondary/35 px-5 py-12 text-center">
        <p className="text-xl tracking-[-0.035em]">Happy New Year!</p>
      </div>
    );
  }

  return (
    <div
      aria-label={`${remainingTime.days} days, ${remainingTime.hours} hours, ${remainingTime.minutes} minutes, and ${remainingTime.seconds} seconds until the new year`}
      className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4"
      role="timer"
    >
      {units.map(({ label, value }) => (
        <div className="border-foreground/15 border-t pt-4" key={label}>
          <span className="block font-mono text-2xl tabular-nums tracking-[-0.05em] sm:text-[1.75rem]">
            {String(value).padStart(2, "0")}
          </span>
          <span className="mt-1 block text-[0.6875rem] text-muted-foreground uppercase tracking-[0.08em]">
            {label}
          </span>
        </div>
      ))}
      <p className="col-span-full text-[0.6875rem] text-muted-foreground leading-relaxed">
        Counting down to January 1, {new Date(targetTimestamp).getFullYear()}.
      </p>
    </div>
  );
}
