"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import Image, { type StaticImageData } from "next/image";
import { useCallback, useState } from "react";

import { ProductSpin } from "@/components/product-spin";
import type { ProductSpin as ProductSpinData } from "@/shared/products";

interface ProductGalleryProps {
  labels: {
    media: string;
    next: string;
    previous: string;
    /** One entry per slide: "Show image N". */
    showImage: readonly string[];
    spin: string;
  };
  renders: readonly { alt: string; image: StaticImageData }[];
  spin: ProductSpinData;
}

/** Turntable first, then still images; arrows and square dots as on vercel.store. */
export function ProductGallery({ labels, renders, spin }: ProductGalleryProps) {
  const count = renders.length + 1;
  const [index, setIndex] = useState(0);
  const render = index > 0 ? renders[index - 1] : undefined;

  const showPrevious = useCallback(
    () => setIndex((current) => (current - 1 + count) % count),
    [count]
  );
  const showNext = useCallback(
    () => setIndex((current) => (current + 1) % count),
    [count]
  );
  const handleDotClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) =>
      setIndex(Number(event.currentTarget.dataset.index)),
    []
  );

  return (
    <section aria-label={labels.media} className="store-media">
      <div className="store-media-stage">
        {render ? (
          <div className="store-media-render">
            <Image
              alt={render.alt}
              className="object-contain"
              fill
              sizes="(min-width: 64rem) 60vw, 92vw"
              src={render.image}
            />
          </div>
        ) : (
          <ProductSpin
            alt={labels.spin}
            sizes="(min-width: 64rem) 60vw, 92vw"
            spin={spin}
          />
        )}
      </div>
      <button
        aria-label={labels.previous}
        className="store-media-arrow left-0"
        onClick={showPrevious}
        type="button"
      >
        <ChevronLeftIcon aria-hidden="true" />
      </button>
      <button
        aria-label={labels.next}
        className="store-media-arrow right-0"
        onClick={showNext}
        type="button"
      >
        <ChevronRightIcon aria-hidden="true" />
      </button>
      <div className="store-media-dots">
        {labels.showImage.map((label, dot) => (
          <button
            aria-current={dot === index}
            aria-label={label}
            className="store-media-dot"
            data-index={dot}
            key={label}
            onClick={handleDotClick}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
