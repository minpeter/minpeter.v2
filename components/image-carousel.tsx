"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/shared/utils/tailwind";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  height?: number;
}

export function ImageCarousel({
  images,
  alt = "Image",
  className,
  height = 400,
}: ImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

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
    <div className={cn("-mt-8", className)}>
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
                {/* biome-ignore lint/performance/noImgElement: using img for dynamic external images */}
                {/* biome-ignore lint/correctness/useImageSize: height is set via style prop */}
                <img
                  alt={`${alt} ${index + 1}`}
                  className="block h-full w-auto object-contain"
                  loading="lazy"
                  src={src}
                  style={{ height: `${height}px` }}
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
              "h-1.5 w-1.5 rounded-full transition-all",
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
