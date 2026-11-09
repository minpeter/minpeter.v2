import { Rss } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getLocalizedPath } from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

interface RssLinkProps {
  locale: string;
}

export async function RssLink({ locale }: RssLinkProps) {
  const t = await getTranslations();

  return (
    <a
      className={cn(
        "tap-target",
        "flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.6875rem] leading-[1.26]",
        "text-muted-foreground hover:bg-secondary hover:text-primary",
        "transition-colors duration-150",
        "focus-visible:ring-ring focus:outline-none focus-visible:ring-2"
      )}
      href={getLocalizedPath(locale, "/blog/rss.xml")}
      rel="noopener noreferrer"
      target="_blank"
      title={t("common.rssFeed")}
    >
      <Rss className="h-3.5 w-3.5" />
      <span>RSS</span>
    </a>
  );
}
