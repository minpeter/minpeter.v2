# Learnings — nextjs-latest-features

## [2026-03-24] Session ses_2e105cc5fffej8YNOUR6w6Fcib — Wave 1 Start

### Project Setup
- Next.js 16.2.1 + React 19.2.4 (already latest)
- Vitest 4.1.1 with `environment: "node"`, `globals: true`
- No `jsdom` installed yet — Task 2 will add it
- `app/api/search/route.ts` uses `createFromSource` from fumadocs-core (exports only `GET`)
- `proxy.test.ts` and `app/api/search/route.test.ts` both exist
- instrumentation.ts does NOT exist yet (needs to be created in project root)
- `@testing-library/react` NOT installed yet

### Key Technical Constraints (from plan research)
- `getTranslations()` calls `headers()` internally → NEVER put `use cache` in any component using `getTranslations()`
- `after()` only useful in dynamic routes (API routes, Server Actions) — NOT static blog pages
- `view-transition-name` must be unique per page
- error.tsx MUST be `"use client"` component
- loading.tsx goes to `[locale]/blog/`, `[locale]/blog/[...slug]/`, `[locale]/show/` — NOT `[locale]/` root
- `proxy.ts` (next-intl middleware) must NOT be touched

### Evidence Location
- `.sisyphus/evidence/nextjs-latest-features/` for this plan
