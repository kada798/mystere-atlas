# Project instructions

- Product: Mystère Atlas, a Chinese/English/French mystery discovery and community platform with in-person events.
- Read `README.md`, `docs/mvp.md`, and `docs/architecture.md` before changing architecture or scope.
- Use the installed Next.js documentation under `node_modules/next/dist/docs` when available; check current official documentation for version-sensitive APIs.
- Preserve locale routes and translate interface changes in all three `messages` files.
- Keep business rules in feature modules; do not place credentials or privileged database operations in client components.
- Preserve existing user content. Do not turn planned functionality into fake successful account, review, or registration flows.
- Do not commit environment secrets, generated build output, dependencies, logs, or temporary files.
- Use npm and preserve `package-lock.json`.
- Validate with `npm run check`, `npm run build`, and `npm run smoke -- --start-server` when routing or the runtime changes. Tests should cover meaningful behavior.
- New feature branches should use the `codex/` prefix.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
