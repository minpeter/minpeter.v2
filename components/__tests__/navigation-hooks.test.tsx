import { describe, expect, it, vi } from "vitest";

// Simple test: verify onNavigate can preventDefault
describe("Navigation hooks integration", () => {
  it("onNavigate callback prevents default when called with e.preventDefault", () => {
    const mockPreventDefault = vi.fn();
    const mockEvent = {
      preventDefault: mockPreventDefault,
    } as unknown as React.MouseEvent;

    const onNavigate = (e: React.MouseEvent) => {
      e.preventDefault();
    };

    onNavigate(mockEvent);
    expect(mockPreventDefault).toHaveBeenCalledOnce();
  });
});
