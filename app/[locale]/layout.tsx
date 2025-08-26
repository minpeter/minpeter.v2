import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { VercelToolbar } from "@vercel/toolbar/next";

import { RootProvider } from "fumadocs-ui/provider";
import { NuqsAdapter } from "nuqs/adapters/next";
import localFont from "next/font/local";
import { I18nProvider } from "fumadocs-ui/i18n";

import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProviderClient } from "@/locales/client";
import NewMetadata from "@/lib/metadata";
import { cn } from "@/lib/utils";

import "./global.css";

export const metadata = NewMetadata({
  title: "minpeter",
  description: "이 웹에서 가장 멋진 사이트가 될거야~",
});

const FontSans = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/AritaBuri-Medium.woff2",
      weight: "400",
      style: "normal",
    },
  ],
});

import { getStaticParams } from "@/locales/server";

export function generateStaticParams() {
  return getStaticParams();
}

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await params;
  const shouldInjectToolbar = process.env.NODE_ENV === "development";

  return (
    <html
      lang={locale ? locale : "ko"}
      className={cn("antialiased", FontSans.className)}
      suppressHydrationWarning
    >
      <body>
        <I18nProviderClient locale={locale}>
          <I18nProvider locale={locale}>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <RootProvider>
                <NuqsAdapter>
                  <main className="relative mx-auto min-h-screen w-full max-w-3xl px-4 py-24">
                    <div className="from-background pointer-events-none fixed inset-x-0 top-0 z-10 h-24 bg-linear-to-b to-transparent" />
                    {children}
                    {shouldInjectToolbar && <VercelToolbar />}
                  </main>

                  <Footer />
                </NuqsAdapter>
              </RootProvider>
            </ThemeProvider>
          </I18nProvider>
        </I18nProviderClient>
      </body>
      <Analytics />
      <SpeedInsights />
      <GoogleAnalytics gaId="G-8L34G6HSJS" />
    </html>
  );
}
