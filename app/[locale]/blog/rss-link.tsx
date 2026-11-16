import { Rss } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getLocalizedPath } from "@/shared/utils/metadata";

interface RssLinkProps {
  locale: string;
}

export async function RssLink({ locale }: RssLinkProps) {
  const t = await getTranslations();

  return (
    <a
      className="site-tool tap-target"
      href={getLocalizedPath(locale, "/blog/rss.xml")}
      rel="noopener noreferrer"
      target="_blank"
      title={t("common.rssFeed")}
    >
      <Rss className="h-3 w-3" />
      <span>RSS</span>
    </a>
  );
}
