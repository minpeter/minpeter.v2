// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImageCarousel } from "./image-carousel";

vi.mock("embla-carousel-react", () => ({
  default: () => [() => undefined, undefined],
}));

const EXTERNAL_IMAGE_URL = "https://images.example.com/gallery/photo.jpg";

describe("ImageCarousel", () => {
  it("keeps dynamic external image URLs on the rendered image element", () => {
    render(
      <ImageCarousel alt="Gallery" height={240} images={[EXTERNAL_IMAGE_URL]} />
    );

    const image = screen.getByRole("img", { name: "Gallery 1" });

    expect(image.getAttribute("src")).toBe(EXTERNAL_IMAGE_URL);
    expect(image.getAttribute("height")).toBe("240");
    expect(image.getAttribute("width")).toBe("360");
  });
});
