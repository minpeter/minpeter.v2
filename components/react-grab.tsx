"use client";

import { useEffect } from "react";

/** Starts React Grab only in development without rendering a script element. */
export function ReactGrab() {
  useEffect(() => {
    void import("react-grab");
  }, []);

  return null;
}
