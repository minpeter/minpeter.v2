"use client";

import { ArrowLeft, FileWarning, RotateCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";

import { getPathname } from "@/shared/i18n/navigation";

interface ErrorPanelProps {
  error: Error & { digest?: string };
  namespace: "blog" | "blogList" | "general";
  retry: () => void;
}

function reloadPage() {
  // Retrying React alone reuses the failed module from the old build.
  window.location.reload();
}

export function ErrorPanel({ error, namespace, retry }: ErrorPanelProps) {
  const t = useTranslations("errors");
  const locale = useLocale();
  const backHref = getPathname({
    href: namespace === "blog" ? "/blog" : "/",
    locale,
  });
  const needsReload = error.name === "ChunkLoadError";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      aria-labelledby="error-title"
      className="mx-auto w-full max-w-lg py-20 font-[family-name:var(--font-geist),Arial,sans-serif] sm:py-26"
      data-testid="error-panel"
    >
      <div
        aria-hidden="true"
        className="border-border text-muted-foreground mb-8 flex size-11 items-center justify-center rounded-xl border"
      >
        <FileWarning size={21} strokeWidth={1.4} />
      </div>
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.16em] uppercase">
        {t(`${namespace}.kicker`)}
      </p>
      <h1
        className="text-foreground mt-3 text-2xl font-normal tracking-tight text-balance"
        id="error-title"
      >
        {t(`${namespace}.title`)}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-6 text-pretty">
        {t(`${namespace}.description`)}
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <button
          className="bg-foreground text-background focus-visible:outline-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4"
          onClick={needsReload ? reloadPage : retry}
          type="button"
        >
          <RotateCw aria-hidden="true" size={14} />
          {needsReload ? t("reload") : t(`${namespace}.retry`)}
        </button>
        {/* A document navigation also works when the client router is broken. */}
        <a
          className="text-muted-foreground hover:text-foreground focus-visible:outline-ring inline-flex min-h-11 items-center gap-2 rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
          href={backHref}
        >
          <ArrowLeft aria-hidden="true" size={14} />
          {t(`${namespace}.back`)}
        </a>
      </div>

      {namespace === "general" && error.digest ? (
        <p className="border-border text-muted-foreground mt-8 flex flex-wrap gap-x-2 border-t pt-4 font-mono text-[10px]">
          <span>{t("general.digestLabel")}</span>
          <code className="break-all">{error.digest}</code>
        </p>
      ) : null}
    </section>
  );
}
