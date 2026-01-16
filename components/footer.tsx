import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Link from "next/link";
import purplePikmin from "@/public/purple-pikmin-carrying-fruit.webp";
import { cn } from "@/shared/utils/tailwind";

import { ModeToggle } from "./theme-toggle";

export default function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        className,
        "mt-10 flex items-center justify-between gap-1 border-t px-4 py-1"
      )}
    >
      <Image
        alt="Purple Pikmin carrying fruit "
        height={32}
        src={purplePikmin}
        width={32}
      />
      <p className="text-gray-400 text-sm">
        written by{" "}
        <Link
          className="rounded-md px-0.5 text-gray-400 text-sm underline hover:bg-secondary/100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/about"
        >
          minpeter
          <ArrowTopRightIcon className="mb-1 ml-0.5 inline h-3 w-3" />
        </Link>
        {" • "}
        <a
          className="rounded-md px-0.5 text-gray-400 text-sm underline hover:bg-secondary/100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="https://github.com/minpeter/minpeter.uk"
          rel="noopener noreferrer"
          target="_blank"
        >
          source code
          <ArrowTopRightIcon className="mb-1 ml-0.5 inline h-3 w-3" />
        </a>
      </p>
      <ModeToggle />
    </footer>
  );
}
