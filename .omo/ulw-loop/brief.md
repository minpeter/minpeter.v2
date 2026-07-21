# Brief: Max out react-doctor and Lighthouse scores on refactor/deslop-dx

Continuation of PR #79 (deslop branch). Two goals, HEAVY tier (cross-domain refactor, user demanded maximum rigor and browser self-verification).

## Goal 1: react-doctor score 100
Baseline (captured): 61 on main, 63 on this branch; 38 issues (2 errors, 36 warnings).
Fix or justifiably exclude every remaining issue:
- 19x react-compiler-no-manual-memoization (remove manual useMemo/useCallback; React Compiler is enabled via babel-plugin-react-compiler)
- 4x components/ui/carousel.tsx (shadcn vendored — fix or config-exclude with justification)
- 1x react-grab.tsx react-compiler todo error (compiler BuildHIR limitation — rewrite or exclude)
- 3x shared/i18n/navigation.ts unused-export (next-intl convention), 3x request.ts no-dynamic-import-path (next-intl message loading)
- 2x js-hoist-intl (hoist Intl.DateTimeFormat), 2x mod-code-block only-export-components, 1x loading.tsx array-index key
Success criterion: `npx react-doctor . -y --json` reports score 100 with zero errors and zero warnings; every config exclusion carries a written justification; vitest+tsc+build stay green.
STOP when: react-doctor reports 100 with all exclusions justified and all gates green.

## Goal 2: Lighthouse 100 in all categories on all pages, browser-verified
Serve the production build and run real-browser Lighthouse audits (Playwright chromium at ~/.cache/ms-playwright).
Success criteria: every audited route scores 100 in Performance, Accessibility, Best Practices, SEO; cover all distinct page archetypes across ko/en/ja (home, blog list, blog posts, show index + each showcase experiment, resume, 404); audit JSON + screenshots captured as evidence; fix whatever blocks 100 (a11y contrast, meta, image sizing, render-blocking, etc.) while keeping vitest+tsc+build green.
STOP when: the full audited route set shows 100x4 in captured Lighthouse reports.
