import type { AxiosStatic } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { uploadFile } from "./tmpf";

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock(import("axios"), () => ({
  default: {
    create: () => ({
      get: vi.fn(),
      post: mockPost,
    }),
  } as unknown as AxiosStatic,
}));

function makeFile(name: string) {
  return new File(["dummy"], name, { type: "text/plain" });
}

describe("uploadFile response validation", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it("returns the payload when the response has a valid shape", async () => {
    const payload = {
      files: [{ fileName: "a.txt" }, { fileName: "b.txt" }],
      folderId: "abc123",
    };
    mockPost.mockResolvedValue({ data: payload });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toStrictEqual(
      payload
    );
  });

  it("returns null when files is not an array", async () => {
    mockPost.mockResolvedValue({
      data: { files: "not-an-array", folderId: "abc123" },
    });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });

  it("returns null when folderId is missing or not a string", async () => {
    mockPost.mockResolvedValue({ data: { files: [{ fileName: "a.txt" }] } });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();

    mockPost.mockResolvedValue({
      data: { files: [{ fileName: "a.txt" }], folderId: 42 },
    });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });

  it("returns null when a file entry lacks a string fileName", async () => {
    mockPost.mockResolvedValue({
      data: { files: [{ name: "a.txt" }], folderId: "abc123" },
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
