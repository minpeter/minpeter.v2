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

const cache = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const frames = new Map<number, ImageBitmap>();
  const state = { version: 0 };
  const loader = {
    fetchedCount: 0,
    getSnapshot: () => state.version,
    getSource: vi.fn<(index: number) => Blob | undefined>(() => undefined),
    nearestFrame: vi.fn((target: number) => {
      let nearest: { index: number; bitmap: ImageBitmap } | null = null;
      let distance = Number.POSITIVE_INFINITY;
      for (const [index, bitmap] of frames) {
        const delta = Math.abs(target - index);
        const circular = Math.min(delta, 72 - delta);
        if (circular < distance) {
          nearest = { bitmap, index };
          distance = circular;
        }
      }
      return nearest;
    }),
    readyCount: 0,
    release: vi.fn(),
    requestFrame: vi.fn(),
    setActive: vi.fn(),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return { frames, listeners, loader, state };
});
vi.mock("@/shared/product-spin-loader", () => ({
  getSpinLoader: () => cache.loader,
}));

const spin = {
  basePath: "/assets/products/example/spin",
  defaultFrame: 0,
  frameCount: 72,
  height: 1536,
  poster: { height: 1536, src: "/poster.webp", width: 1024 },
  width: 1024,
};
const drawImage = vi.fn();
const context = { drawImage, globalCompositeOperation: "source-over" };

function mountSpin(active = true) {
  render(<ProductSpin alt="Reconstructed render" sizes="100vw" spin={spin} />);
  const slider = screen.getByRole("slider", { name: "Reconstructed render" });
  if (active) {
    fireEvent.focus(slider);
  }
  return slider;
}
function press(slider: HTMLElement, key: string, times = 1) {
  for (let step = 0; step < times; step += 1) {
    fireEvent.keyDown(slider, { key });
  }
}
function arrive(index: number) {
  const bitmap = {
    close: vi.fn(),
    height: 768,
    width: 512,
  } as unknown as ImageBitmap;
  act(() => {
    cache.frames.set(index, bitmap);
    cache.loader.readyCount = cache.frames.size;
    cache.loader.fetchedCount += 1;
    cache.state.version += 1;
    for (const listener of cache.listeners) {
      listener();
    }
  });
  return bitmap;
}

