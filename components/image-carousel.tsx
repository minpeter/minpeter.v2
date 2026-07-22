"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/shared/utils/tailwind";

const IMAGE_WIDTH_RATIO = 1.5;
const WHEEL_NAVIGATION_THRESHOLD = 24;
const WHEEL_GESTURE_IDLE_MS = 160;

interface ImageCarouselProps {
  alt?: string;
  className?: string;
  height?: number;
  images: string[];
}

export function ImageCarousel({
  images,
  alt = "Image",
  className,
  height = 400,
}: ImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const carouselRootRef = useRef<HTMLDivElement>(null);
  const wheelDelta = useRef(0);
  const wheelGestureLocked = useRef(false);
  const wheelResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const carouselRoot = carouselRootRef.current;
    if (!carouselRoot) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      const isHorizontalGesture =
        Math.abs(event.deltaX) > Math.abs(event.deltaY);
      let horizontalDelta = 0;
      if (isHorizontalGesture) {
        horizontalDelta = event.deltaX;
      } else if (event.shiftKey) {
        horizontalDelta = event.deltaY;
      }

      if (!(api && horizontalDelta)) {
        return;
      }

      event.preventDefault();

      if (wheelResetTimeout.current) {
        clearTimeout(wheelResetTimeout.current);
      }
      wheelResetTimeout.current = setTimeout(() => {
        wheelDelta.current = 0;
        wheelGestureLocked.current = false;
      }, WHEEL_GESTURE_IDLE_MS);

      if (wheelGestureLocked.current) {
        return;
      }

      wheelDelta.current += horizontalDelta;
      if (Math.abs(wheelDelta.current) < WHEEL_NAVIGATION_THRESHOLD) {
        return;
      }

      wheelGestureLocked.current = true;
      if (wheelDelta.current > 0) {
        api.scrollNext();
      } else {
        api.scrollPrev();
      }
    };

    carouselRoot.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      carouselRoot.removeEventListener("wheel", handleWheel);
      if (wheelResetTimeout.current) {
        clearTimeout(wheelResetTimeout.current);
      }
      wheelDelta.current = 0;
      wheelGestureLocked.current = false;
    };
  }, [api]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className={cn("-mt-6", className)} ref={carouselRootRef}>
      <Carousel
        className="w-full"
        opts={{
          align: "center",
          loop: true,
        }}
        setApi={setApi}
      >
        <CarouselContent className="-ml-2">
          {images.map((src, index) => (
            <CarouselItem
              className="flex basis-auto items-start justify-center pl-2"
              key={src}
            >
              <div className="overflow-hidden rounded-lg">
                <Image
                  alt={`${alt} ${index + 1}`}
                  className="block object-contain"
                  height={height}
                  src={src}
                  style={{ height: `${height}px`, width: "auto" }}
                  unoptimized
                  width={Math.round(height * IMAGE_WIDTH_RATIO)}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 border-0 bg-background/80 backdrop-blur-sm hover:bg-background/90" />
        <CarouselNext className="right-2 border-0 bg-background/80 backdrop-blur-sm hover:bg-background/90" />
      </Carousel>
      <div className="mt-3 flex justify-center gap-1.5">
        {images.map((src, index) => (
          <button
            aria-label={`Go to slide ${index + 1}`}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              current === index
                ? "w-3 bg-foreground"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            key={src}
            onClick={() => api?.scrollTo(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
