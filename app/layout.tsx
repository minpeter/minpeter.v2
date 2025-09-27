import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { VercelToolbar } from "@vercel/toolbar/next";

import { RootProvider } from "fumadocs-ui/provider";
import { NuqsAdapter } from "nuqs/adapters/next";
import { NextProvider } from "fumadocs-core/framework/next";

import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProviderClient } from "@/locales/client";
import { AritaBuriLocalFont } from "@/lib/font.AritaBuri";
import { getStaticParams } from "@/locales/server";
import { cn } from "@/lib/tw-utils";
import NewMetadata from "@/lib/metadata";

import "./globals.css";

export const metadata = NewMetadata({
  title: "minpeter",
  description: "이 웹에서 가장 멋진 사이트가 될거야~",
});

export function generateStaticParams() {
  return getStaticParams();
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldInjectToolbar = process.env.NODE_ENV === "development";

  return (
    <html
      suppressHydrationWarning
      className={cn(AritaBuriLocalFont.variable, "font-aritaburi antialiased")}
    >
      <body>
        <NextProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <NuqsAdapter>
              <main className="relative mx-auto min-h-screen w-full max-w-3xl px-4 py-24">
                <div className="from-background pointer-events-none fixed inset-x-0 top-0 z-10 h-24 bg-linear-to-b to-transparent" />
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
