# AGENTS.md

## Dev server
- `pnpm dev` uses portless: `portless minpeter next dev`
- Origin is typically `https://minpeter.localhost` (or whatever portless prints). Read the next dev banner for the actual URL/port.
- Production-like local: `pnpm build && pnpm start` → port 8200 (`next start -p 8200`)

## next-dev-loop / MCP
- Requires Next 16.3+ Turbopack (this repo uses `turbopack` in `next.config.mts`).
- With `next dev` running, MCP is at `/_next/mcp` on the dev origin.
- Set `NEXT_MCP_URL` to that origin if the agent tool needs it.
- Prefer agent-browser ≥ 0.31.1 for DOM verification.

## Runtime verification checklist
- Home / locale: `/`, `/en`, `/ja` (`data-testid="home-page"`)
- Blog list + search: `#blog-search` / `[data-testid=blog-search]` (debounce ~500ms)
- Blog post: soft-nav from list; avoid external_url posts for in-app checks
- Header / locale: `[data-testid=site-header]`, `[data-testid=language-selector]`
- Showcase: prefer title/description, not canvas pixels
- Lint/format: `pnpm check:lint` / `pnpm fmt` (Ultracite → Biome; no oxlint/oxfmt)
- Typecheck: `pnpm check` · Tests: `pnpm test` · Build: `pnpm build` · Audit: `pnpm audit --prod`

## Cache Components
- `cacheComponents: true` and `partialPrefetching: true` in `next.config.mts` (stable top-level).
- Prefer removing `instant = false` once a route builds clean. Interactive showcases may keep a deliberate Block (client-only canvas / timers / network).
- Blog list: server shell renders post list; client `BlogList` only owns search (`?q=`).
- OG routes use `"use cache"` + `cacheLife("days")` instead of `revalidate`/`dynamic`.

## Next experimental flags (`next.config.mts`)
Keep under `experimental` until they gain a stable top-level rename (Next 16.3 types still list these as experimental-only):
- `experimental.globalNotFound`
- `experimental.useTypeScriptCli`
- `experimental.optimizePackageImports` (`lucide-react`, `@radix-ui/react-icons`, `react-icons`)

## i18n: Server Components vs Route Handlers
- **Server Components / `generateMetadata` under `[locale]`**: prefer request locale from next-intl (root-params), not params override:
  ```ts
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  ```
- **Keep explicit `{ locale }`** for opengraph-image / twitter-image routes and true Route Handlers (rss, og handlers) where root-params may be unreliable.
- **Route Handlers / Server Actions**: `next/root-params` does **not** work. Pass locale explicitly:
  ```ts
  // Route Handlers / Server Actions: next/root-params does NOT work.
  // Pass locale explicitly:
  const t = await getTranslations({ locale });
  // getRequestConfig receives { locale } override when provided
  // (shared/i18n/request.ts resolveLocale(explicit)).
  ```
