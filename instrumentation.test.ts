import { describe, expect, it, vi } from "vitest";

import { onRequestError, register } from "./instrumentation";

describe("instrumentation", () => {
  it("register logs initialization message", () => {
    const consoleSpy = vi.spyOn(console, "info").mockReturnValue();
    register();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[instrumentation] Server initialized"
    );
    consoleSpy.mockRestore();
  });

  it("onRequestError logs error info with context", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockReturnValue();
    const mockErr = new Error("Test error");
    const mockRequest = new Request("http://localhost/blog");
    const mockContext = {
      routePath: "/blog",
      routeType: "render",
      routerKind: "App",
    };

    await onRequestError(mockErr, mockRequest, mockContext);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[instrumentation]"),
      expect.objectContaining({
        message: "Test error",
        path: "/blog",
        routeType: "render",
      })
    );
    consoleSpy.mockRestore();
  });
});
