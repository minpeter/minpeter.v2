import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { VercelToolbar } from "@vercel/toolbar/next";
import { NextProvider } from "fumadocs-core/framework/next";
import type { Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next";

import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { AritaBuriLocalFont } from "@/shared/font.AritaBuri";
import styles from "@/shared/styles/header-overlay.module.css";
import NewMetadata from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

import "./globals.css";

export const metadata = NewMetadata({
  title: "minpeter",
  description: "이 웹에서 가장 멋진 사이트가 될거야~",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  colorScheme: "light dark",
};

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shouldInjectToolbar = process.env.NODE_ENV === "development";

  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={cn(
          AritaBuriLocalFont.variable,
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
            <NuqsAdapter>
              <main
                className={cn(
                  "font-sans",
                  "relative mx-auto min-h-screen w-full max-w-3xl px-4 py-8"
                )}
              >
                <div
                  className={cn(
                    styles.scroll_responsive_header,
                    "pointer-events-none fixed inset-x-0 top-0 z-10 h-40"
                  )}
                />

                {children}
                {shouldInjectToolbar && <VercelToolbar />}
              </main>

              <Footer />
            </NuqsAdapter>
          </ThemeProvider>
        </NextProvider>
      </body>
      {process.env.NODE_ENV === "production" && process.env.VERCEL && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
      <GoogleAnalytics gaId="G-8L34G6HSJS" />
    </html>
  );
}
