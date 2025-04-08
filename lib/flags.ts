import { flag } from "flags/next";

export const exampleFlag = flag({
  key: "example-flag",
  description: "An example feature flag",
  decide() {
    return false;
  },
});
