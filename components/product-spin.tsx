"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type { ProductSpin as ProductSpinData } from "@/shared/products";
import { cn } from "@/shared/utils/tailwind";

/** The shown frame steps one frame at a time toward the pointer's frame, at most this often. */
const STEP_MS = 14;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Decode state belongs to this mounted image, never to a historical frame index. */
function SpinFrame({
  index,
  src,
  selected,
  visible,
  onReady,
}: {
  index: number;
  src: string;
  selected: boolean;
  visible: boolean;
  onReady: (index: number) => void;
}) {
  const [decoded, setDecoded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (selected && decoded && imageRef.current?.isConnected) {
      onReady(index);
    }
  }, [decoded, index, onReady, selected]);

  const handleLoad = useCallback(
    async (event: React.SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      try {
        await image.decode();
        if (image.isConnected && image === imageRef.current) {
          setDecoded(true);
        }
      } catch {
        // Keep the last decoded frame (or poster) on decode/network failure.
      }
    },
    []
  );

  return (
    <Image
      alt=""
      className={cn("object-contain", !visible && "invisible")}
      data-index={index}
      draggable={false}
      fill
      loading="eager"
      onLoad={handleLoad}
      ref={imageRef}
      src={src}
      unoptimized
    />
  );
}

interface ProductSpinProps {
  /** Accessible name; omit inside a link, where the spin is decorative hover-only motion. */
  alt?: string;
  className?: string;
  sizes: string;
  spin: ProductSpinData;
}

/** Shortest signed step (−1, 0, 1) from `from` to `to` around a loop of `count` frames. */
function stepToward(from: number, to: number, count: number) {
  let diff = to - from;
  if (Math.abs(diff) > count / 2) {
    diff -= Math.sign(diff) * count;
  }
  return Math.sign(diff);
}

export function ProductSpin({ alt, className, sizes, spin }: ProductSpinProps) {
  const interactive = alt !== undefined;
  const { basePath, defaultFrame, frameCount, height, poster, width } = spin;
  const [active, setActive] = useState(false);
  const [frame, setFrame] = useState(defaultFrame);
  const [displayedFrame, setDisplayedFrame] = useState<number | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false
  );
  const frameRef = useRef(defaultFrame);
  const targetRef = useRef(defaultFrame);
  const rafRef = useRef(0);
  const lastStepRef = useRef(0);
  const dragRef = useRef<{ startFrame: number; startX: number } | null>(null);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  useEffect(() => {
    if (reducedMotion) {
      cancelAnimationFrame(rafRef.current);
    }
  }, [reducedMotion]);

  const animate = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      if (frameRef.current === targetRef.current) {
        return;
      }
      if (now - lastStepRef.current >= STEP_MS) {
        lastStepRef.current = now;
        const next =
          (frameRef.current +
            stepToward(frameRef.current, targetRef.current, frameCount) +
            frameCount) %
          frameCount;
        frameRef.current = next;
        setFrame(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [frameCount]);

  const aim = useCallback(
    (target: number) => {
      targetRef.current = target;
      if (reducedMotion) {
        cancelAnimationFrame(rafRef.current);
        frameRef.current = target;
        setFrame(target);
      } else {
        animate();
      }
    },
    [animate, reducedMotion]
  );

  const frameAt = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const { left, width: boxWidth } =
        event.currentTarget.getBoundingClientRect();
      const progress = Math.min(
        Math.max((event.clientX - left) / boxWidth, 0),
        1
      );
      return Math.min(Math.floor(progress * frameCount), frameCount - 1);
    },
    [frameCount]
  );

  const handlePointerEnter = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      setActive(true);
      if (event.pointerType === "mouse" && !reducedMotion) {
        aim(frameAt(event));
      }
    },
    [aim, frameAt, reducedMotion]
  );

  // Mouse and pen: the horizontal position over the render picks the angle, no click needed.
  // Touch: drag across the render; one full width is one full turn.
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag) {
        const { width: boxWidth } = event.currentTarget.getBoundingClientRect();
        const moved = Math.round(
          ((event.clientX - drag.startX) / boxWidth) * frameCount
        );
        aim(
          (((drag.startFrame + moved) % frameCount) + frameCount) % frameCount
        );
        return;
      }
      if (event.pointerType !== "touch" && !reducedMotion) {
        aim(frameAt(event));
      }
    },
    [aim, frameAt, frameCount, reducedMotion]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      setActive(true);
      if (event.pointerType === "touch") {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
          startFrame: frameRef.current,
          startX: event.clientX,
        };
      }
    },
    []
  );

  const handlePointerEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "touch" && !reducedMotion) {
        aim(defaultFrame);
      }
    },
    [aim, defaultFrame, reducedMotion]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const delta = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
      if (!delta) {
        return;
      }
      event.preventDefault();
      setActive(true);
      aim((targetRef.current + delta + frameCount) % frameCount);
    },
    [aim, frameCount]
  );

  const handleFrameReady = useCallback((index: number) => {
    // A late decode must not replace the newer requested angle.
    if (index === frameRef.current) {
      setDisplayedFrame(index);
    }
  }, []);

  const handleFocus = useCallback(() => setActive(true), []);

  const frameSources = useMemo(
    () =>
      Array.from(
        { length: frameCount },
        (_, index) => `${basePath}/${String(index + 1).padStart(2, "0")}.webp`
      ),
    [basePath, frameCount]
  );

  const frameWindow = useMemo(
    () =>
      active
        ? Array.from(
            new Set([
              frame,
              (frame + 1) % frameCount,
              (frame - 1 + frameCount) % frameCount,
              ...(displayedFrame === null ? [] : [displayedFrame]),
            ])
          )
        : [],
    [active, displayedFrame, frame, frameCount]
  );
  // At most four frame images: requested angle, its neighbors, and the retained decoded image.
  const showFrames = displayedFrame !== null;

  return (
    <div
      {...(interactive
        ? {
            "aria-label": alt,
            "aria-valuemax": frameCount - 1,
            "aria-valuemin": 0,
            "aria-valuenow": frame,
            "aria-valuetext": `${Math.round((frame / frameCount) * 360)}°`,
            onFocus: handleFocus,
            onKeyDown: handleKeyDown,
            onLostPointerCapture: handlePointerEnd,
            onPointerCancel: handlePointerEnd,
            onPointerDown: handlePointerDown,
            onPointerUp: handlePointerEnd,
            role: "slider",
            tabIndex: 0,
          }
        : { "aria-hidden": true })}
      className={cn("relative touch-pan-y select-none", className)}
      data-displayed-frame={displayedFrame ?? "poster"}
      data-frame={frame}
      data-testid="product-spin"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Image
        alt=""
        className={cn("object-contain", showFrames && "invisible")}
        draggable={false}
        fill
        priority
        sizes={sizes}
        src={poster}
      />
      {frameWindow.map((index) => (
        <SpinFrame
          index={index}
          key={frameSources[index]}
          onReady={handleFrameReady}
          selected={index === frame}
          src={frameSources[index]}
          visible={index === displayedFrame}
        />
      ))}
    </div>
  );
}
