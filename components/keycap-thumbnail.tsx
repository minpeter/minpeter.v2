"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import { ProductMediaSkeleton } from "@/components/product-media-skeleton";
import silhouettes from "@/shared/keycap-silhouettes.json";
import { cn } from "@/shared/utils/tailwind";

type KeycapId = keyof typeof silhouettes;
type ImageStatus = "loading" | "ready" | "error";

export function KeycapThumbnail({ id }: { id: KeycapId }) {
  const src = `/assets/products/maru60/keycaps/v1/${id}.webp`;
  const [image, setImage] = useState<{ src: string; status: ImageStatus }>({
    src,
    status: "loading",
  });
  const status = image.src === src ? image.status : "loading";
  const rememberCachedImage = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete && node.naturalWidth > 0) {
        setImage({ src, status: "ready" });
      }
    },
    [src]
  );

  const handleLoad = useCallback(
    () => setImage({ src, status: "ready" }),
    [src]
  );
  const handleError = useCallback(
    () => setImage({ src, status: "error" }),
    [src]
  );

  return (
    <span
      aria-hidden="true"
      className="store-keycap-thumbnail"
      data-state={status}
      data-testid={`keycap-thumbnail-${id}`}
    >
      <ProductMediaSkeleton
        className={cn(
          "h-full w-full rounded-none transition-opacity duration-150 motion-reduce:transition-none",
          status !== "loading" && "animate-none",
          status === "ready" && "opacity-0"
        )}
        outline={silhouettes[id]}
      />
      <Image
        alt=""
        className={cn(
          "absolute inset-0 h-full w-full object-contain transition-opacity duration-150 motion-reduce:transition-none",
          status === "ready" ? "opacity-100" : "opacity-0"
        )}
        height={256}
        onError={handleError}
        onLoad={handleLoad}
        ref={rememberCachedImage}
        src={src}
        unoptimized
        width={256}
      />
    </span>
  );
}
