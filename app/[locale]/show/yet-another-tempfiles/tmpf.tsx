"use client";

import {
  DownloadIcon,
  ExclamationTriangleIcon,
  EyeOpenIcon,
  FileTextIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UploadResponse } from "./tmpf-api";
import {
  API_SUFFIX,
  downloadFile,
  TMPF_API_BASE,
  uploadFile,
} from "./tmpf-api";

export default function TmpfUI() {
  const t = useTranslations("showcase.items.tempfiles");
  const [files, setFiles] = useState<File[] | null>(null);
  const [uploaded, setUploaded] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files ? [...e.target.files] : null);
  };

  const handleUpload = async () => {
    if (!(files && files.length > 0)) {
      return;
    }
    setError(null);
    setDownloadFailed(false);
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
    if (!uploaded || downloading) {
      return;
    }
    setDownloadFailed(false);
    setDownloading(true);
    try {
      const results = await Promise.allSettled(
        uploaded.files.map((item) =>
          downloadFile(uploaded.folderId, item.fileName)
        )
      );
      setDownloadFailed(results.some((result) => result.status === "rejected"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs" htmlFor="uploadfiles">
          {t("uploadLabel")}
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            className="h-10 min-w-0 bg-background text-sm shadow-none sm:flex-1"
            id="uploadfiles"
            multiple={true}
            onChange={handleFileChange}
            type="file"
          />
          <Button
            className="h-10 px-5"
            disabled={loading || downloading || !(files && files.length > 0)}
            onClick={handleUpload}
            type="button"
          >
            {t("uploadButton")}
          </Button>
        </div>
      </div>

      {error ? (
        <div
          className="flex items-start gap-2.5 text-muted-foreground text-xs leading-relaxed"
          role="alert"
        >
          <ExclamationTriangleIcon
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-destructive/75"
          />
          <span>{t("uploadFailed", { error })}</span>
        </div>
      ) : null}
      {loading ? (
        <div
          aria-live="polite"
          className="flex items-center gap-2 text-muted-foreground text-xs"
          role="status"
        >
          <ReloadIcon aria-hidden="true" className="size-3.5 animate-spin" />
          {t("uploading")}
        </div>
      ) : null}
      {uploaded && uploaded.files.length > 0 ? (
        <div className="border-foreground/10 border-t pt-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {t("folderLabel")}
              </p>
              <code className="block break-all font-mono text-xs">
                {uploaded.folderId}
              </code>
            </div>
            <span className="rounded-full border border-foreground/10 px-2 py-0.5 text-[10px] text-muted-foreground">
              {t("uploadedLabel")}
            </span>
          </div>

          <ul className="divide-y divide-foreground/10 border-foreground/10 border-y">
            {uploaded.files.map((f) => (
              <li key={f.fileName}>
                <a
                  className="group flex min-w-0 items-center gap-3 rounded-sm py-3 text-sm transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`${TMPF_API_BASE}${API_SUFFIX.VIEW(uploaded.folderId, f.fileName)}`}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  <FileTextIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1 break-all">{f.fileName}</span>
                  <EyeOpenIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  />
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-3">
            {downloadFailed ? (
              <div
                className="flex items-start gap-2.5 rounded-md bg-secondary/70 p-3 text-muted-foreground text-xs leading-relaxed"
                role="alert"
              >
                <ExclamationTriangleIcon
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-foreground/70"
                />
                <p>{t("downloadFailed")}</p>
              </div>
            ) : null}
            <Button
              aria-label={t("downloadAll")}
              className="h-10 w-full"
              disabled={downloading || loading}
              onClick={handleDownloadAll}
              type="button"
              variant="outline"
            >
              {downloading ? (
                <ReloadIcon
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <DownloadIcon aria-hidden="true" className="size-4" />
              )}
              {t("downloadAll")}
            </Button>
            {downloading ? (
              <p
                aria-live="polite"
                className="text-center text-muted-foreground text-xs"
                role="status"
              >
                {t("downloading")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
