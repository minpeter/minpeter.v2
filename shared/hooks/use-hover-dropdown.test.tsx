// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useHoverDropdown } from "./use-hover-dropdown";

const noop = () => null;

describe("desktop dropdown interactions", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string): MediaQueryList => ({
        addEventListener: noop,
        addListener: noop,
        dispatchEvent: () => true,
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: noop,
        removeListener: noop,
      }),
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
  });

  it("opens from the dropdown trigger on desktop", () => {
    const { result } = renderHook(() => useHoverDropdown());

    act(() => result.current.handleOpenChange(true));

    expect(result.current.isOpen).toBeTruthy();
  });
});
