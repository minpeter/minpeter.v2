- 2026-03-24: fumadocs 16.7.5 still supports `useDocsSearch({ type: "fetch", api, locale })`; no migration update required for `app/[locale]/blog/list.tsx`.
- 2026-03-24: Upgrading fumadocs tightened MDX image prop typing in our page render path; `ImageZoom` bridge now needs an explicit prop cast for compatibility.
- 2026-03-24: TypeScript 6.0.2 works in this repo with `target: "ES2022"`; `pnpm check:types` passed without new source-level type errors.
- 2026-03-24: Even with TS 6 peer-range warnings (`next-intl`, `vite-tsconfig-paths`), type/build/test remained green, so no escape hatch fallback was needed.

- 2026-03-24 F2 review: `shared/hooks/use-hover-dropdown.ts` correctly moved `isInSafeTriangle` to `useEffectEvent`, removed it from the effect dependency array, and left other callback bodies unchanged in the branch diff.
- 2026-03-24 F2 review: `app/[locale]/blog/[...slug]/page.tsx` replaced `@ts-ignore` with `isValidElement<{ children: ReactNode }>(item.title)`, which safely handles both element and non-element TOC titles.
- 2026-03-24 F2 review: `components/code-block.test.ts` uses non-empty inline snapshots of actual `sugar-high` HTML output, so the upgrade regression coverage is real even though it targets the library output directly.
