# instant-nav rig: minpeter.v2

- BUILD: `EXPOSE_TESTING_API=1 pnpm build && pnpm start` (port 8200)
- EXPOSE: `experimental.exposeTestingApiInProductionBuild` when `process.env.EXPOSE_TESTING_API === "1"` (`next.config.mts`)
- RUN: `pnpm test:e2e` → Playwright against `http://127.0.0.1:8200` (or `BASE_URL`)
- TEST USER: public site, no auth; default locale `ko` (`localePrefix: as-needed`)
- DRIFT: locale cookie / path prefix (`/en`, `/ja`); content MDX set; portless host only for `pnpm dev` (not used for instant())
- LOOP: build with EXPOSE → start → playwright test; fully local/agent-drivable
- LIVENESS: n/a for local build && start (artifact is the one just built)
- WALLS:
  - Never measure on `pnpm dev` / portless — instant() needs production build + testing API
  - Reuse port 8200 carefully; stop previous `next start` if `EADDRINUSE`
