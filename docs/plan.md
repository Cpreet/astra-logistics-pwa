# ASTRA — Delivery Plan

Authoritative build schedule. Task IDs here are the unit of work: a branch, a commit series and a PR reference one task ID. Behaviour comes from [`user-flows.md`](./user-flows.md); rules and data come from [`spec.md`](./spec.md); current state comes from [`handoff.md`](./handoff.md).

Phase-level narrative and the architecture diagram live in [`implementation-plan.md`](./implementation-plan.md); this file is the task-level schedule.

---

## 0. Ground rules

1. **The repository is runnable after every task.** `npm run build` and `npm test` pass on every commit that lands on the branch.
2. **One task per PR**, small commits within it. Commit subjects: `feat|fix|test|docs|chore|refactor: <what changed>`.
3. **Vertical slices, not layers.** A task delivers domain + repository + service + UI + tests for one flow. Do not build "all repositories" as a task.
4. **Domain before UI within a task.** Write the pure function and its test first; the screen is the last step.
5. **No task is done without its offline behaviour** matching the matrix in `user-flows.md` §4.
6. **Update the docs in the same PR** when behaviour diverges from them. Docs drifting from code is a defect.
7. **Do not add scope silently.** If a task turns out to need something not listed, note it in the PR and add a task rather than growing the current one.

---

## 1. Phase map

| Phase | Theme | Tasks | Gate |
|-------|-------|-------|------|
| **0** | Scaffold | — | ✅ complete (`4577e05`) |
| **1** | Platform foundation | P1-01 … P1-10 | 🟡 **partly done** (`d8bf819`) — auth, shell, permissions, write path, seed and notifications landed. Money, full schema and hygiene remain |
| **2** | Commercial | P2-01 … P2-06 | 🟡 **started** — customers and inquiry capture landed; rating, quotations and bookings remain |
| **3** | Shipment core | P3-01 … P3-09 | Booking → shipment with a route map; guarded transitions; event timeline |
| **4** | Documents & compliance | P4-01 … P4-06 | Documents, simulated OCR, reconciliation, compliance and DG gates |
| **5** | Carrier, consol & customs | P5-01 … P5-05 | Carrier comparison, consolidation, filings that block departure |
| **6** | Physical operations | P6-01 … P6-04 | Pickup, warehouse receipt, delivery and POD — all fully offline |
| **7** | Finance | P7-01 … P7-06 | Charges, invoices, payments, job P&L, closure freeze |
| **8** | Exceptions & control tower | P8-01 … P8-05 | Incidents, escalation, delay detection, reports |
| **9** | Sync, portal & hardening | P9-01 … P9-06 | Conflict resolution, customer portal, a11y, performance, seed demo |

---

## 2. Phase 1 — Platform foundation

**Goal:** the chassis every later task bolts onto. Getting this wrong is expensive; getting it right makes phases 2–9 mechanical.

| ID | Task | Delivers | Depends on |
|----|------|----------|------------|
| **P1-01** | Dexie schema (revised) | ✅ **done** — Schema **v3** with remaining `spec.md` §5 tables; `SyncOutboxEntry` + `AuditLogEntry` extended; v2→v3 migration test | — |
| **P1-02** | Money domain | ✅ **done** — `src/domain/money`: add, subtract, multiplyByRate, allocate (largest-remainder), convert, format, marginOf. 100% branch coverage | — |
| **P1-03** | Write path hardening | `persistCreate`/`persistUpdate` already do table + outbox + audit in one transaction. Add Zod re-validation, `persistDelete` for soft deletes, and before/after capture for the audit entry | P1-01 |
| **P1-04** | Audit log | 🟡 `audit-service` + `audit-repository` write entries today. **Remaining:** before/after values, `operationId`, mandatory reasons, and the shared `<AuditTrail />` viewer on all eight entities (`spec.md` §5.22) | P1-03 |
| **P1-05** | Demo auth + capabilities | ✅ **done in `d8bf819`** — `/welcome` role picker, session, `hasPermission()`, `RequireAuth`/`RequirePermission`, labelled non-production. Extend `Permission` as features land |
| **P1-06** | Seed & reference data | 🟡 users, customers and inquiries seeded in `d8bf819`; IATA lookup exists in `domain/locations.ts`. **Remaining:** carriers, warehouses, charge codes, lane rules, route-map templates, rate cards, settings, and a **Reset Demo Data** action | P1-01 |
| **P1-07** | App shell + Workboard | ✅ **largely done in `d8bf819`** — collapsible sidebar, mobile bottom nav, dashboard attention queue (the Workboard), skeletons, empty states, toasts, offline banner, command palette. **Remaining:** the rest of the required primary navigation as those modules land, and unsaved-change protection |
| **P1-08** | Notification centre | 🟡 `notification-repository` and `notification-service` exist. **Remaining:** the in-app centre UI and `NotificationChannelAdapter` with simulated badges | P1-03 |
| **P1-09** | Errors & resilience | Application error boundary, the ten typed domain error classes (`spec.md` §11), user-facing message map, local technical logging that excludes secrets and document contents | P1-03 |
| **P1-10** | Project hygiene | Coverage thresholds in `vite.config.ts`, `noUncheckedIndexedAccess`, a CI workflow running `typecheck`/`lint`/`test` on pull requests | — |

