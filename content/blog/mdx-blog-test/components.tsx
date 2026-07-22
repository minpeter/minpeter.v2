"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const PUSHED_THRESHOLD = 8;
const HEART_COUNT = 82;
const INFINITY_COUNT = 802;

export function SimpleButton() {
  const [toggle, setToggle] = useState(false);
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setToggle((prevToggle) => !prevToggle);
    setCount((prevCount) => prevCount + 1);
  };

  let buttonLabel = "Push me!!";
  if (count >= PUSHED_THRESHOLD) {
    buttonLabel = `You pushed me ${PUSHED_THRESHOLD} times!!`;
  } else if (toggle) {
    buttonLabel = "You pushed me!!";
  }

  return (
    <Button onClick={handleClick} variant={"secondary"}>
      {buttonLabel}
    </Button>
  );
}

export function Ip() {
  const [ip, setIp] = useState("Click the button to load your IP.");
  const [isLoading, setIsLoading] = useState(false);

  const loadIp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://ip.minpeter.com/ip");
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      setIp(await response.text());
    } catch {
      setIp("Failed to fetch IP. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      Your IP: {isLoading ? "Loading..." : ip}
      <Button disabled={isLoading} onClick={loadIp} size="sm" variant="secondary">
        Load IP
      </Button>
    </span>
  );
}

export function Counter() {
  const [count, setCount] = useState(0);
  const handleCountUp = () => {
    setCount((currentCount) => currentCount + 1);
  };
  const handleReset = () => {
    setCount(0);
  };

  return (
    <div className="space-y-2">
      <p>
        Count: {count}
        {count === HEART_COUNT || count === INFINITY_COUNT ? " - 🫵🩷♾️" : ""}
      </p>
      <div className="space-x-1">
        <Button onClick={handleCountUp} variant={"secondary"}>
          Count Up
        </Button>
        <Button onClick={handleReset} variant={"outline"}>
          Reset
        </Button>
      </div>
    </div>
  );
}
