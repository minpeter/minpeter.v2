# Full Dependency Upgrade + Feature Adoption + Refactoring (TDD)

## TL;DR

> **Quick Summary**: Upgrade all ~50 dependencies to latest stable, patch 7 CVEs, adopt Next.js 16.2/TS 6.0/fumadocs 16.7 new features, and refactor dead code — all with TDD.
> 
> **Deliverables**:
> - All dependencies at latest stable versions
> - 7 CVE security patches applied
> - New features adopted (Next.js experimental flags, TS 6.0, fumadocs renderer API)
> - Dead code removed, @ts-ignore resolved, zod import standardized
> - All existing 4 tests pass + new tests added
> 
> **Estimated Effort**: XL
> **Parallel Execution**: YES - 4 phases, multiple waves per phase
> **Critical Path**: Security patches → Safe minors → Major bumps (fumadocs search most risky) → Feature adoption → TS 6.0

---

## Context

### Original Request
Upgrade all Next.js and dependency patch notes to latest, adopt maximum new features, update all dependencies, refactor maximally. TDD approach.

### Interview Summary
**Key Discussions**:
- User wants maximum adoption — no specific exclusions
- TDD approach with vitest (infrastructure already exists)
- Project is a personal blog/portfolio with i18n (ko/en/ja), Three.js 3D models, blog search, typing practice

**Research Findings** (6 parallel librarian investigations):
- Next.js 16.1.2 → 16.2.1: 5 CVE patches, 87% faster dev server, prefetchInlining, SRI, browserToTerminal logging
- React 19.2.3 → 19.2.4: Server Actions DoS hardening
- fumadocs 16.4.7 → 16.7.5: Search client API redesign (biggest breaking change), renderer API slots
- TypeScript 5.9.3 → 6.0.2: Released March 23, 2026 — strict default, ES5 removed, many deprecations
- lucide-react 0.562.0 → 1.0.1: Brand icons removed, aria-hidden default
- axios 1.13.2 → 1.13.6: CVE-2026-25639 DoS vulnerability

### Metis Review
**Identified Gaps** (addressed):
- Zod import inconsistency: `source.config.ts` uses `"zod"`, `env.ts` uses `"zod/v4"` — both paths planned
- 4 test files exist (not 1): proxy.test.ts + 3 typing utility tests — all gated
- TS 6.0 ecosystem readiness unvalidated — deferred to final phase with escape hatch
- lucide-react brand icons: confirmed NOT used from lucide (brands come from @radix-ui/react-icons + react-icons/si)
- ultracite + biome compatibility: must verify before upgrading biome
- Missing packages added to plan (~10 previously untracked)
- Sugar-high v1.0.0: snapshot test BEFORE upgrade (TDD)
- fumadocs search: smoke test BEFORE upgrade (TDD)

---

## Work Objectives

### Core Objective
Upgrade all dependencies to latest stable versions while preserving existing functionality, adopt valuable new features, and clean up technical debt — using TDD to ensure zero regressions.

### Concrete Deliverables
- Updated `package.json` with all latest stable versions
- Updated `pnpm-lock.yaml`
- Modified config files: `next.config.ts`, `tsconfig.json`, `source.config.ts`, `biome.jsonc`
- Refactored source files to use new APIs
- New test files for pre-upgrade snapshots
- Cleaned dead code

### Definition of Done
- [ ] `pnpm check:types` passes
- [ ] `pnpm check:biome` passes
- [ ] `pnpm test` passes (all tests including new ones)
- [ ] `pnpm build` succeeds (includes postbuild sitemap)
- [ ] All 7 CVEs patched
- [ ] No `@ts-ignore` in codebase
- [ ] No commented-out dead code

### Must Have
- All security vulnerabilities patched (7 CVEs)
- All existing 4 test files pass after every commit
- Production build succeeds after every commit
- Blog search works end-to-end (API + client)
- Three.js Lickitung model renders
- i18n routing works for all 3 locales
- RSS feed generates correctly

### Must NOT Have (Guardrails)
- Do NOT adopt React `<Activity>` component (no concrete use case)
- Do NOT adopt Temporal types (polyfill ecosystem not ready)
- Do NOT add `remark-llms` plugin (new feature, separate PR)
- Do NOT refactor beyond identified targets (search.tsx removal, @ts-ignore fix, zod import, useEffectEvent in useHoverDropdown)
- Do NOT mix "upgrade" commits with "refactor" commits
- Do NOT upgrade more than one major-version package per task
- Do NOT touch the 3 typing utility test files content (they are regression safety net)
- Do NOT change business logic during dependency upgrades

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (vitest 4.0.17 → 4.1.1)
- **Automated tests**: TDD (write test → upgrade → verify)
- **Framework**: vitest
- **TDD**: Each major upgrade gets a pre-upgrade snapshot/smoke test

### QA Policy
Every task MUST run the full CI gate:
```bash
pnpm check:types && pnpm check:biome && pnpm test && pnpm build
```
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Build verification**: `pnpm build` (includes next-sitemap postbuild)
- **API verification**: `curl` against dev server for search, blog, i18n routes
- **Visual verification**: Playwright screenshots for homepage, blog, typing pages
- **Regression**: All 4 existing test files must pass

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — Security Patches + TDD Setup):
├── Task 1: Security patch — Next.js, React, axios, nuqs [quick]
├── Task 2: TDD setup — sugar-high highlight() snapshot test [quick]
├── Task 3: TDD setup — fumadocs search API smoke test [quick]

