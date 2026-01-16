import { Rss } from "lucide-react";

import { cn } from "@/shared/utils/tailwind";

interface RssLinkProps {
  locale: string;
}

export function RssLink({ locale }: RssLinkProps) {
  return (
    <a
      className={cn(
        "flex items-center gap-1 rounded-md px-2 py-1 text-sm",
        "text-gray-500 hover:bg-secondary hover:text-primary",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      href={`/${locale}/blog/rss.xml`}
      rel="noopener noreferrer"
      target="_blank"
      title="RSS Feed"
    >
      <Rss className="h-3.5 w-3.5" />
      <span>RSS</span>
    </a>
  );
}
