// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  API_SUFFIX,
  downloadFile,
  TMPF_API_BASE,
  type UploadResponse,
  uploadFile,
} from "./tmpf-api";

type DownloadBody = () => Promise<Blob>;

type DownloadRequest = (
  url: string,
  options: { readonly retry: 0; readonly timeout: false }
) => { readonly blob: DownloadBody };

type UploadBody = () => Promise<unknown>;

type UploadRequest = (
  url: string,
  options: {
    readonly body: FormData;
    readonly retry: 0;
    readonly timeout: false;
  }
) => { readonly json: UploadBody };

const { mockBlob, mockCreate, mockGet, mockJson, mockPost } = vi.hoisted(() => {
  const blob = vi.fn<DownloadBody>();
  const get = vi.fn<DownloadRequest>(() => ({ blob }));
  const json = vi.fn<UploadBody>();
  const post = vi.fn<UploadRequest>(() => ({ json }));
  const create = vi.fn(() => ({
    get,
    post,
  }));

  return {
    mockBlob: blob,
    mockCreate: create,
    mockGet: get,
    mockJson: json,
    mockPost: post,
  };
});

vi.mock("ky", () => ({
  default: {
    create: mockCreate,
  },
}));

const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(
  window.URL,
  "createObjectURL"
);
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(
  window.URL,
  "revokeObjectURL"
);

function makeFile(name: string) {
  return new File(["dummy"], name, { type: "text/plain" });
}

describe("uploadFile response validation", () => {
  beforeEach(() => {
    mockBlob.mockReset();
    mockGet.mockClear();
    mockJson.mockReset();
    mockPost.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();

    if (originalCreateObjectUrl) {
      Object.defineProperty(
        window.URL,
        "createObjectURL",
        originalCreateObjectUrl
      );
    } else {
      Reflect.deleteProperty(window.URL, "createObjectURL");
    }

    if (originalRevokeObjectUrl) {
      Object.defineProperty(
        window.URL,
        "revokeObjectURL",
        originalRevokeObjectUrl
      );
    } else {
      Reflect.deleteProperty(window.URL, "revokeObjectURL");
    }
  });

  it("returns the payload when the response has a valid shape", async () => {
    const payload = {
      files: [{ fileName: "a.txt" }, { fileName: "b.txt" }],
      folderId: "abc123",
    };
    mockJson.mockResolvedValue(payload);

    await expect(uploadFile([makeFile("a.txt")])).resolves.toStrictEqual(
      payload
    );
  });

  it("returns null when files is not an array", async () => {
    mockJson.mockResolvedValue({
      files: "not-an-array",
      folderId: "abc123",
    });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });

  it("returns null when folderId is missing or not a string", async () => {
    mockJson.mockResolvedValue({ files: [{ fileName: "a.txt" }] });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();

    mockJson.mockResolvedValue({
      files: [{ fileName: "a.txt" }],
      folderId: 42,
    });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });

  it("returns null when a file entry lacks a string fileName", async () => {
    mockJson.mockResolvedValue({
      files: [{ name: "a.txt" }],
      folderId: "abc123",
    });

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });

  it("returns null when the payload is null or a non-object", async () => {
    mockJson.mockResolvedValue(null);
    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();

    mockJson.mockResolvedValue("ok");
    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });

  it("returns null when the request fails", async () => {
    mockJson.mockRejectedValue(new Error("network down"));

    await expect(uploadFile([makeFile("a.txt")])).resolves.toBeNull();
  });

  it("posts every input file as browser-managed multipart data", async () => {
    const files = [makeFile("a.txt"), makeFile("b.txt")];
    const payload = {
      files: files.map((file) => ({ fileName: file.name })),
      folderId: "abc123",
    } satisfies UploadResponse;
    mockJson.mockResolvedValue(payload);

    await expect(uploadFile(files)).resolves.toStrictEqual(payload);

    expect(mockPost).toHaveBeenCalledOnce();
    const [call] = mockPost.mock.calls;
    if (!call) {
      throw new TypeError("Expected one upload request");
    }
    expect(mockCreate).toHaveBeenCalledWith({ baseUrl: TMPF_API_BASE });
    expect(call).toHaveLength(2);
    expect(call[0]).toBe(API_SUFFIX.UPLOAD);
    expect(call[1]).toMatchObject({ retry: 0, timeout: false });
    expect(call[1]).not.toHaveProperty("headers");
    expect([...call[1].body.entries()]).toStrictEqual(
      files.map((file) => ["file", file])
    );
  });

  it("downloads through a temporary anchor and cleans up synchronously", async () => {
    const sourceBlob = new Blob(["downloaded"], { type: "text/plain" });
    const createObjectUrl = vi.fn<(blob: Blob) => string>(
      () => "blob:tmpf-download"
    );
    const revokeObjectUrl = vi.fn<(url: string) => void>();
    Object.defineProperties(window.URL, {
      createObjectURL: {
        configurable: true,
        value: createObjectUrl,
      },
      revokeObjectURL: {
        configurable: true,
        value: revokeObjectUrl,
      },
    });
    const append = vi.spyOn(document.body, "append");
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const remove = vi.spyOn(Element.prototype, "remove");
    mockBlob.mockResolvedValue(sourceBlob);

    await expect(downloadFile("folder", "a.txt")).resolves.toBeUndefined();

    expect(mockGet).toHaveBeenCalledWith(
      API_SUFFIX.DOWNLOAD("folder", "a.txt"),
      { retry: 0, timeout: false }
    );
    const anchor = append.mock.calls[0]?.[0];
    if (!(anchor instanceof HTMLAnchorElement)) {
      throw new TypeError("Expected a temporary download anchor");
    }
    expect(anchor.href).toBe("blob:tmpf-download");
    expect(anchor.download).toBe("a.txt");
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:tmpf-download");
    expect(document.body.contains(anchor)).toBe(false);

    const wrappedBlob = createObjectUrl.mock.calls[0]?.[0];
    if (!(wrappedBlob instanceof Blob)) {
      throw new TypeError("Expected a wrapped download Blob");
    }
    expect(wrappedBlob).not.toBe(sourceBlob);
    expect(wrappedBlob.type).toBe("");
    await expect(wrappedBlob.text()).resolves.toBe("downloaded");

    const callOrder = [
      createObjectUrl.mock.invocationCallOrder[0],
      append.mock.invocationCallOrder[0],
      click.mock.invocationCallOrder[0],
      revokeObjectUrl.mock.invocationCallOrder[0],
      remove.mock.invocationCallOrder[0],
    ].filter((order): order is number => order !== undefined);
    expect(callOrder).toHaveLength(5);
    expect(callOrder).toStrictEqual([...callOrder].sort((a, b) => a - b));
  });

  it.each([
    {
      arrange(error: Error) {
        mockGet.mockImplementationOnce(() => {
          throw error;
        });
      },
      stage: "request",
    },
    {
      arrange(error: Error) {
        mockBlob.mockRejectedValueOnce(error);
      },
      stage: "blob body",
    },
  ])("propagates $stage failures", async ({ arrange }) => {
    const requestError = new Error("download unavailable");
    arrange(requestError);

    await expect(downloadFile("folder", "a.txt")).rejects.toBe(requestError);

    expect(mockGet).toHaveBeenCalledWith(
      API_SUFFIX.DOWNLOAD("folder", "a.txt"),
      { retry: 0, timeout: false }
    );
  });
});
