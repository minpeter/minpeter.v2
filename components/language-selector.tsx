"use client";

import {
  Content,
  Item,
  Portal,
  Root,
  Trigger,
} from "@radix-ui/react-dropdown-menu";
import { GlobeIcon } from "@radix-ui/react-icons";
import { useLocale } from "next-intl";
import { LOCALE_LABELS } from "@/shared/constants/locales";
import { useHoverDropdown } from "@/shared/hooks/use-hover-dropdown";
import { Link, usePathname } from "@/shared/i18n/navigation";
import { routing } from "@/shared/i18n/routing";
import { cn } from "@/shared/utils/tailwind";

export function LanguageSelector() {
  const locale = useLocale();
  const pathname = usePathname();

  const {
    isOpen,
    setIsOpen,
    triggerRef,
    contentRef,
    handleMouseEnter,
    handleMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    handleTriggerClick,
    handleOpenChange,
  } = useHoverDropdown();

  const currentLabel =
    LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS] || LOCALE_LABELS.ko;

  return (
    <Root modal={false} onOpenChange={handleOpenChange} open={isOpen}>
      <Trigger asChild>
        <button
          aria-label="Select language"
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-sm",
            "text-gray-500 hover:bg-secondary hover:text-primary",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          onClick={handleTriggerClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
          className={cn(
            "z-50 min-w-[120px] rounded-md border border-border bg-background p-1 shadow-md",
            "fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 animate-in data-[state=closed]:animate-out",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          )}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
          ref={contentRef}
          sideOffset={5}
        >
          {routing.locales.map((l) => {
            const isActive = locale === l;
            const label = LOCALE_LABELS[l] || { short: l, native: l };

            return (
              <Item asChild key={l}>
                <Link
                  className={cn(
                    "block w-full cursor-pointer rounded-sm px-3 py-2 text-left text-sm",
                    "transition-colors duration-150",
                    "focus:outline-none",
                    {
                      "bg-secondary font-medium text-primary": isActive,
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
              </Item>
            );
          })}
        </Content>
      </Portal>
    </Root>
  );
}
