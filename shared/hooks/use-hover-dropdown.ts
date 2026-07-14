"use client";

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
  handleContentMouseEnter: () => void;
  handleContentMouseLeave: () => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
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

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMouseInSafeZoneRef = useRef(false);
  const lastInteractionRef = useRef<
    "mouse" | "touch" | "pen" | "keyboard" | null
  >(null);

  // Track last interaction type for desktop keyboard access
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const pointerType =
        e.pointerType === "mouse" ||
        e.pointerType === "touch" ||
        e.pointerType === "pen"
          ? e.pointerType
          : "mouse";
      lastInteractionRef.current = pointerType;
    };

    const handleKeyDown = () => {
      lastInteractionRef.current = "keyboard";
    };

    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Clear timeouts on unmount
  useEffect(
    () => () => {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    },
    []
  );

  // Check if mouse is in safe triangle zone
  const isInSafeTriangle = useEffectEvent(() => {
    if (!(triggerRef.current && contentRef.current)) {
      return false;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
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
    if (!isOpen || isTouchDevice) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };

      if (closeTimeoutRef.current) {
        const inTrigger = triggerRef.current?.contains(e.target as Node);
        const inContent = contentRef.current?.contains(e.target as Node);
        const inSafeZone = isInSafeTriangle();

        isMouseInSafeZoneRef.current = inSafeZone;

        if (inTrigger || inContent || inSafeZone) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [isOpen, isTouchDevice]);

  const handleMouseEnter = () => {
    if (isTouchDevice) {
      return;
    }

    // Cancel any pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // Small delay to prevent flicker on quick mouse movements
    if (!(isOpen || openTimeoutRef.current)) {
      openTimeoutRef.current = setTimeout(() => {
        setIsOpen(true);
        openTimeoutRef.current = null;
      }, openDelay);
    }
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) {
      return;
    }

    // Cancel any pending open
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    // Start close timeout - gives time for safe triangle check
    closeTimeoutRef.current = setTimeout(() => {
      // Final check before closing
      if (!isMouseInSafeZoneRef.current) {
        setIsOpen(false);
      }
      closeTimeoutRef.current = null;
    }, closeDelay);
  };

  const handleContentMouseEnter = () => {
    if (isTouchDevice) {
      return;
    }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleContentMouseLeave = () => {
    if (isTouchDevice) {
      return;
    }

    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, openDelay);
  };

  // Touch devices: allow click/keyboard to toggle. Desktop: ignore opens (hover only),
  // but allow closes (outside click / Escape) and keyboard opens to be reflected.
  const handleOpenChange = (open: boolean) => {
    if (isTouchDevice) {
      setIsOpen(open);
      return;
    }
    if (!open) {
      setIsOpen(false);
      return;
    }
    if (lastInteractionRef.current === "keyboard") {
      setIsOpen(true);
    }
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
