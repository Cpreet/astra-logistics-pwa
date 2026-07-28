# ASTRA

**AI-Powered Freight Intelligence Platform** — offline-first logistics ERP (Progressive Web App).

This repository is under active development. The current milestone is a **scaffold**: React + Vite + TypeScript PWA with Dexie (IndexedDB), sync outbox, and application shell. Air freight workflows and remaining modules will be added incrementally.

## Requirements

- Node.js 20+
- npm

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (PWA dev service worker enabled) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | Oxlint |

## Architecture

- **Local database:** Dexie / IndexedDB (`src/db`)
- **Repositories:** `src/repositories` (UI must not call IndexedDB directly)
- **Sync:** Outbox + `SyncEngine` with pluggable transport (`src/sync`)
- **Docs:** `docs/implementation-plan.md`, `docs/domain-model.md`, `docs/offline-sync.md`

## Offline-first behaviour

1. App shell is cached via `vite-plugin-pwa`.
2. On first load, `bootstrapLocalDatabase()` initializes device metadata and settings.
3. Mutations enqueue records in `syncOutbox` for asynchronous sync.
4. MVP uses a **noop transport** (no real backend) — pending counts may clear locally after a simulated push.

## Authentication (planned)

Production authentication is **not** implemented. A future phase will add **demo authentication** with seeded users and role-based guards, clearly labelled as non-production in this README.

## Deploy (Netlify + GitHub)

1. In [Netlify](https://app.netlify.com/), choose **Add new site** → **Import an existing project** → **GitHub** → `Cpreet/astra-logistics-pwa`.
2. Confirm build settings from `netlify.toml` (build: `npm run build`, publish: `dist`, Node 20).
3. Deploy; production updates on every push to `main`.

Optional GitHub Actions deploy (requires `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` repository secrets): see [docs/deploy-netlify.md](docs/deploy-netlify.md).

## License

MIT — see [LICENSE](LICENSE).
