// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/en.json";
import ja from "@/shared/i18n/ja.json";

import {
  HOUSING_OPTIONS,
  KEYCAP_OPTIONS,
} from "@/shared/keyboard-customization";

import { ProductCustomizer } from "./product-customizer";
import type { ProductGalleryProps } from "./product-gallery";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const fixtures = vi.hoisted(() => ({
  candidates: [] as unknown[],
  retry: vi.fn(),
}));
vi.mock("@/shared/product-spin-loader", () => ({
  getSpinLoader: () => ({ retry: fixtures.retry }),
}));
vi.mock("@/shared/keyboard-customization", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/shared/keyboard-customization")>();
  return {
    ...actual,
    getValidatedCombination: (housing: string, keycaps: string) =>
      actual.getValidatedCombination(housing, keycaps, fixtures.candidates),
  };
});
vi.mock("@/components/product-gallery", async () => {
  const { createElement } = await import("react");
  return {
    ProductGallery: ({ initialAngle, onAngleChange }: ProductGalleryProps) => {
      const rotate = () => onAngleChange?.(150);
      return (
        <div data-angle={initialAngle} data-testid="personal-gallery">
          {createElement("img", {
            alt: "Personal showcase fixture",
            height: 1536,
            src: "/personal.webp",
            width: 1024,
          })}
          <button onClick={rotate} type="button">
            Rotate showcase
          </button>
        </div>
      );
    },
  };
});
vi.mock("@/components/product-spin", async () => {
  const { useId } = await import("react");
  return {
    ProductSpin: ({
      initialAngle,
      onAngleChange,
      onLoadStateChange,
      spin,
    }: {
      initialAngle: number;
      onAngleChange: (angle: number) => void;
      onLoadStateChange: (
        state: "loading" | "ready" | "partial" | "error"
      ) => void;
      spin: ProductGalleryProps["spin"];
    }) => {
      const instance = useId();
      const rotate = () => onAngleChange(210);
      const ready = () => onLoadStateChange("ready");
      const error = () => onLoadStateChange("error");
      const partial = () => onLoadStateChange("partial");
      const loading = () => onLoadStateChange("loading");
      return (
        <div
          data-angle={initialAngle}
          data-instance={instance}
          data-source={spin.basePath}
          data-testid="retail-spin"
        >
          <button onClick={rotate} type="button">
            Rotate retail
          </button>
          <button onClick={ready} type="button">
            Resolve render
          </button>
          <button onClick={partial} type="button">
            Partial render
          </button>
          <button onClick={error} type="button">
            Fail render
          </button>
          <button onClick={loading} type="button">
            Start render
          </button>
        </div>
      );
    },
  };
});

const props: ProductGalleryProps = {
  labels: {
    media: "Media",
    next: "Next",
    previous: "Previous",
    showImage: ["First"],
    spin: "Personal spin",
  },
  renders: [],
  spin: {
    basePath: "/personal",
    defaultFrame: 0,
    frameCount: 72,
    height: 1536,
    poster: "/personal.webp",
    width: 1024,
  },
};
const ko = JSON.parse(readFileSync("shared/i18n/ko.json", "utf8")) as typeof en;
const messages = { en, ja, ko };
type Locale = keyof typeof messages;
function ui(searchParams = "", locale: Locale = "en") {
  window.history.replaceState(
    null,
    "",
    `/products/rule60-hhkb-unibody${searchParams}`
  );
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={
        messages[locale] as unknown as ComponentProps<
          typeof NextIntlClientProvider
        >["messages"]
      }
      timeZone="UTC"
    >
      <ProductCustomizer {...props} />
    </NextIntlClientProvider>
  );
}

/** Real asynchronous jsdom session-history traversal, not a synthetic state rerender. */
async function traverse(direction: "back" | "forward") {
  await act(async () => {
    await new Promise<void>((resolve) => {
      window.addEventListener("popstate", () => resolve(), { once: true });
      window.history[direction]();
    });
  });
}

