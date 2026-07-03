import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { VercelToolbar } from "@vercel/toolbar/next";
import { NextProvider } from "fumadocs-core/framework/next";
import { Geist_Mono, Shippori_Mincho } from "next/font/google";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next";
import { type ReactNode, Suspense } from "react";

import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { env } from "@/shared/env";
import { AritaBuriLocalFont } from "@/shared/font.AritaBuri";
import styles from "@/shared/styles/header-overlay.module.css";
import { cn } from "@/shared/utils/tailwind";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const REACT_GRAB_SCRIPT_SRC =
  "https://unpkg.com/react-grab@0.1.47/dist/index.global.js";
const REACT_GRAB_SCRIPT_INTEGRITY =
  "sha256-N9ZzcnqywEotWZk5PhMpU5N3zfVzXaABUWaqjSqVWJw=";

interface RootDocumentProps {
  readonly children: ReactNode;
  readonly lang: string;
}

export function RootDocument({ children, lang }: RootDocumentProps) {
  const shouldInjectDevTools = env.NODE_ENV === "development";
  const isProduction = env.NODE_ENV === "production";
  const isVercel = !!env.VERCEL_ENV;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {shouldInjectDevTools ? (
          <Script
            crossOrigin="anonymous"
            integrity={REACT_GRAB_SCRIPT_INTEGRITY}
            src={REACT_GRAB_SCRIPT_SRC}
            strategy="beforeInteractive"
          />
        ) : null}
      </head>
      <body
        className={cn(
          AritaBuriLocalFont.variable,
          shipporiMincho.variable,
          geistMono.variable,
          "antialiased"
        )}
      >
        <NextProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
            enableSystem
          >
            <Suspense>
              <NuqsAdapter>
                <main
                  className={cn(
                    "font-sans",
                    "relative mx-auto min-h-screen w-full max-w-3xl px-4 py-8"
                  )}
                >
                  <div
                    aria-hidden="true"
                    className={styles["header-overlay-root"]}
                  />
                  {children}
                  {shouldInjectDevTools ? <VercelToolbar /> : null}
                </main>

                <Footer />
              </NuqsAdapter>
            </Suspense>
          </ThemeProvider>
        </NextProvider>
        {isProduction && isVercel ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : (
          <Analytics debug={false} />
        )}
      </body>
      <GoogleAnalytics gaId="G-8L34G6HSJS" />
    </html>
  );
}
