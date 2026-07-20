"use client";

import { useTranslations } from "next-intl";
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

function getNextYearTimestamp() {
  const currentYear = new Date().getFullYear();
  return new Date(currentYear + 1, 0, 1).getTime();
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
  const t = useTranslations("showcase.items.newYear");
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
    { label: t("days"), value: remainingTime.days },
    { label: t("hours"), value: remainingTime.hours },
    { label: t("minutes"), value: remainingTime.minutes },
    { label: t("seconds"), value: remainingTime.seconds },
  ] as const;

  if (!hasTimeLeft) {
    return (
      <div className="rounded-lg border border-foreground/10 bg-secondary/35 px-5 py-12 text-center">
        <p className="text-xl tracking-[-0.035em]">{t("happy")}</p>
      </div>
    );
  }

  return (
    <div
      aria-label={t("timerLabel", {
        days: String(remainingTime.days),
        hours: String(remainingTime.hours),
        minutes: String(remainingTime.minutes),
        seconds: String(remainingTime.seconds),
      })}
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
        {t("caption", {
          year: String(new Date(targetTimestamp).getFullYear()),
        })}
      </p>
    </div>
  );
}
