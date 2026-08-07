"use client";

import { useEffect } from "react";

// React Compiler cannot lower `import()` inside a component.
const loadReactGrab = () => import("react-grab");

export function ReactGrab() {
  useEffect(() => {
    loadReactGrab().catch(() => {
      // react-grab is a dev-only optional dependency
    });
  }, []);

  return null;
}
