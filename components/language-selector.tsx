"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { GlobeIcon } from "@radix-ui/react-icons";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/shared/i18n/navigation";
import { routing } from "@/shared/i18n/routing";
import { cn } from "@/shared/utils/tailwind";

const LOCALE_LABELS: Record<string, { short: string; native: string }> = {
  ko: { short: "KO", native: "한국어" },
  en: { short: "EN", native: "English" },
  ja: { short: "JA", native: "日本語" },
};

// Check if point is inside triangle using barycentric coordinates
function isPointInTriangle(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number
): boolean {
  const v0x = cx - ax;
  const v0y = cy - ay;
  const v1x = bx - ax;
  const v1y = by - ay;
  const v2x = px - ax;
  const v2y = py - ay;

  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;

  const denom = dot00 * dot11 - dot01 * dot01;
  if (denom === 0) return false;

  const invDenom = 1 / denom;
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

  return u >= 0 && v >= 0 && u + v <= 1;
}

export function LanguageSelector() {
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMouseInSafeZoneRef = useRef(false);

  const currentLabel = LOCALE_LABELS[locale] || LOCALE_LABELS.ko;

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Check if mouse is in safe triangle zone
  const isInSafeTriangle = useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return false;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const { x: mx, y: my } = mousePositionRef.current;

    // Trigger center point (apex of triangle)
    const tx = triggerRect.left + triggerRect.width / 2;
    const ty = triggerRect.bottom;

    // Content corners (base of triangle) - expand slightly for better UX
    const padding = 20;
    const c1x = contentRect.left - padding;
    const c1y = contentRect.top;
    const c2x = contentRect.right + padding;
    const c2y = contentRect.top;

    return isPointInTriangle(mx, my, tx, ty, c1x, c1y, c2x, c2y);
  }, []);

  // Handle mouse movement for safe triangle
  useEffect(() => {
    if (!isOpen || isTouchDevice) return;

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

  const handleMouseEnter = () => {
    if (isTouchDevice) return;

    // Cancel any pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // Small delay to prevent flicker on quick mouse movements
    if (!isOpen && !openTimeoutRef.current) {
      openTimeoutRef.current = setTimeout(() => {
        setIsOpen(true);
        openTimeoutRef.current = null;
      }, 50);
    }
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;

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
    }, 100);
  };

  const handleContentMouseEnter = () => {
    if (isTouchDevice) return;

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleContentMouseLeave = () => {
    if (isTouchDevice) return;

    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, 50);
  };

  // For touch devices, toggle on click
  const handleTriggerClick = () => {
    if (isTouchDevice) {
      setIsOpen((prev) => !prev);
    }
  };

  // Handle Radix's onOpenChange - only use for touch devices
  const handleOpenChange = (open: boolean) => {
    // On PC, we control state via hover handlers, ignore Radix's changes
    if (!isTouchDevice) return;
    setIsOpen(open);
  };

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          ref={triggerRef}
          aria-label="Select language"
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-sm",
            "text-gray-500 hover:bg-secondary hover:text-primary",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          type="button"
          onClick={handleTriggerClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <GlobeIcon className="h-3.5 w-3.5" />
          <span>{currentLabel.short}</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          ref={contentRef}
          align="end"
          className={cn(
            "z-50 min-w-[120px] rounded-md border border-border bg-background p-1 shadow-md",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          )}
          sideOffset={5}
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {routing.locales.map((l) => {
            const isActive = locale === l;
            const label = LOCALE_LABELS[l] || { short: l, native: l };

            return (
              <DropdownMenu.Item asChild key={l}>
                <Link
                  className={cn(
                    "block w-full cursor-pointer rounded-sm px-3 py-2 text-left text-sm",
                    "transition-colors duration-150",
                    "focus:outline-none",
                    {
                      "bg-secondary text-primary font-medium": isActive,
                      "text-muted-foreground hover:bg-secondary hover:text-primary focus:bg-secondary focus:text-primary":
                        !isActive,
                    }
                  )}
                  href={pathname}
                  locale={l}
                  onClick={() => setIsOpen(false)}
                >
                  {label.native}
                </Link>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