**Exit criteria:** log in as each of the 10 seeded users; each lands on a role-appropriate Dashboard/Workboard; a scratch write produces an audit entry and an outbox entry; money tests at 100% branch coverage; all eight required npm scripts pass; app loads with the network off.

> **Seed scope note:** P1-06 delivers *reference* data. The full demo dataset required by `spec.md` §17 — including the `EX/BLR/24/000123` shipment, varied statuses, conflicts and incidents — is **P9-06**, because it can only be built once the entities exist. Seeding must be idempotent from the first commit, and **"Reset Demo Data"** (with confirmation) ships in P1-06 so it is available throughout.

**Commit series example (P1-02):**
```
feat: add decimal-safe money domain in minor units
feat: add largest-remainder allocation
test: cover rounding, allocation and currency mismatch
```

---

## 3. Phase 2 — Commercial (F1–F6)

| ID | Task | Delivers | Depends on |
|----|------|----------|------------|
| **P2-01** | Customers & contacts | 🟡 list, search, filters, detail, status changes and a create form landed. **Remaining:** contacts, credit fields, compliance + security status (`D-16`), audit tab | P1-03 |
| **P2-02** | Inquiry capture (F1) | 🟡 list, detail, form, workflow timeline and validated transitions landed; IATA lookup and lane templates work. **Remaining:** inline lead creation, live volumetric/chargeable weight, sequence-block numbering | P2-01 |
| **P2-03** | Rate cards + instant rate (F2) | `RateCard`/`RateLine` admin, lane+weight-break lookup, draft charge generation, `no_rate_card` routing | P1-06 |
| **P2-04** | Quotation build (F3) | Line editor, live margin banner, decimal-safe totals, Zod validation, revision model | P1-02, P2-03 |
| **P2-05** | Quotation lifecycle (F4, F5) | State machine, margin-approval routing, send, accept/reject, expiry rule, immutable revisions | P2-04 |
| **P2-06** | Booking (F6) | Convert with commercial snapshot, party selection, credit-limit block + audited override | P2-05 |

**Exit criteria:** a Sales user completes inquiry → quotation → approval → booking entirely offline; a below-threshold margin routes to Pricing; an expired quotation is refused with `E_QUOTATION_EXPIRED`; revising a sent quote leaves revision N intact.

---

## 4. Phase 3 — Shipment core (F7, F16 manual, F17 detection)

| ID | Task | Delivers | Depends on |
|----|------|----------|------------|
| **P3-01** | Shipment creation (F7) | From booking, numbering, party/cargo copy, direct vs. house, `awbMode` | P2-06 |
| **P3-02** | Cargo & pieces | `CargoPiece` editor, weight calculations, DG fields, density warning, validation | P3-01 |
| **P3-03** | Route-map planning | Template resolution, milestone generation, re-plan as a new revision. Pure, 100% coverage | P1-06 |
| **P3-04** | State machine | Transition table, guards, `transitionShipment()` with the full 10-step effect chain, all-failures-at-once reporting | P3-01, P3-03 |
| **P3-05** | Event timeline | Append-only events, FSU codes, idempotency by `sourceReference`, internal/customer visibility filter | P3-04 |
| **P3-06** | Shipment workspace UI | Tabbed detail (overview/cargo/documents/compliance/customs/carrier/events/finance/audit), route-map timeline with planned vs. actual, "next action" panel | P3-04 |
| **P3-07** | Milestone monitor | Local timer classifying `on_plan | at_risk | missed`, derived `delayMinutes`, Workboard feed | P3-03 |
| **P3-08** | Tracking screen | Route summary, current location label, milestone timeline with estimated vs. actual, delay status, last update source/time, freshness indicator, lightweight SVG route visual (no paid map API), manual event entry, simulated carrier updates for seeded shipments | P3-05 |
| **P3-09** | Internal notes | `ShipmentNote` thread on the shipment workspace and the mobile "More" screen; `internal` notes never reach a customer session (repository-enforced, tested) | P3-06 |

