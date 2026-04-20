"use client";

import type { ImageZoom } from "fumadocs-ui/components/image-zoom";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ClientImageZoom = dynamic(
  () => import("fumadocs-ui/components/image-zoom").then((mod) => mod.ImageZoom),
  {
    ssr: false,
  }
);

export type SafeImageZoomProps = ComponentProps<typeof ImageZoom>;

export function SafeImageZoom(props: SafeImageZoomProps) {
  if (typeof window === "undefined") {
    return <img {...(props as ComponentProps<"img">)} />;
  }

  return <ClientImageZoom {...props} />;
}
