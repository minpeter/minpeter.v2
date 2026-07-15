import type { Route } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import NewMetadata from "@/shared/utils/metadata";

import SaaSComponentImage from "./saas-component.png";
import SaaSPageImage from "./saas-page.png";

export const metadata = NewMetadata({
  description: "A perspective study in layered product interfaces.",
  title: "minpeter | unstructured 0828",
});

export default async function Page(
  props: PageProps<"/[locale]/show/unstructured-0828">
) {
  const [{ locale }, t] = await Promise.all([props.params, getTranslations()]);
  return (
    <section className="showcase-page max-w-4xl">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        className="mx-auto w-full max-w-lg"
        description="A perspective study built from layered product interfaces."
        href={`/${locale}/show` as Route}
        kicker="Perspective study"
        title="Unstructured 0828"
      />

      <div className="relative z-10 flex min-h-[340px] w-full max-w-full items-center justify-center overflow-hidden rounded-lg border border-foreground/10 bg-secondary/20 sm:min-h-[430px] md:min-h-[520px] lg:min-h-[560px] xl:min-h-[700px] 2xl:min-h-[820px]">
        <div className="origin-center scale-[0.55] sm:scale-[0.72] md:scale-[0.82] lg:scale-[0.7] xl:scale-100 2xl:scale-[1.25]">
          <div className="[transform:perspective(4101px)_rotateX(40deg)_rotateY(5deg)_rotateZ(55deg)]">
            <div className="relative inline-block [transform:scaleX(-1)_scaleY(-1)_rotate(90deg)]">
              <Image
                alt="SaaS"
                className="rounded-lg border border-border"
                src={SaaSPageImage}
              />

              <Link
                className="group"
                href="https://friendli.ai/suite/~/serverless-endpoints/LGAI-EXAONE/EXAONE-4.0.1-32B/overview"
                target="_blank"
              >
                <Image
                  alt="SaaS overlay"
                  className="absolute top-[25%] left-[-5%] w-[78%] cursor-pointer rounded-lg border-2 border-neutral-200 transition duration-300 ease-out group-hover:brightness-105"
                  src={SaaSComponentImage}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-3 w-full max-w-lg text-[0.6875rem] text-muted-foreground leading-relaxed">
        Select the floating panel to open the referenced model page.
      </p>
    </section>
  );
}
