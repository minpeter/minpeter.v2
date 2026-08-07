"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { isPointInTriangle } from "@/shared/utils/geometry";

const TOUCH_POINTER_QUERY = "(any-pointer: coarse)";

const noopUnsubscribe = (): void => undefined;

function hasTouchPointer(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia(TOUCH_POINTER_QUERY).matches
  );
}

function getTouchDeviceSnapshot(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    hasTouchPointer()
  );
}

function getServerTouchDeviceSnapshot(): boolean {
  return false;
}

function subscribeToTouchDevice(onStoreChange: () => void): () => void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return noopUnsubscribe;
  }

  const touchPointerQuery = window.matchMedia(TOUCH_POINTER_QUERY);

  touchPointerQuery.addEventListener("change", onStoreChange);

  return () => {
    touchPointerQuery.removeEventListener("change", onStoreChange);
  };
}

interface UseHoverDropdownOptions {
  closeDelay?: number;
  openDelay?: number;
  safeTrianglePadding?: number;
}

interface UseHoverDropdownReturn {
  contentRef: React.RefObject<HTMLDivElement | null>;
  handleContentMouseEnter: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleContentMouseLeave: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleMouseEnter: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  handleMouseLeave: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  handleOpenChange: (open: boolean) => void;
  isOpen: boolean;
  isTouchDevice: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function useHoverDropdown(
  options: UseHoverDropdownOptions = {}
): UseHoverDropdownReturn {
  const {
    openDelay = 50,
    closeDelay = 100,
    safeTrianglePadding = 20,
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const isTouchDevice = useSyncExternalStore(
    subscribeToTouchDevice,
    getTouchDeviceSnapshot,
    getServerTouchDeviceSnapshot
  );

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  // Mutable box avoids noUnnecessaryConditions false-positives on RefObject.current
  const timeouts = useRef({
    close: undefined as ReturnType<typeof setTimeout> | undefined,
    open: undefined as ReturnType<typeof setTimeout> | undefined,
  }).current;
  const safeZone = useRef({ active: false }).current;

  // Clear timeouts on unmount
  useEffect(
    () => () => {
      clearTimeout(timeouts.open);
      clearTimeout(timeouts.close);
    },
    [timeouts]
  );

  // Check if mouse is in safe triangle zone
  const isInSafeTriangle = useEffectEvent(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (trigger === null || content === null) {
      return false;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const { x: mx, y: my } = mousePositionRef.current;

    // Trigger center point (apex of triangle)
    const tx = triggerRect.left + triggerRect.width / 2;
    const ty = triggerRect.bottom;

    // Content corners (base of triangle) - expand slightly for better UX
    const c1x = contentRect.left - safeTrianglePadding;
    const c1y = contentRect.top;
    const c2x = contentRect.right + safeTrianglePadding;
    const c2y = contentRect.top;

    return isPointInTriangle(mx, my, tx, ty, c1x, c1y, c2x, c2y);
  });

  // Handle mouse movement for safe triangle
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };

      if (timeouts.close !== undefined) {
        const inTrigger = triggerRef.current?.contains(e.target as Node);
        const inContent = contentRef.current?.contains(e.target as Node);
        const inSafeZone = isInSafeTriangle();

        safeZone.active = inSafeZone;

        if (inTrigger || inContent || inSafeZone) {
          clearTimeout(timeouts.close);
          timeouts.close = undefined;
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [isOpen, timeouts, safeZone]);

  const handleMouseEnter = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "touch") {
      return;
    }

    // Cancel any pending close
    clearTimeout(timeouts.close);
    timeouts.close = undefined;

    // Small delay to prevent flicker on quick mouse movements
    if (!(isOpen || timeouts.open !== undefined)) {
      timeouts.open = setTimeout(() => {
        setIsOpen(true);
        timeouts.open = undefined;
      }, openDelay);
    }
  };

  const handleMouseLeave = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "touch") {
      return;
    }

    // Cancel any pending open
    clearTimeout(timeouts.open);
    timeouts.open = undefined;

    // Start close timeout - gives time for safe triangle check
    timeouts.close = setTimeout(() => {
      // Final check before closing
      if (safeZone.active === false) {
        setIsOpen(false);
      }
      timeouts.close = undefined;
    }, closeDelay);
  };

  const handleContentMouseEnter = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (event.pointerType === "touch") {
      return;
    }

    clearTimeout(timeouts.close);
    timeouts.close = undefined;
  };

  const handleContentMouseLeave = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (event.pointerType === "touch") {
      return;
    }

    timeouts.close = setTimeout(() => {
      setIsOpen(false);
      timeouts.close = undefined;
    }, closeDelay);
  };

  // Keep Radix's click, touch, keyboard, outside-click, and Escape interactions
  // in sync with the controlled state. Pointer hover is handled above.
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return {
    contentRef,
    handleContentMouseEnter,
    handleContentMouseLeave,
    handleMouseEnter,
    handleMouseLeave,
    handleOpenChange,
    isOpen,
    isTouchDevice,
    setIsOpen,
    triggerRef,
  };
}
