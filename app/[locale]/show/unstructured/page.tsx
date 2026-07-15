import type { Metadata, Route } from "next";
import { getTranslations } from "next-intl/server";

import Header from "@/components/header";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/show/unstructured">
): Promise<Metadata> {
  const { locale: routeLocale } = await props.params;
  const locale = resolveLocale(routeLocale);

  return createMetadata({
    description: "Experiments in layered motion and depth.",
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
    <section className="flex flex-col gap-8">
      <Header
        description="unstructured"
        link={{ href: `/${locale}/show` as Route, text: t("back") }}
        title="/show/unstructured"
      />

      <div className="h-48 w-full">
        <div
          className="unstructured-demo unstructured-demo--stack relative h-full w-full"
          role="presentation"
        >
          <div className="unstructured-layer unstructured-layer--stack-back absolute inset-0 -rotate-1 transform rounded-sm bg-neutral-600 transition-all duration-300" />
          <div className="unstructured-layer unstructured-layer--stack-front absolute inset-0 rotate-1 transform rounded-sm bg-neutral-500 p-8 transition-all duration-300">
            <h2 className="font-extrabold text-2xl text-neutral-200">
              Hover me
            </h2>
          </div>
        </div>
      </div>

      {/* Enhanced 3D layered animated card with twisting effect */}
      <div className="h-48 w-full [perspective:1500px]">
        <div
          className="unstructured-demo unstructured-demo--depth relative h-full w-full"
          role="presentation"
        >
          <div className="unstructured-layer unstructured-layer--depth-one absolute inset-0 flex transform items-center justify-center rounded-sm bg-neutral-600 transition-all duration-500 ease-out">
            <span className="font-extrabold text-2xl text-white drop-shadow-md">
              Layer 1
            </span>
          </div>
          <div className="unstructured-layer unstructured-layer--depth-two absolute inset-0 flex transform items-center justify-center rounded-sm bg-neutral-500 transition-all duration-500 ease-out">
            <span className="font-extrabold text-2xl text-white drop-shadow-md">
              Layer 2
            </span>
          </div>
          <div className="unstructured-layer unstructured-layer--depth-three absolute inset-0 flex transform items-center justify-center rounded-sm bg-neutral-400 transition-all duration-500 ease-out">
            <span className="font-extrabold text-2xl text-white drop-shadow-md">
              Layer 3
            </span>
          </div>
        </div>
      </div>

      {/* Side-view transition with layer separation effect */}
      <div className="h-48 w-full [perspective:1500px]">
        <div
          className="unstructured-demo unstructured-demo--side relative h-full w-full"
          role="presentation"
        >
          <div className="unstructured-layer unstructured-layer--side-front absolute inset-0 origin-left transform rounded-sm bg-neutral-700 shadow-lg transition-all duration-700 ease-out">
            <div className="flex h-full p-6">
              <span className="font-extrabold text-2xl text-white drop-shadow-md">
                Front
              </span>
            </div>
          </div>

          <div className="unstructured-layer unstructured-layer--side-middle absolute inset-0 origin-left transform rounded-md bg-neutral-600 shadow-lg transition-all duration-700 ease-out">
            <div className="flex h-full p-6">
              <span className="unstructured-copy unstructured-copy--side-middle font-extrabold text-white text-xl opacity-0 drop-shadow-md transition-opacity delay-100 duration-300">
                Middle
              </span>
            </div>
          </div>

          <div className="unstructured-layer unstructured-layer--side-back absolute inset-x-4 inset-y-6 flex origin-left transform flex-row gap-6 rounded-sm p-3 transition-all duration-700 ease-out">
            <div className="flex h-full w-1/2 rounded-lg bg-neutral-500 p-6">
              <span className="unstructured-copy unstructured-copy--side-back-one font-extrabold text-lg text-white opacity-0 drop-shadow-md transition-opacity delay-200 duration-300">
                Back 1
              </span>
            </div>
            <div className="flex h-full w-1/2 rounded-lg bg-neutral-400 p-6">
              <span className="unstructured-copy unstructured-copy--side-back-two font-extrabold text-lg text-white opacity-0 drop-shadow-md transition-opacity delay-300 duration-300">
                Back 2
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