**Exit criteria:** an Operations user creates a shipment with a full route map; an illegal transition is refused with its error code and a next step; a missed milestone appears on the Workboard within a minute — all offline.

---

## 5. Phase 4 — Documents & compliance (F8–F10)

| ID | Task | Delivers | Depends on |
|----|------|----------|------------|
| **P4-01** | Document storage | Blob in IndexedDB, checksum, duplicate detection, type/size limits, safe preview with revoked object URLs | P1-03 |
| **P4-02** | Simulated OCR | Deterministic per-type extraction, `ocrStatus` lifecycle, confidence per field, `simulated: true` in the result | P4-01 |
| **P4-03** | OCR review UI | Side-by-side preview + fields, low-confidence focus order, verify/reject with reasons | P4-02 |
| **P4-04** | Reconciliation (F9) | Cross-document comparison rules, `DocumentDiscrepancy`, resolution flow, >10% weight → P2 | P4-03 |
| **P4-05** | Compliance engine (F10) | Rule registry, `ComplianceCheck` records, override with justification, hold/release | P3-04, P4-04 |
| **P4-06** | DG checklist + screening adapter | Itemised IATA-style checklist blocking tender; simulated denied-party adapter raising P1 on match | P4-05 |

**Exit criteria:** a shipment cannot reach `ready_for_carrier_booking` with a missing mandatory document, an unresolved error discrepancy, or an incomplete DG checklist; every simulated surface is badged; all of it works offline.

---

## 6. Phase 5 — Carrier, consolidation & customs (F11, F12, F15)

| ID | Task | Delivers | Depends on |
|----|------|----------|------------|
| **P5-01** | Carrier rate options | `CarrierRateOptionProvider` interface + deterministic local provider, explainable score breakdown, capacity eligibility | P1-06 |
| **P5-02** | Carrier booking (F11) | Comparison UI, mandatory rationale when not cheapest, `BKD` event, ETD-driven route-map re-plan, CO₂ estimate | P5-01, P3-04 |
| **P5-03** | Consolidation (F12) | Consol CRUD, house attachment, capacity totals, close/reopen | P5-02 |
| **P5-04** | Cost allocation | Allocation by basis using `money.allocate`, versioned `CostAllocation`, recompute on membership change | P5-03, P1-02 |
| **P5-05** | Customs filings (F15) | `CustomsFiling` lifecycle, lane-driven requirement, field-gap UI, simulated transmission, **departure hard block**, rejection → P2 | P4-05 |

**Exit criteria:** `departed` is refused with `E_CUSTOMS_NOT_ACCEPTED` while a required filing is outstanding; closing a consol allocates costs so the parts sum exactly to the whole; a queued filing is never presented as lodged.

---

## 7. Phase 6 — Physical operations (F13, F14, F19)

Everything in this phase must complete **fully offline on a phone**. Test each with the network disabled.

| ID | Task | Delivers | Depends on |
|----|------|----------|------------|
| **P6-01** | Capture primitives | Camera/file photo capture, signature canvas → Blob, offline-save indicator, pending-count badge | P4-01 |
| **P6-02** | Pickup (F13) | Scheduling, field capture, piece/weight discrepancy prompt, refusal handling | P6-01, P3-04 |
| **P6-03** | Warehouse receipt (F14) | Lookup by number/AWB, received pieces/weight/condition, screening record, damage report → P2, re-rate on weight change | P6-01 |
| **P6-04** | Delivery & POD (F19) | Delivery planning, driver capture, POD auto-attached as a document, short/damaged handling | P6-01 |

**Exit criteria:** with the device offline, a driver completes pickup and delivery including photos and signature; the queue shows the exact pending count; nothing is lost across an app restart.

---

## 8. Phase 7 — Finance (F20, F21)

| ID | Task | Delivers | Depends on |
|----|------|----------|------------|
| **P7-01** | Charge management | Charge CRUD from quotation/rate card/allocation/manual, `costBasis`, `isDisbursement` | P1-02, P5-04 |
| **P7-02** | Financial calculation service | Buy/sell/tax/margin/WIP on estimated, accrued and actual bases; disbursements excluded from GP. 100% branch coverage | P7-01 |
| **P7-03** | Customer invoicing (F20) | Generate from sell lines, duplicate-number refusal, issue, credit notes, no deletion | P7-02 |
| **P7-04** | Payments & receivables | Application with over-payment refusal, derived overdue, ageing buckets, disputes | P7-03 |
| **P7-05** | Vendor invoices & matching (F21) | Capture, accrual-to-actual match, variance → P3 incident | P7-02 |
| **P7-06** | Job P&L & closure | Three-basis P&L view, closure guards, freeze, audited reopen | P7-05 |

