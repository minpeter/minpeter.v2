"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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

interface WheelGestureState {
  delta: number;
  locked: boolean;
  resetTimeout: ReturnType<typeof setTimeout> | undefined;
}

function getHorizontalWheelDelta(event: WheelEvent): number {
  const isHorizontalGesture = Math.abs(event.deltaX) > Math.abs(event.deltaY);
  if (isHorizontalGesture) {
    return event.deltaX;
  }
  if (event.shiftKey) {
    return event.deltaY;
  }
  return 0;
}

function attachWheelNavigation(
  carouselRoot: HTMLDivElement,
  api: CarouselApi,
  gesture: WheelGestureState
): () => void {
  const handleWheel = (event: WheelEvent) => {
    const horizontalDelta = getHorizontalWheelDelta(event);
    if (!api || horizontalDelta === 0) {
      return;
    }

    event.preventDefault();

    clearTimeout(gesture.resetTimeout);
    gesture.resetTimeout = setTimeout(() => {
      gesture.delta = 0;
      gesture.locked = false;
    }, WHEEL_GESTURE_IDLE_MS);

    if (gesture.locked) {
      return;
    }

    gesture.delta += horizontalDelta;
    if (Math.abs(gesture.delta) < WHEEL_NAVIGATION_THRESHOLD) {
      return;
    }

    gesture.locked = true;
    if (gesture.delta > 0) {
      api.scrollNext();
    } else {
      api.scrollPrev();
    }
  };

  carouselRoot.addEventListener("wheel", handleWheel, { passive: false });

  return () => {
    carouselRoot.removeEventListener("wheel", handleWheel);
    clearTimeout(gesture.resetTimeout);
    gesture.delta = 0;
    gesture.locked = false;
  };
}

export function ImageCarousel({
  images,
  alt = "Image",
  className,
  height = 400,
}: ImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const carouselRootRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<WheelGestureState>({
    delta: 0,
    locked: false,
    resetTimeout: undefined,
  });

  useEffect(() => {
    const carouselRoot = carouselRootRef.current;
    if (carouselRoot === null || !api) {
      return;
    }

    return attachWheelNavigation(carouselRoot, api, gestureRef.current);
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

  const handleDotClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const index = Number(event.currentTarget.dataset.index);
      if (Number.isSafeInteger(index)) {
        api?.scrollTo(index);
      }
    },
    [api]
  );

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
            data-index={index}
            key={src}
            onClick={handleDotClick}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
