"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  STAND_COLOR_OPTIONS,
  STAND_VIEW_OPTIONS,
  type StandColorId,
  type StandViewId,
} from "@/shared/skateboard-stand";

interface StandSelection {
  color: StandColorId;
  view: StandViewId;
}

const DEFAULTS: StandSelection = {
  color: "bone-white",
  view: "board",
};
const QUERY_KEYS = ["color", "view"] as const;
const CHANGE_EVENT = "skateboard-stand-query-change";

function parseSelection(search: string): StandSelection {
  const params = new URLSearchParams(search);
  return {
    color:
      STAND_COLOR_OPTIONS.find((option) => option.id === params.get("color"))
        ?.id ?? DEFAULTS.color,
    view:
      STAND_VIEW_OPTIONS.find((option) => option.id === params.get("view"))
        ?.id ?? DEFAULTS.view,
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
export function useSkateboardStandQuery() {
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
  const setSelection = useCallback((patch: Partial<StandSelection>) => {
    const url = new URL(window.location.href);
    const next = { ...parseSelection(url.search), ...patch };
    for (const key of QUERY_KEYS) {
      url.searchParams.set(key, next[key]);
    }
    if (url.href === window.location.href) {
      return;
    }
    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [selection, setSelection] as const;
}
