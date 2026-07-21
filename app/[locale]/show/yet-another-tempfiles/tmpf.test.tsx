import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      post: mockPost,
      get: vi.fn(),
    }),
  },
}));

import { uploadFile } from "./tmpf";

function makeFile(name: string) {
  return new File(["dummy"], name, { type: "text/plain" });
}

describe("uploadFile response validation", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it("returns the payload when the response has a valid shape", async () => {
    const payload = {
      folderId: "abc123",
      files: [{ fileName: "a.txt" }, { fileName: "b.txt" }],
    };
    mockPost.mockResolvedValue({ data: payload });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toEqual(payload);
  });

  it("returns null when files is not an array", async () => {
    mockPost.mockResolvedValue({
      data: { folderId: "abc123", files: "not-an-array" },
    });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });

  it("returns null when folderId is missing or not a string", async () => {
    mockPost.mockResolvedValue({ data: { files: [{ fileName: "a.txt" }] } });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();

    mockPost.mockResolvedValue({
      data: { folderId: 42, files: [{ fileName: "a.txt" }] },
    });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });

  it("returns null when a file entry lacks a string fileName", async () => {
    mockPost.mockResolvedValue({
      data: { folderId: "abc123", files: [{ name: "a.txt" }] },
    });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });

  it("returns null when the payload is null or a non-object", async () => {
    mockPost.mockResolvedValue({ data: null });
    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();

    mockPost.mockResolvedValue({ data: "ok" });
    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });

  it("returns null when the request fails", async () => {
    mockPost.mockRejectedValue(new Error("network down"));

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });
});
