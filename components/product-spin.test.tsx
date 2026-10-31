// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductSpin } from "./product-spin";

vi.mock("next/image", async () => {
  const { createElement, forwardRef } = await import("react");
  const MockImage = forwardRef<HTMLImageElement, Record<string, unknown>>(
    (props, ref) => {
      const imageProps = { ...props };
      for (const name of ["fill", "priority", "unoptimized"]) {
        delete imageProps[name];
      }
      if (typeof imageProps.src === "object" && imageProps.src !== null) {
        imageProps.src = (imageProps.src as { src: string }).src;
      }
      return createElement("img", { ...imageProps, ref });
    }
  );
  return { default: MockImage };
});

const spin = {
  basePath: "/assets/products/example/spin",
  defaultFrame: 0,
  frameCount: 72,
  height: 1536,
  poster: { height: 1536, src: "/poster.webp", width: 1024 },
  width: 1024,
};

function mountSpin() {
  render(<ProductSpin alt="Reconstructed render" sizes="100vw" spin={spin} />);
  return screen.getByRole("slider", { name: "Reconstructed render" });
}

function frame(slider: HTMLElement, index: number) {
  const image = slider.querySelector<HTMLImageElement>(
    `img[data-index="${index}"]`
  );
  if (!image) {
    throw new Error(`Frame ${index} is not mounted`);
  }
  return image;
}

function pendingDecode(image: HTMLImageElement) {
  const deferred = Promise.withResolvers<void>();
  Object.defineProperty(image, "decode", {
    configurable: true,
    value: vi.fn(() => deferred.promise),
  });
  fireEvent.load(image);
  return {
    fail: async () => {
      await act(async () => {
        deferred.reject(new Error("Decode failed"));
        await Promise.resolve();
      });
    },
    finish: async () => {
      await act(async () => {
        deferred.resolve();
        await deferred.promise;
      });
    },
  };
}

function press(slider: HTMLElement, key: string, times = 1) {
  for (let step = 0; step < times; step += 1) {
    fireEvent.keyDown(slider, { key });
  }
}

function displayed(slider: HTMLElement) {
  return [
    slider.getAttribute("data-displayed-frame"),
    ...Array.from(slider.querySelectorAll("img"))
      .filter((image) => !image.classList.contains("invisible"))
      .map((image) => image.getAttribute("data-index") ?? "poster"),
  ];
}

