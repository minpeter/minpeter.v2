"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ProductSpin as ProductSpinData } from "@/shared/products";
import { cn } from "@/shared/utils/tailwind";

/** The shown frame steps one frame at a time toward the pointer's frame, at most this often. */
const STEP_MS = 14;

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
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(new Set());
  const frameRef = useRef(defaultFrame);
  const targetRef = useRef(defaultFrame);
  const rafRef = useRef(0);
  const lastStepRef = useRef(0);
  const dragRef = useRef<{ startFrame: number; startX: number } | null>(null);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

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
      animate();
    },
    [animate]
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
      if (event.pointerType === "mouse") {
        aim(frameAt(event));
      }
    },
    [aim, frameAt]
  );

  // Mouse and pen: the horizontal position over the photo picks the angle, no click needed.
  // Touch: drag across the photo; one full width is one full turn.
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
      if (event.pointerType !== "touch") {
        aim(frameAt(event));
      }
    },
    [aim, frameAt, frameCount]
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
      if (event.pointerType !== "touch") {
        aim(defaultFrame);
      }
    },
    [aim, defaultFrame]
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

  const handleFrameLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const index = Number(event.currentTarget.dataset.index);
      setLoaded((previous) => new Set(previous).add(index));
    },
    []
  );

  const handleFocus = useCallback(() => setActive(true), []);

  const frameSources = useMemo(
    () =>
      Array.from(
        { length: frameCount },
        (_, index) => `${basePath}/${String(index + 1).padStart(2, "0")}.webp`
      ),
    [basePath, frameCount]
  );

  // The poster stays until the frame being shown has decoded, so nothing ever blinks blank.
  const showFrames = active && loaded.has(frame);

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
            onPointerDown: handlePointerDown,
            onPointerUp: handlePointerEnd,
            role: "slider",
            tabIndex: 0,
          }
        : { "aria-hidden": true })}
      className={cn("relative touch-pan-y select-none", className)}
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
      {active
        ? frameSources.map((src, index) => (
            <Image
              alt=""
              className={cn(
                "object-contain",
                !(showFrames && index === frame) && "invisible"
              )}
              data-index={index}
              draggable={false}
              fill
              key={src}
              onLoad={handleFrameLoad}
              src={src}
              unoptimized
            />
          ))
        : null}
    </div>
  );
}
