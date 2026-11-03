// @vitest-environment jsdom
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import manifest from "@/shared/maru60-personal-manifest.json";
import retailOutlines from "@/shared/maru60-retail-silhouettes.json";
import retailSources from "@/shared/maru60-retail-silhouettes.sources.json";
import silhouette from "@/shared/maru60-silhouette.json";
import spinOutlines from "@/shared/maru60-spin-silhouettes.json";
import spinSources from "@/shared/maru60-spin-silhouettes.sources.json";
import { ProductMediaSkeleton } from "./product-media-skeleton";

afterEach(cleanup);

it("uses a solid outer contour aligned to the default frame, with no interior holes", () => {
  expect(silhouette.source).toBe(`public${manifest.frames[0].src}`);
  expect(silhouette.sourceSha256).toBe(manifest.frames[0].sha256);
  expect(
    createHash("sha256").update(readFileSync(silhouette.source)).digest("hex")
  ).toBe(silhouette.sourceSha256);
  expect(silhouette.outline.width).toBe(manifest.frames[0].width);
  expect(silhouette.outline.height).toBe(manifest.frames[0].height);
  expect(silhouette.outline.polygons).toHaveLength(1);
  expect(silhouette.outline.polygons[0].split(" ").length).toBeLessThan(32);
  expect(JSON.stringify(silhouette.outline).length).toBeLessThan(400);
  render(
    <ProductMediaSkeleton
      className="aspect-[2/3]"
      outline={silhouette.outline}
    />
  );
  expect(screen.getByTestId("product-silhouette").getAttribute("viewBox")).toBe(
    "0 0 1024 1536"
  );
  expect(
    screen.getByTestId("product-silhouette").querySelectorAll("polygon")
  ).toHaveLength(1);
  expect(
    screen.getByTestId("product-media-skeleton").className.split(" ")
  ).toContain("relative");
  expect(screen.getByTestId("product-media-skeleton").className).toContain(
    "motion-reduce:animate-none"
  );
});

it("keeps the reserved frame as a safe fallback when no transparent outline is available", () => {
  render(<ProductMediaSkeleton className="aspect-[2/3]" outline={null} />);
  expect(screen.queryByTestId("product-silhouette")).toBeNull();
  expect(screen.getByTestId("product-media-skeleton").className).toContain(
    "aspect-[2/3]"
  );
  expect(
    screen.getByTestId("product-media-skeleton").querySelector("img,canvas,svg")
  ).toBeNull();
});

it("keeps 12 lightweight outer angle envelopes tied to the exact source frames", () => {
  expect(Object.keys(spinOutlines)).toHaveLength(12);
  expect(JSON.stringify(spinOutlines).length).toBeLessThan(3000);
  for (const [key, shape] of Object.entries(spinOutlines)) {
    const source = spinSources[key as keyof typeof spinSources];
    expect(
      createHash("sha256").update(readFileSync(source.source)).digest("hex")
    ).toBe(source.sourceSha256);
    expect(shape.width).toBe(1024);
    expect(shape.height).toBe(1536);
    expect(shape.polygons).toHaveLength(1);
    expect(shape.polygons[0].split(" ").length).toBeLessThan(32);
  }
});

it("uses opaque retail contours instead of the smaller transparent side profile", () => {
  expect(silhouette.outline).toEqual(spinOutlines.frame_000);
  expect(retailOutlines.frame_090.polygons).not.toEqual(
    spinOutlines.frame_090.polygons
  );
  expect(JSON.stringify(retailOutlines).length).toBeLessThan(3000);
  for (const [key, shape] of Object.entries(retailOutlines)) {
    const source = retailSources[key as keyof typeof retailSources];
    expect(
      createHash("sha256").update(readFileSync(source.source)).digest("hex")
    ).toBe(source.sourceSha256);
    expect(shape.polygons).toHaveLength(1);
    expect(shape.polygons[0].split(" ").length).toBeLessThan(32);
  }
});
