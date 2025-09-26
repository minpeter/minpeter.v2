import Header from "@/components/header";
import type { Route } from "next";
import Image from "next/image";

import SaaSComponentImage from "./saas-component.png";
import SaaSPageImage from "./saas-page.png";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: "ko" | "en" }>;
}) {
  const { locale } = await params;
  return (
    <section className="flex flex-col gap-8">
      <Header
        title="/show/unstructured-0828"
        link={{ href: `/${locale}/show` as Route, text: "Back" }}
        description="unstructured 250828"
      />

      {/* Keep overlay pinned by stacking in a relative container */}
      <div className="relative z-10 mt-10 scale-100 sm:scale-100 md:mt-0 md:scale-[0.9] lg:scale-[0.7] xl:scale-100 2xl:scale-[1.35]">
        <div className="[transform:perspective(4101px)_rotateX(40deg)_rotateY(5deg)_rotateZ(55deg)]">
          {/* Apply flips/rotation to the container so both layers move together */}
          <div className="relative inline-block [transform:scaleX(-1)_scaleY(-1)_rotate(90deg)]">
            {/* Base image */}
            <Image
              src={SaaSPageImage}
              alt="SaaS"
              className="border-border rounded-lg border"
            />

            {/* Overlay image pinned on top of the base image */}
            <Link
              href="https://friendli.ai/suite/~/serverless-endpoints/LGAI-EXAONE/EXAONE-4.0.1-32B/overview"
              target="_blank"
            >
              <Image
                src={SaaSComponentImage}
                alt="SaaS overlay"
                className="absolute top-[25%] left-[-5%] w-[78%] cursor-pointer rounded-lg border-2 border-neutral-200 transition duration-300 ease-out group-hover:brightness-105"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
