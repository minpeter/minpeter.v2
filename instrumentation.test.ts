import { describe, expect, it, vi } from "vitest";
import { onRequestError, register } from "./instrumentation";

describe("instrumentation", () => {
  it("exports register function", () => {
    expect(typeof register).toBe("function");
  });

  it("register is async and runs without throwing", async () => {
    await expect(register()).resolves.not.toThrow();
  });

  it("register logs initialization message", async () => {
    const consoleSpy = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);
    await register();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[instrumentation] Server initialized"
    );
    consoleSpy.mockRestore();
  });

  it("exports onRequestError function", () => {
    expect(typeof onRequestError).toBe("function");
  });

  it("onRequestError logs error info with context", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const mockErr = new Error("Test error");
    const mockRequest = new Request("http://localhost/blog");
    const mockContext = {
      routerKind: "App",
      routePath: "/blog",
      routeType: "render",
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
