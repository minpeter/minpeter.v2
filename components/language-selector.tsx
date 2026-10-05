"use client";

import {
  Content,
  Item,
  Portal,
  Root,
  Trigger,
} from "@radix-ui/react-dropdown-menu";
import { GlobeIcon } from "@radix-ui/react-icons";
import { useLocale, useTranslations } from "next-intl";
import { type PointerEvent, useCallback, useRef } from "react";

import { LOCALE_LABELS } from "@/shared/constants/locales";
import { useHoverDropdown } from "@/shared/hooks/use-hover-dropdown";
import { getPathname, usePathname } from "@/shared/i18n/navigation";
import { routing } from "@/shared/i18n/routing";
import { cn } from "@/shared/utils/tailwind";

function preventCloseAutoFocus(event: Event) {
  event.preventDefault();
}

export function LanguageSelector() {
  const locale = useLocale();
  const t = useTranslations("common");
  const pathname = usePathname();
  const touchOpen = useRef<boolean | null>(null);

  const {
    isOpen,
    triggerRef,
    contentRef,
    handleMouseEnter,
    handleMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    handleOpenChange,
  } = useHoverDropdown();

  const handleTriggerPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "touch") {
        // Opening on touch-down can send the release click to a menu item.
        // Capture the toggle before Radix can dismiss the menu on touch-up.
        touchOpen.current = !isOpen;
        event.preventDefault();
      } else {
        touchOpen.current = null;
      }
    },
    [isOpen]
  );

  const handleTriggerClick = useCallback(() => {
    if (touchOpen.current !== null) {
      handleOpenChange(touchOpen.current);
      touchOpen.current = null;
    }
  }, [handleOpenChange]);

  const currentLabel = LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS];

  return (
    <Root modal={false} onOpenChange={handleOpenChange} open={isOpen}>
      <Trigger asChild>
        <button
          aria-label={`${currentLabel.short} - ${t("selectLanguage")}`}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground text-sm transition-colors duration-150 hover:bg-secondary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="language-selector"
          onClick={handleTriggerClick}
          onPointerDown={handleTriggerPointerDown}
          onPointerEnter={handleMouseEnter}
          onPointerLeave={handleMouseLeave}
          ref={triggerRef}
          type="button"
        >
          <GlobeIcon className="h-3.5 w-3.5" />
          <span>{currentLabel.short}</span>
        </button>
      </Trigger>

      <Portal>
        <Content
          align="end"
          className="fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[120px] animate-in rounded-md border border-border bg-background p-1 shadow-md data-[state=closed]:animate-out"
          onCloseAutoFocus={preventCloseAutoFocus}
          onPointerEnter={handleContentMouseEnter}
          onPointerLeave={handleContentMouseLeave}
          ref={contentRef}
          sideOffset={5}
        >
          {routing.locales.map((l) => {
            const isActive = locale === l;
            // Keep full document navigation to avoid aborted RSC streams in Next 16.
            // Even the default locale needs a prefix so middleware updates the
            // locale cookie before redirecting to the unprefixed URL.
            const href = getPathname({
              forcePrefix: true,
              href: pathname,
              locale: l,
            });

            return (
              <Item asChild key={l}>
                <a
                  className={cn(
                    "block w-full cursor-pointer rounded-sm px-3 py-2 text-left text-sm",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    {
                      "bg-secondary font-medium text-primary": isActive,
                      "text-muted-foreground hover:bg-secondary hover:text-primary focus:bg-secondary focus:text-primary":
                        !isActive,
                    }
                  )}
                  href={href}
                  lang={l}
                >
                  {LOCALE_LABELS[l].native}
                </a>
              </Item>
            );
          })}
        </Content>
      </Portal>
    </Root>
  );
}
