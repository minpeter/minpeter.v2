import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductFirstFramePreload } from "./product-first-frame-preload";

const { preload } = vi.hoisted(() => ({ preload: vi.fn() }));
vi.mock("react-dom", () => ({ preload }));

afterEach(() => {
  vi.unstubAllGlobals();
  preload.mockClear();
});

describe("first-frame document hint", () => {
  it("preloads exactly the supplied versioned frame during HTML rendering", () => {
    vi.stubGlobal("window", undefined);
    expect(
      ProductFirstFramePreload({ source: "/frame_000.webp?v=verified" })
    ).toBeNull();
    expect(preload).toHaveBeenCalledExactlyOnceWith(
      "/frame_000.webp?v=verified",
      {
        as: "fetch",
        crossOrigin: "anonymous",
        fetchPriority: "high",
      }
    );
  });

  it("does not emit a new hint during hydration or client navigation", () => {
    vi.stubGlobal("window", {});
    expect(
      ProductFirstFramePreload({ source: "/frame_000.webp?v=verified" })
    ).toBeNull();
    expect(preload).not.toHaveBeenCalled();
  });
});
