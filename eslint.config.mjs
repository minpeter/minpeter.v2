import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  {
    // Ignore generated/build artifacts
    ignores: ["**/.next/**", "**/.next-dev/**", "next-env.d.ts", ".source/**"],
  },
  ...compat.config({
    extends: ["next", "next/core-web-vitals", "next/typescript", "prettier"],
    plugins: ["import"],
    rules: {
      // Import order rules
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Node.js built-in modules
            "external", // External packages
            "internal", // Internal modules (configured via pathGroups)
            ["parent", "sibling"], // Parent and sibling imports
            "index", // Index imports
          ],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
    },
  }),
];

export default eslintConfig;
