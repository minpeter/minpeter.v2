"use client";

import {
  DownloadIcon,
  ExclamationTriangleIcon,
  EyeOpenIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import axios from "axios";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { codeVariants } from "@/components/ui/typography";

const TMPF_API_BASE = "https://api.tmpf.me";

const API_SUFFIX = {
  DOWNLOAD(folderId: string, fileName: string) {
    return `/dl/${folderId}/${fileName}`;
  },
  UPLOAD: "/upload",
  VIEW(folderId: string, fileName: string) {
    return `/view/${folderId}/${fileName}`;
  },
};

const axiosInstance = axios.create({
  baseURL: TMPF_API_BASE,
});

async function downloadFile(folderId: string, fileName: string) {
  const response = await axiosInstance.get(
    API_SUFFIX.DOWNLOAD(folderId, fileName),
    { responseType: "blob" }
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;

  document.body.append(a);
  a.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

interface UploadResponse {
  files: {
    fileName: string;
  }[];
  folderId: string;
}

function isUploadResponse(value: unknown): value is UploadResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<UploadResponse>;
  return (
    typeof candidate.folderId === "string" &&
    Array.isArray(candidate.files) &&
    candidate.files.every(
      (file) =>
        typeof file === "object" &&
        file !== null &&
        typeof (file as { fileName?: unknown }).fileName === "string"
    )
  );
}

export async function uploadFile(file: File[]): Promise<UploadResponse | null> {
  const formData = new FormData();
  for (const f of file) {
    formData.append("file", f);
  }

  try {
    const response = await axiosInstance.post<UploadResponse>(
      API_SUFFIX.UPLOAD,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return isUploadResponse(response.data) ? response.data : null;
  } catch {
    return null;
  }
}

export default function TmpfUI() {
  const t = useTranslations("showcase.items.tempfiles");
  const [files, setFiles] = useState<File[] | null>(null);
  const [uploaded, setUploaded] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files ? [...e.target.files] : null);
  };

  const handleUpload = async () => {
    if (!(files && files.length > 0)) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await uploadFile(files);
      setUploaded(response);
      if (!response) {
        setError(t("connectionError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!uploaded) {
      return;
    }
    try {
      await Promise.all(
        uploaded.files.map((item) =>
          downloadFile(uploaded.folderId, item.fileName)
        )
      );
    } catch (downloadError) {
      console.error(downloadError);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="grid w-full max-w-md items-center gap-1.5">
        <Label htmlFor="uploadfiles">{t("uploadLabel")}</Label>
        <div className="flex w-full max-w-md flex-wrap items-center gap-2">
          <Input
            className="min-w-0 flex-1"
            id="uploadfiles"
            multiple={true}
            onChange={handleFileChange}
            type="file"
          />
          <Button
            disabled={loading || !(files && files.length > 0)}
            onClick={handleUpload}
            type="button"
          >
            {t("uploadButton")}
          </Button>
        </div>
      </div>

      {error ? (
        <div
          className="flex w-full max-w-md items-center gap-1.5 text-[0.6875rem] text-muted-foreground leading-relaxed"
          role="alert"
        >
          <ExclamationTriangleIcon
            aria-hidden="true"
            className="size-3 shrink-0 text-destructive/75"
          />
          <span>{t("uploadFailed", { error })}</span>
        </div>
      ) : null}
      {loading ? (
        <div
          aria-live="polite"
          className="flex w-full items-center gap-2 text-[0.75rem] text-muted-foreground"
          role="status"
        >
          <ReloadIcon aria-hidden="true" className="size-3.5 animate-spin" />
          {t("uploading")}
        </div>
      ) : null}
      {uploaded && uploaded.files.length > 0 ? (
        <>
          <div className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-2">
            <p className="min-w-0 max-w-full break-words">
              {t("folderLabel")}{" "}
              <code className={`${codeVariants()} break-all`}>
                {uploaded.folderId}
              </code>{" "}
              {t("uploadedLabel")}
            </p>
            <Button
              aria-label={t("downloadAll")}
              onClick={handleDownloadAll}
              type="button"
            >
              <DownloadIcon className="h-4 w-4" />
            </Button>
          </div>

          <ul className="w-full min-w-0 max-w-full">
            {uploaded.files.map((f) => (
              <li key={f.fileName}>
                <a
                  className="flex min-w-0 items-center gap-2 rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`${TMPF_API_BASE}${API_SUFFIX.VIEW(uploaded.folderId, f.fileName)}`}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  <span className="min-w-0 break-all">{f.fileName}</span>
                  <EyeOpenIcon className="h-4 w-4 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
