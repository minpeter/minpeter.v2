import { Rss } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { cn } from "@/shared/utils/tailwind";

interface RssLinkProps {
  locale: string;
}

export async function RssLink({ locale }: RssLinkProps) {
  const t = await getTranslations();

  return (
    <a
      className={cn(
        "fieldnotes-rss",
        "flex items-center gap-1 rounded-md px-2 py-1 text-sm",
        "text-muted-foreground hover:bg-secondary hover:text-primary",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      href={`/${locale}/blog/rss.xml`}
      rel="noopener noreferrer"
      target="_blank"
      title={t("common.rssFeed")}
    >
      <Rss className="h-3.5 w-3.5" />
      <span>RSS</span>
    </a>
  );
}
