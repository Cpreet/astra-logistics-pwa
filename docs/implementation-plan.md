# ASTRA Implementation Plan (superseded)

> **Superseded by [`plan.md`](./plan.md).** This file is retained as the Phase 0 record only.
> The current schedule — task IDs, dependencies, exit criteria and parallelisation — lives in
> [`plan.md`](./plan.md); flows are in [`user-flows.md`](./user-flows.md) and rules in
> [`spec.md`](./spec.md). Do not plan work from this file.

## Phase 0 — Scaffold (complete, commit `4577e05`)

Deliver a runnable offline-first PWA shell:

- Vite + React 19 + TypeScript (strict)
- Tailwind CSS and accessible layout primitives
- React Router application shell
- Dexie / IndexedDB with base entity metadata and sync outbox
- `vite-plugin-pwa` for installable, cache-first app shell
- Vitest + Testing Library + `fake-indexeddb` for persistence tests
- Architecture docs (`domain-model.md`, `offline-sync.md`)

**Exit criteria:** `npm run dev`, `npm run build`, and `npm test` succeed; app loads with no network; local DB initializes.

## Phase 1 — Platform foundation

- Demo authentication (clearly labelled non-production) and role-based route guards
- Seeded users, settings, and reference data
- Repository layer over Dexie (no direct IndexedDB in UI)
- Audit log writer and notification adapter (in-app only)
- TanStack Query integration for read models with local-first defaults

## Phase 2 — Commercial workflow (Air focus)

- Customers and contacts
- Inquiries → quotations (state machine, revisions, margin approval)
- Bookings from accepted quotations
- Finance charge calculation service (decimal-safe)

## Phase 3 — Operations (Air shipment lifecycle)

- Shipment state machine (validated transitions, events, incidents)
- Cargo validation
- Carriers and warehouses
- Document upload, simulated OCR, compliance checks

## Phase 4 — Finance and closure

- Invoices, payments, profitability views
- Financially closed shipment immutability rules

## Phase 5 — Sync and customer portal

- Sync engine with idempotent outbox, conflict resolution UI
- Customer read-only portal
- Management dashboards and SLA / delay surfacing

## Cross-cutting

| Concern | Approach |
|--------|----------|
| Domain logic | `src/domain` + `src/services` |
| Persistence | `src/db` + `src/repositories` |
| UI | `src/features/*`, thin pages |
| Sync | `src/sync` transport adapters behind interfaces |
| AI / OCR / sanctions | Deterministic simulators with explicit labelling |

## Repository layout

```
src/
  app/           # providers, router, bootstrap
  components/    # shared UI
  db/            # Dexie schema
  domain/        # pure rules (future)
  features/      # feature modules
  hooks/
  layouts/
  pages/
  repositories/
  services/
  sync/
  test/
  types/
  utils/
```
