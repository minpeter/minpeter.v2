"use client";

import Script from "next/script";

export const ReactGrab = () => (
  <Script
    crossOrigin="anonymous"
    src="https://unpkg.com/react-grab@0.1.48/dist/index.global.js"
    strategy="afterInteractive"
  />
);