Wave 2 (After Wave 1 — Safe Minor Upgrades, MAX PARALLEL):
├── Task 4: Tailwind ecosystem — tailwindcss 4.2.2, @tailwindcss/postcss, tailwind-merge 3.5.0 [quick]
├── Task 5: Testing/dev tools — vitest 4.1.1, @vitest/ui, biome 2.4.8, ultracite 7.3.2 [quick]
├── Task 6: AI/Vercel ecosystem — ai 6.0.137, @friendliai/ai-provider 1.1.8, @vercel/toolbar 0.2.2, flags 4.0.5 [quick]
├── Task 7: Misc safe upgrades — next-intl 4.8.3, three 0.183.2, @types/three, zod 4.3.6, @t3-oss/env-nextjs 0.13.11, vite-tsconfig-paths 6.1.1 [quick]
├── Task 8: @next/* packages — @next/third-parties 16.2.1, @next/bundle-analyzer 16.2.1 [quick]

Wave 3 (After Wave 2 — Major Version Bumps, ONE AT A TIME):
├── Task 9: sugar-high 1.0.0 upgrade (TDD — snapshot already exists) [quick]
├── Task 10: lucide-react 1.0.1 upgrade + audit [unspecified-high]
├── Task 11: @vercel/analytics 2.0.1 + @vercel/speed-insights 2.0.0 [quick]
├── Task 12: fumadocs atomic upgrade — core 16.7.5, ui 16.7.5, mdx 14.2.11, docgen 3.0.8 [deep]
├── Task 13: knip 6.0.4 upgrade [quick]

Wave 4 (After Wave 3 — Feature Adoption + Refactoring):
├── Task 14: next.config.ts — adopt new experimental flags + logging [quick]
├── Task 15: Remove dead search.tsx + fix @ts-ignore in blog slug page [quick]
├── Task 16: Standardize zod imports — env.ts zod/v4 → zod [quick]
├── Task 17: useEffectEvent refactor in useHoverDropdown [quick]
├── Task 18: TypeScript 6.0.2 upgrade + tsconfig migration [deep]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 4-8, 2 | 1 |
| 2 | — | 9 | 1 |
| 3 | — | 12 | 1 |
| 4 | 1 | 14 | 2 |
| 5 | 1 | 13 | 2 |
| 6 | 1 | — | 2 |
| 7 | 1 | 16 | 2 |
| 8 | 1 | — | 2 |
| 9 | 2 | — | 3 |
| 10 | 1 | — | 3 |
| 11 | 1 | — | 3 |
| 12 | 3 | — | 3 |
| 13 | 5 | — | 3 |
| 14 | 4, 8 | 18 | 4 |
| 15 | 12 | — | 4 |
| 16 | 7 | 18 | 4 |
| 17 | 1 | — | 4 |
| 18 | 14, 16 | F1-F4 | 4 |
| F1-F4 | 18 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **3** — T1 → `quick`, T2 → `quick`, T3 → `quick`
- **Wave 2**: **5** — T4-T8 → `quick`
- **Wave 3**: **5** — T9 → `quick`, T10 → `unspecified-high`, T11 → `quick`, T12 → `deep`, T13 → `quick`
- **Wave 4**: **5** — T14-T17 → `quick`, T18 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Security Patches — Next.js 16.2.1, React 19.2.4, axios 1.13.6, nuqs 2.8.9

  **What to do**:
  - Run `pnpm add next@16.2.1 react@19.2.4 react-dom@19.2.4 axios@1.13.6 nuqs@2.8.9`
  - Also update `@types/react@latest` (19.2.8 → 19.2.14)
  - Verify no API changes needed (these are all patch-level for our usage)
  - Run full CI gate: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

  **Must NOT do**:
  - Do NOT change any source code — pure dependency version bump
  - Do NOT adopt new Next.js 16.2 features yet (separate task)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 4-8
  - **Blocked By**: None

  **References**:
  - `package.json:52-55` — Current next, react, react-dom versions
  - `package.json:38` — Current axios version
  - `package.json:54` — Current nuqs version
  - `package.json:70` — Current @types/react version
  - Next.js 16.2.1 release: CVE-2026-27977, CVE-2026-27978, CVE-2026-27979, CVE-2026-27980, CVE-2026-29057
  - axios CVE-2026-25639: DoS via `mergeConfig` __proto__ handling
  - nuqs CVE-2026-23864: dependency security fix

  **Acceptance Criteria**:
  - [ ] `pnpm check:types` passes
  - [ ] `pnpm check:biome` passes
  - [ ] `pnpm test` passes (all 4 test files)
  - [ ] `pnpm build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Security patches applied — verify package versions
    Tool: Bash
    Preconditions: Dependencies installed
    Steps:
      1. Run `pnpm list next react react-dom axios nuqs @types/react --depth=0`
      2. Assert next@16.2.1, react@19.2.4, react-dom@19.2.4, axios@1.13.6, nuqs@2.8.9, @types/react@19.2.14
      3. Run `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`
      4. Assert all pass with exit code 0
    Expected Result: All 6 packages at target versions, full CI gate passes
    Failure Indicators: Version mismatch, type errors, test failures, build failure
    Evidence: .sisyphus/evidence/task-1-security-versions.txt

  Scenario: Dev server starts successfully
    Tool: Bash
    Preconditions: Build succeeded
    Steps:
      1. Start dev server: `pnpm dev &` (background)
      2. Wait 10s for server startup
      3. Run `curl -s -o /dev/null -w '%{http_code}' http://localhost:8200/`
      4. Assert HTTP 200 or 307 (redirect to default locale)
      5. Kill dev server
    Expected Result: Dev server starts and responds
    Failure Indicators: Server crash, timeout, non-2xx/3xx response
    Evidence: .sisyphus/evidence/task-1-dev-server.txt
  ```

  **Commit**: YES
  - Message: `fix(deps): patch security vulnerabilities (CVE-2026-*)`
  - Files: `package.json`, `pnpm-lock.yaml`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 2. TDD Setup — sugar-high highlight() Snapshot Test

  **What to do**:
  - Create test file `components/code-block.test.ts`
  - Import `highlight` from `sugar-high`
  - Write snapshot tests capturing current output for known code inputs:
    - Simple JS: `const x = 1;`
    - JSX: `<div className="test">hello</div>`
    - Multi-line with keywords: `function foo() {\n  return true;\n}`
  - Run `pnpm test` to establish baseline snapshots
  - These snapshots will detect any breaking changes when sugar-high upgrades to 1.0.0

  **Must NOT do**:
  - Do NOT upgrade sugar-high yet — this is the "RED" phase of TDD
  - Do NOT modify the code-block component

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1, 3)
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 9
  - **Blocked By**: None

  **References**:
  - `components/code-block.tsx:5` — `import { highlight } from "sugar-high"` — the function to snapshot
  - `components/code-block.tsx:260` — `const highlightedCode = useMemo(() => highlight(code), [code])` — actual usage pattern
  - `vitest.config.ts` — Test configuration (globals: true, environment: node)
  - `proxy.test.ts` — Existing test pattern (describe/it/expect style)

  **Acceptance Criteria**:
  - [ ] Test file created at `components/code-block.test.ts`
  - [ ] `pnpm test` passes with new snapshot tests
  - [ ] Snapshot files generated in `__snapshots__/` or inline

  **QA Scenarios**:
  ```
  Scenario: Snapshot test captures current sugar-high output
    Tool: Bash
    Preconditions: sugar-high at current version (0.9.5)
    Steps:
      1. Run `pnpm test components/code-block.test.ts`
      2. Assert test passes (exit code 0)
      3. Assert output contains "snapshot" or "toMatchInlineSnapshot"
    Expected Result: All snapshot tests pass, baseline established
    Failure Indicators: Test file not found, snapshot mismatch
    Evidence: .sisyphus/evidence/task-2-snapshot-baseline.txt

  Scenario: Snapshot test would fail on output change
    Tool: Bash
    Preconditions: Snapshot baseline exists
    Steps:
      1. Verify snapshot content exists (grep for known output patterns)
      2. Confirm snapshot is non-empty and contains HTML-like output from highlight()
    Expected Result: Snapshot contains syntax-highlighted HTML output
    Failure Indicators: Empty snapshot, no HTML in output
    Evidence: .sisyphus/evidence/task-2-snapshot-content.txt
  ```

  **Commit**: YES
  - Message: `test(sugar-high): add highlight() snapshot before v1.0 upgrade`
  - Files: `components/code-block.test.ts`
  - Pre-commit: `pnpm test`

- [x] 3. TDD Setup — Fumadocs Search API Smoke Test

  **What to do**:
  - Create test file `app/api/search/route.test.ts`
  - Test that `createFromSource` from `fumadocs-core/search/server` produces a valid GET handler
  - Test the search API response shape: valid JSON, has expected fields
  - Use `vi.mock` pattern from proxy.test.ts for mocking blog source if needed
  - This test will detect breaking changes when fumadocs upgrades

  **Must NOT do**:
  - Do NOT upgrade fumadocs yet
  - Do NOT modify the search route

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1, 2)
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 12
  - **Blocked By**: None

  **References**:
  - `app/api/search/route.ts` — Current search API implementation using `createFromSource`
  - `app/[locale]/blog/list.tsx:72-76` — Client-side `useDocsSearch({ type: "fetch", api: "/api/search", locale: lang })` usage
  - `shared/source.ts:28-34` — `blog` loader configuration
  - `proxy.test.ts` — Test pattern reference (vi.mock, describe/it/expect)

  **Acceptance Criteria**:
  - [ ] Test file created at `app/api/search/route.test.ts`
  - [ ] `pnpm test` passes with new search test
  - [ ] Test validates the search route exports a GET handler

  **QA Scenarios**:
  ```
  Scenario: Search API smoke test passes
    Tool: Bash
    Preconditions: fumadocs at current version (16.4.7)
    Steps:
      1. Run `pnpm test app/api/search/route.test.ts`
      2. Assert test passes (exit code 0)
    Expected Result: Search API structure test passes
    Failure Indicators: Import errors, missing exports
    Evidence: .sisyphus/evidence/task-3-search-smoke.txt
  ```

  **Commit**: YES
  - Message: `test(fumadocs): add search API smoke test before upgrade`
  - Files: `app/api/search/route.test.ts`
  - Pre-commit: `pnpm test`

- [x] 4. Tailwind Ecosystem Upgrade — tailwindcss 4.2.2, @tailwindcss/postcss 4.2.2, tailwind-merge 3.5.0

  **What to do**:
  - Run `pnpm add -D tailwindcss@4.2.2 @tailwindcss/postcss@4.2.2 tailwind-merge@3.5.0`
  - Verify `postcss.config.mjs` still works (uses `@tailwindcss/postcss` plugin string)
  - Verify `globals.css` compiles correctly (uses `@import "tailwindcss"`, `@plugin`, `@theme`)
  - Run full CI gate

  **Must NOT do**:
  - Do NOT adopt new Tailwind 4.2 utilities (logical properties, font-features) — that's refactoring scope
  - Do NOT change postcss.config.mjs format

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5-8)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 14
  - **Blocked By**: Task 1

  **References**:
  - `postcss.config.mjs` — PostCSS config using `@tailwindcss/postcss`
  - `app/globals.css` — Tailwind imports with `@import "tailwindcss"`, `@plugin "tailwindcss-animate"`, `@theme`
  - `shared/utils/tailwind.ts` — `cn()` utility using clsx + tailwind-merge

  **Acceptance Criteria**:
  - [ ] tailwindcss@4.2.2, @tailwindcss/postcss@4.2.2, tailwind-merge@3.5.0 installed
  - [ ] `pnpm check:types && pnpm check:biome && pnpm test && pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Tailwind CSS compilation works
    Tool: Bash
    Preconditions: Packages upgraded
    Steps:
      1. Run `pnpm build`
      2. Assert build succeeds (exit code 0)
      3. Verify CSS output exists in `.next/` directory
    Expected Result: Build succeeds with no CSS compilation errors
    Failure Indicators: PostCSS errors, missing CSS, build failure
    Evidence: .sisyphus/evidence/task-4-tailwind-build.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): upgrade tailwindcss 4.2.2, tailwind-merge 3.5.0`
  - Files: `package.json`, `pnpm-lock.yaml`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 5. Dev Tools Upgrade — vitest 4.1.1, @vitest/ui 4.1.1, biome 2.4.8, ultracite 7.3.2

  **What to do**:
  - First check ultracite 7.3.2 + biome 2.4.8 compatibility: `pnpm add -D ultracite@7.3.2` then verify
  - Run `pnpm add -D vitest@4.1.1 @vitest/ui@4.1.1 @biomejs/biome@2.4.8 ultracite@7.3.2`
  - Run `pnpm check:biome` to verify biome config still valid with `biome.jsonc` extending ultracite presets
  - Run full CI gate

  **Must NOT do**:
  - Do NOT change biome.jsonc configuration
  - Do NOT adopt new biome 2.4 rules

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 6-8)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 13
  - **Blocked By**: Task 1

  **References**:
  - `biome.jsonc` — Extends `ultracite/core` and `ultracite/next`
  - `vitest.config.ts` — Vitest config (environment: node, globals: true)
  - `package.json:6-20` — Scripts using ultracite (`check:biome`, `fmt:biome`)

  **Acceptance Criteria**:
  - [ ] All 4 dev tools at target versions
  - [ ] `pnpm check:biome` passes (biome + ultracite compatible)
  - [ ] `pnpm test` passes with vitest 4.1.1
  - [ ] Full CI gate passes

  **QA Scenarios**:
  ```
  Scenario: Biome + ultracite compatibility check
    Tool: Bash
    Preconditions: Packages upgraded
    Steps:
      1. Run `pnpm check:biome`
      2. Assert exit code 0 (no lint errors beyond existing)
      3. Run `pnpm test`
      4. Assert all tests pass
    Expected Result: Linting and testing work with upgraded tools
    Failure Indicators: Rule conflicts, config parse errors, test runner errors
    Evidence: .sisyphus/evidence/task-5-devtools.txt

  Scenario: If ultracite 7.3.2 conflicts with biome 2.4.8 — fallback
    Tool: Bash
    Preconditions: Conflict detected
    Steps:
      1. Keep ultracite at 7.0.11
      2. Only upgrade biome if ultracite is compatible
      3. Document incompatibility
    Expected Result: Graceful fallback to compatible combination
    Failure Indicators: Unresolvable config errors
    Evidence: .sisyphus/evidence/task-5-devtools-fallback.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): upgrade vitest 4.1.1, biome 2.4.8, ultracite 7.3.2`
  - Files: `package.json`, `pnpm-lock.yaml`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 6. AI/Vercel Ecosystem Upgrade — ai 6.0.137, @friendliai/ai-provider 1.1.8, @vercel/toolbar 0.2.2, flags 4.0.5

  **What to do**:
  - Run `pnpm add ai@6.0.137 @friendliai/ai-provider@1.1.8 @vercel/toolbar@0.2.2 flags@4.0.5`
  - Verify no API changes needed (these are minor/patch within v6)
  - Check `shared/flags.ts` still works with flags 4.0.5
  - Check `app/layout.tsx` VercelToolbar import still valid
  - Run full CI gate

  **Must NOT do**:
  - Do NOT adopt AI SDK v7 beta
  - Do NOT change flags configuration

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4-5, 7-8)
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `shared/flags.ts` — Feature flags using `flags/next` and `@flags-sdk/statsig`
  - `app/layout.tsx:4` — `import { VercelToolbar } from "@vercel/toolbar/next"`
  - `next.config.ts:2` — `import { withVercelToolbar } from "@vercel/toolbar/plugins/next"`
  - AI SDK used in typing practice sentence generation (check app/[locale]/typing/ for server actions)

  **Acceptance Criteria**:
  - [ ] All 4 packages at target versions
  - [ ] Full CI gate passes
  - [ ] No import errors

  **QA Scenarios**:
  ```
  Scenario: AI/Vercel packages upgrade verification
    Tool: Bash
    Preconditions: Packages upgraded
    Steps:
      1. Run `pnpm list ai @friendliai/ai-provider @vercel/toolbar flags --depth=0`
      2. Assert target versions
      3. Run `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`
      4. Assert all pass
    Expected Result: All packages upgraded, build succeeds
    Failure Indicators: Type errors in flags.ts, toolbar import errors
    Evidence: .sisyphus/evidence/task-6-ai-vercel.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): upgrade ai SDK 6.0.137, vercel packages`
  - Files: `package.json`, `pnpm-lock.yaml`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 7. Misc Safe Upgrades — next-intl 4.8.3, three 0.183.2, @types/three, zod 4.3.6, @t3-oss/env-nextjs 0.13.11, vite-tsconfig-paths 6.1.1

  **What to do**:
  - Run `pnpm add next-intl@4.8.3 three@0.183.2 zod@4.3.6 @t3-oss/env-nextjs@0.13.11`
  - Run `pnpm add -D @types/three@0.183.1 vite-tsconfig-paths@6.1.1`
  - Verify `shared/i18n/request.ts` still works with next-intl 4.8.3
  - Verify `components/lickitung.tsx` still works with three 0.183.2
  - Verify `shared/env.ts` still works with zod 4.3.6 + @t3-oss/env-nextjs 0.13.11
  - Run full CI gate

  **Must NOT do**:
  - Do NOT adopt next-intl AOT compilation (separate feature)
  - Do NOT change three.js code

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4-6, 8)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 16
  - **Blocked By**: Task 1

  **References**:
  - `shared/i18n/request.ts` — next-intl getRequestConfig usage
  - `shared/i18n/routing.ts` — defineRouting usage
  - `components/lickitung.tsx` — Three.js usage (useGLTF, Canvas, Environment, MeshTransmissionMaterial)
  - `shared/env.ts` — @t3-oss/env-nextjs + zod/v4 usage
  - `vitest.config.ts` — vite-tsconfig-paths plugin

  **Acceptance Criteria**:
  - [ ] All packages at target versions
  - [ ] Full CI gate passes

  **QA Scenarios**:
  ```
  Scenario: Misc packages upgrade verification
    Tool: Bash
    Preconditions: Packages upgraded
    Steps:
      1. Run `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`
      2. Assert all pass
    Expected Result: Build succeeds with no regressions
    Failure Indicators: Type errors, three.js import issues, env validation failures
    Evidence: .sisyphus/evidence/task-7-misc-upgrade.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): upgrade next-intl 4.8.3, three 0.183.2, misc`
  - Files: `package.json`, `pnpm-lock.yaml`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 8. @next/* Packages Upgrade — @next/third-parties 16.2.1, @next/bundle-analyzer 16.2.1

  **What to do**:
  - Run `pnpm add @next/third-parties@16.2.1 && pnpm add -D @next/bundle-analyzer@16.2.1`
  - Verify `app/layout.tsx` GoogleAnalytics import still works
  - Verify `next.config.ts` bundleAnalyzer import still works
  - Run full CI gate

  **Must NOT do**:
  - Do NOT change next.config.ts structure

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4-7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 14
  - **Blocked By**: Task 1

  **References**:
  - `app/layout.tsx:1` — `import { GoogleAnalytics } from "@next/third-parties/google"`
  - `next.config.ts:1` — `import bundleAnalyzer from "@next/bundle-analyzer"`

  **Acceptance Criteria**:
  - [ ] Both packages at 16.2.1
  - [ ] Full CI gate passes

  **QA Scenarios**:
  ```
  Scenario: @next/* packages upgrade verification
    Tool: Bash
    Preconditions: Packages upgraded
    Steps:
      1. Run `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`
      2. Assert all pass
    Expected Result: Build succeeds
    Failure Indicators: Import errors, plugin registration issues
    Evidence: .sisyphus/evidence/task-8-next-packages.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): upgrade @next/* packages to 16.2.1`
  - Files: `package.json`, `pnpm-lock.yaml`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 9. Sugar-high 1.0.0 Upgrade (TDD — verify snapshot)

  **What to do**:
  - Run `pnpm add sugar-high@1.0.0`
  - Run `pnpm test components/code-block.test.ts`
  - If snapshots pass: sugar-high 1.0.0 is backward-compatible, done
  - If snapshots fail: update snapshots if output is still valid HTML (visual inspection), or fix code-block.tsx if API changed
  - Run full CI gate

  **Must NOT do**:
  - Do NOT refactor code-block.tsx unless the API actually broke

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 10, 11)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:
  - `components/code-block.tsx:5` — `import { highlight } from "sugar-high"` — the function under test
  - `components/code-block.test.ts` — Snapshot test created in Task 2
  - sugar-high GitHub: https://github.com/huozhi/sugar-high — check v1.0.0 release notes

  **Acceptance Criteria**:
  - [ ] sugar-high@1.0.0 installed
  - [ ] Snapshot tests pass (or updated with valid new output)
  - [ ] `pnpm check:types && pnpm check:biome && pnpm test && pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Sugar-high v1.0.0 backward compatibility
    Tool: Bash
    Preconditions: Snapshot baseline from Task 2 exists
    Steps:
      1. Run `pnpm add sugar-high@1.0.0`
      2. Run `pnpm test components/code-block.test.ts`
      3. If pass: done. If fail: inspect snapshot diff
      4. Update snapshots only if output is valid highlighted HTML
      5. Run `pnpm build`
    Expected Result: highlight() still produces valid syntax-highlighted HTML
    Failure Indicators: API renamed, output format completely changed, import error
    Evidence: .sisyphus/evidence/task-9-sugar-high.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): upgrade sugar-high 1.0.0`
  - Files: `package.json`, `pnpm-lock.yaml`, possibly `components/code-block.test.ts` (snapshot update)
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 10. Lucide-react 1.0.1 Upgrade + Icon Audit

  **What to do**:
  - BEFORE upgrading: Audit all lucide-react imports across the codebase
  - Search for any brand icons from lucide-react (they were removed in v1.0)
  - Current usage in codebase: `CodeIcon`, `ExternalLinkIcon`, `KeyboardIcon`, `Rss`, `Search`, `X`, `Loader2`, `ExternalLink` — ALL are utility icons, NOT brand icons
  - Brand icons come from `@radix-ui/react-icons` (GitHubLogoIcon, LinkedInLogoIcon) and `react-icons/si` (SiX) — SAFE
  - Run `pnpm add lucide-react@1.0.1`
  - Verify all icon imports resolve correctly
  - Note: v1.0 adds `aria-hidden="true"` by default to all icons — verify accessibility
  - Run full CI gate

  **Must NOT do**:
  - Do NOT adopt LucideProvider context API yet
  - Do NOT change existing aria attributes on icons

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires careful icon audit across multiple files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 11)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `app/[locale]/page.tsx:8` — `import { CodeIcon, ExternalLinkIcon, KeyboardIcon } from "lucide-react"`
  - `app/[locale]/blog/list.tsx:5` — `import { ExternalLink, Loader2, Search, X } from "lucide-react"`
  - `app/[locale]/blog/rss-link.tsx:1` — `import { Rss } from "lucide-react"`
  - `components/footer.tsx:1` — Uses @radix-ui/react-icons (ArrowTopRightIcon), NOT lucide
  - `components/link.tsx:1` — Uses @radix-ui/react-icons (ArrowTopLeftIcon), NOT lucide
  - lucide-react v1.0 changelog: brand icons removed, aria-hidden default

  **Acceptance Criteria**:
  - [ ] lucide-react@1.0.1 installed
  - [ ] All icon imports resolve (no missing exports)
  - [ ] Full CI gate passes

  **QA Scenarios**:
  ```
  Scenario: All lucide-react icon imports still resolve
    Tool: Bash
    Preconditions: lucide-react upgraded to 1.0.1
    Steps:
      1. Run `pnpm check:types`
      2. Assert no "Cannot find module" or "has no exported member" errors for lucide-react
      3. Run `pnpm build`
      4. Assert build succeeds
    Expected Result: All icon imports resolve, build succeeds
    Failure Indicators: Missing export errors for any icon names
    Evidence: .sisyphus/evidence/task-10-lucide-audit.txt

  Scenario: No brand icons from lucide-react in codebase
    Tool: Bash (grep)
    Preconditions: Codebase audit
    Steps:
      1. Search for known removed brand icons: Github, Twitter, Facebook, Instagram, Youtube, Linkedin, etc. from lucide-react imports
      2. Assert none found (all brand icons come from @radix-ui or react-icons)
    Expected Result: Zero brand icon imports from lucide-react
    Failure Indicators: Any brand icon import from lucide-react
    Evidence: .sisyphus/evidence/task-10-brand-audit.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): upgrade lucide-react 1.0.1`
  - Files: `package.json`, `pnpm-lock.yaml`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 11. @vercel/analytics 2.0.1 + @vercel/speed-insights 2.0.0

  **What to do**:
  - Run `pnpm add @vercel/analytics@2.0.1 @vercel/speed-insights@2.0.0`
  - Verify `app/layout.tsx` imports still work:
    - `import { Analytics } from "@vercel/analytics/react"` — check if path changed
    - `import { SpeedInsights } from "@vercel/speed-insights/next"` — check if path changed
  - These are Next.js (not Nuxt), so breaking changes should NOT apply
  - Run full CI gate

  **Must NOT do**:
  - Do NOT change the conditional rendering logic in layout.tsx

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `app/layout.tsx:2-3` — Analytics and SpeedInsights imports
  - `app/layout.tsx:94-99` — Conditional rendering: `{isProduction && isVercel && (<><Analytics /><SpeedInsights /></>)}`

  **Acceptance Criteria**:
  - [ ] Both packages at target versions
  - [ ] Import paths still valid
  - [ ] Full CI gate passes

  **QA Scenarios**:
  ```
  Scenario: Vercel analytics/speed-insights v2 import compatibility
    Tool: Bash
    Preconditions: Packages upgraded
    Steps:
      1. Run `pnpm check:types`
      2. Assert no import errors for @vercel/analytics/react or @vercel/speed-insights/next
      3. Run `pnpm build`
      4. Assert build succeeds
    Expected Result: Import paths unchanged, build succeeds
    Failure Indicators: Module not found errors, changed export paths
    Evidence: .sisyphus/evidence/task-11-vercel-v2.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): upgrade @vercel/analytics 2.0.1, speed-insights 2.0.0`
  - Files: `package.json`, `pnpm-lock.yaml`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 12. Fumadocs Atomic Upgrade — core 16.7.5, ui 16.7.5, mdx 14.2.11, docgen 3.0.8

  **What to do**:
  - This is the HIGHEST RISK upgrade. All 4 fumadocs packages must be upgraded together.
  - Run `pnpm add fumadocs-core@16.7.5 fumadocs-ui@16.7.5 fumadocs-mdx@14.2.11 fumadocs-docgen@3.0.8`
  - Run `fumadocs-mdx` postinstall to regenerate `.source/` directory
  - Check search client API change in `app/[locale]/blog/list.tsx`:
    - Current: `useDocsSearch({ type: "fetch", api: "/api/search", locale: lang })` — verify this still works in 16.7.5
    - If API changed: update to new interface per fumadocs 16.6.11+ docs
  - Check search server in `app/api/search/route.ts`:
    - Current: `createFromSource(blog, { localeMap: {...} })` — verify still valid
  - Check MDX components in `app/[locale]/blog/[...slug]/page.tsx`:
    - `DocsBody`, `defaultMdxComponents`, `ImageZoom`, `Tab`, `Tabs`, `Callout` — verify imports
  - Verify `source.config.ts` works with new fumadocs-mdx
  - Run the search smoke test from Task 3
  - Run full CI gate

  **Must NOT do**:
  - Do NOT adopt renderer API slots (separate feature task)
  - Do NOT add remark-llms plugin
  - Do NOT change sidebar/layout configuration

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Highest risk upgrade, requires understanding fumadocs internals, search API migration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential — most risky)
  - **Parallel Group**: Wave 3 (after Tasks 9-11)
  - **Blocks**: Task 15
  - **Blocked By**: Task 3

  **References**:
  - `app/[locale]/blog/list.tsx:4` — `import { useDocsSearch } from "fumadocs-core/search/client"` — MOST LIKELY TO BREAK
  - `app/[locale]/blog/list.tsx:72-76` — `useDocsSearch({ type: "fetch", api: "/api/search", locale: lang })` — current usage
  - `app/api/search/route.ts:1-11` — Server-side search using `createFromSource`
  - `app/[locale]/blog/[...slug]/page.tsx:2-6` — fumadocs-ui component imports (Callout, ImageZoom, Tab, Tabs, DocsBody)
  - `app/[locale]/blog/[...slug]/page.tsx:5` — `import defaultMdxComponents from "fumadocs-ui/mdx"`
  - `shared/source.ts:1-8` — fumadocs-mdx runtime imports (docs, meta, loader, toFumadocsSource)
  - `source.config.ts` — fumadocs-mdx config (defineConfig, defineDocs, frontmatterSchema)
  - `app/globals.css:3-4` — fumadocs-ui CSS imports
  - fumadocs 16.6.11 search client migration: https://www.fumadocs.dev/docs/search/flexsearch

  **Acceptance Criteria**:
  - [ ] All 4 fumadocs packages at target versions
  - [ ] `.source/` directory regenerated successfully
  - [ ] Search works: `useDocsSearch` in blog list + `createFromSource` in API route
  - [ ] Blog post renders with all MDX components (DocsBody, ImageZoom, Tab, Tabs, Callout)
  - [ ] `pnpm test app/api/search/route.test.ts` passes (smoke test from Task 3)
  - [ ] Full CI gate passes

  **QA Scenarios**:
  ```
  Scenario: Fumadocs search client still works
    Tool: Bash
    Preconditions: All 4 fumadocs packages upgraded
    Steps:
      1. Run `pnpm check:types`
      2. Look specifically for errors in blog/list.tsx and api/search/route.ts
      3. If useDocsSearch API changed, update blog/list.tsx to new interface
      4. Run `pnpm build`
      5. Start dev server and curl `/api/search?query=test&locale=ko`
      6. Assert valid JSON response
    Expected Result: Search API returns valid JSON, no type errors
    Failure Indicators: useDocsSearch signature changed, createFromSource API different
    Evidence: .sisyphus/evidence/task-12-fumadocs-search.txt

  Scenario: Blog post renders correctly with fumadocs-ui components
    Tool: Bash
    Preconditions: fumadocs-ui upgraded
    Steps:
      1. Run `pnpm build`
      2. Assert build succeeds (all MDX pages compile)
      3. Check `.next/` output for blog pages
    Expected Result: All blog posts build successfully
    Failure Indicators: MDX compilation errors, missing component exports
    Evidence: .sisyphus/evidence/task-12-fumadocs-mdx.txt

  Scenario: .source/ directory regenerates
    Tool: Bash
    Preconditions: fumadocs-mdx upgraded
    Steps:
      1. Run `pnpm postinstall` (which runs `fumadocs-mdx`)
      2. Verify `.source/` directory exists and has content
      3. Run `pnpm build`
    Expected Result: .source/ regenerated, build succeeds
    Failure Indicators: Empty .source/, missing collections, build errors
    Evidence: .sisyphus/evidence/task-12-fumadocs-source.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): upgrade fumadocs ecosystem to 16.7.5`
  - Files: `package.json`, `pnpm-lock.yaml`, possibly `app/[locale]/blog/list.tsx` (if search API changed), possibly `app/api/search/route.ts`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 13. Knip 6.0.4 Upgrade

  **What to do**:
  - Run `pnpm add -D knip@6.0.4`
  - Run `pnpm knip` to verify it works with new version
  - If new unused exports/dependencies found: review but do NOT auto-remove (just verify knip runs)
  - If `--isolate-workspaces` or `--include-libs` were used in scripts: remove them (removed in v6)
  - Run full CI gate

  **Must NOT do**:
  - Do NOT auto-delete files/dependencies flagged by knip (review only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Wave 2)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 5

  **References**:
  - `package.json:20` — `"knip": "knip"` script
  - knip 6.0 changelog: `--isolate-workspaces` removed, `--include-libs` removed, OXC parser

  **Acceptance Criteria**:
  - [ ] knip@6.0.4 installed
  - [ ] `pnpm knip` runs without crash
  - [ ] Full CI gate passes

  **QA Scenarios**:
  ```
  Scenario: Knip 6.0 runs successfully
    Tool: Bash
    Preconditions: knip upgraded
    Steps:
      1. Run `pnpm knip`
      2. Assert it completes (exit code 0 or 1 with findings)
      3. It should NOT crash with "unknown flag" errors
    Expected Result: knip runs and reports findings (or clean)
    Failure Indicators: Crash, config parse error, unknown option error
    Evidence: .sisyphus/evidence/task-13-knip.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): upgrade knip 6.0.4`
  - Files: `package.json`, `pnpm-lock.yaml`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 14. Next.js Config — Adopt New Experimental Flags + Logging

  **What to do**:
  - Update `next.config.ts` to adopt new 16.2 features:
    - Add `logging.browserToTerminal: 'error'` — forward client errors to dev terminal
    - Add `experimental.sri: { algorithm: 'sha256' }` — Subresource Integrity for JS
    - Add `experimental.prefetchInlining: true` — reduce prefetch network requests
  - Verify all existing config options still valid in 16.2.1
  - `cacheComponents: false` — verify still exists (was experimental)
  - `reactCompiler: true` — verify still works
  - `turbopackFileSystemCacheForDev: true` — verify still valid
  - Run full CI gate

  **Must NOT do**:
  - Do NOT restructure the plugin chain (withMDX, withVercelToolbar, etc.)
  - Do NOT add adapter configuration
  - Do NOT enable useLightningcss (needs testing)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 15-17)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 18
  - **Blocked By**: Tasks 4, 8

  **References**:
  - `next.config.ts:7-47` — Current Next.js config with experimental options
  - Next.js 16.2 blog: `logging.browserToTerminal`, `experimental.prefetchInlining`, `experimental.sri`
  - Next.js 16.2 changelog: `turbopack.ignoreIssue` for noise suppression

  **Acceptance Criteria**:
  - [ ] New experimental flags added to next.config.ts
  - [ ] `pnpm build` succeeds (SRI hashes generated)
  - [ ] Full CI gate passes

  **QA Scenarios**:
  ```
  Scenario: New experimental flags don't break build
    Tool: Bash
    Preconditions: next.config.ts updated
    Steps:
      1. Run `pnpm build`
      2. Assert build succeeds
      3. Check build output for SRI hash generation (if logged)
    Expected Result: Build succeeds with new flags active
    Failure Indicators: Unknown config option errors, build failures
    Evidence: .sisyphus/evidence/task-14-next-config.txt

  Scenario: Dev server works with new logging config
    Tool: Bash
    Preconditions: next.config.ts updated
    Steps:
      1. Start dev server: `pnpm dev &`
      2. Wait 10s
      3. curl http://localhost:8200/
      4. Assert 200/307
      5. Kill dev server
    Expected Result: Dev server starts with new config
    Failure Indicators: Config parse error, server crash
    Evidence: .sisyphus/evidence/task-14-dev-server.txt
  ```

  **Commit**: YES
  - Message: `feat(next.config): adopt experimental.sri, logging.browserToTerminal, prefetchInlining`
  - Files: `next.config.ts`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 15. Remove Dead Code — search.tsx + Fix @ts-ignore in Blog Slug Page

  **What to do**:
  - Delete `app/[locale]/blog/search.tsx` — entirely commented out, exports nothing (`export {};`)
  - Remove the commented-out import in `app/[locale]/blog/page.tsx:9`: `// import { BlogSearch, BlogSearchFallback } from "./search";`
  - Remove the commented-out JSX in `app/[locale]/blog/page.tsx:49-54`
  - Fix `@ts-ignore` in `app/[locale]/blog/[...slug]/page.tsx:139`:
    - Current: `{/* @ts-ignore */}\n{item.title?.props.children}`
    - Investigate the actual type of `item.title` from fumadocs TOCItemType
    - Fix with proper type assertion or type guard
  - Run full CI gate

  **Must NOT do**:
  - Do NOT refactor any other files
  - Do NOT change blog functionality

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14, 16, 17)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 12

  **References**:
  - `app/[locale]/blog/search.tsx` — All code commented out, `export {};` only
  - `app/[locale]/blog/page.tsx:9` — Commented-out import of search components
  - `app/[locale]/blog/page.tsx:49-54` — Commented-out JSX using search components
  - `app/[locale]/blog/[...slug]/page.tsx:139-140` — `@ts-ignore` on `item.title?.props.children`
  - `fumadocs-core/toc` — TOCItemType definition (check type of `title` field)

  **Acceptance Criteria**:
  - [ ] `search.tsx` deleted
  - [ ] Commented-out search references removed from `page.tsx`
  - [ ] `@ts-ignore` removed and replaced with proper typing
  - [ ] Full CI gate passes
  - [ ] `grep -r "@ts-ignore" app/` returns no results

  **QA Scenarios**:
  ```
  Scenario: Dead code removed, no @ts-ignore remaining
    Tool: Bash
    Preconditions: Files edited
    Steps:
      1. Verify `app/[locale]/blog/search.tsx` does not exist
      2. Run `grep -r "@ts-ignore" app/` and assert empty output
      3. Run `grep -r "BlogSearch" app/` and assert empty output
      4. Run `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`
    Expected Result: No dead code, no @ts-ignore, build passes
    Failure Indicators: File still exists, @ts-ignore found, type errors
    Evidence: .sisyphus/evidence/task-15-dead-code.txt
  ```

  **Commit**: YES
  - Message: `refactor: remove dead search.tsx, fix @ts-ignore in blog slug`
  - Files: `app/[locale]/blog/search.tsx` (deleted), `app/[locale]/blog/page.tsx`, `app/[locale]/blog/[...slug]/page.tsx`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 16. Standardize Zod Imports — env.ts zod/v4 → zod

  **What to do**:
  - Change `shared/env.ts:2` from `import { z } from "zod/v4"` to `import { z } from "zod"`
  - Zod 4 is already the main package (v4.3.5+), the `/v4` compat path is unnecessary
  - Verify all zod schema features used in env.ts work with standard import:
    - `z.enum()`, `z.coerce.number()`, `z.url()`, `z.string()`, `z.boolean()` — all standard Zod 4 APIs
  - Verify `source.config.ts` already uses `import { z } from "zod"` (confirmed — no change needed)
  - Run full CI gate

  **Must NOT do**:
  - Do NOT change any schema logic
  - Do NOT modify source.config.ts (already correct)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14, 15, 17)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 18
  - **Blocked By**: Task 7

  **References**:
  - `shared/env.ts:2` — `import { z } from "zod/v4"` — the import to change
  - `source.config.ts:9` — `import { z } from "zod"` — already correct (reference pattern)
  - `@t3-oss/env-nextjs` docs: https://env.t3.gg/docs/nextjs — check Zod 4 compatibility

  **Acceptance Criteria**:
  - [ ] `shared/env.ts` imports from `"zod"` not `"zod/v4"`
  - [ ] `grep -r "zod/v4" shared/` returns no results
  - [ ] Full CI gate passes
  - [ ] Environment validation still works correctly

  **QA Scenarios**:
  ```
  Scenario: Zod import standardized
    Tool: Bash
    Preconditions: env.ts updated
    Steps:
      1. Run `grep -r "zod/v4" shared/`
      2. Assert empty output (no compat path imports)
      3. Run `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`
      4. Assert all pass (env validation works)
    Expected Result: Standard zod import, build passes
    Failure Indicators: z.url() not available, enum type mismatch
    Evidence: .sisyphus/evidence/task-16-zod-import.txt
  ```

  **Commit**: YES
  - Message: `refactor(env): standardize zod imports from zod/v4 to zod`
  - Files: `shared/env.ts`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 17. useEffectEvent Refactor in useHoverDropdown

  **What to do**:
  - Refactor `shared/hooks/use-hover-dropdown.ts` to use React 19.2's `useEffectEvent`
  - Identify stable callbacks that are currently in useCallback but referenced in useEffect deps:
    - `isInSafeTriangle` (line 92) — used in useEffect (line 115) dependency array
    - Could benefit from useEffectEvent to avoid re-subscribing mousemove listener when `safeTrianglePadding` changes
  - Replace appropriate useCallback + useEffect dep patterns with useEffectEvent
  - Write a test to verify the hook behavior (open/close states, mouse enter/leave)
  - Run full CI gate

  **Must NOT do**:
  - Do NOT change the hook's public API (return type must remain identical)
  - Do NOT apply useEffectEvent to ALL hooks — only this one where it's clearly beneficial
  - Do NOT touch the 3 typing utility test files

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14-16)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `shared/hooks/use-hover-dropdown.ts:92-112` — `isInSafeTriangle` useCallback
  - `shared/hooks/use-hover-dropdown.ts:115-139` — useEffect with `isInSafeTriangle` dependency
  - React docs: https://react.dev/reference/react/useEffectEvent — useEffectEvent API
  - `shared/utils/geometry.ts` — `isPointInTriangle` utility used by the hook

  **Acceptance Criteria**:
  - [ ] `useEffectEvent` imported from React and used in use-hover-dropdown.ts
  - [ ] Hook public API unchanged (same return type)
  - [ ] `pnpm check:types && pnpm check:biome && pnpm test && pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: useEffectEvent refactor preserves behavior
    Tool: Bash
    Preconditions: Hook refactored
    Steps:
      1. Run `pnpm check:types`
      2. Assert no type errors in use-hover-dropdown.ts
      3. Verify useEffectEvent import exists: `grep "useEffectEvent" shared/hooks/use-hover-dropdown.ts`
      4. Run `pnpm build`
      5. Assert build succeeds
    Expected Result: Hook uses useEffectEvent, types pass, build succeeds
    Failure Indicators: Type error on useEffectEvent, changed return type
    Evidence: .sisyphus/evidence/task-17-useeffectevent.txt
  ```

  **Commit**: YES
  - Message: `refactor(hooks): use useEffectEvent in useHoverDropdown`
  - Files: `shared/hooks/use-hover-dropdown.ts`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

- [x] 18. TypeScript 6.0.2 Upgrade + tsconfig Migration

  **What to do**:
  - This is the FINAL upgrade, done after everything else is stable
  - Run `pnpm add -D typescript@6.0.2`
  - Update `tsconfig.json`:
    - Change `"target": "ES2017"` → `"target": "ES2022"` (ES5 output removed in TS 6, ES2022 recommended for Next.js)
    - Add `"lib": ["dom", "dom.iterable", "esnext"]` (keep current — `dom.iterable` auto-included but explicit is fine)
    - `strict: true` is now default but already set — no change needed
    - `strictNullChecks: true` already set — redundant with strict but harmless
    - Remove `"jsx": "react-jsx"` if Next.js plugin handles it (test first)
  - Run `pnpm check:types` and fix any new errors from stricter TS 6 checks
  - If TS 6 breaks too many things due to ecosystem compatibility:
    - ESCAPE HATCH: Revert to `typescript@5.9.3` and skip TS 6 for now
    - Document incompatibilities for future revisit
  - Run full CI gate

  **Must NOT do**:
  - Do NOT add `"ignoreDeprecations": "6.0"` — fix properly instead
  - Do NOT adopt Temporal types (polyfill ecosystem not ready)
  - Do NOT change moduleResolution from "bundler"

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: TS 6.0 released yesterday, potential unknown issues, may need escape hatch
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (must be last — depends on all other tasks)
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 14, 16

  **References**:
  - `tsconfig.json` — Current TypeScript config
  - `package.json:81` — Current typescript version (^5.9.3)
  - TS 6.0 changelog: strict default, ES5 removed, types[] default empty, rootDir default change
  - All source files — potential type errors from stricter checks
  - `next-env.d.ts` — Next.js type definitions
  - `.next/types/**/*.ts` — Generated route types

  **Acceptance Criteria**:
  - [ ] TypeScript 6.0.2 installed (or documented escape hatch if incompatible)
  - [ ] `tsconfig.json` updated for TS 6
  - [ ] `pnpm check:types` passes with zero errors
  - [ ] Full CI gate passes
  - [ ] If escape hatch: TypeScript stays at 5.9.3 with documented reasons

  **QA Scenarios**:
  ```
  Scenario: TypeScript 6.0 full compatibility check
    Tool: Bash
    Preconditions: TS 6.0.2 installed, tsconfig updated
    Steps:
      1. Run `pnpm check:types`
      2. If errors: categorize (our code vs third-party types)
      3. Fix our code errors
      4. If third-party type errors unfixable: trigger escape hatch
      5. Run `pnpm check:biome && pnpm test && pnpm build`
    Expected Result: All checks pass with TS 6.0
    Failure Indicators: Unresolvable type errors from dependencies
    Evidence: .sisyphus/evidence/task-18-typescript6.txt

  Scenario: Escape hatch — revert if ecosystem not ready
    Tool: Bash
    Preconditions: TS 6.0 breaks third-party types
    Steps:
      1. Run `pnpm add -D typescript@5.9.3`
      2. Revert tsconfig.json changes
      3. Run full CI gate
      4. Document which packages are incompatible with TS 6.0
    Expected Result: Clean revert to TS 5.9.3, all checks pass
    Failure Indicators: Revert fails, leftover TS 6 artifacts
    Evidence: .sisyphus/evidence/task-18-ts6-escape.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): upgrade TypeScript 6.0.2 + tsconfig migration`
  - Files: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`
  - Pre-commit: `pnpm check:types && pnpm check:biome && pnpm test && pnpm build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm check:types` + `pnpm check:biome` + `pnpm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start dev server. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration. Test edge cases: empty search, invalid locale, 404 pages. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Phase | Commit Message | Files | Gate |
|-------|---------------|-------|------|
| 1 | `fix(deps): patch security vulnerabilities (CVE-2026-*)` | package.json, pnpm-lock.yaml | full CI |
| 2-TDD | `test(sugar-high): add highlight() snapshot before v1.0 upgrade` | new test file | pnpm test |
| 2-TDD | `test(fumadocs): add search API smoke test before upgrade` | new test file | pnpm test |
| 2 | `chore(deps): upgrade tailwindcss 4.2.2, tailwind-merge 3.5.0` | package.json, pnpm-lock.yaml | full CI |
| 2 | `chore(deps): upgrade vitest 4.1.1, biome 2.4.8, ultracite 7.3.2` | package.json, pnpm-lock.yaml | full CI |
| 2 | `chore(deps): upgrade ai SDK 6.0.137, vercel packages` | package.json, pnpm-lock.yaml | full CI |
| 2 | `chore(deps): upgrade next-intl 4.8.3, three 0.183.2, misc` | package.json, pnpm-lock.yaml | full CI |
| 2 | `chore(deps): upgrade @next/* packages to 16.2.1` | package.json, pnpm-lock.yaml | full CI |
| 3 | `chore(deps): upgrade sugar-high 1.0.0` | package.json, pnpm-lock.yaml | full CI + snapshot |
| 3 | `chore(deps): upgrade lucide-react 1.0.1` | package.json, pnpm-lock.yaml | full CI |
| 3 | `chore(deps): upgrade @vercel/analytics 2.0.1, speed-insights 2.0.0` | package.json, pnpm-lock.yaml, app/layout.tsx | full CI |
| 3 | `chore(deps): upgrade fumadocs ecosystem to 16.7.5` | package.json, pnpm-lock.yaml, blog/list.tsx, api/search/route.ts | full CI + search test |
| 3 | `chore(deps): upgrade knip 6.0.4` | package.json, pnpm-lock.yaml | full CI |
| 4 | `feat(next.config): adopt experimental.sri, logging.browserToTerminal` | next.config.ts | full CI |
| 4 | `refactor: remove dead search.tsx, fix @ts-ignore in blog slug` | search.tsx, blog/[...slug]/page.tsx | full CI |
| 4 | `refactor(env): standardize zod imports from zod/v4 to zod` | shared/env.ts | full CI |
| 4 | `refactor(hooks): use useEffectEvent in useHoverDropdown` | shared/hooks/use-hover-dropdown.ts | full CI |
| 4 | `chore(deps): upgrade TypeScript 6.0.2 + tsconfig migration` | package.json, tsconfig.json | full CI |

---

## Success Criteria

### Verification Commands
```bash
pnpm check:types    # Expected: no errors
pnpm check:biome    # Expected: no errors
pnpm test           # Expected: all tests pass
pnpm build          # Expected: build succeeds with postbuild sitemap
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All 4+ test files pass
- [ ] Production build succeeds
- [ ] All 7 CVEs patched
- [ ] No `@ts-ignore` in codebase
- [ ] No commented-out dead code (search.tsx cleaned)
- [ ] Blog search works (API + client)
- [ ] Three.js renders on homepage
- [ ] i18n routing works for ko/en/ja
- [ ] RSS feed generates correctly
