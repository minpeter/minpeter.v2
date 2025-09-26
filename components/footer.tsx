import { ModeToggle } from "./theme-toggle";
import Link from "next/link";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import purplePikmin from "@/public/purple-pikmin-carrying-fruit.webp";
import { cn } from "@/lib/utils";

export default function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        className,
        "mt-10 flex items-center justify-between gap-1 border-t px-4 py-1"
      )}
    >
      <Image
        src={purplePikmin}
        alt="Purple Pikmin carrying fruit "
        width={32}
        height={32}
      />
      <p className="text-sm text-gray-400">
        written by{" "}
        <Link
          className="hover:bg-secondary/100 rounded-md px-0.5 text-sm text-gray-400 underline"
          href="/about"
        >
          minpeter
          <ArrowTopRightIcon className="mb-1 ml-0.5 inline h-3 w-3" />
        </Link>
        {" • "}
        <a
          className="hover:bg-secondary/100 rounded-md px-0.5 text-sm text-gray-400 underline"
          href="https://github.com/minpeter/minpeter.uk"
          target="_blank"
          rel="noopener noreferrer"
        >
          source code
          <ArrowTopRightIcon className="mb-1 ml-0.5 inline h-3 w-3" />
        </a>
      </p>
      <ModeToggle />
    </footer>
  );
}
