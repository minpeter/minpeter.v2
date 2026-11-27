"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { STAND_USAGE_SCENES } from "@/shared/skateboard-stand";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type ShowcaseRowLayout = "editorial" | "feature" | "trio";

const SHOWCASE_ROWS: readonly {
  layout: ShowcaseRowLayout;
  scenes: readonly (typeof STAND_USAGE_SCENES)[number][];
}[] = [
  { layout: "editorial", scenes: STAND_USAGE_SCENES.slice(0, 2) },
  { layout: "feature", scenes: STAND_USAGE_SCENES.slice(2, 3) },
  { layout: "trio", scenes: STAND_USAGE_SCENES.slice(3, 6) },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mergeRevealedScenes(
  prev: Record<string, boolean>,
  ids: readonly string[]
): Record<string, boolean> {
  let changed = false;
  for (const id of ids) {
    if (!prev[id]) {
      changed = true;
      break;
    }
  }
  if (!changed) {
    return prev;
  }
  const next = { ...prev };
  for (const id of ids) {
    next[id] = true;
  }
  return next;
}

function collectAboveOrVisibleSceneIds(
  cards: readonly HTMLElement[],
  viewportHeight: number
): string[] {
  const ids: string[] = [];
  const threshold = viewportHeight * 0.92;
  for (const el of cards) {
    const id = el.dataset.sceneId;
    if (id && el.getBoundingClientRect().top < threshold) {
      ids.push(id);
    }
  }
  return ids;
}

function collectUnrevealedPassedSceneIds(
  cards: readonly HTMLElement[],
  viewportHeight: number
): string[] {
  const ids: string[] = [];
  const threshold = viewportHeight * 0.92;
  for (const el of cards) {
    if (el.dataset.revealed === "true") {
      continue;
    }
    const id = el.dataset.sceneId;
    if (id && el.getBoundingClientRect().top < threshold) {
      ids.push(id);
    }
  }
  return ids;
}

function applyShowcaseParallax(
  measurements: readonly {
    bottom: number;
    el: HTMLElement;
    height: number;
    top: number;
  }[],
  viewportHeight: number,
  lastApplied: WeakMap<HTMLElement, string>
): void {
  const topBound = -viewportHeight * 0.5;
  const bottomBound = viewportHeight * 1.5;
  for (const { bottom, el, height, top } of measurements) {
    if (bottom < topBound || top > bottomBound) {
      continue;
    }
    const centerY = top + height * 0.5;
    const normalized = clamp(
      (viewportHeight * 0.5 - centerY) / (viewportHeight * 0.75),
      -1,
      1
    );
    const pStr = normalized.toFixed(4);
    if (lastApplied.get(el) === pStr) {
      continue;
    }
    lastApplied.set(el, pStr);
    el.style.setProperty("--scene-p", pStr);
    el.style.setProperty("--scene-abs", Math.abs(normalized).toFixed(4));
  }
}

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

export function SkateboardStandShowcase() {
  const t = useTranslations("products.standCustomization");
  const sectionRef = useRef<HTMLElement>(null);
  const showcaseGridRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [motionArmed, setMotionArmed] = useState(false);
  const [revealedScenes, setRevealedScenes] = useState<Record<string, boolean>>(
    {}
  );

  // Dynamically track prefers-reduced-motion so live OS toggles immediately disarm motion.
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => {
      setReducedMotion(media.matches);
      if (media.matches) {
        setMotionArmed(false);
      }
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Choreographed beat reveals as each showcase scene enters (or is scrolled past).
  useEffect(() => {
    const grid = showcaseGridRef.current;
    if (!grid || reducedMotion || typeof IntersectionObserver === "undefined") {
      return;
    }

    const cards = Array.from(
      grid.querySelectorAll<HTMLElement>("[data-scene-id]")
    );
    if (cards.length === 0) {
      return;
    }

    const aboveFold = collectAboveOrVisibleSceneIds(
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
          if (!(entry.isIntersecting || entry.boundingClientRect.top < 0)) {
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
  }, [reducedMotion]);

  // Batched focal depth parallax for editorial + feature scenes only (skips offscreen & trio).
  useEffect(() => {
    const sectionEl = sectionRef.current;
    const gridEl = showcaseGridRef.current;
    if (!(sectionEl && gridEl)) {
      return;
    }

    const parallaxCards = Array.from(
      gridEl.querySelectorAll<HTMLElement>(
        '.store-showcase-row:not([data-layout="trio"]) [data-scene-id]'
      )
    );
    const allCards = Array.from(
      gridEl.querySelectorAll<HTMLElement>("[data-scene-id]")
    );

    if (reducedMotion) {
      for (const el of parallaxCards) {
        el.style.removeProperty("--scene-p");
        el.style.removeProperty("--scene-abs");
      }
      return;
    }

    let rafId = 0;
    const lastApplied = new WeakMap<HTMLElement, string>();

    const updateOnScroll = () => {
      rafId = 0;
      const vh = window.innerHeight || 800;
      const sectionRect = sectionEl.getBoundingClientRect();
      // Skip all card DOM reads & writes while the visitor is in the hero or cinema.
      if (sectionRect.bottom < -vh || sectionRect.top > vh * 1.5) {
        return;
      }

      // Phase 1: batch ALL layout reads before ANY style writes (zero forced reflow thrashing).
      const measurements = parallaxCards.map((el) => {
        const rect = el.getBoundingClientRect();
        return { bottom: rect.bottom, el, height: rect.height, top: rect.top };
      });
      const passedIds = collectUnrevealedPassedSceneIds(allCards, vh);

      // Phase 2: apply CSS custom properties only for nearby cards whose value changed.
      applyShowcaseParallax(measurements, vh, lastApplied);

      if (passedIds.length > 0) {
        setRevealedScenes((prev) => mergeRevealedScenes(prev, passedIds));
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
  }, [reducedMotion]);

  return (
    <section
      aria-label={t("showcase.heading")}
      className="store-showcase"
      data-testid="stand-usage-showcase"
      ref={sectionRef}
    >
      <div
        className="store-showcase-grid"
        data-motion-armed={motionArmed && !reducedMotion}
        ref={showcaseGridRef}
      >
        {SHOWCASE_ROWS.map((row) => (
          <div
            className="store-showcase-row"
            data-layout={row.layout}
            key={row.layout}
          >
            {row.scenes.map((scene, colIndex) => {
              const isPortrait = scene.height > scene.width;
              const isRevealed =
                reducedMotion || Boolean(revealedScenes[scene.id]);
              const delayMs = colIndex * 90;
              const imageSizes = getShowcaseImageSizes(row.layout, isPortrait);
              return (
                <figure
                  className="store-showcase-card"
                  data-aspect={isPortrait ? "portrait" : "landscape"}
                  data-revealed={isRevealed}
                  data-scene-id={scene.id}
                  key={scene.id}
                  style={{ "--col-delay": `${delayMs}ms` } as CSSProperties}
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
  );
}
