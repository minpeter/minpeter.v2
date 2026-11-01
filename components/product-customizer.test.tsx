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

const KEYCAP_CHIPS: Record<string, string> = {
  inventor: "Inventor",
  "nicepbt-bow-retail": "NicePBT BoW",
  "nicepbt-noel-latin-retail": "Noel",
  "nicepbt-purple-chonkers-retail": "Purple Chonkers",
  "pbtfans-wob-retail": "PBTfans WoB",
  "retro-programmer-retail": "Retro Programmer",
};

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
vi.mock("@/components/product-spin", async () => {
  const { createElement, useId } = await import("react");
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
      const rotatePersonal = () => onAngleChange(150);
      if (
        spin.basePath === "/personal" ||
        spin.basePath ===
          "/assets/products/maru60/assembled/v1/transparent--inventor"
      ) {
        return (
          <div
            data-angle={initialAngle}
            data-frame-count={spin.frameCount}
            data-instance={instance}
            data-testid="personal-spin"
          >
            {createElement("img", {
              alt: "Personal turntable poster fixture",
              height: 1536,
              src: "/personal.webp",
              width: 1024,
            })}
            <canvas height={1536} width={1024} />
            <button onClick={rotatePersonal} type="button">
              Rotate showcase
            </button>
          </div>
        );
      }

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
    showImage: ["First", "Second", "Third", "Fourth", "Fifth"],
    spin: "Personal spin",
  },
  renders: Array.from({ length: 4 }, (_, index) => ({
    alt: `Unused CAD fixture ${index + 1}`,
    image: { height: 800, src: `/cad-${index}.webp`, width: 1200 },
  })),
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
function ui(searchParams = "", locale: Locale = "en", gallery = props) {
  window.history.replaceState(null, "", `/products/maru60${searchParams}`);
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
      <ProductCustomizer {...gallery} />
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
  return {
    frames: angles.map((angleDegrees) => ({
      angleDegrees,
      height: 1536,
      sha256: "a".repeat(64),
      src: `/assets/products/maru60/assembled/v1/${id}/frame_${String(angleDegrees).padStart(3, "0")}.webp`,
      width: 1024,
    })),
    housingId,
    id,
    keycapId,
    orderable: false,
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
    "uses the assembled personal twelve-frame fixture without retail classification in %s",
    (locale) => {
      const basePath =
        "/assets/products/maru60/assembled/v1/transparent--inventor";
      const frameSources = Array.from(
        { length: 12 },
        (_, index) =>
          `${basePath}/frame_${String(index * 30).padStart(3, "0")}.webp?v=${"a".repeat(64)}`
      );
      const gallery: ProductGalleryProps = {
        ...props,
        spin: {
          ...props.spin,
          basePath,
          frameCount: 12,
          frameSources,
          geometryRevision: "assembled-draft",
          poster: frameSources[0],
        },
      };
      render(ui("", locale, gallery));
      const root = screen.getByTestId("product-customizer");
      expect(root.getAttribute("data-configuration")).toBe("personal");
      expect(root.getAttribute("data-orderable")).toBe("false");
      expect(root.getAttribute("data-geometry-revision")).toBe(
        "assembled-draft"
      );
      expect(
        screen.getByTestId("personal-spin").getAttribute("data-frame-count")
      ).toBe("12");
      expect(screen.queryByTestId("retail-spin")).toBeNull();
      expect(housingRadio("transparent").checked).toBe(true);
      expect(keycapRadio("inventor").checked).toBe(true);
      const details = screen.getByTestId(
        "customization-details"
      ) as HTMLDetailsElement;
      expect(details.open).toBe(false);
      expect(
        details.contains(
          screen.getByText(
            messages[locale].products.customization.geometryAssembled
          )
        )
      ).toBe(true);
      expect(
        screen.queryByText(
          messages[locale].products.customization.geometryPrevious
        )
      ).toBeNull();
      expect(screen.queryByTestId("personal-showcase-notice")).toBeNull();
    }
  );

  it.each(["en", "ja", "ko"] as const)(
    "labels geometry inside collapsed details and remounts changed frame bytes in %s",
    (locale) => {
      const previous = candidate();
      fixtures.candidates = [previous];
      const query = "?housing=bone-white&keycaps=retro-programmer-retail";
      const view = render(ui(query, locale));
      const labels = messages[locale].products.customization;
      const details = screen.getByTestId(
        "customization-details"
      ) as HTMLDetailsElement;
      expect(details.open).toBe(false);
      expect(details.contains(screen.getByText(labels.geometryAssembled))).toBe(
        true
      );
      expect(
        screen
          .getByTestId("product-customizer")
          .getAttribute("data-geometry-revision")
      ).toBe("assembled-draft");
      const original = screen.getByTestId("retail-spin");
      const assembled = {
        ...previous,
        frames: previous.frames.map((frame) => ({
          ...frame,
          sha256: "c".repeat(64),
        })),
      };
      fixtures.candidates = [assembled];
      view.rerender(ui(query, locale));
      expect(original.isConnected).toBe(false);
      expect(details.contains(screen.getByText(labels.geometryAssembled))).toBe(
        true
      );
      expect(screen.queryByText(labels.geometryPrevious)).toBeNull();
      expect(
        screen
          .getByTestId("product-customizer")
          .getAttribute("data-geometry-revision")
      ).toBe("assembled-draft");
      expect(
        document
          .querySelector(".store-custom-preview")
          ?.getAttribute("data-geometry-revision")
      ).toBe("assembled-draft");
      const before = screen.getByTestId("retail-spin");
      fixtures.candidates = [
        {
          ...assembled,
          frames: assembled.frames.map((frame) => ({
            ...frame,
            sha256: "d".repeat(64),
          })),
        },
      ];
      view.rerender(ui(query, locale));
      expect(before.isConnected).toBe(false);
      expect(
        screen.getByTestId("product-customizer").getAttribute("data-orderable")
      ).toBe("false");
      expect(screen.queryByTestId("personal-showcase-notice")).toBeNull();
    }
  );
  it.each(["en", "ja", "ko"] as const)(
    "shows a personal, non-orderable showcase by default in %s",
    (locale) => {
      render(ui("", locale));
      const t = messages[locale].products.customization;
      expect(screen.queryByTestId("personal-showcase-notice")).toBeNull();
      expect(screen.queryByText(t.showcaseNote)).toBeNull();
      expect(screen.queryByRole("button", { name: t.showcase })).toBeNull();
      expect(screen.queryByRole("button", { name: t.customize })).toBeNull();
      expect(
        screen.getByTestId("product-customizer").getAttribute("data-orderable")
      ).toBe("false");
      expect(housingRadio("transparent").checked).toBe(true);
      expect(keycapRadio("inventor").checked).toBe(true);
      const personal = screen.getByTestId("personal-spin");
      expect(personal.getAttribute("data-frame-count")).toBe("72");
      expect(personal.querySelectorAll("canvas")).toHaveLength(1);
      expect(
        document.querySelectorAll(
          ".store-media-arrow, .store-media-dot, .store-media-dots, .store-media-render"
        )
      ).toHaveLength(0);
      expect(
        screen.queryByRole("button", { name: props.labels.next })
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: props.labels.previous })
      ).toBeNull();
      for (const label of props.labels.showImage) {
        expect(screen.queryByRole("button", { name: label })).toBeNull();
      }
      for (const cad of props.renders) {
        expect(screen.queryByAltText(cad.alt)).toBeNull();
      }
      expect(screen.queryByTestId("customization-pending")).toBeNull();
      expect(screen.getAllByRole("radio")).toHaveLength(14);
    }
  );

  it.each(["en", "ja", "ko"] as const)(
    "renders unified eight housings, six keycap choices, and honest pending text in %s",
    (locale) => {
      render(ui("?customize=true", locale));
      const t = messages[locale].products.customization;
      expect(screen.queryByTestId("personal-spin")).toBeNull();
      expect(
        document.querySelectorAll(
          ".store-media-stage img, .store-media-stage canvas"
        )
      ).toHaveLength(0);
      expect(screen.getByText(t.configurationNote)).toBeTruthy();
      expect(screen.getByText(t.pending)).toBeTruthy();
      expect(screen.getByText(t.pendingDetail)).toBeTruthy();
      expect(screen.getByText(t.kitQA)).toBeTruthy();
      expect(screen.getByText(t.approximation)).toBeTruthy();
      expect(
        within(
          screen.getByRole("group", {
            name: (name) => name.startsWith(t.housing),
          })
        ).getAllByRole("radio")
      ).toHaveLength(8);
      expect(
        within(screen.getByRole("group", { name: t.keycaps })).getAllByRole(
          "radio"
        )
      ).toHaveLength(6);
      for (const housing of HOUSING_OPTIONS) {
        expect(
          screen.getByRole("radio", {
            name: t.housingNames[housing.id],
          })
        ).toBeTruthy();
      }
      for (const kit of KEYCAP_OPTIONS) {
        expect(
          screen.getByRole("radio", {
            name: KEYCAP_CHIPS[kit.id],
          })
        ).toBeTruthy();
      }
      expect(housingRadio("bone-white").checked).toBe(true);
      expect(keycapRadio("retro-programmer-retail").checked).toBe(true);
    }
  );

  it.each(["en", "ja", "ko"] as const)(
    "keeps compact accessible options and moves material detail into a closed disclosure in %s",
    (locale) => {
      render(ui("?housing=bone-white&keycaps=nicepbt-bow-retail", locale));
      const t = messages[locale].products.customization;
      const details = screen.getByTestId(
        "customization-details"
      ) as HTMLDetailsElement;
      expect(details.tagName).toBe("DETAILS");
      expect(details.open).toBe(false);
      const summary = details.querySelector("summary");
      expect(summary?.textContent).toBe(t.detailsLabel);
      expect(summary).not.toBeNull();
      expect(details.contains(screen.getByText(t.configurationNote))).toBe(
        true
      );
      expect(details.contains(screen.getByText(t.approximation))).toBe(true);
      expect(details.textContent).toContain("PLA Matte · 11103");
      expect(details.textContent).toContain("NicePBT BoW (retail set)");
      expect(
        document
          .querySelector("h2.store-custom-selection")
          ?.classList.contains("sr-only")
      ).toBe(true);
      const group = screen.getByRole("group", {
        name: `${t.housing} ${t.housingNames["bone-white"]}`,
      });
      expect(
        group.querySelectorAll(".store-custom-selected-name")
      ).toHaveLength(1);
      expect(
        group.querySelector(".store-custom-selected-name")?.textContent
      ).toBe(t.housingNames["bone-white"]);
      for (const label of group.querySelectorAll("label")) {
        expect(label.textContent?.trim()).toBe("");
        expect(label.querySelectorAll("p, small, dl")).toHaveLength(0);
      }
      expect(
        screen.getByRole("radio", { name: t.housingNames.transparent })
      ).toBeTruthy();
      for (const [id, name] of Object.entries(KEYCAP_CHIPS)) {
        const radio = screen.getByRole("radio", { name });
        expect(radio.getAttribute("value")).toBe(id);
        const tile = radio.closest("label");
        expect(tile?.textContent?.trim()).toBe("");
        expect(tile?.getAttribute("title")).toBe(name);
        const thumbnail = tile?.querySelector("img");
        expect(thumbnail?.getAttribute("src")).toBe(
          `/assets/products/maru60/keycaps/v1/${id}.webp`
        );
        expect(thumbnail?.getAttribute("alt")).toBe("");
        expect(
          radio.closest("label")?.querySelectorAll("p, small, dl")
        ).toHaveLength(0);
      }
      // jsdom exercises native click disclosure; real Enter/Space behavior is covered by E2E.
      fireEvent.click(summary as HTMLElement);
      expect(details.open).toBe(true);
      fireEvent.click(summary as HTMLElement);
      expect(details.open).toBe(false);
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
      expect(new URLSearchParams(window.location.search).get("keycaps")).toBe(
        "retro-programmer-retail"
      );
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
      expect(housingRadio("transparent").checked).toBe(true);
      expect(keycapRadio("inventor").checked).toBe(true);
      expect(screen.getByTestId("personal-spin")).toBeTruthy();
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

  it("does not add history entries for duplicate option clicks", () => {
    render(ui("?customize=true"));
    const { length } = window.history;
    const url = window.location.href;

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
    expect(window.location.pathname).toBe("/products/maru60");
    await traverse("back");
    params = new URLSearchParams(window.location.search);
    expect(params.get("campaign")).toBe("launch");
    expect(params.getAll("tag")).toEqual(["a", "b"]);
    expect(params.get("housing")).toBe("charcoal");
    expect(params.get("keycaps")).toBe("retro-programmer-retail");
    expect(keycapRadio("retro-programmer-retail").checked).toBe(true);
    expect(window.location.hash).toBe("#render");
  });

  it("rejects unknown unflagged options to personal defaults and removes the original image on retail selection", () => {
    render(ui("?housing=unknown&keycaps=personal-logo"));
    expect(housingRadio("transparent").checked).toBe(true);
    expect(keycapRadio("inventor").checked).toBe(true);
    expect(screen.getByTestId("personal-spin")).toBeTruthy();
    fireEvent.click(housingRadio("bone-white"));
    expect(screen.getByTestId("customization-pending")).toBeTruthy();
    expect(housingRadio("bone-white").checked).toBe(true);
    expect(keycapRadio("retro-programmer-retail").checked).toBe(true);
    expect(screen.queryByTestId("personal-spin")).toBeNull();
    expect(
      document.querySelectorAll(
        ".store-media-stage img, .store-media-stage canvas"
      )
    ).toHaveLength(0);
    expect(screen.getByTestId("customization-pairing-notice")).toBeTruthy();
  });

  it("preserves angle while keyed validated combinations replace stale preview instances", async () => {
    fixtures.candidates = [candidate(), candidate("charcoal")];
    render(ui());
    fireEvent.click(screen.getByRole("button", { name: "Rotate showcase" }));
    fireEvent.click(housingRadio("bone-white"));
    const first = await screen.findByTestId("retail-spin");
    expect(first.getAttribute("data-angle")).toBe("150");
    fireEvent.click(screen.getByRole("button", { name: "Rotate retail" }));
    fireEvent.click(screen.getByRole("button", { name: "Resolve render" }));
    expect(
      within(
        document.querySelector(".store-custom-preview") as HTMLElement
      ).getByRole("status").textContent
    ).toBe(en.products.customization.ready);
    expect(
      document.querySelector(".store-custom-preview [role=status]")?.className
    ).toBe("sr-only");
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
    expect(
      within(
        document.querySelector(".store-custom-preview") as HTMLElement
      ).getByRole("status").textContent
    ).toBe(en.products.customization.loading);
    fireEvent.click(housingRadio("ice-blue"));
    await waitFor(() =>
      expect(screen.getByTestId("customization-pending")).toBeTruthy()
    );
    expect(screen.queryByTestId("retail-spin")).toBeNull();
    expect(second.isConnected).toBe(false);
    fireEvent.click(housingRadio("transparent"));
    await waitFor(() =>
      expect(
        screen.getByTestId("personal-spin").getAttribute("data-angle")
      ).toBe("210")
    );
  });

  it("announces loading and errors, retries without remounting, then announces readiness", () => {
    fixtures.candidates = [candidate()];
    render(ui("?customize=true"));
    expect(
      within(
        document.querySelector(".store-custom-preview") as HTMLElement
      ).getByRole("status").textContent
    ).toBe(en.products.customization.loading);
    const before = screen.getByTestId("retail-spin");
    fireEvent.click(screen.getByRole("button", { name: "Rotate retail" }));
    fireEvent.click(screen.getByRole("button", { name: "Fail render" }));
    expect(
      within(
        document.querySelector(".store-custom-preview") as HTMLElement
      ).getByRole("status").textContent
    ).toBe(en.products.customization.loadError);
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
    expect(
      within(
        document.querySelector(".store-custom-preview") as HTMLElement
      ).getByRole("status").textContent
    ).toBe(en.products.customization.loading);
    fireEvent.click(screen.getByRole("button", { name: "Start render" }));
    expect(
      within(
        document.querySelector(".store-custom-preview") as HTMLElement
      ).getByRole("status").textContent
    ).toBe(en.products.customization.loading);
    fireEvent.click(screen.getByRole("button", { name: "Resolve render" }));
    expect(
      within(
        document.querySelector(".store-custom-preview") as HTMLElement
      ).getByRole("status").textContent
    ).toBe(en.products.customization.ready);
    expect(
      document.querySelector(".store-custom-preview [role=status]")?.className
    ).toBe("sr-only");
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
      expect(
        within(
          document.querySelector(".store-custom-preview") as HTMLElement
        ).getByRole("status").textContent
      ).toBe(t.partial);
      expect(
        within(document.querySelector(".store-custom-preview") as HTMLElement)
          .getByRole("status")
          .getAttribute("aria-live")
      ).toBe("polite");
      fireEvent.click(screen.getByRole("button", { name: t.retry }));
      expect(fixtures.retry).toHaveBeenCalledOnce();
      expect(screen.getByTestId("retail-spin")).toBe(preview);
      expect(preview.isConnected).toBe(true);
      expect(preview.getAttribute("data-angle")).toBe("210");
      expect(
        within(
          document.querySelector(".store-custom-preview") as HTMLElement
        ).getByRole("status").textContent
      ).toBe(t.loading);
      fireEvent.click(screen.getByRole("button", { name: "Resolve render" }));
      expect(
        within(
          document.querySelector(".store-custom-preview") as HTMLElement
        ).getByRole("status").textContent
      ).toBe(t.ready);
      expect(screen.queryByRole("button", { name: t.retry })).toBeNull();
    }
  );
  it.each(["en", "ja", "ko"] as const)(
    "canonicalizes legacy personal and retail URLs without extra history in %s",
    (locale) => {
      const { length } = window.history;
      render(
        ui(
          "?customize=false&housing=charcoal&keycaps=nicepbt-bow-retail&campaign=launch#render",
          locale
        )
      );
      expect(housingRadio("transparent").checked).toBe(true);
      expect(keycapRadio("inventor").checked).toBe(true);
      expect(screen.getByTestId("personal-spin")).toBeTruthy();
      expect(window.history.length).toBe(length);
      let params = new URLSearchParams(window.location.search);
      expect(params.has("customize")).toBe(false);
      expect(params.get("housing")).toBe("transparent");
      expect(params.get("keycaps")).toBe("inventor");
      expect(params.get("campaign")).toBe("launch");
      expect(window.location.hash).toBe("#render");
      cleanup();
      render(ui("?customize=true&housing=unknown&keycaps=unknown", locale));
      params = new URLSearchParams(window.location.search);
      expect(params.has("customize")).toBe(false);
      expect(params.get("housing")).toBe("bone-white");
      expect(params.get("keycaps")).toBe("retro-programmer-retail");
      expect(screen.getByTestId("customization-pending")).toBeTruthy();
      expect(window.history.length).toBe(length);
    }
  );

  it.each(["en", "ja", "ko"] as const)(
    "keeps explicit cross-pair URLs unavailable and image-free in %s",
    (locale) => {
      for (const [housing, keycaps] of [
        ["transparent", "nicepbt-bow-retail"],
        ["charcoal", "inventor"],
      ]) {
        render(ui(`?housing=${housing}&keycaps=${keycaps}`, locale));
        expect(housingRadio(housing).checked).toBe(true);
        expect(keycapRadio(keycaps).checked).toBe(true);
        expect(screen.getByTestId("customization-unavailable")).toBeTruthy();
        expect(
          screen
            .getByTestId("product-customizer")
            .getAttribute("data-configuration")
        ).toBe("unsupported");
        expect(
          document.querySelectorAll(
            ".store-media-stage img, .store-media-stage canvas"
          )
        ).toHaveLength(0);
        expect(screen.queryByTestId("personal-spin")).toBeNull();
        cleanup();
      }
    }
  );

  it("pairs personal selectors atomically and restores the last retail counterpart", () => {
    render(ui("?housing=charcoal&keycaps=nicepbt-bow-retail"));
    fireEvent.click(keycapRadio("inventor"));
    expect(housingRadio("transparent").checked).toBe(true);
    expect(keycapRadio("inventor").checked).toBe(true);
    expect(screen.getByTestId("personal-spin")).toBeTruthy();
    expect(
      screen
        .getByTestId("customization-pairing-notice")
        .getAttribute("aria-live")
    ).toBe("polite");
    expect(screen.getByTestId("customization-pairing-notice").className).toBe(
      "sr-only"
    );
    fireEvent.click(housingRadio("ice-blue"));
    expect(housingRadio("ice-blue").checked).toBe(true);
    expect(keycapRadio("nicepbt-bow-retail").checked).toBe(true);
    fireEvent.click(housingRadio("transparent"));
    expect(keycapRadio("inventor").checked).toBe(true);
    fireEvent.click(keycapRadio("pbtfans-wob-retail"));
    expect(housingRadio("ice-blue").checked).toBe(true);
    expect(keycapRadio("pbtfans-wob-retail").checked).toBe(true);
    expect(screen.queryByTestId("personal-spin")).toBeNull();
  });
});
