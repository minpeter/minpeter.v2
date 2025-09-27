"use client";

import {
  CookieIcon,
  GitHubLogoIcon,
  InstagramLogoIcon,
  LinkedInLogoIcon,
} from "@radix-ui/react-icons";
import { CodeIcon, KeyboardIcon, ExternalLinkIcon } from "lucide-react";
import type { Route } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";

import Header from "@/components/header";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/tailwind";
import { useCurrentLocale, useI18n } from "@/locales/client";
import styles from "@/lib/styles/stagger-fade-in.module.css";
import mainImage1 from "@/public/assets/images/main-image-1.jpg";
import mainImage2 from "@/public/assets/images/main-image-2.png";
import mainImage3 from "@/public/assets/images/main-image-3.png";

const Lickitung = dynamic(() => import("@/components/Lickitung"));

export default function Page() {
  const t = useI18n();
  const locale = useCurrentLocale();

  return (
    <section className="flex flex-col gap-3">
      <Header
        description="written, coded, and designed by minpeter"
        title="minpeter 🇰🇷"
      />
      <div className={cn(styles.stagger_container, styles.slow)}>
        <div
          className={cn(
            styles.stagger_container,
            styles.slow,
            // 상위 레이아웃에 넓이 제한이 존재하기 때문에 여기서 넓이 제한은 의미없음
            "grid w-full grid-cols-1 gap-2 lg:grid-cols-2"
          )}
        >
          <Link
            href={`/${locale}/blog` as Route}
            className="lg:square flex h-40 flex-col justify-between rounded-xl bg-black/5 p-5 transition-colors duration-200 hover:bg-black/10 lg:h-auto dark:bg-white/5 dark:hover:bg-white/10"
          >
            <span className="text-lg font-medium">{t("blogTitle")}</span>
            <CookieIcon className="h-6 w-6" />
          </Link>

          <div className="grid grid-cols-2 gap-2">
            {[
              {
                href: "/typing",
                text: t("typingTitle"),
                icon: <KeyboardIcon className="h-4 w-4" />,
              },
              {
                href: "https://ip.minpeter.uk/",
                text: t("ipTitle"),
                icon: <CodeIcon className="h-4 w-4" />,
                external: true,
              },
            ].map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="relative flex aspect-square flex-col rounded-xl bg-black/5 p-3 transition-colors duration-200 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {item.icon}
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <ExternalLinkIcon className="h-3 w-3" />
                  </div>
                  <span className="mt-auto self-start text-sm">
                    {item.text}
                  </span>
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}` as Route}
                  className="relative flex aspect-square flex-col rounded-xl bg-black/5 p-3 transition-colors duration-200 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {item.icon}
                  </div>
                  <span className="mt-auto self-start text-sm">
                    {item.text}
                  </span>
                </Link>
              )
            )}

            <div className="gap-2">
              <CarouselImage />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  href: "https://github.com/minpeter",
                  icon: <GitHubLogoIcon className="h-4 w-4" />,
                },
                {
                  href: "https://instagram.com/minpeter2",
                  icon: <InstagramLogoIcon className="h-4 w-4" />,
                },
                {
                  href: "https://linkedin.com/in/minpeter/",
                  icon: <LinkedInLogoIcon className="h-4 w-4" />,
                },
              ].map((item) => (
                <a
                  aria-label={`social link to ${item.href}`}
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex aspect-square items-center justify-center rounded-xl bg-black/5 p-3 transition-colors duration-200 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="flex items-center gap-1.5">{item.icon}</div>
                </a>
              ))}

              <Link
                aria-label="Project Showcase Link"
                className="col-span-3"
                href={`/${locale}/show` as Route}
              >
                <Suspense
                  fallback={<Skeleton className="aspect-3/2 h-full w-full" />}
                >
                  <Lickitung aspect="3/2" />
                </Suspense>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CarouselImage() {
  const [grayscale, setGrayscale] = useState("grayscale(1)");

  return (
    <Carousel>
      <CarouselContent>
        {Array.from({ length: 3 }).map((_, index) => (
          <CarouselItem key={index}>
            <AspectRatio ratio={1}>
              <Image
                loading="lazy"
                placeholder="blur"
                className={cn(
                  "transition-filter h-full w-full cursor-pointer rounded-lg object-cover grayscale-[70%] duration-1000",
                  grayscale === "grayscale(0)" && "grayscale-0"
                )}
                width={300}
                height={300}
                src={[mainImage1, mainImage3, mainImage2][index]}
                alt={`Main image ${index + 1}`}
                onMouseEnter={() => setGrayscale("grayscale(0)")}
                onMouseLeave={() => setGrayscale("grayscale(70%)")}
                onTouchEnd={() => setGrayscale("grayscale(70%)")}
                onClick={() => {
                  const urls = [
                    "https://youtu.be/n_R0-YosZ3g?t=39",
                    null,
                    "/73e3da8fa7a397e7b1bc36efabb2cbb265524a75d7d5e6d1620b9e10e694257",
                  ];
                  if (urls[index]) window.open(urls[index]);
                }}
              />
            </AspectRatio>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
