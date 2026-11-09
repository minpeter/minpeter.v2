"use client";

import { useEffect } from "react";

import { ensurePretendardFonts } from "@/shared/theme-init";

export function PretendardFontLoader() {
  useEffect(() => {
    ensurePretendardFonts();
  }, []);

  return null;
}