function candidate(
  housingId = "bone-white",
  keycapId = "retro-programmer-retail"
) {
  const id = `${housingId}--${keycapId}`;
  const angles = Array.from({ length: 12 }, (_, index) => index * 30);
  const review = {
    reviewedAt: "2026-10-31T00:00:00Z",
    reviewer: "component-fixture-only",
  };
  return {
    frames: angles.map((angleDegrees) => ({
      angleDegrees,
      height: 1536,
      sha256: "a".repeat(64),
      src: `/assets/products/rule60-hhkb-unibody/customization/v1/${id}/frame_${String(angleDegrees).padStart(3, "0")}.webp`,
      width: 1024,
    })),
    housingId,
    id,
    keycapId,
    kitQa: {
      ...review,
      keys: Array.from({ length: 60 }, (_, index) => ({
        passed: true,
        position: `key-${index}`,
      })),
      status: "60-of-60-passed",
    },
    kitQaStatus: "60-of-60-passed",
    materialCalibration: "approximate",
    renderer: "test-only",
    sourceDigest: "b".repeat(64),
    status: "validated",
    visualQa: { ...review, angles, status: "passed" },
  };
}
function housingRadio(id: string) {
  const input = document.querySelector<HTMLInputElement>(
    `input[name="housing"][value="${id}"]`
  );
  if (!input) {
    throw new Error(`Missing housing ${id}`);
  }
  return input;
}
function keycapRadio(id: string) {
  const input = document.querySelector<HTMLInputElement>(
    `input[name="keycaps"][value="${id}"]`
  );
  if (!input) {
    throw new Error(`Missing keycaps ${id}`);
  }
  return input;
}

beforeEach(() => {
  fixtures.candidates = [];
  fixtures.retry.mockClear();
});
afterEach(() => {
  cleanup();
});

