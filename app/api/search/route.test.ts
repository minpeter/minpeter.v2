import { describe, expect, it, vi } from "vitest";

// @ts-expect-error -- the test only needs the search route's GET handler.
vi.mock(import("fumadocs-core/search/server"), () => ({
  createFromSource: vi.fn(() => ({
    GET: vi.fn(() =>
      Promise.resolve(
        Response.json(
          { results: [] },
          {
            headers: { "Content-Type": "application/json" },
            status: 200,
          }
        )
      )
    ),
  })),
}));

// @ts-expect-error -- the test only needs the loader's getPages method.
vi.mock(import("@/shared/source"), () => ({
  blog: {
    getPages: vi.fn(() => []),
  },
}));

describe("Search API Route", () => {
  it("should export GET handler", async () => {
    const { GET } = await import("./route");

    expect(GET).toBeDefined();
    expect(GET).toBeTypeOf("function");
  });

  it("should call createFromSource with correct arguments", async () => {
    const { createFromSource } = await import("fumadocs-core/search/server");
    const { blog } = await import("@/shared/source");

    await import("./route");

    expect(createFromSource).toHaveBeenCalled();
    expect(createFromSource).toHaveBeenCalledWith(blog, {
      localeMap: {
        en: "english",
        ja: "english",
        ko: "english",
      },
    });
  });

  it("GET handler should be callable", async () => {
    const { GET } = await import("./route");

    const request = new Request("http://localhost:3000/api/search?q=test");
    const response = await GET(request);

    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });
});
