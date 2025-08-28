import Header from "@/components/header";
import type { Route } from "next";
import Image from "next/image";

import SaaSComponentImage from "./saas-component.png";
import SaaSPageImage from "./saas-page.png";

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
              className="border-border rounded-lg border [box-shadow:0px_82px_105px_0px_#E3E2DF7A,0px_29.93px_38.33px_0px_#E3E2DF54,0px_14.53px_18.61px_0px_#E3E2DF44,0px_7.12px_9.12px_0px_#E3E2DF36,0px_2.82px_3.61px_0px_#E3E2DF26] [filter:drop-shadow(0_0_20px_rgba(59,130,246,0.34))_drop-shadow(0_0_40px_rgba(59,130,246,0.18))] dark:[box-shadow:0px_80px_60px_0px_rgba(0,0,0,0.35),0px_35px_28px_0px_rgba(0,0,0,0.25),0px_18px_15px_0px_rgba(0,0,0,0.20),0px_10px_8px_0px_rgba(0,0,0,0.17),0px_5px_4px_0px_rgba(0,0,0,0.14),0px_2px_2px_0px_rgba(0,0,0,0.10)] dark:[filter:drop-shadow(0_0_20px_rgba(96,165,250,0.30))_drop-shadow(0_0_40px_rgba(96,165,250,0.16))]"
            />

            {/* Overlay image pinned on top of the base image */}
            <Image
              src={SaaSComponentImage}
              alt="SaaS overlay"
              className="border-border pointer-events-none absolute top-[25%] left-[-5%] w-[78%] rounded-lg border"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
