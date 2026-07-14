import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { VercelToolbar } from "@vercel/toolbar/next";
import { NextProvider } from "fumadocs-core/framework/next";
import { Geist, Geist_Mono, Shippori_Mincho } from "next/font/google";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next";
import { Suspense } from "react";
import type { ReactNode } from "react";

import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { env } from "@/shared/env";
import { AritaBuriLocalFont } from "@/shared/font.AritaBuri";
import { cn } from "@/shared/utils/tailwind";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  weight: ["400", "500", "600"],
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  variable: "--font-shippori-mincho",
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
          geist.variable,
          "flex min-h-screen flex-col antialiased"
        )}
      >
        <NextProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <Suspense>
              <NuqsAdapter>
                <main
                  className={cn(
                    "font-sans",
                    "relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 sm:px-8 lg:px-12"
                  )}
                >
                  {children}
                  {shouldInjectDevTools ? <VercelToolbar /> : null}
                </main>

                <Footer locale={lang} />
              </NuqsAdapter>
            </Suspense>
          </ThemeProvider>
        </NextProvider>
        {isProduction && isVercel ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
      <GoogleAnalytics gaId="G-8L34G6HSJS" />
    </html>
  );
}
