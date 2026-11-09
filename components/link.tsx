import { ArrowTopLeftIcon } from "@radix-ui/react-icons";

import { Link } from "@/shared/i18n/navigation";

export function Backlink({
  text,
  href,
  ariaLabel,
  onNavigate,
  prefetch,
}: {
  text: string;
  /** Locale-agnostic pathname; the locale prefix is applied by next-intl. */
  href: string;
  ariaLabel?: string;
  onNavigate?: (e: React.MouseEvent) => void;
  /** Forwarded to next-intl Link (Next.js Partial Prefetching). */
  prefetch?: boolean | null;
}) {
  const resolvedAriaLabel =
    text.trim().length === 0 ? (ariaLabel ?? "Back") : undefined;

  return (
    <Link
      aria-label={resolvedAriaLabel}
      className="tap-target animation:enter text-muted-foreground hover:bg-secondary/100 focus-visible:ring-ring inline-block w-fit rounded-md px-0.5 text-sm underline focus-visible:ring-2 focus-visible:outline-none"
      href={href}
      onClick={onNavigate}
      prefetch={prefetch}
    >
      <ArrowTopLeftIcon className="mr-0.5 mb-1 inline h-3 w-3" />
      {text}
    </Link>
  );
}
