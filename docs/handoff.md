# ASTRA — Agent Handoff

**Read this first.** It states exactly where the project is, what has been verified, what to do next, and the rules every agent works under.

- **Last verified:** 28 July 2026 — P1-01 (schema v3) and P1-02 (money) merged to `main`
- **Branch convention (this environment):** `cursor/<task>-1b46` off `main` — one task ID per PR
- **Phase:** 0 complete · Phase 1 **partly** complete (auth, shell, permissions, write path, seed, **schema v3**, **money**) · Phase 2 started (customers, inquiries)

---

## 1. Document map

| Read when | Document |
|-----------|----------|
| Picking up work — start here | **`handoff.md`** (this file) |
| What the customer actually asked for | [`product-brief.md`](./product-brief.md) — verbatim, never edited |
| What to build next, in what order | [`plan.md`](./plan.md) |
| Data model, rules, state machine, permissions, screens, NFRs | [`spec.md`](./spec.md) |
| How a flow must behave for a user, offline included | [`user-flows.md`](./user-flows.md) |
| Every state machine and its guards | [`state-machines.md`](./state-machines.md) |
| Why a design decision exists (`D-xx`) | [`market-research.md`](./market-research.md) |
| Why the UI and onboarding look the way they do | [`ux-principles.md`](./ux-principles.md) |
| Sync internals | [`offline-sync.md`](./offline-sync.md) |
| Entity overview (companion to `spec.md` §5) | [`domain-model.md`](./domain-model.md) |
| Phase-level plan and architecture diagram | [`implementation-plan.md`](./implementation-plan.md) |
| What is simulated, and production hardening | [`security-notes.md`](./security-notes.md) |
| How to add a backend without a rewrite | [`future-backend.md`](./future-backend.md) |
| Deployment | [`deploy-netlify.md`](./deploy-netlify.md) |

Precedence when documents disagree: `product-brief.md` states the requirement → `spec.md` states how it is met → `user-flows.md` for user-facing behaviour → `plan.md` for sequencing. Fix the loser in the same PR. Requirement-to-doc traceability for the whole brief is `spec.md` §21.

---

## 2. Current state — verified, not assumed

Recent history on `main`:

```
bc1899e  docs: ASTRA specification, delivery plan and agent handoff (#5)
d8bf819  feat: frictionless onboarding and professional operations UI (#4)
4577e05  ci: fail Netlify workflow when repository secrets are missing (#3)
1977d26  fix: sync package-lock.json for CI and Netlify builds (#2)
04849ec  Scaffold ASTRA offline-first PWA (React, Vite, Dexie) (#1)
```

Verified on 28 July 2026 after merging `d8bf819`:

```
npm ci              → clean install, exit 0
npm run typecheck   → exit 0
npm run lint        → exit 0 (3 fast-refresh warnings in context files)
npm test            → 5 files, 16 tests passed
npm run build       → 15 precache entries, 889 KiB
```

### What exists

| Area | Files | State |
|------|-------|-------|
| Dexie schema | `src/db/astra-db.ts` | **v3.** All `spec.md` §5 tables declared (quotations → numberSequences). Migration test preserves v2 data. `SyncOutboxEntry` + `AuditLogEntry` extended |
| Seed | `src/db/seed.ts` | Demo users, customers and inquiries; idempotent |
| Demo auth | `src/features/auth/*` | `/welcome` role picker, session in IndexedDB, `RequireAuth`, `RequirePermission`. Labelled non-production in the README |
| Permissions | `src/domain/permissions.ts` | 8 permissions × 10 roles, pure, tested |
| Write path | `src/repositories/persist-entity.ts` | `persistCreate` / `persistUpdate` — one transaction covering table write + outbox + audit |
| Repositories | `customer`, `inquiry`, `audit`, `notification`, `settings`, `user`, `sync-*` | The only Dexie callers |
| Domain | `attention.ts`, `inquiry-workflow.ts`, `locations.ts`, `permissions.ts`, `role-home.ts`, **`money/`** | Pure; attention, inquiry transitions and money are tested |
| Services | `audit-service`, `notification-service`, `activation-service` | |
| Pages | dashboard, customers (list/detail/form), inquiries (list/detail/form), sync, air-freight, welcome | Real workflows, not placeholders |
| Shell | `app-header`, `app-sidebar`, `mobile-bottom-nav`, `mobile-tab-bar`, `nav-items`, `user-menu`, `quick-create-sheet` | Collapsible sidebar + mobile bottom nav |
| UI kit | badge, button, card, empty-state, field, kbd, progress, segmented, sheet, skeleton, status-badge, timeline, toast | Light and dark themes via semantic tokens |
| Extras | `command-palette`, `use-app-shortcuts`, `theme-context` | ⌘K palette, `g d`/`g i`/`g c`/`g a`/`g s`, `n` |
| Sync | `sync-engine.ts`, `sync-transport.ts`, `/sync` page | Outbox drain + queue viewer; `NoopSyncTransport` only |
| Tests | 7 files, ~44 tests | bootstrap, attention, activation, inquiry-workflow, permissions, **money (100% branch)**, **schema-v3-migration** |

