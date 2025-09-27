import { statsigAdapter, type StatsigUser } from "@flags-sdk/statsig";
import type { Identify } from "flags";
import { flag, dedupe } from "flags/next";

export const identify = dedupe((async () => ({
  customIDs: { stableID: "1234" },
  // add any additional user properties you collect here
})) satisfies Identify<StatsigUser>);

export const createFeatureGate = (key: string) =>
  flag<boolean, StatsigUser>({
    key,
    adapter: statsigAdapter.featureGate((gate) => gate.value, {
      exposureLogging: true,
    }),
    identify,
  });
