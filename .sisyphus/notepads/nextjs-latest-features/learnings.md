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

## Task 5: Loading UI Skeletons
- Used Next.js `loading.tsx` conventions for automatic route transition skeleton states.
- Handled React `key` iteration properly to prevent React hydration errors in skeleton arrays.
- Implemented basic testing to confirm rendering without errors.

## Task 4: App Router Error Boundaries
- `app/[locale]/error.tsx` and nested `app/[locale]/blog/[...slug]/error.tsx` must start with `"use client"` for Next.js App Router error boundary support.
- Error boundary components can safely log incoming `error` objects in `useEffect`, expose `reset()` retry actions, and avoid `next-intl` hooks to keep fallback UI resilient.
- Vitest stays on the default Node environment globally, so each React boundary test needs the required `// @vitest-environment jsdom` file header.

### Shared Element Transitions in React 19 / Next.js
- React 19's `<ViewTransition name="...">` component works smoothly but may cause TypeScript errors if the local `@types/react` doesn't fully expose it (or conflicts with the DOM `ViewTransition` interface). A global type override or casting as an unknown FC component (`const ViewTransition = _ViewTransition as unknown as FC<{ name: string; children?: ReactNode }>`) serves as a viable workaround until types stabilize.
- The name supplied to `ViewTransition` must be globally unique per DOM and cannot contain `/` characters. Using `.replace(/\//g, '-')` efficiently transforms route slugs into CSS-safe ID strings.
- Next.js `next/link` implicitly handles `transitionTypes` attributes correctly when the experimental View Transition support is enabled in `next.config.ts`, making directional transitions straightforward (e.g. `slide-forward`, `slide-back`).
