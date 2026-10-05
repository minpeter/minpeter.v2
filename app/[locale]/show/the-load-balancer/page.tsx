import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { ShowcaseProjectCollection } from "@/components/showcase-project-collection";
import { createMetadata } from "@/shared/utils/metadata";

// KiroLB and InferX retain their wordmarks; Token Hub pairs its original H with outlined lettering.
import inferxAnalytics from "./assets/inferx-analytics.webp";
import inferxAnalyticsDark from "./assets/inferx-analytics-dark.webp";
import inferxOverview from "./assets/inferx-overview.webp";
import inferxOverviewDark from "./assets/inferx-overview-dark.webp";
import inferxUsage from "./assets/inferx-usage.webp";
import inferxUsageDark from "./assets/inferx-usage-dark.webp";
import inferxWordmark from "./assets/inferx-wordmark.svg";
import kiroLbAccounts from "./assets/kiro-lb-accounts.webp";
import kiroLbAccountsDark from "./assets/kiro-lb-accounts-dark.webp";
import kiroLbOverview from "./assets/kiro-lb-overview.webp";
import kiroLbOverviewDark from "./assets/kiro-lb-overview-dark.webp";
import kiroLbSettings from "./assets/kiro-lb-settings.webp";
import kiroLbSettingsDark from "./assets/kiro-lb-settings-dark.webp";
import kiroLbWordmark from "./assets/kiro-lb-wordmark.svg";
import tokenHubModels from "./assets/token-hub-models.webp";
import tokenHubModelsDark from "./assets/token-hub-models-dark.webp";
import tokenHubOverview from "./assets/token-hub-overview.webp";
import tokenHubOverviewDark from "./assets/token-hub-overview-dark.webp";
import tokenHubRequests from "./assets/token-hub-requests.webp";
import tokenHubRequestsDark from "./assets/token-hub-requests-dark.webp";
import tokenHubWordmark from "./assets/token-hub-wordmark.svg";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("showcase.items.loadBalancer"),
  ]);

  return createMetadata({
    description: t("summary"),
    locale,
    path: "/show/the-load-balancer",
    title: `minpeter | ${t("title")}`,
  });
}

export default async function Page() {
  const t = await getTranslations("showcase.items.loadBalancer");

  return (
    <ShowcaseProjectCollection
      description={t("description")}
      kicker={t("kicker")}
      projects={[
        {
          description: t("tokenhub.description"),
          details: [
            { label: t("connectionLabel"), value: t("tokenhub.connection") },
            { label: t("settingsLabel"), value: t("tokenhub.settings") },
          ],
          label: t("tokenhub.label"),
          name: "Tokenhub",
          screenshots: [
            {
              alt: t("tokenhub.screenAlt"),
              darkImage: tokenHubOverviewDark,
              image: tokenHubOverview,
              label: t("screens.overview"),
            },
            {
              alt: t("tokenhub.modelsAlt"),
              darkImage: tokenHubModelsDark,
              image: tokenHubModels,
              label: t("screens.models"),
            },
            {
              alt: t("tokenhub.requestsAlt"),
              darkImage: tokenHubRequestsDark,
              image: tokenHubRequests,
              label: t("screens.requests"),
            },
          ],
          wordmark: tokenHubWordmark,
        },
        {
          description: t("kiroLb.description"),
          details: [
            { label: t("connectionLabel"), value: t("kiroLb.connection") },
            { label: t("settingsLabel"), value: t("kiroLb.settings") },
          ],
          href: "https://github.com/minpeter/kiro-lb",
          name: "kiro-lb",
          screenshots: [
            {
              alt: t("kiroLb.screenAlt"),
              darkImage: kiroLbOverviewDark,
              image: kiroLbOverview,
              label: t("screens.overview"),
            },
            {
              alt: t("kiroLb.accountsAlt"),
              darkImage: kiroLbAccountsDark,
              image: kiroLbAccounts,
              label: t("screens.accounts"),
            },
            {
              alt: t("kiroLb.settingsAlt"),
              darkImage: kiroLbSettingsDark,
              image: kiroLbSettings,
              label: t("screens.settings"),
            },
          ],
          wordmark: kiroLbWordmark,
        },
        {
          description: t("inferx.description"),
          details: [
            { label: t("connectionLabel"), value: t("inferx.connection") },
            { label: t("settingsLabel"), value: t("inferx.settings") },
          ],
          href: "https://github.com/inferxhq",
          name: "InferX",
          screenshots: [
            {
              alt: t("inferx.screenAlt"),
              darkImage: inferxOverviewDark,
              image: inferxOverview,
              label: t("screens.overview"),
            },
            {
              alt: t("inferx.usageAlt"),
              darkImage: inferxUsageDark,
              image: inferxUsage,
              label: t("screens.usage"),
            },
            {
              alt: t("inferx.analyticsAlt"),
              darkImage: inferxAnalyticsDark,
              image: inferxAnalytics,
              label: t("screens.analytics"),
            },
          ],
          wordmark: inferxWordmark,
        },
      ]}
      title={t("title")}
    />
  );
}
