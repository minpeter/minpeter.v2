"use client";

import { preload } from "react-dom";

/**
 * Emit a fetch hint only while rendering the initial HTML document. A server
 * component's direct link also travels in RSC prefetch responses, wasting a
 * default frame when the visitor is using a different detail configuration.
 * This client boundary is not rendered by RSC prefetch; hydration is a no-op.
 */
export function ProductFirstFramePreload({ source }: { source: string }) {
  if (typeof window === "undefined") {
    preload(source, {
      as: "fetch",
      crossOrigin: "anonymous",
      fetchPriority: "high",
    });
  }
  return null;
}
