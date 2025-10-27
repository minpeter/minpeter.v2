import type { Metadata } from "next";

export default function NewMetadata({
  title,
  description,
}: {
  title?: string;
  description?: string;
}): Metadata {
  const LOCAL_PORT_FALLBACK = 3000;

  const baseUrl = (() => {
    if (process.env.PUBLIC_BASE_URL) {
      return process.env.PUBLIC_BASE_URL;
    }

    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }

    const port = process.env.PORT ?? LOCAL_PORT_FALLBACK;
    return `http://localhost:${port}`;
  })();

  return {
    metadataBase: new URL(baseUrl),

    title,
    description,
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