describe("ProductSpin decode retention", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: true,
        removeEventListener: vi.fn(),
      }))
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("starts with only a poster and bounds retained frame elements to four", async () => {
    const slider = mountSpin();
    expect(slider.querySelectorAll("img[data-index]")).toHaveLength(0);
    expect(displayed(slider)).toEqual(["poster", "poster"]);
    fireEvent.focus(slider);
    expect(slider.querySelectorAll("img[data-index]")).toHaveLength(3);
    await pendingDecode(frame(slider, 0)).finish();
    for (let index = 1; index <= 72; index += 1) {
      press(slider, "ArrowRight");
      expect(
        slider.querySelectorAll("img[data-index]").length
      ).toBeLessThanOrEqual(4);
      expect(displayed(slider)).toEqual(["0", "0"]);
    }
  });

  it("wraps 0 to 71 to 0 without intermediate animation under reduced motion", () => {
    const slider = mountSpin();
    press(slider, "ArrowLeft");
    expect(slider.getAttribute("data-frame")).toBe("71");
    expect(slider.getAttribute("aria-valuetext")).toBe("355°");
    expect(frame(slider, 71).getAttribute("src")).toBe(
      `${spin.basePath}/72.webp`
    );
    press(slider, "ArrowRight");
    expect(slider.getAttribute("data-frame")).toBe("0");
    expect(slider.getAttribute("aria-valuetext")).toBe("0°");
  });

  it("promotes an already decoded mounted neighbor when selected", async () => {
    const slider = mountSpin();
    fireEvent.focus(slider);
    await pendingDecode(frame(slider, 0)).finish();
    await pendingDecode(frame(slider, 1)).finish();
    expect(displayed(slider)).toEqual(["0", "0"]);
    press(slider, "ArrowRight");
    expect(displayed(slider)).toEqual(["1", "1"]);
  });

  it("retains the last decoded frame until the requested image decodes", async () => {
    const slider = mountSpin();
    fireEvent.focus(slider);
    await pendingDecode(frame(slider, 0)).finish();
    press(slider, "ArrowRight", 4);
    const decode = pendingDecode(frame(slider, 4));
    expect(displayed(slider)).toEqual(["0", "0"]);
    await decode.finish();
    expect(displayed(slider)).toEqual(["4", "4"]);
    expect(slider.querySelector('img[data-index="0"]')).toBeNull();
  });

  it("ignores stale decodes even when the old target is still a mounted neighbor", async () => {
    const slider = mountSpin();
    fireEvent.focus(slider);
    await pendingDecode(frame(slider, 0)).finish();
    press(slider, "ArrowRight");
    const stale = pendingDecode(frame(slider, 1));
    press(slider, "ArrowRight");
    await pendingDecode(frame(slider, 2)).finish();
    await stale.finish();
    expect(displayed(slider)).toEqual(["2", "2"]);
  });

  it("ignores decode completion after an image was unmounted", async () => {
    const slider = mountSpin();
    fireEvent.focus(slider);
    const staleImage = frame(slider, 1);
    const stale = pendingDecode(staleImage);
    press(slider, "ArrowRight", 6);
    expect(staleImage.isConnected).toBe(false);
    await stale.finish();
    expect(displayed(slider)).toEqual(["poster", "poster"]);
    await pendingDecode(frame(slider, 6)).finish();
    expect(displayed(slider)).toEqual(["6", "6"]);
  });

  it("requires a fresh decode when returning to an unmounted historical frame", async () => {
    const slider = mountSpin();
    fireEvent.focus(slider);
    const original = frame(slider, 0);
    await pendingDecode(original).finish();
    press(slider, "ArrowRight", 4);
    await pendingDecode(frame(slider, 4)).finish();
    expect(original.isConnected).toBe(false);
    press(slider, "ArrowLeft", 4);
    expect(frame(slider, 0)).not.toBe(original);
    expect(displayed(slider)).toEqual(["4", "4"]);
    await pendingDecode(frame(slider, 0)).finish();
    expect(displayed(slider)).toEqual(["0", "0"]);
  });

  it("keeps the poster on initial decode failure and last decoded frame on later failure", async () => {
    const slider = mountSpin();
    fireEvent.focus(slider);
    await pendingDecode(frame(slider, 0)).fail();
    expect(displayed(slider)).toEqual(["poster", "poster"]);
    press(slider, "ArrowRight");
    await pendingDecode(frame(slider, 1)).finish();
    press(slider, "ArrowRight");
    await pendingDecode(frame(slider, 2)).fail();
    fireEvent.error(frame(slider, 2));
    expect(displayed(slider)).toEqual(["1", "1"]);
  });

  it("cancels an active animation when reduced motion is enabled live", () => {
    const listeners = new Set<() => void>();
    const media = {
      addEventListener: (_event: string, listener: () => void) =>
        listeners.add(listener),
      matches: false,
      removeEventListener: (_event: string, listener: () => void) =>
        listeners.delete(listener),
    };
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => media)
    );
    const callbacks = new Map<number, FrameRequestCallback>();
    let requestId = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      requestId += 1;
      callbacks.set(requestId, callback);
      return requestId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => callbacks.delete(id));

    const slider = mountSpin();
    press(slider, "ArrowRight", 8);
    expect(callbacks.size).toBe(1);
    act(() => {
      const entry = callbacks.entries().next().value;
      if (entry) {
        callbacks.delete(entry[0]);
        entry[1](20);
      }
    });
    expect(slider.getAttribute("data-frame")).toBe("1");
    expect(callbacks.size).toBe(1);
    act(() => {
      media.matches = true;
      for (const listener of listeners) {
        listener();
      }
    });
    expect(callbacks.size).toBe(0);
    expect(slider.getAttribute("data-frame")).toBe("1");
    press(slider, "ArrowLeft");
    expect(slider.getAttribute("data-frame")).toBe("7");
    expect(callbacks.size).toBe(0);
    cleanup();
    expect(listeners.size).toBe(0);
  });

  it("leaves vertical touch panning enabled and does not animate on reduced-motion hover", () => {
    const slider = mountSpin();
    expect(slider.classList.contains("touch-pan-y")).toBe(true);
    press(slider, "ArrowRight", 8);
    fireEvent.pointerEnter(slider, { clientX: 100, pointerType: "mouse" });
    fireEvent.pointerMove(slider, { clientX: 200, pointerType: "mouse" });
    fireEvent.pointerLeave(slider, { pointerType: "mouse" });
    expect(slider.getAttribute("data-frame")).toBe("8");
  });
});
