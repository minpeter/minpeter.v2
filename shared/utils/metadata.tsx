import type { Metadata } from "next";

import { getBaseUrl } from "@/shared/env";
import { siteConfig } from "@/shared/site-config";

export default function NewMetadata({
  title,
  description,
  image = "/og-image.png",
}: {
  title?: string;
  description?: string;
  image?: string;
}): Metadata {
  const baseUrl = getBaseUrl();

  return {
    description,
    formatDetection: {
      telephone: false,
    },
    keywords: siteConfig.keywords,
    metadataBase: new URL(baseUrl),

    openGraph: {
      description,
      images: image,
      locale: "ko_KR",
      siteName: siteConfig.title,
      title,
      type: "website",
    },

    title,
    twitter: {
      card: "summary_large_image",
      creator: "@minpeter",
      description,
      images: image,
      title,
    },
  };
}
