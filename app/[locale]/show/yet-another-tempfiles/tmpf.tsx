"use client";

import { DownloadIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import axios from "axios";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { codeVariants } from "@/components/ui/typography";

const TMPF_API_BASE = "https://api.tmpf.me";
// const TMPF_API_BASE = "http://localhost:5001";

const API_SUFFIX = {
  UPLOAD: "/upload",
  DOWNLOAD(folderId: string, fileName: string) {
    return `/dl/${folderId}/${fileName}`;
  },
  VIEW(folderId: string, fileName: string) {
    return `/view/${folderId}/${fileName}`;
  },
};

function BACKEND(suffix: string) {
  return `${TMPF_API_BASE}${suffix}`;
}

const axiosInstance = axios.create({
  baseURL: TMPF_API_BASE,
});

export async function downloadFile(folderId: string, fileName: string) {
  await axiosInstance
    .get(API_SUFFIX.DOWNLOAD(folderId, fileName), { responseType: "blob" })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch((error) => error);

  return;
}

type UploadResponse = {
  folderId: string;
  files: Array<{
    fileName: string;
  }>;
};

export async function uploadFile(file: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  for (const f of file) {
    formData.append("file", f);
  }

  return await axiosInstance
    .post<UploadResponse>(API_SUFFIX.UPLOAD, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => response.data)
    .catch((error) => error);
}

export default function TmpfUI() {
  const [file, setFile] = useState<File[] | null>(null);
  const [uploaded, setUploaded] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (file) {
      setLoading(true);
      const response = await uploadFile(file);
      setUploaded(response);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="grid w-full max-w-md items-center gap-1.5">
        <Label htmlFor="uploadfiles">Upload Files</Label>
        <div className="flex w-full max-w-md items-center space-x-2">
          <Input
            id="uploadfiles"
            multiple={true}
            onChange={handleFileChange}
            type="file"
          />
          <Button onClick={handleUpload}>Upload</Button>
        </div>
      </div>

      {loading && <p>Uploading...</p>}
      {uploaded && (
        <>
          <div className="flex flex-row items-center space-x-4">
            <p>
              Folder <code className={codeVariants()}>{uploaded.folderId}</code>{" "}
              uploaded
            </p>
            <Button
              onClick={async () => {
                for (const item of uploaded.files) {
                  // eslint-disable-next-line no-await-in-loop
                  await downloadFile(uploaded.folderId, item.fileName);
                }
              }}
            >
              <DownloadIcon className="h-4 w-4" />
            </Button>
          </div>

          <ul>
            {uploaded.files.map((f) => (
              <li key={f.fileName}>
                <a
                  className="flex items-center space-x-2 hover:underline"
                  href={BACKEND(API_SUFFIX.VIEW(uploaded.folderId, f.fileName))}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  <span>{f.fileName}</span>
                  <EyeOpenIcon className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
