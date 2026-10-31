"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { getSpinLoader } from "@/shared/product-spin-loader";
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
  const [inView, setInView] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paintedBitmapRef = useRef<ImageBitmap | null>(null);
  const fullResolutionFrameRef = useRef<number | null>(null);
  const fullDecodePendingRef = useRef(false);
  const [resolution, setResolution] = useState("preview");
  const id = useId();
  const token = useMemo(() => Symbol(id), [id]);
  const loader = useMemo(
    () => getSpinLoader({ basePath, frameCount, height, width }),
    [basePath, frameCount, height, width]
  );
  const version = useSyncExternalStore(
    loader.subscribe,
    loader.getSnapshot,
    () => 0
  );
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

  useEffect(() => {
    const stage = stageRef.current;
    if (!(stage && window.IntersectionObserver)) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (!entry.isIntersecting) {
        setActive(false);
      }
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    loader.setActive(token, inView || active);
  }, [active, inView, loader, token]);
  useEffect(() => () => loader.release(token), [loader, token]);

  useEffect(() => {
    if (!(inView || active)) {
      return;
    }
    loader.requestFrame(token, frame);
    if (version !== loader.getSnapshot()) {
      return;
    }
    // Loading order is independent of pointer movement. Only draw decoded cache entries;
    // a late load is compared with the current angle, never blindly promoted.
    const nearest = loader.nearestFrame(frame);
    const canvas = canvasRef.current;
    if (
      !(nearest && canvas) ||
      nearest.bitmap === paintedBitmapRef.current ||
      nearest.index === fullResolutionFrameRef.current
    ) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    try {
      context.globalCompositeOperation = "copy";
      context.drawImage(nearest.bitmap, 0, 0, canvas.width, canvas.height);
      paintedBitmapRef.current = nearest.bitmap;
      fullResolutionFrameRef.current = null;
      setResolution("preview");
      setDisplayedFrame(nearest.index);
    } catch {
      // An unavailable bitmap must not erase the already painted frame or poster.
    }
  }, [active, frame, inView, loader, token, version]);

  useEffect(() => {
    if (
      !(inView || active) ||
      displayedFrame === null ||
      fullResolutionFrameRef.current === displayedFrame
    ) {
      return;
    }
    const source = loader.getSource(displayedFrame);
    if (!source) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const paintFullResolution = async () => {
      if (cancelled) {
        return;
      }
      // biome-ignore lint/suspicious/noUnnecessaryConditions: A previous effect's asynchronous decode can still own this shared ref.
      if (fullDecodePendingRef.current) {
        timer = setTimeout(paintFullResolution, 50);
        return;
      }
      fullDecodePendingRef.current = true;
      let bitmap: ImageBitmap | undefined;
      try {
        // Preserve original detail on high-DPR screens after motion stops. The compressed
        // original is already cached; only one temporary full-resolution decode is needed.
        bitmap = await createImageBitmap(source);
        const canvas = canvasRef.current;
        if (cancelled || !canvas || frameRef.current !== frame) {
          return;
        }
        const context = canvas.getContext("2d");
        if (!context) {
          return;
        }
        context.globalCompositeOperation = "copy";
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        fullResolutionFrameRef.current = displayedFrame;
        setResolution("full");
      } catch {
        // A full-quality refinement failure leaves the resized decoded frame intact.
      } finally {
        bitmap?.close();
        fullDecodePendingRef.current = false;
      }
    };
    timer = setTimeout(paintFullResolution, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, displayedFrame, frame, inView, loader]);

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
    setActive(false);
    dragRef.current = null;
  }, []);

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      setActive(false);
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

  const handleFocus = useCallback(() => setActive(true), []);
  const handleBlur = useCallback(() => setActive(false), []);
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
            onBlur: handleBlur,
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
      data-loaded-count={loader.fetchedCount}
      data-ready-count={loader.readyCount}
      data-resolution={resolution}
      data-testid="product-spin"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      ref={stageRef}
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
      <canvas
        aria-hidden="true"
        className={cn(
          "absolute inset-0 h-full w-full object-contain",
          !showFrames && "invisible"
        )}
        height={height}
        ref={canvasRef}
        tabIndex={-1}
        width={width}
      />
    </div>
  );
}
