// @vitest-environment jsdom
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, expect, it as test, vi } from "vitest";
import silhouettes from "@/shared/keycap-silhouettes.json";
import sources from "@/shared/keycap-silhouettes.sources.json";
import { KeycapThumbnail } from "./keycap-thumbnail";

vi.mock("next/image", () => ({
  default: ({
    unoptimized: _unoptimized,
    ...props
  }: ComponentProps<"img"> & { unoptimized?: boolean }) => (
    // biome-ignore lint/performance/noImgElement: Minimal Next Image test double.
    <img {...props} alt={props.alt} height={props.height} width={props.width} />
  ),
}));

afterEach(cleanup);

test("uses small source-matched solid outlines for all six keycap assets", () => {
  expect(Object.keys(silhouettes)).toHaveLength(6);
  for (const [id, asset] of Object.entries(sources)) {
    const outline = silhouettes[id as keyof typeof silhouettes];
    expect(
      createHash("sha256").update(readFileSync(asset.source)).digest("hex")
    ).toBe(asset.sourceSha256);
    expect(outline.width).toBe(256);
    expect(outline.height).toBe(256);
    expect(outline.polygons.length).toBeGreaterThan(0);
  }
});

test("keeps image and outline in the same frame and fades only the loaded image", () => {
  const { container, rerender } = render(<KeycapThumbnail id="inventor" />);
  const frame = screen.getByTestId("keycap-thumbnail-inventor");
  expect(frame.getAttribute("data-state")).toBe("loading");
  const image = container.querySelector("img") as HTMLImageElement;
  expect(image.className).toContain("opacity-0");
  fireEvent.load(image);
  expect(frame.getAttribute("data-state")).toBe("ready");
  expect(image.className).toContain("opacity-100");
  rerender(<KeycapThumbnail id="inventor" />);
  expect(frame.getAttribute("data-state")).toBe("ready");
  expect(image.className).toContain("motion-reduce:transition-none");
});

test("leaves a non-pulsing silhouette instead of a broken image on failure", () => {
  const { container } = render(<KeycapThumbnail id="nicepbt-bow-retail" />);
  fireEvent.error(container.querySelector("img") as HTMLImageElement);
  expect(
    screen
      .getByTestId("keycap-thumbnail-nicepbt-bow-retail")
      .getAttribute("data-state")
  ).toBe("error");
  expect(screen.getByTestId("product-media-skeleton").className).toContain(
    "animate-none"
  );
  expect(screen.getByTestId("product-silhouette")).toBeTruthy();
});

test("recognizes an already decoded cached image at mount without waiting for a load event", () => {
  const complete = vi
    .spyOn(HTMLImageElement.prototype, "complete", "get")
    .mockReturnValue(true);
  const width = vi
    .spyOn(HTMLImageElement.prototype, "naturalWidth", "get")
    .mockReturnValue(256);
  try {
    render(<KeycapThumbnail id="inventor" />);
    expect(
      screen.getByTestId("keycap-thumbnail-inventor").getAttribute("data-state")
    ).toBe("ready");
  } finally {
    complete.mockRestore();
    width.mockRestore();
  }
});
