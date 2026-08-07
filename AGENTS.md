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
- `cacheComponents: true` and `partialPrefetching: true` in `next.config.mts`.
- Most pages/layouts still export `instant = false` with "Cache Components opt-out" markers — do not remove without verifying the route shell in dev/build.
- OG routes use `"use cache"` + `cacheLife("days")` instead of `revalidate`/`dynamic`.
