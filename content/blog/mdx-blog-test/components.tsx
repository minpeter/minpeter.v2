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
    fetch("https://ip.minpeter.uk/ip")
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        return res.text();
      })
      .then((fetchedIp) => setIp(fetchedIp))
      .catch(() => {
        setIp("Failed to fetch IP. Please try again later.");
      });
  }, []);

  return <span>Your IP: {ip ? ip : "Loading..."}</span>;
}

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-2">
      <p>
        Count: {count}
        {count === HEART_COUNT || count === INFINITY_COUNT ? " - 🫵🩷♾️" : ""}
      </p>
      <div className="space-x-1">
        <Button onClick={() => setCount(count + 1)} variant={"secondary"}>
          Count Up
        </Button>
        <Button onClick={() => setCount(0)} variant={"outline"}>
          Reset
        </Button>
      </div>
    </div>
  );
}
