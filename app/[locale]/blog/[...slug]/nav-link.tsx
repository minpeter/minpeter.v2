"use client";

import type { Route } from "next";
import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/tailwind";

export function NavLink({
  href,
  children,
  className,
}: {
  href: Route;
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useLinkStatus();
  return (
    <Link className={cn(className, pending && "opacity-50")} href={href}>
      {children}
      {pending && <span className="ml-1 opacity-60">...</span>}
    </Link>
  );
}