describe("ProductCustomizer availability and selection", () => {
  it.each(["en", "ja", "ko"] as const)(
    "shows a personal, non-orderable showcase by default in %s",
    (locale) => {
      render(ui("", locale));
      const t = messages[locale].products.customization;
      expect(screen.getByTestId("personal-showcase-notice").textContent).toBe(
        t.showcaseNote
      );
      expect(
        screen
          .getByRole("button", { name: t.showcase })
          .getAttribute("aria-pressed")
      ).toBe("true");
      expect(screen.getByTestId("personal-gallery")).toBeTruthy();
      expect(screen.queryByTestId("customization-pending")).toBeNull();
      expect(screen.queryByRole("radio")).toBeNull();
    }
  );

  it.each(["en", "ja", "ko"] as const)(
    "renders seven housings, five complete retail sets, and honest pending text in %s",
    (locale) => {
      render(ui("?customize=true", locale));
      const t = messages[locale].products.customization;
      expect(screen.queryByTestId("personal-gallery")).toBeNull();
      expect(document.querySelectorAll("img, canvas")).toHaveLength(0);
      expect(screen.getByText(t.configurationNote)).toBeTruthy();
      expect(screen.getByText(t.pending)).toBeTruthy();
      expect(screen.getByText(t.pendingDetail)).toBeTruthy();
      expect(screen.getByText(t.kitQA)).toBeTruthy();
      expect(screen.getByText(t.approximation)).toBeTruthy();
      expect(
        within(screen.getByRole("group", { name: t.housing })).getAllByRole(
          "radio"
        )
      ).toHaveLength(7);
      expect(
        within(screen.getByRole("group", { name: t.keycaps })).getAllByRole(
          "radio"
        )
      ).toHaveLength(5);
      for (const housing of HOUSING_OPTIONS) {
        expect(
          screen.getByRole("radio", {
            name: (name) =>
              name.includes(t.housingNames[housing.id]) &&
              name.includes(housing.sku),
          })
        ).toBeTruthy();
      }
      for (const kit of KEYCAP_OPTIONS) {
        expect(
          screen.getByRole("radio", {
            name: (name) =>
              name.includes(kit.name) && name.includes(t.fullRetailSet),
          })
        ).toBeTruthy();
      }
      expect(housingRadio("bone-white").checked).toBe(true);
      expect(keycapRadio("retro-programmer-retail").checked).toBe(true);
    }
  );

  it.each(["en", "ja", "ko"] as const)(
    "synchronizes real Back and Forward URL, radios, labels and preview identity in %s",
    async (locale) => {
      fixtures.candidates = [
        candidate("ice-blue"),
        candidate("ice-blue", "nicepbt-bow-retail"),
      ];
      render(ui("", locale));
      const t = messages[locale].products.customization;
      fireEvent.click(screen.getByRole("button", { name: t.customize }));
      fireEvent.click(housingRadio("ice-blue"));
      const retro = screen.getByTestId("retail-spin");
      fireEvent.click(screen.getByRole("button", { name: "Rotate retail" }));
      fireEvent.click(keycapRadio("nicepbt-bow-retail"));
      const bow = screen.getByTestId("retail-spin");
      expect(new URLSearchParams(window.location.search).get("keycaps")).toBe(
        "nicepbt-bow-retail"
      );
      expect(keycapRadio("nicepbt-bow-retail").checked).toBe(true);
      expect(retro.isConnected).toBe(false);

      await traverse("back");
      expect(
        new URLSearchParams(window.location.search).get("keycaps")
      ).toBeNull();
      expect(new URLSearchParams(window.location.search).get("housing")).toBe(
        "ice-blue"
      );
      expect(keycapRadio("retro-programmer-retail").checked).toBe(true);
      expect(keycapRadio("nicepbt-bow-retail").checked).toBe(false);
      expect(
        keycapRadio("retro-programmer-retail")
          .closest("label")
          ?.getAttribute("data-selected")
      ).toBe("true");
      expect(
        keycapRadio("nicepbt-bow-retail")
          .closest("label")
          ?.getAttribute("data-selected")
      ).toBe("false");
      expect(screen.getByRole("heading").textContent).toBe(
        `${t.housingNames["ice-blue"]} × Retro Programmer (retail set)`
      );
      expect(
        screen.getByTestId("retail-spin").getAttribute("data-source")
      ).toContain("ice-blue--retro-programmer-retail");
      expect(screen.getByTestId("retail-spin").getAttribute("data-angle")).toBe(
        "210"
      );
      expect(bow.isConnected).toBe(false);

      const restoredRetro = screen.getByTestId("retail-spin");
      await traverse("back");
      expect(
        new URLSearchParams(window.location.search).get("housing")
      ).toBeNull();
      expect(housingRadio("bone-white").checked).toBe(true);
      expect(screen.getByTestId("customization-pending")).toBeTruthy();
      expect(screen.queryByTestId("retail-spin")).toBeNull();
      expect(restoredRetro.isConnected).toBe(false);

      await traverse("forward");
      expect(new URLSearchParams(window.location.search).get("housing")).toBe(
        "ice-blue"
      );
      expect(housingRadio("ice-blue").checked).toBe(true);
      expect(
        screen.getByTestId("retail-spin").getAttribute("data-source")
      ).toContain("ice-blue--retro-programmer-retail");
      await traverse("forward");
      expect(new URLSearchParams(window.location.search).get("keycaps")).toBe(
        "nicepbt-bow-retail"
      );
      expect(keycapRadio("nicepbt-bow-retail").checked).toBe(true);
      expect(
        keycapRadio("nicepbt-bow-retail")
          .closest("label")
          ?.getAttribute("data-selected")
      ).toBe("true");
      expect(screen.getByRole("heading").textContent).toBe(
        `${t.housingNames["ice-blue"]} × NicePBT BoW (retail set)`
      );
      expect(
        screen.getByTestId("retail-spin").getAttribute("data-source")
      ).toContain("ice-blue--nicepbt-bow-retail");
    }
  );

  it("does not add history entries for duplicate mode or option clicks", () => {
    render(ui("?customize=true"));
    const { length } = window.history;
    const url = window.location.href;
    fireEvent.click(
      screen.getByRole("button", { name: en.products.customization.customize })
    );
    fireEvent.click(housingRadio("bone-white"));
    fireEvent.click(keycapRadio("retro-programmer-retail"));
    expect(window.history.length).toBe(length);
    expect(window.location.href).toBe(url);
    fireEvent.click(housingRadio("ice-blue"));
    expect(window.history.length).toBe(length + 1);
    fireEvent.click(housingRadio("ice-blue"));
    expect(window.history.length).toBe(length + 1);
  });

  it("preserves unrelated query parameters and hash through selection and history traversal", async () => {
    render(ui("?customize=true&campaign=launch&tag=a&tag=b#render"));
    fireEvent.click(housingRadio("charcoal"));
    fireEvent.click(keycapRadio("nicepbt-bow-retail"));
    let params = new URLSearchParams(window.location.search);
    expect(params.get("campaign")).toBe("launch");
    expect(params.getAll("tag")).toEqual(["a", "b"]);
    expect(window.location.hash).toBe("#render");
    expect(window.location.pathname).toBe("/products/rule60-hhkb-unibody");
    await traverse("back");
    params = new URLSearchParams(window.location.search);
    expect(params.get("campaign")).toBe("launch");
    expect(params.getAll("tag")).toEqual(["a", "b"]);
    expect(params.get("housing")).toBe("charcoal");
    expect(params.get("keycaps")).toBeNull();
    expect(keycapRadio("retro-programmer-retail").checked).toBe(true);
    expect(window.location.hash).toBe("#render");
  });

  it("rejects invalid URL choices and removes the personal image when entering pending mode", async () => {
    render(ui("?housing=unknown&keycaps=personal-logo"));
    fireEvent.click(
      screen.getByRole("button", { name: en.products.customization.customize })
    );
    await waitFor(() =>
      expect(screen.getByTestId("customization-pending")).toBeTruthy()
    );
    expect(housingRadio("bone-white").checked).toBe(true);
    expect(keycapRadio("retro-programmer-retail").checked).toBe(true);
    expect(screen.queryByTestId("personal-gallery")).toBeNull();
    expect(document.querySelectorAll("img, canvas")).toHaveLength(0);
  });

  it("preserves angle while keyed validated combinations replace stale preview instances", async () => {
    fixtures.candidates = [candidate(), candidate("charcoal")];
    render(ui());
    fireEvent.click(screen.getByRole("button", { name: "Rotate showcase" }));
    fireEvent.click(
      screen.getByRole("button", { name: en.products.customization.customize })
    );
    const first = await screen.findByTestId("retail-spin");
    expect(first.getAttribute("data-angle")).toBe("150");
    fireEvent.click(screen.getByRole("button", { name: "Rotate retail" }));
    fireEvent.click(screen.getByRole("button", { name: "Resolve render" }));
    expect(screen.getByRole("status").textContent).toBe(
      en.products.customization.ready
    );
    fireEvent.click(housingRadio("charcoal"));
    await waitFor(() =>
      expect(
        screen.getByTestId("retail-spin").getAttribute("data-source")
      ).toContain("charcoal--")
    );
    const second = screen.getByTestId("retail-spin");
    expect(second.getAttribute("data-instance")).not.toBe(
      first.getAttribute("data-instance")
    );
    expect(first.isConnected).toBe(false);
    expect(second.getAttribute("data-angle")).toBe("210");
    expect(screen.getByRole("status").textContent).toBe(
      en.products.customization.loading
    );
    fireEvent.click(housingRadio("ice-blue"));
    await waitFor(() =>
      expect(screen.getByTestId("customization-pending")).toBeTruthy()
    );
    expect(screen.queryByTestId("retail-spin")).toBeNull();
    expect(second.isConnected).toBe(false);
    fireEvent.click(
      screen.getByRole("button", { name: en.products.customization.showcase })
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("personal-gallery").getAttribute("data-angle")
      ).toBe("210")
    );
  });

  it("announces loading and errors, retries without remounting, then announces readiness", () => {
    fixtures.candidates = [candidate()];
    render(ui("?customize=true"));
    expect(screen.getByRole("status").textContent).toBe(
      en.products.customization.loading
    );
    const before = screen.getByTestId("retail-spin");
    fireEvent.click(screen.getByRole("button", { name: "Rotate retail" }));
    fireEvent.click(screen.getByRole("button", { name: "Fail render" }));
    expect(screen.getByRole("status").textContent).toBe(
      en.products.customization.loadError
    );
    fireEvent.click(
      screen.getByRole("button", { name: en.products.customization.retry })
    );
    const after = screen.getByTestId("retail-spin");
    expect(after.getAttribute("data-instance")).toBe(
      before.getAttribute("data-instance")
    );
    expect(before.isConnected).toBe(true);
    expect(fixtures.retry).toHaveBeenCalledOnce();
    expect(after.getAttribute("data-angle")).toBe("210");
    expect(screen.getByRole("status").textContent).toBe(
      en.products.customization.loading
    );
    fireEvent.click(screen.getByRole("button", { name: "Start render" }));
    expect(screen.getByRole("status").textContent).toBe(
      en.products.customization.loading
    );
    fireEvent.click(screen.getByRole("button", { name: "Resolve render" }));
    expect(screen.getByRole("status").textContent).toBe(
      en.products.customization.ready
    );
    expect(
      screen.queryByRole("button", { name: en.products.customization.retry })
    ).toBeNull();
  });
  it.each(["en", "ja", "ko"] as const)(
    "announces partial availability and retries in-place in %s",
    (locale) => {
      fixtures.candidates = [candidate()];
      render(ui("?customize=true", locale));
      const t = messages[locale].products.customization;
      const preview = screen.getByTestId("retail-spin");
      fireEvent.click(screen.getByRole("button", { name: "Rotate retail" }));
      fireEvent.click(screen.getByRole("button", { name: "Partial render" }));
      expect(screen.getByRole("status").textContent).toBe(t.partial);
      expect(screen.getByRole("status").getAttribute("aria-live")).toBe(
        "polite"
      );
      fireEvent.click(screen.getByRole("button", { name: t.retry }));
      expect(fixtures.retry).toHaveBeenCalledOnce();
      expect(screen.getByTestId("retail-spin")).toBe(preview);
      expect(preview.isConnected).toBe(true);
      expect(preview.getAttribute("data-angle")).toBe("210");
      expect(screen.getByRole("status").textContent).toBe(t.loading);
      fireEvent.click(screen.getByRole("button", { name: "Resolve render" }));
      expect(screen.getByRole("status").textContent).toBe(t.ready);
      expect(screen.queryByRole("button", { name: t.retry })).toBeNull();
    }
  );
});
