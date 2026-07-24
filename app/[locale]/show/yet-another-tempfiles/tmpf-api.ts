import axios from "axios";

export const TMPF_API_BASE = "https://api.tmpf.me";

export const API_SUFFIX = {
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

export async function downloadFile(folderId: string, fileName: string) {
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
  a.remove();
}

export interface UploadResponse {
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
    const response = await axiosInstance.post<unknown>(
      API_SUFFIX.UPLOAD,
      formData
    );
    return isUploadResponse(response.data) ? response.data : null;
  } catch {
    return null;
  }
}
