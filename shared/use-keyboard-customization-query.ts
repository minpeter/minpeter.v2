"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  HOUSING_OPTIONS,
  type HousingId,
  KEYCAP_OPTIONS,
  type KeycapId,
} from "@/shared/keyboard-customization";

interface CustomizationSelection {
  customize: boolean;
  housing: HousingId;
  keycaps: KeycapId;
}

const DEFAULTS: CustomizationSelection = {
  customize: false,
  housing: "bone-white",
  keycaps: "retro-programmer-retail",
};
const QUERY_KEYS = ["customize", "housing", "keycaps"] as const;
const CHANGE_EVENT = "keyboard-customization-query-change";

function parseSelection(search: string): CustomizationSelection {
  const params = new URLSearchParams(search);
  return {
    customize: params.get("customize") === "true",
    housing:
      HOUSING_OPTIONS.find((option) => option.id === params.get("housing"))
        ?.id ?? DEFAULTS.housing,
    keycaps:
      KEYCAP_OPTIONS.find((option) => option.id === params.get("keycaps"))
        ?.id ?? DEFAULTS.keycaps,
  };
}

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function getSnapshot() {
  return window.location.search;
}

/** Keep selection tied to the actual history entry, including restored cached routes. */
export function useKeyboardCustomizationQuery() {
  const serverParams = useSearchParams();
  const serverSearch = serverParams.toString();
  const getServerSnapshot = useCallback(
    () => (serverSearch ? `?${serverSearch}` : ""),
    [serverSearch]
  );
  const search = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const selection = useMemo(() => parseSelection(search), [search]);
  const setSelection = useCallback((patch: Partial<CustomizationSelection>) => {
    const url = new URL(window.location.href);
    for (const key of QUERY_KEYS) {
      const value = patch[key];
      if (value === undefined) {
        continue;
      }
      if (value === DEFAULTS[key]) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    }
    if (url.href === window.location.href) {
      return;
    }
    // Next supports native history updates. Do not push again during popstate.
    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [selection, setSelection] as const;
}
