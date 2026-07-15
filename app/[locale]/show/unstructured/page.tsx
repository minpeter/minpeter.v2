import type { Metadata, Route } from "next";
import { getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

import styles from "./styles.module.css";

export async function generateMetadata(
  props: PageProps<"/[locale]/show/unstructured">
): Promise<Metadata> {
  const { locale: routeLocale } = await props.params;
  const locale = resolveLocale(routeLocale);
  const t = await getTranslations({ locale });

  return createMetadata({
    description: t("showcase.items.unstructured.summary"),
    locale,
    path: "/show/unstructured",
    title: "minpeter | unstructured",
  });
}

export default async function Page(
  props: PageProps<"/[locale]/show/unstructured">
) {
  const [{ locale }, t] = await Promise.all([props.params, getTranslations()]);
  return (
    <section className="showcase-page">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description={t("showcase.items.unstructured.description")}
        href={`/${locale}/show` as Route}
        kicker={t("showcase.items.unstructured.kicker")}
        navigationLabel={t("showcase.detailNavigationLabel", {
          title: t("showcase.items.unstructured.title"),
        })}
        title={t("showcase.items.unstructured.title")}
      />

      <div className="space-y-10">
        <figure>
          <figcaption className="mb-3 flex items-center justify-between text-[0.6875rem] text-muted-foreground uppercase tracking-[0.08em]">
            <span>{t("showcase.items.unstructured.counterRotation")}</span>
            <span className="font-mono">01</span>
          </figcaption>
          <div className="h-48 w-full">
            <div
              aria-label={t("showcase.items.unstructured.counterRotationLabel")}
              className={cn(
                styles.demo,
                styles.stack,
                "relative h-full w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              role="img"
              tabIndex={0}
            >
              <div
                className={cn(
                  styles.stackBack,
                  "absolute inset-0 -rotate-1 transform rounded-md bg-neutral-600 transition-all duration-300"
                )}
              />
              <div
                className={cn(
                  styles.stackFront,
                  "absolute inset-0 rotate-1 transform rounded-md bg-neutral-500 p-8 transition-all duration-300"
                )}
              >
                <h2 className="font-medium text-2xl text-neutral-100 tracking-[-0.04em]">
                  {t("showcase.items.unstructured.hoverMe")}
                </h2>
              </div>
            </div>
          </div>
        </figure>

        <figure>
          <figcaption className="mb-3 flex items-center justify-between text-[0.6875rem] text-muted-foreground uppercase tracking-[0.08em]">
            <span>{t("showcase.items.unstructured.depthSeparation")}</span>
            <span className="font-mono">02</span>
          </figcaption>
          <div className="h-48 w-full [perspective:1500px]">
            <div
              aria-label={t("showcase.items.unstructured.depthSeparationLabel")}
              className={cn(
                styles.demo,
                styles.depth,
                "relative h-full w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              role="img"
              tabIndex={0}
            >
              <div
                className={cn(
                  styles.depthOne,
                  "absolute inset-0 flex transform items-center justify-center rounded-md bg-neutral-600 transition-all duration-500 ease-out"
                )}
              >
                <span className="font-medium text-2xl text-white tracking-[-0.04em] drop-shadow-md">
                  {t("showcase.items.unstructured.layer1")}
                </span>
              </div>
              <div
                className={cn(
                  styles.depthTwo,
                  "absolute inset-0 flex transform items-center justify-center rounded-md bg-neutral-500 transition-all duration-500 ease-out"
                )}
              >
                <span className="font-medium text-2xl text-white tracking-[-0.04em] drop-shadow-md">
                  {t("showcase.items.unstructured.layer2")}
                </span>
              </div>
              <div
                className={cn(
                  styles.depthThree,
                  "absolute inset-0 flex transform items-center justify-center rounded-md bg-neutral-400 transition-all duration-500 ease-out"
                )}
              >
                <span className="font-medium text-2xl text-white tracking-[-0.04em] drop-shadow-md">
                  {t("showcase.items.unstructured.layer3")}
                </span>
              </div>
            </div>
          </div>
        </figure>

        <figure>
          <figcaption className="mb-3 flex items-center justify-between text-[0.6875rem] text-muted-foreground uppercase tracking-[0.08em]">
            <span>{t("showcase.items.unstructured.sideView")}</span>
            <span className="font-mono">03</span>
          </figcaption>
          <div className="h-48 w-full [perspective:1500px]">
            <div
              aria-label={t("showcase.items.unstructured.sideViewLabel")}
              className={cn(
                styles.demo,
                styles.side,
                "relative h-full w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              role="img"
              tabIndex={0}
            >
              <div
                className={cn(
                  styles.sideFront,
                  "absolute inset-0 z-30 origin-left transform rounded-md bg-neutral-700 shadow-lg transition-all duration-700 ease-out"
                )}
              >
                <div className="flex h-full p-6">
                  <span className="font-medium text-2xl text-white tracking-[-0.04em] drop-shadow-md">
                    {t("showcase.items.unstructured.front")}
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  styles.sideMiddle,
                  "absolute inset-0 z-20 origin-left transform rounded-md bg-neutral-600 shadow-lg transition-all duration-700 ease-out"
                )}
              >
                <div className="flex h-full p-6">
                  <span
                    className={cn(
                      styles.copy,
                      "font-medium text-white text-xl opacity-0 tracking-[-0.04em] drop-shadow-md transition-opacity delay-100 duration-300"
                    )}
                  >
                    {t("showcase.items.unstructured.middle")}
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  styles.sideBack,
                  "absolute inset-x-4 inset-y-6 z-10 flex origin-left transform flex-row gap-6 rounded-md p-3 transition-all duration-700 ease-out"
                )}
              >
                <div className="flex h-full w-1/2 rounded-md bg-neutral-500 p-6">
                  <span
                    className={cn(
                      styles.copy,
                      "font-medium text-lg text-white opacity-0 tracking-[-0.04em] drop-shadow-md transition-opacity delay-200 duration-300"
                    )}
                  >
                    {t("showcase.items.unstructured.back1")}
                  </span>
                </div>
                <div className="flex h-full w-1/2 rounded-md bg-neutral-400 p-6">
                  <span
                    className={cn(
                      styles.copy,
                      "font-medium text-lg text-white opacity-0 tracking-[-0.04em] drop-shadow-md transition-opacity delay-300 duration-300"
                    )}
                  >
                    {t("showcase.items.unstructured.back2")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
