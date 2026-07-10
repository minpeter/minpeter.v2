import { describe, expect, it, vi } from "vitest";

vi.mock("fumadocs-core/search/server", () => ({
  createFromSource: vi.fn(() => ({
    GET: vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ results: [] }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        })
      )
    ),
  })),
}));

vi.mock("@/shared/source", () => ({
  blog: {
    getPages: vi.fn(() => []),
  },
}));

describe("Search API Route", () => {
  it("should export GET handler", async () => {
    const { GET } = await import("./route");

    expect(GET).toBeDefined();
    expect(typeof GET).toBe("function");
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
