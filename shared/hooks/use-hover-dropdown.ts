"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isPointInTriangle } from "@/shared/utils/geometry";

interface UseHoverDropdownOptions {
  openDelay?: number;
  closeDelay?: number;
  safeTrianglePadding?: number;
}

interface UseHoverDropdownReturn {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isTouchDevice: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleContentMouseEnter: () => void;
  handleContentMouseLeave: () => void;
  handleTriggerClick: () => void;
  handleOpenChange: (open: boolean) => void;
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
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMouseInSafeZoneRef = useRef(false);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Check if mouse is in safe triangle zone
  const isInSafeTriangle = useCallback(() => {
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
  }, [safeTrianglePadding]);

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
  }, [isOpen, isTouchDevice, isInSafeTriangle]);

  const handleMouseEnter = useCallback(() => {
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
  }, [isTouchDevice, isOpen, openDelay]);

  const handleMouseLeave = useCallback(() => {
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
  }, [isTouchDevice, closeDelay]);

  const handleContentMouseEnter = useCallback(() => {
    if (isTouchDevice) {
      return;
    }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, [isTouchDevice]);

  const handleContentMouseLeave = useCallback(() => {
    if (isTouchDevice) {
      return;
    }

    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, openDelay);
  }, [isTouchDevice, openDelay]);

  // For touch devices, toggle on click
  const handleTriggerClick = useCallback(() => {
    if (isTouchDevice) {
      setIsOpen((prev) => !prev);
    }
  }, [isTouchDevice]);

  // Handle Radix's onOpenChange - only use for touch devices
  const handleOpenChange = useCallback(
    (open: boolean) => {
      // On PC, we control state via hover handlers, ignore Radix's changes
      if (!isTouchDevice) {
        return;
      }
      setIsOpen(open);
    },
    [isTouchDevice]
  );

  return {
    isOpen,
    setIsOpen,
    isTouchDevice,
    triggerRef,
    contentRef,
    handleMouseEnter,
    handleMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    handleTriggerClick,
    handleOpenChange,
  };
}