describe("ProductSpin progressive canvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache.frames.clear();
    cache.state.version = 0;
    cache.loader.readyCount = 0;
    cache.loader.fetchedCount = 0;
    drawImage.mockReset();
    cache.loader.getSource.mockReset();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D
    );
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
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retains one poster and one canvas instead of mounting frame images", () => {
    const slider = mountSpin();
    expect(slider.getAttribute("data-displayed-frame")).toBe("poster");
    expect(slider.querySelectorAll("img")).toHaveLength(1);
    expect(slider.querySelectorAll("canvas")).toHaveLength(1);
    expect(
      slider.querySelector("canvas")?.classList.contains("invisible")
    ).toBe(true);
    fireEvent.focus(slider);
    for (let index = 0; index < 72; index += 1) {
      arrive(index);
    }
    press(slider, "ArrowRight", 72);
    expect(slider.querySelectorAll("img")).toHaveLength(1);
    expect(slider.querySelectorAll("canvas")).toHaveLength(1);
    expect(slider.getAttribute("data-loaded-count")).toBe("72");
    expect(slider.getAttribute("data-ready-count")).toBe("72");
  });

  it("draws the nearest ready angle and refines without changing the requested angle", () => {
    const slider = mountSpin();
    const coarse = arrive(6);
    press(slider, "ArrowRight", 8);
    expect(cache.loader.nearestFrame).toHaveBeenLastCalledWith(8);
    expect(slider.getAttribute("data-frame")).toBe("8");
    expect(slider.getAttribute("data-displayed-frame")).toBe("6");
    expect(drawImage).toHaveBeenLastCalledWith(coarse, 0, 0, 1024, 1536);
    const medium = arrive(9);
    expect(slider.getAttribute("data-displayed-frame")).toBe("9");
    expect(drawImage).toHaveBeenLastCalledWith(medium, 0, 0, 1024, 1536);
    const fine = arrive(8);
    expect(slider.getAttribute("data-displayed-frame")).toBe("8");
    expect(slider.getAttribute("data-frame")).toBe("8");
    expect(drawImage).toHaveBeenLastCalledWith(fine, 0, 0, 1024, 1536);
    expect(context.globalCompositeOperation).toBe("copy");
  });

  it("compares late arrivals against the latest angle instead of blindly drawing them", () => {
    const slider = mountSpin();
    arrive(0);
    press(slider, "ArrowRight", 6);
    arrive(6);
    press(slider, "ArrowRight", 18);
    const current = arrive(24);
    arrive(7);
    expect(cache.loader.nearestFrame).toHaveBeenLastCalledWith(24);
    expect(slider.getAttribute("data-displayed-frame")).toBe("24");
    expect(drawImage).toHaveBeenLastCalledWith(current, 0, 0, 1024, 1536);
    expect(cache.loader.requestFrame).toHaveBeenLastCalledWith(
      expect.any(Symbol),
      24
    );
  });

  it("keeps the poster when drawing fails and retains a successfully painted frame on later failure", () => {
    const slider = mountSpin();
    drawImage.mockImplementationOnce(() => {
      throw new Error("Closed bitmap");
    });
    arrive(0);
    expect(slider.getAttribute("data-displayed-frame")).toBe("poster");
    expect(slider.querySelector("img")?.classList.contains("invisible")).toBe(
      false
    );
    arrive(6);
    expect(slider.getAttribute("data-displayed-frame")).toBe("0");
    drawImage.mockImplementationOnce(() => {
      throw new Error("Closed bitmap");
    });
    press(slider, "ArrowRight", 4);
    expect(slider.getAttribute("data-displayed-frame")).toBe("0");
    cache.frames.clear();
    press(slider, "ArrowRight", 1);
    expect(slider.getAttribute("data-displayed-frame")).toBe("0");
    expect(
      slider.querySelector("canvas")?.classList.contains("invisible")
    ).toBe(false);
  });

  it("keeps the poster if the browser cannot provide a canvas context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const slider = mountSpin();
    arrive(0);
    expect(drawImage).not.toHaveBeenCalled();
    expect(slider.getAttribute("data-displayed-frame")).toBe("poster");
  });

  it("wraps keyboard controls and chooses the circular nearest ready frame", () => {
    const slider = mountSpin();
    arrive(0);
    arrive(60);
    press(slider, "ArrowLeft");
    expect(slider.getAttribute("data-frame")).toBe("71");
    expect(slider.getAttribute("aria-valuetext")).toBe("355°");
    expect(slider.getAttribute("data-displayed-frame")).toBe("0");
    press(slider, "ArrowRight");
    expect(slider.getAttribute("data-frame")).toBe("0");
    expect(slider.getAttribute("aria-valuetext")).toBe("0°");
  });

  it("tracks viewport activity and only releases the shared consumer on unmount", () => {
    let intersect: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersect = callback;
        }
        observe = observe;
        disconnect = disconnect;
      }
    );
    const slider = mountSpin(false);
    expect(observe).toHaveBeenCalledWith(slider);
    expect(cache.loader.setActive).toHaveBeenLastCalledWith(
      expect.any(Symbol),
      false
    );
    act(() => {
      intersect?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });
    expect(cache.loader.setActive).toHaveBeenLastCalledWith(
      expect.any(Symbol),
      true
    );
    act(() => {
      intersect?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });
    expect(cache.loader.setActive).toHaveBeenLastCalledWith(
      expect.any(Symbol),
      false
    );
    fireEvent.focus(slider);
    expect(cache.loader.setActive).toHaveBeenLastCalledWith(
      expect.any(Symbol),
      true
    );
    arrive(0);
    expect(drawImage).toHaveBeenCalledOnce();
    act(() => {
      intersect?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });
    arrive(6);
    expect(drawImage).toHaveBeenCalledOnce();
    expect(cache.loader.setActive).toHaveBeenLastCalledWith(
      expect.any(Symbol),
      false
    );
    expect(cache.loader.release).not.toHaveBeenCalled();
    const token = cache.loader.setActive.mock.calls.at(-1)?.[0];
    cleanup();
    expect(cache.loader.release).toHaveBeenLastCalledWith(token);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(cache.listeners.size).toBe(0);
  });
  it("does not draw offscreen cache updates until activated", () => {
    const slider = mountSpin(false);
    const bitmap = arrive(0);
    arrive(6);
    expect(drawImage).not.toHaveBeenCalled();
    expect(cache.loader.requestFrame).not.toHaveBeenCalled();
    expect(slider.getAttribute("data-displayed-frame")).toBe("poster");
    fireEvent.focus(slider);
    expect(drawImage).toHaveBeenCalledOnce();
    expect(drawImage).toHaveBeenLastCalledWith(bitmap, 0, 0, 1024, 1536);
    expect(slider.getAttribute("data-displayed-frame")).toBe("0");
  });

  it("does not repaint the same bitmap when unrelated cache versions arrive", () => {
    const slider = mountSpin();
    arrive(0);
    expect(drawImage).toHaveBeenCalledOnce();
    arrive(24);
    arrive(30);
    expect(drawImage).toHaveBeenCalledOnce();
    press(slider, "ArrowRight");
    expect(drawImage).toHaveBeenCalledOnce();
    arrive(1);
    expect(drawImage).toHaveBeenCalledTimes(2);
    expect(slider.getAttribute("data-displayed-frame")).toBe("1");
    arrive(36);
    expect(drawImage).toHaveBeenCalledTimes(2);
  });

  it("refines an idle frame at full resolution and closes the temporary bitmap", async () => {
    vi.useFakeTimers();
    const source = new Blob(["frame"]);
    cache.loader.getSource.mockReturnValue(source);
    const full = {
      close: vi.fn(),
      height: 1536,
      width: 1024,
    } as unknown as ImageBitmap;
    const decode = vi.fn().mockResolvedValue(full);
    vi.stubGlobal("createImageBitmap", decode);
    const slider = mountSpin();
    arrive(0);
    expect(slider.getAttribute("data-resolution")).toBe("preview");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(199);
    });
    expect(decode).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(decode).toHaveBeenCalledExactlyOnceWith(source);
    expect(drawImage).toHaveBeenLastCalledWith(full, 0, 0, 1024, 1536);
    expect(full.close).toHaveBeenCalledOnce();
    expect(slider.getAttribute("data-resolution")).toBe("full");
    const paints = drawImage.mock.calls.length;
    arrive(24);
    expect(drawImage).toHaveBeenCalledTimes(paints);
  });

  it("closes a stale idle decode without replacing the newer angle", async () => {
    vi.useFakeTimers();
    cache.loader.getSource.mockReturnValue(new Blob(["frame"]));
    const pending = Promise.withResolvers<ImageBitmap>();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => pending.promise)
    );
    const slider = mountSpin();
    arrive(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    press(slider, "ArrowRight", 6);
    const latest = arrive(6);
    const paints = drawImage.mock.calls.length;
    const stale = {
      close: vi.fn(),
      height: 1536,
      width: 1024,
    } as unknown as ImageBitmap;
    await act(async () => {
      pending.resolve(stale);
      await pending.promise;
    });
    expect(stale.close).toHaveBeenCalledOnce();
    expect(drawImage).toHaveBeenCalledTimes(paints);
    expect(drawImage).toHaveBeenLastCalledWith(latest, 0, 0, 1024, 1536);
    expect(slider.getAttribute("data-displayed-frame")).toBe("6");
    expect(slider.getAttribute("data-resolution")).toBe("preview");
  });

  it("allows only one pending full-resolution decode and then refines the latest angle", async () => {
    vi.useFakeTimers();
    cache.loader.getSource.mockReturnValue(new Blob(["frame"]));
    const pending = Promise.withResolvers<ImageBitmap>();
    const latestFull = {
      close: vi.fn(),
      height: 1536,
      width: 1024,
    } as unknown as ImageBitmap;
    const decode = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(latestFull);
    vi.stubGlobal("createImageBitmap", decode);
    const slider = mountSpin();
    arrive(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    press(slider, "ArrowRight", 6);
    arrive(6);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(decode).toHaveBeenCalledOnce();
    const obsolete = {
      close: vi.fn(),
      height: 1536,
      width: 1024,
    } as unknown as ImageBitmap;
    await act(async () => {
      pending.resolve(obsolete);
      await pending.promise;
    });
    expect(obsolete.close).toHaveBeenCalledOnce();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(decode).toHaveBeenCalledTimes(2);
    expect(drawImage).toHaveBeenLastCalledWith(latestFull, 0, 0, 1024, 1536);
    expect(latestFull.close).toHaveBeenCalledOnce();
    expect(slider.getAttribute("data-displayed-frame")).toBe("6");
    expect(slider.getAttribute("data-resolution")).toBe("full");
  });

  it("retains the preview when idle full-resolution decoding fails", async () => {
    vi.useFakeTimers();
    cache.loader.getSource.mockReturnValue(new Blob(["frame"]));
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockRejectedValue(new Error("Decode failed"))
    );
    const slider = mountSpin();
    const preview = arrive(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(drawImage).toHaveBeenCalledOnce();
    expect(drawImage).toHaveBeenLastCalledWith(preview, 0, 0, 1024, 1536);
    expect(slider.getAttribute("data-resolution")).toBe("preview");
    expect(slider.getAttribute("data-displayed-frame")).toBe("0");
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