**The attention queue on the dashboard is the Workboard concept from `user-flows.md` §2** — already built, severity-ranked, with the action attached. Extend it rather than starting again.

### What does **not** exist yet

Repositories/UI/workflows for shipments, quotations, bookings, cargo, documents, compliance, customs, carriers, consolidation, charges, invoices, payments, incidents · the shipment state machine · route-map planning logic · OCR and every other adapter · conflict resolution UI · customer portal · reports · error boundary.

### Reconciliation — where the code and `spec.md` disagree

The code landed first and is authoritative on naming. Fix the *spec* to match, not the code:

| Item | Code | `spec.md` says | Action |
|------|------|----------------|--------|
| Role ids | `sales_executive`, `pricing_executive`, … | `sales`, `pricing`, … | Adopt the code's `*_executive` names in §4 |
| Permission strings | `customers.read` (dot) | `customer:*` (colon) | Adopt dot notation; extend the list as features land |
| Write path API | `persistCreate` / `persistUpdate` | `createRepository<T>()` | Keep the functions; add Zod validation and soft-delete in P1-03 |
| Audit entry | optional before/after + `operationId` on the type (P1-01) | `{previousValues, newValues, changedFields, reason, operationId}` | **Wire capture in P1-03** — types exist; writers do not populate them yet |

### Known gaps to fix as you pass through

1. `vite.config.ts` has no coverage thresholds — add with P1-02.
2. No CI job runs `typecheck`/`lint`/`test` on pull requests; only the Netlify deploy workflow exists. **P1-10.**
3. `tsconfig.app.json` does **not** set `noUncheckedIndexedAccess`. `spec.md` §2 requires it — turn it on before the codebase grows.
4. `NoopSyncTransport` reports success for everything, so the outbox always drains. Replaced in **P9-03** by `MockLoopbackTransport` and `DisabledTransport` (brief §7). Never read a drained outbox as evidence that sync works.
5. `SyncOutboxEntry` now has `nextAttemptAt` / `dependencyOperationIds` and `conflict`/`cancelled` statuses (P1-01); backoff and dependency ordering still land in **P9-01**.
6. `persistEntity` has no `persistDelete` and does not re-validate with Zod — both required by `spec.md` §3.2 and §7. **P1-03.**
7. Three `only-export-components` lint warnings in `auth-context`, `theme-context` and `command-palette` — harmless, but they will hide a real warning eventually.

## 3. Start here

`main` now carries demo auth, the shell, permissions, a transactional write path, seed data, customers, inquiries, **`src/domain/money` (P1-02)**, and **Dexie schema v3 (P1-01)**. Next blocking platform task:

### P1-01 — Dexie schema ✅ complete
Schema v3 adds the remaining domain tables from `spec.md` §5, extends `SyncOutboxEntry` (`nextAttemptAt`, `dependencyOperationIds`, `conflict`/`cancelled`) and `AuditLogEntry` (before/after, `changedFields`, `reason`, `operationId`). Migration test opens a populated v2 DB and upgrades cleanly.

### P1-02 — Money domain ✅ complete
`src/domain/money/` with integer minor units, `add` / `subtract` / `multiplyByRate` / `allocate()` (largest-remainder) / `convert` / `format` / `marginOf`, 100% branch coverage. Quotations and finance must import from here only — no floats.

### P1-03 (revised) — Harden the write path ← **do this next**
`persistCreate` / `persistUpdate` already give one transaction covering table + outbox + audit. Add: Zod re-validation at the repository, `persistDelete` for soft deletes, and the before/after capture the extended audit entry needs. Test that a forced mid-transaction failure leaves no partial state.

Then Phase 2 continues from `P2-03` (rate cards) — customers (`P2-01`) and inquiry capture (`P2-02`) are substantially done and need reconciling with `spec.md` rather than rebuilding.

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
- [ ] Keyboard-operable, labelled, visible focus; status never conveyed by colour alone
- [ ] Loading, empty and error states present for any new screen
- [ ] Docs updated if behaviour diverged from them
- [ ] PR names the task ID (e.g. `P3-04`)

---

## 5. Commands

All eight scripts required by the brief exist and work:

```bash
npm ci                # install (lockfile is committed and must stay in sync)
npm run dev           # dev server, PWA service worker enabled in dev
npm run typecheck     # tsc -b --noEmit
npm run lint          # oxlint
npm test              # vitest run
npm run test:watch    # vitest watch
npm run test:coverage # vitest run --coverage
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
5. **Offline number allocation uses per-device sequence blocks** (`spec.md` §8), not a device segment in the number — shipment numbers must read `EX/BLR/24/000123`. Two offline devices minting the same invoice number is a data-integrity bug, not a cosmetic one.
6. **Tailwind 4** is configured through the Vite plugin — there is no `tailwind.config.js`. Theme extensions go in CSS via `@theme`.
7. **The Netlify workflow deploys `main`.** Merging to `main` publishes. Feature work stays on the branch above.

---

## 7. Definition of done for the MVP

The formal bar is the **30 acceptance criteria in [`spec.md`](./spec.md) §20**, verified by the procedure in [`plan.md`](./plan.md) §14. In practical terms, the MVP is complete when a reviewer can, on a single device with the network disabled after first load:

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
