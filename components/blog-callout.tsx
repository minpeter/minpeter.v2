import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/utils/tailwind";

type BlogCalloutType = "error" | "idea" | "info" | "success" | "tip" | "warn";

interface BlogCalloutProps extends Omit<ComponentProps<"div">, "title"> {
  title?: ReactNode;
  type?: BlogCalloutType;
}

const MARKERS: Record<BlogCalloutType, string> = {
  error: "×",
  idea: "✦",
  info: "i",
  success: "✓",
  tip: "i",
  warn: "!",
};

export function BlogCallout({
  children,
  className,
  title,
  type = "info",
  ...props
}: BlogCalloutProps) {
  return (
    <div
      className={cn("blog-callout", className)}
      data-callout-type={type}
      role="note"
      {...props}
    >
      <span aria-hidden="true" className="blog-callout-marker">
        {MARKERS[type]}
      </span>
      <div className="blog-callout-content">
        {title ? <p className="blog-callout-title">{title}</p> : null}
        {children ? (
          <div className="blog-callout-description">{children}</div>
        ) : null}
      </div>
    </div>
  );
}

export function BlogRelatedLink({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={cn("blog-related-link", className)} {...props}>
      <span aria-hidden="true" className="blog-related-link-marker">
        ↗
      </span>
      <div className="blog-related-link-content">{children}</div>
    </div>
  );
}
