"use client";

import Image from "next/image";
import { type MouseEvent, useCallback, useEffect, useState } from "react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/shared/utils/tailwind";

const IMAGE_WIDTH_RATIO = 1.5;

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
  const handleIndicatorClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const slideIndex = Number.parseInt(
        event.currentTarget.dataset.slideIndex ?? "",
        10
      );
      if (!Number.isNaN(slideIndex)) {
        api?.scrollTo(slideIndex);
      }
    },
    [api]
  );

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
    <div className={cn("-mt-6", className)}>
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
                  className="block h-full w-auto object-contain"
                  height={height}
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 768px"
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
            data-slide-index={index}
            key={src}
            onClick={handleIndicatorClick}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
