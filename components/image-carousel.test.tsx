// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ImageCarousel } from "./image-carousel";

const emblaApi = vi.hoisted(() => ({
  canScrollNext: vi.fn<() => boolean>(() => true),
  canScrollPrev: vi.fn<() => boolean>(() => true),
  off: vi.fn<() => void>(),
  on: vi.fn<() => void>(),
  scrollNext: vi.fn<() => void>(),
  scrollPrev: vi.fn<() => void>(),
  scrollTo: vi.fn<(index: number) => void>(),
  selectedScrollSnap: vi.fn<() => number>(() => 0),
}));

// @ts-expect-error -- the mock only implements the Embla surface used here.
vi.mock(import("embla-carousel-react"), () => ({
  default: () => [() => {}, emblaApi],
}));

const EXTERNAL_IMAGE_URL = "https://images.example.com/gallery/photo.jpg";
const IMAGES = [EXTERNAL_IMAGE_URL, `${EXTERNAL_IMAGE_URL}?slide=2`];

const renderCarousel = () =>
  render(
    <NextIntlClientProvider
      locale="ko"
      messages={
        {
          common: {
            nextSlide: "다음 슬라이드",
            previousSlide: "이전 슬라이드",
          },
        } as const
      }
    >
      <ImageCarousel alt="Gallery" height={240} images={IMAGES} />
    </NextIntlClientProvider>
  );

const getCarousel = (container: HTMLElement) => {
  const carousel = container.querySelector<HTMLElement>(
    '[data-slot="carousel"]'
  );
  if (!carousel) {
    throw new Error("Expected the image carousel to be rendered");
  }
  return carousel;
};

describe(ImageCarousel, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps dynamic external image URLs on the rendered image element", () => {
    renderCarousel();

    const image = screen.getByRole("img", { name: "Gallery 1" });

    expect(image.getAttribute("src")).toBe(EXTERNAL_IMAGE_URL);
    expect(image.getAttribute("height")).toBe("240");
    expect(image.getAttribute("width")).toBe("360");
  });

  it("moves to the next slide with a horizontal wheel gesture", () => {
    const { container } = renderCarousel();
    const carousel = getCarousel(container);

    fireEvent.wheel(carousel, { deltaX: 48, deltaY: 2 });

    expect(emblaApi.scrollNext).toHaveBeenCalledOnce();
    expect(emblaApi.scrollPrev).not.toHaveBeenCalled();
  });

  it("moves to the previous slide with a reverse horizontal wheel gesture", () => {
    const { container } = renderCarousel();
    const carousel = getCarousel(container);

    fireEvent.wheel(carousel, { deltaX: -48, deltaY: 2 });

    expect(emblaApi.scrollPrev).toHaveBeenCalledOnce();
    expect(emblaApi.scrollNext).not.toHaveBeenCalled();
  });

  it("does not intercept ordinary vertical scrolling", () => {
    const { container } = renderCarousel();
    const carousel = getCarousel(container);
    const wheelEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaX: 0,
      deltaY: 48,
    });

    fireEvent(carousel, wheelEvent);

    expect(wheelEvent.defaultPrevented).toBeFalsy();
    expect(emblaApi.scrollNext).not.toHaveBeenCalled();
    expect(emblaApi.scrollPrev).not.toHaveBeenCalled();
  });

  it("uses shift plus vertical wheel as horizontal navigation", () => {
    const { container } = renderCarousel();
    const carousel = getCarousel(container);
    const wheelEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 48,
      shiftKey: true,
    });

    fireEvent(carousel, wheelEvent);

    expect(wheelEvent.defaultPrevented).toBeTruthy();
    expect(emblaApi.scrollNext).toHaveBeenCalledOnce();
  });

  it("advances only once during a single wheel gesture", () => {
    const { container } = renderCarousel();
    const carousel = getCarousel(container);

    fireEvent.wheel(carousel, { deltaX: 48, deltaY: 0 });
    fireEvent.wheel(carousel, { deltaX: 48, deltaY: 0 });

    expect(emblaApi.scrollNext).toHaveBeenCalledOnce();
  });
});
