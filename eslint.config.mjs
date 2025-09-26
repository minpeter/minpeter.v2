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
  }),
];

export default eslintConfig;
