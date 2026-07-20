// react-doctor configuration.
// File name and schema confirmed against react-doctor@0.8.1 (dist/cli.js
// CONFIG_BASENAME / dist/index.d.ts ReactDoctorConfig). The
// `ReactDoctorConfig` type is intentionally NOT imported from
// "react-doctor/api": react-doctor runs via `npx react-doctor@latest` and is
// not a project dependency, so the import would fail `tsc --noEmit`. The
// object below mirrors that interface structurally.
//
// Exclusion policy: code fixes are preferred; exclusions below exist only
// where a rule conflicts with vendored code or a framework-mandated pattern.
// Each entry states its justification inline.

export default {
  ignore: {
    // components/ui/** is vendored shadcn/ui (see components.json —
    // "ui": "@/components/ui"). These files are generated and owned by the
    // upstream shadcn CLI: local edits are discarded on the next component
    // add/upgrade, so project React rules must not demand refactors of
    // upstream code. This matches the project's existing lint convention:
    // oxlint.config.ts sets `ignorePatterns: core.ignorePatterns`, excluding
    // code the project does not own (build output, generated files) from
    // the project's own lint scope.
    //
    // Suppresses, in vendored files only:
    //   - react-doctor/no-pass-data-to-parent       carousel.tsx:105 — embla
    //   - react-doctor/no-pass-live-state-to-parent carousel.tsx:105 — carousel
    //     API sync (setApi/onSelect effects) is embla's required wiring.
    //   - react-doctor/no-prop-callback-in-effect   carousel.tsx:105 — same.
    //   - react-hooks-js/set-state-in-effect        carousel.tsx:112 — same.
    //   - deslop/unused-file                        aspect-ratio.tsx — kept as
    //     part of the vendored shadcn set; deleting upstream-managed files
    //     individually breaks the managed-directory convention.
    files: ["components/ui/**"],

    overrides: [
      {
        // Framework convention (next-intl): createNavigation(routing) returns
        // the full locale-aware navigation API — Link, redirect, usePathname,
        // useRouter, getPathname — and the documented pattern is to destructure
        // and re-export all of it so consumers import from one stable module
        // (@/shared/i18n/navigation). redirect/useRouter/getPathname have no
        // current importer, but dropping them would make this wrapper
        // incomplete vs the next-intl API it mirrors and force a re-edit here
        // the first time a locale-aware redirect is needed. Unused members are
        // deliberate API surface, not dead code.
        files: ["shared/i18n/navigation.ts"],
        rules: ["deslop/unused-export"],
      },
      {
        // Framework-mandated pattern (next-intl): getRequestConfig must load
        // locale messages via dynamic imports with an interpolated path —
        // `await import(`./${locale}.json`)` — because the locale is only known
        // at request time. Bundlers still code-split this correctly (webpack/
        // turbopack context import over the locales directory); the rule's
        // suggested "plain string path" cannot express per-request locale
        // selection. No user-code alternative exists.
        files: ["shared/i18n/request.ts"],
        rules: ["react-doctor/no-dynamic-import-path"],
      },
    ],
  },
};
