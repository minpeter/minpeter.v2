// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, expect, it, vi } from "vitest";
import TmpfUI from "./tmpf";
import { downloadFile, uploadFile } from "./tmpf-api";

const messages = {
  showcase: {
    items: {
      tempfiles: {
        downloadAll: "모든 파일 다운로드",
        downloadFailed:
          "일부 파일을 다운로드하지 못했습니다. 연결을 확인하고 다시 시도해 주세요. 이미 받은 파일은 다시 다운로드될 수 있습니다.",
        downloading: "파일 다운로드 중…",
        folderLabel: "폴더",
        uploadButton: "업로드",
        uploadedLabel: "업로드 완료",
        uploading: "파일을 업로드하는 중…",
        uploadLabel: "파일 업로드",
      },
    },
  },
} as const;

vi.mock("./tmpf-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./tmpf-api")>()),
  downloadFile: vi.fn(),
  uploadFile: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it("waits for every download after a partial failure, prevents duplicates, and clears the error on retry", async () => {
  vi.mocked(uploadFile).mockResolvedValue({
    files: [{ fileName: "failed.txt" }, { fileName: "slow.txt" }],
    folderId: "folder",
  });
  const slow = Promise.withResolvers<void>();
  vi.mocked(downloadFile)
    .mockRejectedValueOnce(new Error("offline"))
    .mockReturnValueOnce(slow.promise)
    .mockResolvedValue(undefined);
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <TmpfUI />
    </NextIntlClientProvider>
  );
  fireEvent.change(screen.getByLabelText("파일 업로드"), {
    target: { files: [new File(["test"], "failed.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "업로드" }));
  const button = await screen.findByRole("button", {
    name: "모든 파일 다운로드",
  });
  fireEvent.click(button);
  await waitFor(() => expect(downloadFile).toHaveBeenCalledTimes(2));
  expect(button.hasAttribute("disabled")).toBe(true);
  expect(screen.getByRole("status").textContent).toBe("파일 다운로드 중…");
  fireEvent.click(button);
  expect(downloadFile).toHaveBeenCalledTimes(2);
  await act(async () => {
    slow.resolve();
    await slow.promise;
  });
  expect(screen.getByRole("alert").textContent).toContain(
    "일부 파일을 다운로드하지 못했습니다"
  );
  expect(button.hasAttribute("disabled")).toBe(false);
  fireEvent.click(button);
  await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
  expect(downloadFile).toHaveBeenCalledTimes(4);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
});
