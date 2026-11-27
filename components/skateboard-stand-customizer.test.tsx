// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RouteLoading from "@/app/[locale]/products/[slug]/loading";
import en from "@/shared/i18n/en.json";
import ja from "@/shared/i18n/ja.json";
import { STAND_COLOR_OPTIONS } from "@/shared/skateboard-stand";

import { SkateboardStandCustomizer } from "./skateboard-stand-customizer";
import { SkateboardStandCustomizerSkeleton } from "./skateboard-stand-customizer-skeleton";
import { SkateboardStandShowcase } from "./skateboard-stand-showcase";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const NON_EMPTY_NAME = /.+/u;

vi.mock("@/components/product-spin", () => ({
  ProductSpin: ({
    initialAngle,
    onAngleChange,
    spin,
  }: {
    initialAngle?: number;
    onAngleChange?: (angle: number) => void;
    spin: { basePath: string; frameCount: number };
  }) => {
    const rotate = () => onAngleChange?.(120);
    return (
      <div
        data-angle={initialAngle}
        data-frame-count={spin.frameCount}
        data-source={spin.basePath}
        data-testid="stand-spin"
      >
        <button onClick={rotate} type="button">
          Rotate stand
        </button>
      </div>
    );
  },
}));

const ko = JSON.parse(readFileSync("shared/i18n/ko.json", "utf8")) as typeof en;
const messages = { en, ja, ko };
type Locale = keyof typeof messages;

function renderCustomizer(searchParams = "", locale: Locale = "ko") {
  window.history.replaceState(
    null,
    "",
    `/products/skateboard-stand${searchParams}`
  );
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={
        messages[locale] as unknown as ComponentProps<
          typeof NextIntlClientProvider
        >["messages"]
      }
    >
      <SkateboardStandCustomizer
        details={<p>Details fixture</p>}
        intro={<h1>SKATEBOARD STAND</h1>}
        labels={{
          media: "Skateboard Stand renders",
          spin: "Skateboard Stand 360 render",
        }}
      />
    </NextIntlClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("SkateboardStandCustomizer", () => {
  it("defaults to bone-white mounted board view and renders all 7 color swatches", () => {
    renderCustomizer();
    const root = screen.getByTestId("skateboard-stand-customizer");
    expect(root.getAttribute("data-color")).toBe("bone-white");
    expect(root.getAttribute("data-view")).toBe("board");
    expect(screen.getByTestId("stand-spin").getAttribute("data-source")).toBe(
      "/assets/products/skateboard-stand/turntable/with-board/bone-white"
    );
    expect(screen.getAllByRole("radio", { name: NON_EMPTY_NAME })).toHaveLength(
      STAND_COLOR_OPTIONS.length + 2
    );
  });

  it("sanitizes invalid query parameters back to defaults", () => {
    renderCustomizer("?color=not-a-color&view=invalid", "en");
    const root = screen.getByTestId("skateboard-stand-customizer");
    expect(root.getAttribute("data-color")).toBe("bone-white");
    expect(root.getAttribute("data-view")).toBe("board");
  });

  it("switches to the stand-only view while preserving angle and syncing URL params", () => {
    renderCustomizer("", "en");
    fireEvent.click(screen.getByRole("button", { name: "Rotate stand" }));
    fireEvent.click(screen.getByLabelText("Stand"));

    const spin = screen.getByTestId("stand-spin");
    expect(spin.getAttribute("data-source")).toBe(
      "/assets/products/skateboard-stand/turntable/stand/bone-white"
    );
    expect(spin.getAttribute("data-angle")).toBe("120");
    expect(window.location.search).toContain("view=stand");
  });

  it("switches colors and shows the marble texture note inside Specs for White Marble", () => {
    renderCustomizer("", "en");
    fireEvent.click(screen.getByLabelText("White Marble"));
    expect(screen.getByTestId("stand-spin").getAttribute("data-source")).toBe(
      "/assets/products/skateboard-stand/turntable/with-board/white-marble"
    );
    expect(window.location.search).toContain("color=white-marble");
    const details = screen.getByTestId("stand-material-details");
    expect(details.textContent).toContain("PLA Marble 13103");
    expect(details.textContent).toContain("fine gray flecks");
  });

  it("keeps live intro and CTA accessible outside aria-hidden in the stand skeleton", () => {
    render(
      <SkateboardStandCustomizerSkeleton
        actions={
          <a data-testid="product-store-cta" href="https://example.com">
            Buy on Smart Store
          </a>
        }
        intro={<h1>SKATEBOARD STAND</h1>}
      />
    );
    expect(
      screen
        .getByRole("heading", { name: "SKATEBOARD STAND" })
        .closest('[aria-hidden="true"]')
    ).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Buy on Smart Store" })
        .closest('[aria-hidden="true"]')
    ).toBeNull();
  });

  it("keeps the shared product route loading fallback product-neutral", () => {
    render(<RouteLoading />);
    const skeleton = screen.getByTestId("product-detail-skeleton");
    expect(skeleton.getAttribute("aria-busy")).toBe("true");
    expect(skeleton.textContent).not.toContain("MARU60");
    expect(skeleton.querySelector("input,button,a,summary")).toBeNull();
  });

  it("renders all 6 showcase scenes and disarms motion immediately when reduced motion toggles on", async () => {
    const listeners = new Set<() => void>();
    const media = {
      addEventListener: (_event: string, cb: () => void) => listeners.add(cb),
      matches: false,
      removeEventListener: (_event: string, cb: () => void) =>
        listeners.delete(cb),
    };
    const prevMatch = window.matchMedia;
    const prevIO = globalThis.IntersectionObserver;

    class MockIO {
      disconnect = vi.fn();
      observe = vi.fn();
      unobserve = vi.fn();
    }

    window.matchMedia = vi.fn(
      () => media
    ) as unknown as typeof window.matchMedia;
    globalThis.IntersectionObserver =
      MockIO as unknown as typeof IntersectionObserver;

    try {
      render(
        <NextIntlClientProvider
          locale="en"
          messages={
            en as unknown as ComponentProps<
              typeof NextIntlClientProvider
            >["messages"]
          }
        >
          <SkateboardStandShowcase />
        </NextIntlClientProvider>
      );

      const showcase = screen.getByTestId("stand-usage-showcase");
      expect(showcase.querySelectorAll("figure")).toHaveLength(6);
      const grid = showcase.querySelector(".store-showcase-grid");
      await waitFor(() => {
        expect(grid?.getAttribute("data-motion-armed")).toBe("true");
      });

      act(() => {
        media.matches = true;
        for (const cb of listeners) {
          cb();
        }
      });

      expect(grid?.getAttribute("data-motion-armed")).toBe("false");
    } finally {
      window.matchMedia = prevMatch;
      globalThis.IntersectionObserver = prevIO;
    }
  });
});
