# ASTRA — Agent Handoff

**Read this first.** It states exactly where the project is, what has been verified, what to do next, and the rules every agent works under.

- **Last verified:** 28 July 2026 against commit `4577e05`
- **Branch:** `claude/astra-logistics-erp-setup-x4pt7p` (all work goes here; never push elsewhere without explicit permission)
- **Phase:** 0 complete → **Phase 1 not started**

---

## 1. Document map

| Read when | Document |
|-----------|----------|
| Picking up work — start here | **`handoff.md`** (this file) |
| What to build next, in what order | [`plan.md`](./plan.md) |
| Data model, rules, state machine, permissions, NFRs | [`spec.md`](./spec.md) |
| How a flow must behave for a user, offline included | [`user-flows.md`](./user-flows.md) |
| Why a design decision exists (`D-xx`) | [`market-research.md`](./market-research.md) |
| Sync internals | [`offline-sync.md`](./offline-sync.md) |
| Entity overview (companion to `spec.md` §5) | [`domain-model.md`](./domain-model.md) |
| Phase 0 record (superseded by `plan.md`) | [`implementation-plan.md`](./implementation-plan.md) |
| Deployment | [`deploy-netlify.md`](./deploy-netlify.md) |

Precedence when documents disagree: `spec.md` for rules and data → `user-flows.md` for user-facing behaviour → `plan.md` for sequencing. Fix the loser in the same PR.

---

## 2. Current state — verified, not assumed

Commit history on the branch:

```
4577e05  ci: fail Netlify workflow when repository secrets are missing (#3)
1977d26  fix: sync package-lock.json for CI and Netlify builds (#2)
04849ec  Scaffold ASTRA offline-first PWA (React, Vite, Dexie) (#1)
c9fc85d  Initial commit
```

Verified on 28 July 2026:

```
npm ci      → clean install, exit 0
npm test    → 1 file, 2 tests passed (vitest 4.1.10, ~1s)
```

### What exists (~950 lines of source)

| Area | File | State |
|------|------|-------|
| Dexie schema | `src/db/astra-db.ts` | **v1 with only 3 tables:** `syncOutbox`, `syncMetadata`, `appSettings`. No domain tables yet |
| Bootstrap | `src/db/bootstrap.ts` | Device metadata + a bootstrap marker; enqueues one demo outbox entry |
| Base types | `src/types/base.ts` | `BaseEntity`, `SyncStatus`, `SyncOutboxEntry`, `SyncMetadata` |
| Sync | `src/sync/sync-engine.ts`, `sync-transport.ts` | Outbox drain loop, 30 s interval + `online` listener; `NoopSyncTransport` marks everything successful |
| Repositories | `src/repositories/sync-*.ts` | Outbox and metadata only. **No generic write path, no audit, no domain repos** |
| App | `src/app/router.tsx`, `providers.tsx` | Two routes: `/` and `/modules/air` |
| UI | `src/layouts/app-shell.tsx`, `components/ui/*`, `components/layout/offline-banner.tsx` | Shell, nav, offline banner, `Button`, `Card` |
| Pages | `src/pages/dashboard-page.tsx`, `air-freight-page.tsx` | Static marketing-style content. **No workflow** |
| Hooks | `src/hooks/use-online-status.ts` | Connectivity state |
| Utils | `src/utils/id.ts`, `time.ts` | `createId()`, `nowUtcIso()` |
| Tests | `src/test/db-bootstrap.test.ts` | 2 tests: bootstrap idempotency and outbox enqueue |
| Empty | `src/domain/`, `src/features/`, `src/services/` | `.gitkeep` only |
| Build | `vite.config.ts` | React + Tailwind 4 + `vite-plugin-pwa` (autoUpdate, dev SW on), `@` → `src`, vitest jsdom |
| CI | `.github/workflows/netlify-deploy.yml` | Builds and deploys `main` to Netlify; fails loudly if `NETLIFY_AUTH_TOKEN`/`NETLIFY_SITE_ID` are missing |

### What does **not** exist yet

Authentication, roles or guards · any domain entity table · any business logic · the state machine · money utilities · audit logging · seed data · Workboard · every feature module · React Hook Form/Zod usage · TanStack Query usage beyond the provider · route guards · tests beyond the two above.

**In short: the chassis is built, the vehicle is not.** Treat the two existing pages as placeholders to be replaced, not as patterns to copy.

### Known gaps to fix as you pass through

1. `vite.config.ts` has no coverage thresholds — add them with P1-02 (`spec.md` §10 requires 100% branch coverage on domain).
2. There is no CI job running `lint`/`test` on pull requests; only the Netlify deploy workflow exists. Worth adding in Phase 1.
3. `tsconfig.app.json` should have `noUncheckedIndexedAccess` verified before P1-01 lands (`spec.md` §2).
4. `NoopSyncTransport` reports success for everything, so the outbox always drains. Keep it, but the sync console (P9-03) must state plainly that the transport is simulated.

---

## 3. Start here

**The next three tasks are serial and block everything else.** Do them in order, in separate PRs:

### P1-01 — Dexie schema v2
Add every table from [`spec.md`](./spec.md) §5 in one migration: users, customers, customerContacts, inquiries, quotations, quotationLines, bookings, shipments, cargo, cargoPieces, consolidations, costAllocations, routeMaps, routeMapMilestones, shipmentEvents, documents, documentDiscrepancies, complianceChecks, dgChecklistItems, customsFilings, charges, invoices, payments, notifications, incidents, auditLogs, carriers, warehouses, locations, rateCards, rateLines, laneRules, routeMapTemplates, exceptionRoutingRules, syncConflicts, numberSequences.

