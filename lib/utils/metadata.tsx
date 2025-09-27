import type { Metadata } from "next";

export default function NewMetadata({
  title,
  description,
}: {
  title?: string;
  description?: string;
}): Metadata {
  return {
    metadataBase: new URL(
      process.env.PUBLIC_BASE_URL
        ? process.env.PUBLIC_BASE_URL
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : `http://localhost:${process.env.PORT ?? 3_000}`
    ),

    title: title,
    description: description,
    keywords: [
      "minpeter",
      "blog",
      "development",
      "web",
      "frontend",
      "backend",
      "server",
      "cloud",
      "k8s",
    ],

    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: "minpeter",
      title: title,
      description: description,
      images: "/og-image.png",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      creator: "@minpeter",
      images: "/og-image.png",
    },
    formatDetection: {
      telephone: false,
    },
  };
}
