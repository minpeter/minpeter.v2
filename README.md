# minpeter.com

A personal website, blog, and side projects built with Next.js.

## Local preview

Run `pnpm preview` for a production-mode preview on port 8321, or
`PORT=8322 pnpm preview` to use another port. It builds and serves a standalone
snapshot, so later builds cannot delete assets used by an open preview.
Stop the preview before replacing it on the same port; its snapshot is removed
when the server exits. Don't leave `next start` serving this checkout's `.next`
while rebuilding it: old pages will request deleted JS/CSS chunks.

Preview snapshots live in the git-ignored `.amp/in/previews/` directory.
After a hard kill or machine crash, remove orphaned snapshots manually once
their preview processes have stopped. For hot reload, use `pnpm dev` instead.

## Inspired by ~

- [Gaudion](https://gaudion.dev/)
- [Shadcn](https://shadcn.com/)
- [Bepyan](https://bepyan.me/)
- [Paco](https://paco.me/)