**Exit criteria:** a job goes from charges to issued invoice to payment to `financially_closed`; a closed job refuses mutation with `E_JOB_CLOSED`; disbursements never inflate gross profit; no float appears anywhere in the finance path.

---

## 9. Phase 8 — Exceptions & control tower (F17, F22)

| ID | Task | Delivers | Depends on |
|----|------|----------|------------|
| **P8-01** | Incident engine | Auto-raise from rules, priority table, routing rules, lifecycle, root-cause codes | P3-07 |
| **P8-02** | Escalation timers | Local per-priority timers, in-app escalation real, external simulated, Manager view | P8-01 |
| **P8-03** | Delay prediction | Deterministic estimator with visible inputs, badged simulated, graceful default | P3-07 |
| **P8-04** | Dashboard KPIs & charts | Every metric in `spec.md` §15.3 (active/delivered/delayed, pending documentation, compliance %, revenue/cost/profit/margin, SLA and carrier performance, average clearance time, open P1/P2, pending sync) plus status distribution, revenue vs. cost, recent activity, critical alerts, upcoming departures/arrivals, documentation exceptions — **all derived from local data, no hardcoded chart values** | P7-02 |
| **P8-05** | Reports & CSV | The 15 required reports (`spec.md` §15.3) with CSV export and honest empty states; basis + as-of stamped on every figure | P8-04 |

**Exit criteria:** a missed milestone produces a routed incident that escalates on schedule and closes with a root cause; incident deduplication prevents a second open incident for the same condition; every reported figure names its basis and timestamp; no chart reads from a literal.

---

## 10. Phase 9 — Sync, portal & hardening (F23, F24)

| ID | Task | Delivers | Depends on |
|----|------|----------|------------|
| **P9-01** | Sync engine hardening | The five required interfaces (`LocalRepository`, `SyncTransport`, `SyncEngine`, `ConflictResolver`, `ConnectivityService`); exponential backoff with `nextAttemptAt`; dependency ordering via `dependencyOperationIds`; per-entity status propagation; replay safety; retry reusing the same `operationId` | P1-03 |
| **P9-02** | Conflict resolution | `SyncConflict` table, version-conflict detection, field-level diff UI (entity, local version, simulated remote version, differing fields), keep-local / accept-remote / merge-selected, resolution note + audit record. **Financial and compliance conflicts never auto-resolve** | P9-01 |
| **P9-03** | Sync Centre & simulator | Queue inspector, sync history, manual retry, cancel safe pending operations, pause/resume, last successful sync, reference-data staleness, transport identity; `MockLoopbackTransport` + `DisabledTransport`; dev simulator triggering offline / slow / one failure / repeated failures / conflict / recovery | P9-01 |
| **P9-04** | Customer portal (F23) | Scoped read-only shipments, action-required view, tracking timeline, approved documents, invoices, payment status, notifications, quotation accept/reject. **Exclusions in `spec.md` §15.6 enforced at the repository and tested** | P3-05, P7-03 |
| **P9-05** | Accessibility & performance | Keyboard paths, focus management, live regions, AA contrast, status never by colour alone; virtualised lists; table horizontal overflow; NFR targets in `spec.md` §9 measured | all |
| **P9-06** | Demo dataset & docs | The full idempotent seed in `spec.md` §17 including `EX/BLR/24/000123`, every lifecycle stage, a compliance hold, an overdue invoice, P1–P4 incidents, a failed sync operation and a version conflict; README rewrite against brief §17; screenshots | all |

**Exit criteria:** every NFR in `spec.md` §9 is measured and met; a customer-role session provably cannot read another customer's data; re-running the seed never duplicates; "Reset Demo Data" restores a clean demo; all 30 acceptance criteria in `spec.md` §20 hold.

---

## 11. Parallelisation

Phase 1 is a serial bottleneck — **P1-01, P1-02 and P1-03 should land before anything else starts.** After that:

```
P1-01 ─┬─ P1-03 ─┬─ P2-* ─── P3-* ─┬─ P4-* ─── P5-* ─── P6-*
       │         │                 └─ P7-* (needs P5-04 for allocation)
       ├─ P1-05 ─── P1-07                    P8-* (needs P3-07)
       ├─ P1-06 ─── P2-03, P3-03, P5-01
       └─ P1-02 ─── P2-04, P7-02
```

