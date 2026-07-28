# ASTRA

**AI-Powered Freight Intelligence Platform** — an offline-first logistics ERP delivered as a Progressive Web App.

Air freight is implemented first; the domain model already covers sea, road, rail, courier, import, and export so later modules extend rather than duplicate it.

## Requirements

- Node.js 20+
- npm

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (PWA dev service worker enabled) |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | Oxlint |

## Getting started in one tap

Open the app and you land on `/welcome`, which asks a single question — “What do you do?”. Choosing a role signs you in immediately with a working, pre-populated workspace. There is no password, profile step, or setup wizard.

Seeded roles include Sales, Operations, Pricing, Documentation, Compliance, Warehouse, Finance, Manager, Administrator, and a read-only Customer portal.

> **Demo authentication only.** Sessions live in IndexedDB on the current device. This is not production-grade authentication and must be replaced before real use.

## What works today

- **Dashboard** — an exception-first “Needs attention” queue (stalled pricing, imminent or missed pickups, credit holds, compliance reviews, failed syncs), each with a direct action
- **Customers** — list, search, filters, detail view, status changes, and a four-field create form
- **Inquiries** — list, search, status filters, detail view with a colour-coded workflow timeline, and validated state transitions
- **Command palette** — `⌘K` / `Ctrl+K` (or `/`) to search records and run commands
- **Keyboard shortcuts** — `g d`, `g i`, `g c`, `g a`, `g s` to navigate; `n` for a new inquiry
- **Sync activity** — the local operation queue with status, plus a manual push
- **Light and dark themes**, respecting the system preference

## Architecture

```
src/
  app/            providers, router
  components/     ui primitives, layout
  db/             Dexie schema, bootstrap, demo seed
  domain/         pure rules (permissions, workflow, attention, locations)
  features/       auth, onboarding, command palette, theme, dashboard
  hooks/          data + interaction hooks
  layouts/        app shell
  pages/          thin route components
  repositories/   the only code that touches Dexie
  services/       audit, notifications, activation
  sync/           outbox engine + transport interface
  test/           Vitest suites
  types/          entity contracts
```

Rules enforced by this layout: UI never calls IndexedDB directly, state transitions are validated centrally, every mutation writes an audit entry and a sync outbox operation, and timestamps are stored as ISO 8601 UTC.

## Offline-first behaviour

1. The app shell is precached by `vite-plugin-pwa`, so it loads with no network.
2. Reads come from IndexedDB through repositories, wrapped in TanStack Query.
3. Writes land locally first, then enqueue an idempotent operation in `syncOutbox`.
4. A banner distinguishes “offline, saved on this device” from “queued for sync”, and every record shows its sync status.

The MVP ships a **simulated transport** — there is no backend. Pushing marks operations complete locally so queue behaviour is verifiable end to end; the UI never claims a real integration exists.

Try it: turn off your network, create a customer, and watch the offline banner, toast, and `Local` sync badge.

## Documentation

| Document | Contents |
|----------|----------|
| [docs/ux-principles.md](docs/ux-principles.md) | Onboarding and UI decisions, with the research behind them |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Phased build plan |
| [docs/domain-model.md](docs/domain-model.md) | Entities, statuses, and extensibility rules |
| [docs/offline-sync.md](docs/offline-sync.md) | Outbox, conflicts, and transport design |
| [docs/deploy-netlify.md](docs/deploy-netlify.md) | Netlify + GitHub deployment |

## Deploy (Netlify + GitHub)

1. In [Netlify](https://app.netlify.com/): **Add new site** → **Import an existing project** → **GitHub** → `Cpreet/astra-logistics-pwa`.
2. Confirm the settings from `netlify.toml` (build `npm run build`, publish `dist`, Node 20).
3. Deploy. Pushes to `main` update production; pull requests get deploy previews.

A GitHub Actions workflow is also available and requires the `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` repository secrets.

## License

MIT — see [LICENSE](LICENSE).
