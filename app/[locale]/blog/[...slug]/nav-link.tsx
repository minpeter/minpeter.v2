"use client";

import type { Route } from "next";
import Link, { useLinkStatus } from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/utils/tailwind";

type NextLinkProps = ComponentProps<typeof Link>;

export function NavLink({
  href,
  children,
  className,
  transitionTypes,
  prefetch,
  ...rest
}: {
  href: Route;
  children: ReactNode;
  className?: string;
  transitionTypes?: string[];
  prefetch?: NextLinkProps["prefetch"];
} & Omit<
  NextLinkProps,
  "href" | "children" | "className" | "transitionTypes" | "prefetch"
>) {
  const { pending } = useLinkStatus();
  return (
    <Link
      className={cn(className, pending && "opacity-50")}
      href={href}
      prefetch={prefetch}
      transitionTypes={transitionTypes}
      {...rest}
    >
      {children}
      {pending ? <span className="ml-1 opacity-60">...</span> : null}
    </Link>
  );
}
