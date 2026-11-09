"use client";

import { useEffect } from "react";

import { holdStoreThemeColor } from "@/shared/theme-init";

export function StoreThemeColor() {
  useEffect(() => holdStoreThemeColor(), []);

  return null;
}
