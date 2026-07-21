"use client";

import { useEffect } from "react";

// React Compiler cannot lower `import()` inside a component.
const loadReactGrab = () => import("react-grab");

export function ReactGrab() {
  useEffect(() => {
    void loadReactGrab();
  }, []);

  return null;
}
