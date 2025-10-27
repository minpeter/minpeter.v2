import { ArrowTopLeftIcon } from "@radix-ui/react-icons";
import type { Route } from "next";
import Link from "next/link";

export function Backlink({
  text = "plz input text props",
  href,
}: {
  text: string;
  href: Route;
}) {
  return (
    <Link
      className="animation:enter w-fit rounded-md px-0.5 text-gray-400 text-sm underline hover:bg-secondary/100"
      href={href}
    >
      <ArrowTopLeftIcon className="mr-0.5 mb-1 inline h-3 w-3" />
      {text}
    </Link>
  );
}
