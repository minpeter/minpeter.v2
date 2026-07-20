"use client";

import { useEffect } from "react";

// Hoisted out of the component: React Compiler cannot lower `import()`
// expressions (BuildHIR::lowerExpression "Handle Import expressions") and
// only compiles components/hooks, so a module-level helper keeps the same
// lazy client-side load without disabling compiler optimization.
const loadReactGrab = () => import("react-grab");

/** Starts React Grab only in development without rendering a script element. */
export function ReactGrab() {
  useEffect(() => {
    void loadReactGrab();
  }, []);

  return null;
}
