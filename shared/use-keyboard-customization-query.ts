"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import {
  SELECTION_HOUSING_OPTIONS,
  SELECTION_KEYCAP_OPTIONS,
  type SelectionHousingId,
  type SelectionKeycapId,
} from "@/shared/keyboard-customization";

interface CustomizationSelection {
  housing: SelectionHousingId;
  keycaps: SelectionKeycapId;
}

const DEFAULTS: CustomizationSelection = {
  housing: "transparent",
  keycaps: "inventor",
};
const QUERY_KEYS = ["housing", "keycaps"] as const;
const CHANGE_EVENT = "keyboard-customization-query-change";

function parseSelection(search: string): CustomizationSelection {
  const params = new URLSearchParams(search);
  if (params.has("customize") && params.get("customize") !== "true") {
    return DEFAULTS;
  }
  const legacyRetail = params.get("customize") === "true";
  return {
    housing:
      SELECTION_HOUSING_OPTIONS.find(
        (option) => option.id === params.get("housing")
      )?.id ?? (legacyRetail ? "bone-white" : DEFAULTS.housing),
    keycaps:
      SELECTION_KEYCAP_OPTIONS.find(
        (option) => option.id === params.get("keycaps")
      )?.id ?? (legacyRetail ? "retro-programmer-retail" : DEFAULTS.keycaps),
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
  // Upgrade old mode URLs without adding a history entry or losing unrelated parameters.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.search !== search || !url.searchParams.has("customize")) {
      return;
    }
    const current = parseSelection(url.search);
    url.searchParams.delete("customize");
    for (const key of QUERY_KEYS) {
      url.searchParams.set(key, current[key]);
    }
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [search]);
  const setSelection = useCallback((patch: Partial<CustomizationSelection>) => {
    const url = new URL(window.location.href);
    const next = { ...parseSelection(url.search), ...patch };
    url.searchParams.delete("customize");
    for (const key of QUERY_KEYS) {
      url.searchParams.set(key, next[key]);
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
