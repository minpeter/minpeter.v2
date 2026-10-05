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
        className="mb-8 flex size-11 items-center justify-center rounded-xl border border-border text-muted-foreground"
      >
        <FileWarning size={21} strokeWidth={1.4} />
      </div>
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.16em]">
        {t(`${namespace}.kicker`)}
      </p>
      <h1
        className="mt-3 text-balance font-normal text-2xl text-foreground tracking-tight"
        id="error-title"
      >
        {t(`${namespace}.title`)}
      </h1>
      <p className="mt-3 max-w-sm text-pretty text-muted-foreground text-sm leading-6">
        {t(`${namespace}.description`)}
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2 text-background transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
          onClick={needsReload ? reloadPage : retry}
          type="button"
        >
          <RotateCw aria-hidden="true" size={14} />
          {needsReload ? t("reload") : t(`${namespace}.retry`)}
        </button>
        {/* A document navigation also works when the client router is broken. */}
        <a
          className="inline-flex min-h-11 items-center gap-2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
          href={backHref}
        >
          <ArrowLeft aria-hidden="true" size={14} />
          {t(`${namespace}.back`)}
        </a>
      </div>

      {namespace === "general" && error.digest ? (
        <p className="mt-8 flex flex-wrap gap-x-2 border-border border-t pt-4 font-mono text-[10px] text-muted-foreground">
          <span>{t("general.digestLabel")}</span>
          <code className="break-all">{error.digest}</code>
        </p>
      ) : null}
    </section>
  );
}
