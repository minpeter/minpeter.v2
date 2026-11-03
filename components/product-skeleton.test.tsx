// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProductDetailSkeleton } from "../app/[locale]/products/[slug]/loading";
import ListLoading from "../app/[locale]/products/loading";
import en from "../shared/i18n/en.json";
import { ProductCustomizerSkeleton } from "./product-customizer-skeleton";

afterEach(cleanup);

describe("product loading skeletons", () => {
  it("keeps real introduction and details accessible while the preview suspends", () => {
    render(
      <ProductCustomizerSkeleton
        details={<p>Existing product description</p>}
        intro={<h1>MARU60</h1>}
      />
    );
    expect(
      screen
        .getByRole("heading", { name: "MARU60" })
        .closest('[aria-hidden="true"]')
    ).toBeNull();
    expect(
      screen
        .getByText("Existing product description")
        .closest('[aria-hidden="true"]')
    ).toBeNull();
    expect(
      screen
        .getByTestId("product-customizer-skeleton")
        .querySelectorAll(".store-custom-sidebar")
    ).toHaveLength(1);
  });

  it("reserves the stage, selectors, details row and full information hierarchy", () => {
    render(
      <ProductDetailSkeleton introText={en.products.items.rule60.intro} />
    );
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
