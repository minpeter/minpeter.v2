// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/en.json";
import ja from "@/shared/i18n/ja.json";
import { STAND_COLOR_OPTIONS } from "@/shared/skateboard-stand";

import { SkateboardStandCustomizer } from "./skateboard-stand-customizer";

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

afterEach(cleanup);

describe("SkateboardStandCustomizer", () => {
  it("defaults to bone-white mounted board view and renders all 7 color swatches and 6 usage scenes", () => {
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
    expect(
      screen.getByTestId("stand-usage-showcase").querySelectorAll("figure")
    ).toHaveLength(6);
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

  it("switches colors and shows the marble texture note for White Marble", () => {
    renderCustomizer("", "en");
    fireEvent.click(screen.getByLabelText("White Marble"));
    expect(screen.getByTestId("stand-spin").getAttribute("data-source")).toBe(
      "/assets/products/skateboard-stand/turntable/with-board/white-marble"
    );
    expect(window.location.search).toContain("color=white-marble");
    expect(screen.getByTestId("stand-material-details").textContent).toContain(
      "PLA Marble 13103"
    );
  });
});
