"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function SimpleButton() {
  const [toggle, setToggle] = useState(false);
  const [count, setCount] = useState(0);

  return (
    <Button
      variant={"secondary"}
      onClick={() => {
        setToggle(!toggle);
        setCount(count + 1);
      }}
    >
      {count >= 8
        ? "You pushed me 8 times!!"
        : toggle
          ? "You pushed me!!"
          : "Push me!!"}
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
      .then((ip) => setIp(ip))
      .catch((err) => {
        console.error(err);
        setIp("Failed to fetch IP, check console for more information.");
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
        {count == 82 || count == 802 ? " - 🫵🩷♾️" : ""}
      </p>
      <div className="space-x-1">
        <Button variant={"secondary"} onClick={() => setCount(count + 1)}>
          Count Up
        </Button>
        <Button variant={"outline"} onClick={() => setCount(0)}>
          Reset
        </Button>
      </div>
    </div>
  );
}