Safe concurrent lanes once Phase 1 lands:

| Lane | Tasks | Touches |
|------|-------|---------|
| Commercial | P2-* | `features/inquiry`, `features/quotation`, `features/booking` |
| Reference data | P1-06, P2-03, P5-01 | `db/seed`, `features/rate-cards`, `features/carriers` |
| Documents | P4-01…P4-04 | `features/documents` |
| Finance domain | P1-02, P7-02 | `domain/money`, `domain/finance` |

**Shared files that need coordination:** `src/db/astra-db.ts` (schema), `src/domain/shipment-state-machine.ts` (transition table), `src/app/router.tsx`, `src/types/*`. Announce edits to these in the PR title; prefer additive changes.

---

## 12. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema churn after data exists | Migration pain | Land P1-01 with all tables from `spec.md` §5 up front; add indexes not tables later |
| Guards leaking into components | Rules become untestable and inconsistent | Lint rule + review checklist item; guards live in `domain/` |
| Float money creeping in | Wrong invoices, silent corruption | Minor units only; test asserting no raw monetary numbers escape `domain/money` |
| Simulated features reading as real | Breaks the honesty requirement | Register in `spec.md` §12 + badge + `simulated` flag + a test asserting the register is complete |
| Blob storage bloating IndexedDB | Quota errors on device | Size cap, quota check before write, clear error, purge tool in the sync console |
| Route-map templates missing for a lane | Silent bad plans | Fall back to the mode default and raise a P3 so the gap is visible |
| Offline number collisions | Duplicate invoice/shipment numbers | Device-prefixed sequences, reconciled on sync, duplicate detection at the repository |

---

## 13. Verification per phase

Before a phase is called done, run and record:

```bash
npm ci
npm run typecheck
npm run lint
npm test            # + npm run test:coverage on the domain modules the phase touched
npm run build
npm run preview     # then: load once, go offline, reload, exercise the phase's flows
```

Plus a manual offline pass on a phone-sized viewport for phases 3, 6 and 9.

**Never start a later phase while the current one has TypeScript or build failures** (brief §19).

---

## 14. Final verification

Before the MVP is reported complete, run this in order and record the result of each step:

1. Install from a clean dependency state (`rm -rf node_modules && npm ci`)
2. `npm run typecheck`
3. `npm run lint`
4. `npm test` (and `npm run test:coverage`)
5. `npm run build`
6. Load the preview build and inspect the browser console for errors
7. Test offline mode
8. Test refresh while offline
9. Test adding data offline
10. Test recovery after returning online
11. Test a version conflict end to end
12. Log in as each of the ten seeded roles and confirm permissions differ
13. Review mobile layouts at common viewport sizes
14. Verify no secrets or credentials are committed
15. Verify the git working tree is clean

Then produce: an implementation summary · the list of completed modules · the commands used to verify · test results · known limitations · the recommended next backend milestone (see [`future-backend.md`](./future-backend.md)).

**Do not report a feature as complete unless it is implemented and verified.**

---

## 15. Mapping to the brief's phase list

The brief (§19) gives nine phases. They map to the task IDs above; the ordering differs only where a dependency demanded it, and every brief phase is covered.

| Brief phase | Covered by |
|-------------|-----------|
| 1 Foundation — Vite/TS, lint, routing, design system, PWA, shell, demo auth | **Phase 0** (done) + P1-05, P1-07, P1-09, P1-10 |
| 2 Persistence — Dexie, entity types, repositories, seed, audit | P1-01, P1-03, P1-04, P1-06 |
| 3 Customers and quotations | P2-01 … P2-06, P1-02 (financial calculations) |
| 4 Shipment operations — booking conversion, creation, state machine, cargo, timeline, tracking | P3-01 … P3-09 |
| 5 Documents and compliance | P4-01 … P4-06 (+ P5-05 customs, an addition per `D-13`) |
| 6 Finance | P7-01 … P7-06 (+ P5-03/P5-04 consolidation costing, per `D-10`) |
| 7 Exceptions and sync | P8-01 … P8-03, P9-01 … P9-03 |
| 8 Dashboards and customer portal | P8-04, P8-05, P9-04 |
| 9 Quality — tests, accessibility, performance, docs, build verification | P9-05, P9-06, §14 above |

Carrier comparison and consolidation (Phase 5 here) have no equivalent brief phase — they are research-driven additions (`D-10`, `D-27`) and are sequenced where their dependencies fall.
