import { Rss } from "lucide-react";

interface RssLinkProps {
  locale: string;
}

export function RssLink({ locale }: RssLinkProps) {
  return (
    <a
      className="inline-flex items-center gap-1.5 rounded text-gray-500 text-sm transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-gray-400 dark:hover:text-gray-200"
      href={`/${locale}/blog/rss.xml`}
      rel="noopener noreferrer"
      target="_blank"
      title="RSS Feed"
    >
      <Rss className="h-4 w-4" />
      <span>RSS</span>
    </a>
  );
}
