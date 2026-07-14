import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import vitest from "ultracite/oxlint/vitest";

const vitestPreset: typeof vitest = {
  ...vitest,
  overrides: vitest.overrides?.map((override) => ({
    ...override,
    rules: {
      ...override.rules,
      "vitest/max-expects": "warn",
      "vitest/prefer-called-with": "off",
      "vitest/prefer-to-be": "warn",
      "vitest/prefer-to-be-falsy": "warn",
      "vitest/prefer-to-be-truthy": "warn",
      "vitest/require-mock-type-parameters": "warn",
      "vitest/require-top-level-describe": "warn",
    },
  })),
};

export default defineConfig({
  extends: [core, next, vitestPreset],
  ignorePatterns: core.ignorePatterns,
  // Preserve established project conventions while retaining every Ultracite
  // preset. These style rules are warnings until their large-scale refactor is
  // scheduled; correctness and framework rules remain errors.
  rules: {
    "eslint/func-style": "warn",
    "eslint/no-inline-comments": "warn",
    "eslint/no-negated-condition": "warn",
    "eslint/no-use-before-define": "warn",
    "eslint/no-useless-rename": "warn",
    "eslint/prefer-named-capture-group": "warn",
    "eslint/require-unicode-regexp": "warn",
    "import/newline-after-import": "warn",
    "import/no-named-as-default-member": "warn",
    "jsdoc/require-param-description": "warn",
    "jsdoc/require-returns-description": "warn",
    "promise/prefer-await-to-then": "warn",
    "unicorn/consistent-function-scoping": "warn",
    "unicorn/no-array-reduce": "warn",
    "unicorn/no-await-expression-member": "warn",
    "unicorn/no-immediate-mutation": "warn",
    "unicorn/no-negated-condition": "warn",
    "unicorn/no-useless-undefined": "warn",
    "unicorn/prefer-dom-node-remove": "warn",
    "unicorn/prefer-string-replace-all": "warn",
  },
});
