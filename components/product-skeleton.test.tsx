// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import DetailLoading from "../app/[locale]/products/[slug]/loading";
import ListLoading from "../app/[locale]/products/loading";

afterEach(cleanup);

describe("product loading skeletons", () => {
  it("reserves the stage, selectors, details row and full information hierarchy", () => {
    render(<DetailLoading />);
    const skeleton = screen.getByTestId("product-detail-skeleton");
    expect(skeleton.getAttribute("aria-busy")).toBe("true");
    expect(skeleton.querySelectorAll(".store-product-heading")).toHaveLength(1);
    expect(skeleton.querySelectorAll(".store-custom-visual")).toHaveLength(1);
    expect(skeleton.querySelectorAll(".store-media-stage")).toHaveLength(1);
    expect(skeleton.querySelectorAll(".store-custom-color")).toHaveLength(8);
    expect(skeleton.querySelectorAll(".store-custom-kit")).toHaveLength(6);
    expect(
      skeleton.querySelectorAll(".store-custom-details-placeholder")
    ).toHaveLength(1);
    expect(
      skeleton.querySelectorAll(".store-product-info .store-button")
    ).toHaveLength(2);
    expect(
      skeleton.querySelectorAll(".store-product-info section")
    ).toHaveLength(2);
    expect(skeleton.querySelector(".store-media")).toBeNull();
    expect(skeleton.querySelector("input,button,a,summary")).toBeNull();
    expect(
      skeleton.querySelectorAll('[aria-hidden="true"]').length
    ).toBeGreaterThanOrEqual(2);
  });

  it("uses the catalog's portrait ratio and reserves its two caption lines", () => {
    render(<ListLoading />);
    const skeleton = screen.getByTestId("product-list-skeleton");
    expect(
      skeleton
        .querySelector('[data-slot="skeleton"]')
        ?.classList.contains("aspect-[2/3]")
    ).toBe(true);
    expect(skeleton.querySelectorAll(".store-card-caption > div")).toHaveLength(
      2
    );
  });
});
