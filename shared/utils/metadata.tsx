import type { Metadata } from "next";
import { getBaseUrl } from "@/shared/env";
import { siteConfig } from "@/shared/site-config";

export default function NewMetadata({
  title,
  description,
}: {
  title?: string;
  description?: string;
}): Metadata {
  const baseUrl = getBaseUrl();

  return {
    metadataBase: new URL(baseUrl),

    title,
    description,
    keywords: siteConfig.keywords,

    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: siteConfig.title,
      title,
      description,
      images: "/og-image.png",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@minpeter",
      images: "/og-image.png",
    },
    formatDetection: {
      telephone: false,
    },
  };
}
