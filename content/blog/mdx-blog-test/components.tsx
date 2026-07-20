"use client";

import { useEffect, useState } from "react";

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
  const [ip, setIp] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch("https://ip.minpeter.com/ip", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        return res.text();
      })
      .then((fetchedIp) => setIp(fetchedIp))
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setIp("Failed to fetch IP. Please try again later.");
      });

    return () => controller.abort();
  }, []);

  return <span>Your IP: {ip || "Loading..."}</span>;
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
