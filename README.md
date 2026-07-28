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
| `npm run typecheck` | TypeScript project check, no emit |
| `npm run lint` | Oxlint |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with V8 coverage |

## Architecture

- **Local database:** Dexie / IndexedDB (`src/db`)
- **Repositories:** `src/repositories` (UI must not call IndexedDB directly)
- **Sync:** Outbox + `SyncEngine` with pluggable transport (`src/sync`)
- **Docs:** see [`docs/`](docs/README.md)

## Documentation

Start with [`docs/handoff.md`](docs/handoff.md) — verified current state, next tasks, and the working agreement.

| Document | Contents |
|----------|----------|
| [docs/handoff.md](docs/handoff.md) | Current state, next tasks, conventions, PR checklist |
| [docs/product-brief.md](docs/product-brief.md) | The original product brief, verbatim |
| [docs/plan.md](docs/plan.md) | Phased delivery schedule (task IDs `P1-01`–`P9-06`) |
| [docs/spec.md](docs/spec.md) | Canonical spec: architecture, domain model, state machines, screens, NFRs, acceptance criteria |
| [docs/user-flows.md](docs/user-flows.md) | End-to-end flows `F1`–`F24`, role workboards, offline matrix |
| [docs/market-research.md](docs/market-research.md) | 2026 market research and design decisions `D-01`–`D-30` |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Phase plan and architecture diagram |
| [docs/domain-model.md](docs/domain-model.md) | Entity overview |
| [docs/state-machines.md](docs/state-machines.md) | State machines and guards |
| [docs/offline-sync.md](docs/offline-sync.md) | Sync engine and conflict handling |
| [docs/security-notes.md](docs/security-notes.md) | Simulated surfaces and production hardening |
| [docs/future-backend.md](docs/future-backend.md) | Adding a backend without a rewrite |

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
