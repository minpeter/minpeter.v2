"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ProductSpin } from "@/components/product-spin";
import { SkateboardStandScrollCinema } from "@/components/skateboard-stand-scroll-cinema";
import { getSpinLoader } from "@/shared/product-spin-loader";
import {
  getValidatedStandSet,
  STAND_COLOR_OPTIONS,
  STAND_USAGE_SCENES,
  STAND_VIEW_OPTIONS,
  type StandColorId,
  type StandViewId,
  standSetToSpin,
  type ValidatedStandSet,
} from "@/shared/skateboard-stand";
import boardSilhouettes from "@/shared/skateboard-stand-board-silhouettes.json";
import standSilhouettes from "@/shared/skateboard-stand-silhouettes.json";
import { useSkateboardStandQuery } from "@/shared/use-skateboard-stand-query";

interface SkateboardStandCustomizerProps {
  actions?: ReactNode;
  details?: ReactNode;
  intro?: ReactNode;
  labels: {
    media: string;
    spin: string;
  };
}

const STAND_OUTLINES = Object.values(standSilhouettes);
const BOARD_OUTLINES = Object.values(boardSilhouettes);
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mergeRevealedScenes(
  prev: Record<string, boolean>,
  ids: readonly string[]
): Record<string, boolean> {
  const next = { ...prev };
  for (const id of ids) {
    next[id] = true;
  }
  return next;
}

function collectAboveFoldSceneIds(
  cards: NodeListOf<HTMLElement>,
  viewportHeight: number
): string[] {
  const ids: string[] = [];
  for (const el of cards) {
    const id = el.dataset.sceneId;
    if (id && el.getBoundingClientRect().top < viewportHeight * 0.92) {
      ids.push(id);
    }
  }
  return ids;
}

type ShowcaseRowLayout = "editorial" | "feature" | "trio";

function getShowcaseImageSizes(
  layout: ShowcaseRowLayout,
  isPortrait: boolean
): string {
  if (layout === "feature") {
    return "94vw";
  }
  if (layout === "trio") {
    return "(min-width: 64rem) 31vw, 94vw";
  }
  return isPortrait
    ? "(min-width: 64rem) 31vw, 94vw"
    : "(min-width: 64rem) 62vw, 94vw";
}

