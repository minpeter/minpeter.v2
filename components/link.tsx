
import Link from "next/link";
import type { Route } from "next";
import { ArrowTopLeftIcon } from "@radix-ui/react-icons";

export function Backlink({
  text = "plz input text props",
  href,
}: {
  text: string;
  href: Route;
}) {
  return (
    <Link
      className="hover:bg-secondary/100 animation:enter w-fit rounded-md px-0.5 text-sm text-gray-400 underline"
      href={href}
    >
      <ArrowTopLeftIcon className="mr-0.5 mb-1 inline h-3 w-3" />
      {text}
    </Link>
  );
}
