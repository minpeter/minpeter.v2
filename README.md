# minpeter.com

A personal website, blog, and side projects built with Next.js.

## Local preview

Run `pnpm preview` for a production-mode preview on port 8321, or
`PORT=8322 pnpm preview` to use another port. It builds and serves a standalone
snapshot, so later builds cannot delete assets used by an open preview.
Stop the preview before replacing it on the same port; its snapshot is removed
when the server exits. Don't leave `next start` serving this checkout's `.next`
while rebuilding it: old pages will request deleted JS/CSS chunks.

Preview snapshots live in `.amp/in/previews/`. Keep `/.amp/in/` in the
repository-local `.git/info/exclude` file. For hot reload, use `pnpm dev` instead.

## Inspired by ~

- [Gaudion](https://gaudion.dev/)
- [Shadcn](https://shadcn.com/)
- [Bepyan](https://bepyan.me/)
- [Paco](https://paco.me/)
