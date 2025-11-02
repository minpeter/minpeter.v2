"use client";

import {
  CookieIcon,
  GitHubLogoIcon,
  InstagramLogoIcon,
  LinkedInLogoIcon,
} from "@radix-ui/react-icons";
import { CodeIcon, ExternalLinkIcon, KeyboardIcon } from "lucide-react";
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
import mainImage1 from "@/public/assets/images/main-image-1.jpg";
import mainImage2 from "@/public/assets/images/main-image-2.png";
import mainImage3 from "@/public/assets/images/main-image-3.png";
import { useCurrentLocale, useI18n } from "@/shared/i18n/client";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import { cn } from "@/shared/utils/tailwind";

const Lickitung = dynamic(() => import("@/components/lickitung"));

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
            className="lg:square flex h-40 flex-col justify-between rounded-xl bg-black/5 p-5 transition-colors duration-200 hover:bg-black/10 lg:h-auto dark:bg-white/5 dark:hover:bg-white/10"
            href={`/${locale}/blog` as Route}
          >
            <span className="font-medium text-lg">{t("blogTitle")}</span>
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
                  className="relative flex aspect-square flex-col rounded-xl bg-black/5 p-3 transition-colors duration-200 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                  href={item.href}
                  key={item.href}
                  rel="noreferrer noopener"
                  target="_blank"
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
                  className="relative flex aspect-square flex-col rounded-xl bg-black/5 p-3 transition-colors duration-200 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                  href={`/${locale}${item.href}` as Route}
                  key={item.href}
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
                  className="flex aspect-square items-center justify-center rounded-xl bg-black/5 p-3 transition-colors duration-200 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                  href={item.href}
                  key={item.href}
                  rel="noreferrer noopener"
                  target="_blank"
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
  const slides = [
    {
      id: "spotlight-video",
      image: mainImage1,
      url: "https://youtu.be/n_R0-YosZ3g?t=39",
    },
    {
      id: "spotlight-gallery",
      image: mainImage3,
      url: null,
    },
    {
      id: "spotlight-showcase",
      image: mainImage2,
      url: "/73e3da8fa7a397e7b1bc36efabb2cbb265524a75d7d5e6d1620b9e10e694257",
    },
  ];

  return (
    <Carousel>
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={slide.id}>
            <AspectRatio ratio={1}>
              <Image
                alt={`Main image ${index + 1}`}
                className={cn(
                  "h-full w-full cursor-pointer rounded-lg object-cover grayscale-[70%] transition-filter duration-1000",
                  grayscale === "grayscale(0)" && "grayscale-0"
                )}
                height={300}
                loading="lazy"
                onClick={() => {
                  if (slide.url) {
                    window.open(slide.url);
                  }
                }}
                onMouseEnter={() => setGrayscale("grayscale(0)")}
                onMouseLeave={() => setGrayscale("grayscale(70%)")}
                onTouchEnd={() => setGrayscale("grayscale(70%)")}
                placeholder="blur"
                src={slide.image}
                width={300}
              />
            </AspectRatio>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