function StandValidatedPreview({
  initialAngle,
  labels,
  onAngleChange,
  scrollAngle,
  standSet,
}: {
  initialAngle: number;
  labels: SkateboardStandCustomizerProps["labels"];
  onAngleChange: (angle: number) => void;
  scrollAngle?: number;
  standSet: ValidatedStandSet;
}) {
  const t = useTranslations("products.standCustomization");
  const spin = useMemo(() => standSetToSpin(standSet), [standSet]);
  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "partial" | "error"
  >("loading");
  const angleRef = useRef(initialAngle);
  const rememberAngle = useCallback(
    (angle: number) => {
      angleRef.current = angle;
      onAngleChange(angle);
    },
    [onAngleChange]
  );
  const retry = useCallback(() => {
    getSpinLoader(spin).retry();
    setLoadState("loading");
  }, [spin]);
  const statusKey = {
    error: "loadError",
    loading: "loading",
    partial: "partial",
    ready: "ready",
  } as const;
  const outlines =
    standSet.viewId === "board" ? BOARD_OUTLINES : STAND_OUTLINES;

  return (
    <section
      aria-label={labels.media}
      className="store-custom-preview store-stand-stage-pop"
      data-combination={standSet.id}
      data-view={standSet.viewId}
    >
      <div className="store-media-stage">
        <ProductSpin
          alt={
            standSet.viewId === "board" ? t("boardPreviewLabel") : labels.spin
          }
          initialAngle={angleRef.current}
          loadingOutlines={outlines}
          onAngleChange={rememberAngle}
          onLoadStateChange={setLoadState}
          resetOnLeave={false}
          sizes="(min-width: 64rem) 60vw, 92vw"
          spin={spin}
          targetAngle={scrollAngle}
        />
        <div className="store-custom-feedback">
          <p
            aria-live="polite"
            className={
              loadState === "ready" || loadState === "loading"
                ? "sr-only"
                : "store-label"
            }
            role="status"
          >
            {t(statusKey[loadState])}
          </p>
          {loadState === "error" || loadState === "partial" ? (
            <button
              className="store-button store-label"
              onClick={retry}
              type="button"
            >
              {t("retry")}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function SkateboardStandCustomizer(
  props: SkateboardStandCustomizerProps
) {
  const t = useTranslations("products.standCustomization");
  const [selection, setSelection] = useSkateboardStandQuery();
  const angleRef = useRef(0);
  const manualOffsetRef = useRef(0);
  const lastScrollDeltaRef = useRef(0);
  const [scrollAngle, setScrollAngle] = useState<number | undefined>(undefined);
  const heroRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const showcaseGridRef = useRef<HTMLDivElement>(null);
  const [motionArmed, setMotionArmed] = useState(false);
  const [revealedScenes, setRevealedScenes] = useState<Record<string, boolean>>(
    {}
  );

  const rememberAngle = useCallback((angle: number) => {
    angleRef.current = angle;
    manualOffsetRef.current =
      (((angle - lastScrollDeltaRef.current) % 360) + 360) % 360;
  }, []);

  const changeColor = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSelection({ color: event.currentTarget.value as StandColorId });
    },
    [setSelection]
  );

  const changeView = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSelection({ view: event.currentTarget.value as StandViewId });
    },
    [setSelection]
  );

  // Choreographed beat reveals ("빱! 뽭! 빱!") as each 3D showcase scene enters the viewport.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      return;
    }

    const cards =
      showcaseGridRef.current?.querySelectorAll<HTMLElement>("[data-scene-id]");
    if (!cards || cards.length === 0) {
      return;
    }

    const aboveFold = collectAboveFoldSceneIds(
      cards,
      window.innerHeight || 800
    );
    const alreadyShown = new Set(aboveFold);
    if (aboveFold.length > 0) {
      setRevealedScenes((prev) => mergeRevealedScenes(prev, aboveFold));
    }
    setMotionArmed(true);

    const observer = new IntersectionObserver(
      (entries) => {
        const newlyVisible: string[] = [];
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const id = (entry.target as HTMLElement).dataset.sceneId;
          if (id) {
            newlyVisible.push(id);
          }
          observer.unobserve(entry.target);
        }
        if (newlyVisible.length > 0) {
          setRevealedScenes((prev) => mergeRevealedScenes(prev, newlyVisible));
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.14 }
    );

    for (const el of cards) {
      const id = el.dataset.sceneId;
      if (!(id && alreadyShown.has(id))) {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, []);

  // Scroll-driven 3D turntable scrub + focal depth parallax on showcase frames.
  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    let rafId = 0;

    const updateOnScroll = () => {
      rafId = 0;
      const vh = window.innerHeight || 800;

      const heroEl = heroRef.current;
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect();
        const scrollable = Math.max(260, rect.height * 0.72);
        const progress = clamp(-rect.top / scrollable, 0, 1);
        const deltaDeg = Math.round((progress * 210) / 30) * 30;
        if (deltaDeg !== lastScrollDeltaRef.current) {
          lastScrollDeltaRef.current = deltaDeg;
          const nextAngle = (manualOffsetRef.current + deltaDeg) % 360;
          angleRef.current = nextAngle;
          setScrollAngle(nextAngle);
        }

        // Subtle focal pop on the sticky 3D hero stage as you scroll past its sweet spot.
        const visualEl = visualRef.current;
        if (visualEl) {
          const pulse = Math.sin(progress * Math.PI);
          visualEl.style.setProperty("--hero-pulse", pulse.toFixed(4));
        }
      }

      // Live normalized viewport progress (-1 bottom -> 0 center -> +1 top) per 3D scene.
      const cards =
        showcaseGridRef.current?.querySelectorAll<HTMLElement>(
          "[data-scene-id]"
        );
      if (cards) {
        for (const el of cards) {
          const rect = el.getBoundingClientRect();
          const centerY = rect.top + rect.height * 0.5;
          const normalized = clamp((vh * 0.5 - centerY) / (vh * 0.75), -1, 1);
          el.style.setProperty("--scene-p", normalized.toFixed(4));
          el.style.setProperty("--scene-abs", Math.abs(normalized).toFixed(4));
        }
      }
    };

    const schedule = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(updateOnScroll);
      }
    };

    updateOnScroll();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const standSet = getValidatedStandSet(selection.view, selection.color);
  const selectedColor =
    STAND_COLOR_OPTIONS.find((option) => option.id === selection.color) ??
    STAND_COLOR_OPTIONS[0];

  const selectedLabel = t("selected", {
    color: t(`colorNames.${selectedColor.id}`),
    view: t(`views.${selection.view}`),
  });

  return (
    <>
      <div
        className="store-customizer store-customizer-minimal"
        data-color={selection.color}
        data-testid="skateboard-stand-customizer"
        data-view={selection.view}
        ref={heroRef}
      >
        <h2 className="store-custom-selection sr-only">{selectedLabel}</h2>
        <div
          className="store-custom-visual store-stand-hero-visual"
          ref={visualRef}
        >
          {standSet ? (
            <StandValidatedPreview
              initialAngle={angleRef.current}
              key={`${standSet.id}:${standSet.frames.map((frame) => frame.sha256).join(":")}`}
              labels={props.labels}
              onAngleChange={rememberAngle}
              scrollAngle={scrollAngle}
              standSet={standSet}
            />
          ) : (
            <div
              className="store-media-stage store-custom-pending"
              data-testid="stand-render-pending"
            >
              <div aria-live="polite" role="status">
                <p className="store-label">{t("pending")}</p>
                <p className="store-prose">{t("pendingDetail")}</p>
              </div>
            </div>
          )}
        </div>
        <div className="store-custom-sidebar store-stand-sidebar">
          {props.intro}
          <div className="store-custom-controls">
            <fieldset>
              <legend className="sr-only">{t("viewLabel")}</legend>
              <div className="store-view-toggle">
                {STAND_VIEW_OPTIONS.map((option) => (
                  <label
                    className="store-view-option store-label"
                    data-selected={selection.view === option.id}
                    key={option.id}
                  >
                    <input
                      checked={selection.view === option.id}
                      className="sr-only"
                      name="stand-view"
                      onChange={changeView}
                      type="radio"
                      value={option.id}
                    />
                    <span>{t(`views.${option.id}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="store-label">
                <span className="sr-only">{t("colorLabel")} </span>
                <span className="store-custom-selected-name">
                  {t(`colorNames.${selectedColor.id}`)}
                </span>
              </legend>
              <div className="store-custom-swatches">
                {STAND_COLOR_OPTIONS.map((option) => (
                  <label
                    className="store-custom-option store-custom-color"
                    data-selected={selection.color === option.id}
                    key={option.id}
                    title={t(`colorNames.${option.id}`)}
                  >
                    <input
                      aria-label={t(`colorNames.${option.id}`)}
                      checked={selection.color === option.id}
                      className="sr-only"
                      name="stand-color"
                      onChange={changeColor}
                      type="radio"
                      value={option.id}
                    />
                    <span
                      aria-hidden="true"
                      className="store-custom-swatch"
                      style={{ backgroundColor: option.hex }}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            {props.actions}

            <details
              className="store-custom-details"
              data-testid="stand-material-details"
            >
              <summary className="store-label">{t("detailsLabel")}</summary>
              <div className="store-custom-details-body store-prose">
                {props.details}
                <dl>
                  <div>
                    <dt>{t("colorLabel")}</dt>
                    <dd>
                      {t(`colorNames.${selectedColor.id}`)} ·{" "}
                      {selectedColor.material} {selectedColor.sku}
                    </dd>
                  </div>
                </dl>
                {selection.color === "white-marble" ? (
                  <p>{t("marbleNote")}</p>
                ) : null}
                <p>{t("approximation")}</p>
                <div className="store-custom-sources store-label">
                  <a
                    href={selectedColor.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {t("materialSource")}
                  </a>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      <SkateboardStandScrollCinema />

      <section
        aria-label={t("showcase.heading")}
        className="store-showcase"
        data-testid="stand-usage-showcase"
      >
        <div
          className="store-showcase-grid"
          data-motion-armed={motionArmed}
          ref={showcaseGridRef}
        >
          {(
            [
              {
                layout: "editorial" as const,
                scenes: STAND_USAGE_SCENES.slice(0, 2),
              },
              {
                layout: "feature" as const,
                scenes: STAND_USAGE_SCENES.slice(2, 3),
              },
              {
                layout: "trio" as const,
                scenes: STAND_USAGE_SCENES.slice(3, 6),
              },
            ] as const
          ).map((row) => (
            <div
              className="store-showcase-row"
              data-layout={row.layout}
              key={row.layout}
            >
              {row.scenes.map((scene, colIndex) => {
                const isPortrait = scene.height > scene.width;
                const isRevealed = Boolean(revealedScenes[scene.id]);
                const delayMs = colIndex * 90;
                const imageSizes = getShowcaseImageSizes(
                  row.layout,
                  isPortrait
                );
                return (
                  <figure
                    className="store-showcase-card"
                    data-aspect={isPortrait ? "portrait" : "landscape"}
                    data-revealed={isRevealed}
                    data-scene-id={scene.id}
                    key={scene.id}
                    style={{ "--beat-delay": `${delayMs}ms` } as CSSProperties}
                  >
                    <div className="store-showcase-media">
                      <Image
                        alt={t(`showcase.scenes.${scene.id}.alt`)}
                        className="store-showcase-img"
                        height={scene.height}
                        sizes={imageSizes}
                        src={`${scene.src}?v=${scene.version}`}
                        unoptimized
                        width={scene.width}
                      />
                    </div>
                  </figure>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