Index what the Workboard and shipment list actually query: `[customerId+status]`, `[status+updatedAt]`, `shipmentId`, `[shipmentId+sequence]`, `syncStatus`. Add a migration test that opens v1 and upgrades cleanly — Phase 0 data must survive.

**Do this before anything else.** Schema churn after features exist is the most expensive mistake available here.

### P1-02 — Money domain
`src/domain/money/` with integer minor units, `allocate()` using largest-remainder so parts always sum to the whole, explicit rounding, locale formatting. 100% branch coverage. No other task should invent monetary arithmetic.

### P1-03 — Base repository write path
`createRepository<T>()` giving every aggregate the same transactional guarantee: validate (Zod) → bump `version` → set `updatedAt`/`updatedBy` → write `AuditLog` → enqueue `SyncOutboxEntry`, all in **one** Dexie transaction. Every later repository derives from this. Test that a write with a forced mid-transaction failure leaves no partial state.

Then P1-04 … P1-08 per [`plan.md`](./plan.md) §2.

---

## 4. Working agreement

### Non-negotiables (from `spec.md` §3.2)

1. IndexedDB only from `src/repositories` and `src/db`.
2. No business rules in components — a component formats and dispatches.
3. `src/domain/**` is pure: no Dexie, no React, no repository imports.
4. Every mutation: one transaction, audit entry, outbox entry, version bump.
5. Status changes only through the state machine service.
6. Money in integer minor units through `src/domain/money`. No floats.
7. History appends. Revisions supersede. Closure freezes.
8. Simulated features carry a `simulated: true` flag, a visible badge, and a row in `spec.md` §12.
9. Timestamps stored ISO 8601 UTC, displayed via `Intl`.
10. Nothing blocks on the network.

### Conventions

- **Files:** `kebab-case.ts`. **Components:** `PascalCase`. **Hooks:** `use-*.ts`. **Types:** `PascalCase`, enums as `const` arrays + derived union (match `src/types/base.ts`).
- **Imports:** `@/` alias always; no deep relative chains.
- **Feature folder:** `features/<name>/{components,hooks,schema.ts,index.ts}`. Export through `index.ts`.
- **Errors:** typed codes from `spec.md` §11, never bare strings. Every message says what is wrong *and* what to do next.
- **Dates:** `date-fns` + `Intl`. Never construct display strings by hand.
- **Tests:** colocate as `*.test.ts(x)` next to the unit; shared fixtures in `src/test/`.

### Commits

`feat|fix|test|docs|chore|refactor: <what changed>` — imperative, specific. Several small commits per task, e.g.:

```
feat: add shipment transition table and guards
feat: append shipment event and audit entry on transition
test: cover blocked departure without accepted customs filing
```

Never squash a whole phase into one commit.

### PR checklist

- [ ] `npm run lint`, `npm test`, `npm run build` all pass
- [ ] New domain logic at 100% branch coverage
- [ ] Every mutation writes an audit entry and an outbox entry (asserted in a test)
- [ ] Flow works offline per `user-flows.md` §4
- [ ] No IndexedDB access outside `db/`/`repositories/`
- [ ] No business rule added to a component
- [ ] New simulated surface registered in `spec.md` §12 with a badge
- [ ] Keyboard-operable, labelled, visible focus
- [ ] Docs updated if behaviour diverged from them
- [ ] PR names the task ID (e.g. `P3-04`)

---

## 5. Commands

```bash
npm ci                # install (lockfile is committed and must stay in sync)
npm run dev           # dev server, PWA service worker enabled in dev
npm test              # vitest run
npm run test:watch    # vitest watch
npm run lint          # oxlint
npm run build         # tsc -b && vite build
npm run preview       # serve dist — use this to test true offline behaviour
```

**Offline testing:** `npm run build && npm run preview`, load once, then set the browser to offline and reload. The dev server's service worker is not a substitute for this check.

---

## 6. Pitfalls specific to this repository

1. **`NoopSyncTransport` always succeeds.** Do not read a drained outbox as evidence that sync works. Write transport tests against a fake that fails and conflicts.
2. **Dev service worker is enabled** (`devOptions.enabled: true`). A stale SW can serve old assets during development — hard-reload or unregister when a change seems not to apply.
3. **`fake-indexeddb` needs a fresh DB per test.** Delete and reopen between tests or state leaks across cases.
4. **Blob storage in IndexedDB counts against the origin quota.** Check quota before writing a document; surface a real error rather than failing silently (see `plan.md` §12).
5. **Offline number allocation must be device-prefixed.** Two offline devices allocating `INV-000001` is a data-integrity bug, not a cosmetic one.
6. **Tailwind 4** is configured through the Vite plugin — there is no `tailwind.config.js`. Theme extensions go in CSS via `@theme`.
7. **The Netlify workflow deploys `main`.** Merging to `main` publishes. Feature work stays on the branch above.

---

## 7. Definition of done for the MVP

The MVP is complete when a reviewer can, on a single device with the network disabled after first load:

1. Log in as each seeded role and land on a meaningful Workboard.
2. Take an inquiry through quotation, margin approval and booking.
3. Create a shipment, watch its route map plan, and be blocked from departing until documents, compliance, DG, security and customs filings are all satisfied.
4. Compare carriers, book one with a recorded rationale, build a consol and allocate its cost.
5. Complete pickup, warehouse receipt and delivery with photos and a signature, entirely offline.
6. Invoice the job, apply a payment, review the three-basis P&L, and close it — then be refused when trying to mutate it.
7. See an exception raised, routed, escalated and resolved.
8. Open the customer portal and see only that customer's data.
9. Inspect the sync queue and resolve a conflict.
10. Find every simulated surface clearly labelled as simulated — with no screen anywhere implying an integration exists that does not.
