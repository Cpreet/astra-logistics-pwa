# ASTRA — Engineering Specification

**ASTRA — AI-Powered Freight Intelligence Platform.** Offline-first logistics ERP delivered as a Progressive Web App.

This is the **canonical contract** for every agent working on this repository. Where this document and any other disagree, this document wins, except that [`user-flows.md`](./user-flows.md) is authoritative for user-facing flow behaviour and [`market-research.md`](./market-research.md) is authoritative for *why* a design decision (`D-xx`) exists.

- Current build status and how to pick up work: [`handoff.md`](./handoff.md)
- Phased delivery schedule: [`plan.md`](./plan.md)

---

## 1. Scope

**In scope for the MVP:** the complete air-freight forwarding lifecycle from customer inquiry to financial closure, offline-first, frontend-only, with a domain model that extends to sea, road, rail, courier, import and export without rework.

**Explicitly out of scope for the MVP:** a real backend, production authentication, real OCR, real sanctions screening, real carrier/customs integrations, real outbound email/SMS/push, and payment processing. Each of these has a defined seam so it can be added without rewriting UI or domain logic.

**Non-goal:** disconnected demo screens. Every screen must participate in a workflow that changes persisted state, writes history, and can be resumed after a reload or a device restart.

---

## 2. Technology

| Concern | Choice | Notes |
|---------|--------|-------|
| Runtime | Node.js ≥ 20 (`.nvmrc`) | npm only |
| Framework | React 19 + TypeScript strict | `noUncheckedIndexedAccess` on |
| Build | Vite 8 | `@` alias → `src/` |
| Routing | React Router 7 | Data router |
| Persistence | Dexie 4 / IndexedDB | Only layer that touches IndexedDB |
| PWA | `vite-plugin-pwa` | App shell must load with no network |
| Forms | React Hook Form + Zod | Zod schema is the single validation source |
| Server state | TanStack Query | `queryFn` reads repositories, never Dexie directly |
| Dates | date-fns | Store ISO 8601 UTC, render in user locale |
| Icons | lucide-react | |
| Styling | Tailwind CSS 4 | shadcn/ui *patterns*, vendored — no hosted component service |
| Tests | Vitest + React Testing Library + fake-indexeddb | |
| Lint | oxlint | |

**Dependency rule:** do not add a dependency for something implementable in under ~150 lines. New runtime dependencies require a note in the PR description explaining what it replaces.

---

## 3. Architecture

### 3.1 Layers

```
components / pages / features      UI only. No business rules. No Dexie.
        ↓ (hooks)
hooks                              TanStack Query wrappers over repositories
        ↓
services                           orchestration: transitions, workflows, side effects
        ↓
domain                             pure functions: rules, state machines, money, scoring
        ↓
repositories                       the only callers of Dexie; enforce audit + outbox
        ↓
db                                 Dexie schema and migrations
```

Cross-cutting: `sync/` (transport + engine), `types/`, `utils/`, `test/`.

### 3.2 Hard architectural rules

1. **No IndexedDB access outside `src/repositories` and `src/db`.** Enforced by lint config and a test that greps the tree.
2. **No business rules in components.** A component may format and dispatch. It may not decide whether a transition is legal.
3. **Domain is pure.** `src/domain/**` must not import Dexie, React, or anything from `src/repositories`. Every domain function is deterministic and unit-testable with no setup.
4. **Every mutation goes through a repository write path** that, in a single Dexie transaction: applies the change, bumps `version`, sets `updatedAt`/`updatedBy`, writes an `AuditLog` entry, and enqueues a `SyncOutboxEntry`.
5. **State changes go through a state machine service.** Pages never assign a status.
6. **Money never touches a float.** Integer minor units only, through `src/domain/money`.
7. **History is append-only.** `ShipmentEvent`, `AuditLog`, quotation revisions, route-map revisions, cost-allocation revisions.
8. **Idempotency.** Every queued operation carries a stable `operationId`; replay must be a no-op.
9. **Timestamps are ISO 8601 UTC** in storage; formatting happens only at the edge.
10. **IDs are UUIDs** (`crypto.randomUUID`), stable across devices, mappable to a future ONE Record URI (`D-01`).
11. **Simulation is declared in data**, not only in the UI (§12).
12. **Closed jobs are frozen** (`D-26`); reopening is explicit and audited.

### 3.3 Directory layout

```
src/
  app/            providers, router, bootstrap
  components/     shared UI primitives (ui/, layout/, data/, feedback/)
  db/             Dexie schema, migrations, seed
  domain/         money, state machines, rules, scoring, route-map planning
  features/       feature modules (inquiry, quotation, booking, shipment,
                  documents, compliance, customs, carrier, consolidation,
                  warehouse, finance, incidents, reports, portal, admin, sync)
  hooks/          query/mutation hooks
  layouts/        app shell, portal shell
  pages/          thin route components
  repositories/   one module per aggregate
  services/       orchestration + adapters (ocr, screening, rates, notifications)
  sync/           engine, transport, conflict handling
  test/           setup, factories, fixtures
  types/          shared types and enums
  utils/          id, time, locale, csv, blob
```

A feature folder owns its components, schemas and hooks. Anything used by two features moves up to `components/` or `services/`.

---

## 4. Roles and permissions

Ten roles: `administrator`, `sales`, `pricing`, `operations`, `documentation`, `compliance`, `warehouse`, `finance`, `manager`, `customer`.

**Authentication is demo authentication.** Seeded users, no password verification, session in local storage. It must be labelled as such in the UI login screen and in the README. It must never be described as production-grade.

Permissions are declared as capability strings checked through one guard API, so real auth later changes only the identity source:

```ts
can(user, 'shipment:transition', { shipment })   // capability + optional subject
```

| Capability | Roles |
|-----------|-------|
| `customer:*` | administrator, sales (write), all internal (read) |
| `inquiry:*` | administrator, sales; manager read |
| `quotation:write` | administrator, sales, pricing |
| `quotation:approve_margin` | administrator, pricing, manager |
| `booking:*` | administrator, sales, operations |
| `shipment:create` / `shipment:transition` | administrator, operations |
| `document:upload` | administrator, documentation, operations, warehouse, customer (own) |
| `document:verify` | administrator, documentation |
| `compliance:review` / `compliance:override` | administrator, compliance |
| `compliance:release_hold` | administrator, compliance, manager |
| `customs:file` | administrator, documentation, compliance |
| `carrier:book` | administrator, operations |
| `warehouse:receipt` | administrator, warehouse, operations |
| `finance:invoice` / `finance:payment` | administrator, finance |
| `finance:close_job` / `finance:reopen_job` | administrator, finance |
| `incident:manage` | administrator, manager, plus the routed role |
| `report:view` | administrator, manager, finance |
| `admin:users` / `admin:settings` / `sync:resolve_conflict` | administrator |
| `portal:*` | customer, scoped to own `customerId` |

**Customer scoping is enforced in the repository layer**, not in the UI, and is covered by tests that attempt cross-customer reads.

---

## 5. Domain model

### 5.0 Base entity

Every persisted operational entity:

```ts
interface BaseEntity {
  id: string                // UUID
  createdAt: string         // ISO 8601 UTC
  updatedAt: string
  createdBy: string         // userId
  updatedBy: string
  version: number           // optimistic concurrency
  syncStatus: 'local' | 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
  deletedAt?: string | null // soft delete where appropriate
  externalRefs?: Record<string, string>  // e.g. oneRecordUri (D-01)
}
```

Sync status semantics: `local` created but not queued · `pending` in outbox · `syncing` in flight · `synced` matches remote · `failed` retryable error · `conflict` needs human resolution.

### 5.1 Reference and party entities

- **User** — id, name, email, role, active, avatarUrl, lastLoginAt.
- **Customer** — customerCode, legalName, tradingName, customerType, taxIdentifier, registrationNumber, creditLimit *(minor units)*, paymentTermsDays, currency, status (`lead | active | credit_hold | inactive`), primaryContactId, billingAddress, shippingAddresses[], complianceStatus, **securityStatus** (`known_consignor | account_consignor | unknown`) + `securityStatusValidUntil` (`D-16`), notes.
- **CustomerContact** — customerId, name, role, email, phone, isPrimary.
- **Carrier** — carrierCode, name, carrierType (`airline | shipping_line | road_carrier | rail_operator | courier`), serviceRegions[], contactDetails, active, reliabilityScore, averageDelayMinutes, costScore, slaPerformance.
- **Warehouse** — warehouseCode, name, address, airportOrPortCode, capacity, contactDetails, active.
- **Location** — code (IATA/UN-LOCODE), name, countryCode, type, timezone. Seeded, offline.
- **RateCard / RateLine** (`D-21`) — carrier or tariff scope, lane, mode, service level, validFrom/validUntil, currency; lines carry chargeCode, weight break (min/max kg), buyRate, sellRate, minimum charge, unit.
- **LaneRule** (`D-15`, `D-30`) — origin country, destination country, direction, mode; required document types, required filing types, screening requirement, notes.
- **RouteMapTemplate** (`D-05`) — mode, direction, service level; ordered milestone definitions with offsets and SLA tolerances.
- **ExceptionRoutingRule** (`D-20`) — condition, priority, target role.

### 5.2 Inquiry

inquiryNumber, customerId, transportMode, direction, origin, destination, cargoSummary, requestedPickupDate, requestedDeliveryDate, incoterm, specialInstructions, assignedSalesUserId, lostReasonCode?, status.

`new → qualified → quotation_in_progress → quoted → converted`, with `lost | cancelled` reachable from any non-terminal state.

### 5.3 Quotation and QuotationLine

**Quotation** — quotationNumber, `quotationGroupId`, revision, customerId, inquiryId, transportMode, direction, origin, destination, cargo, currency, exchangeRate *(snapshot)*, validFrom, validUntil, buyTotal, sellTotal, taxTotal, marginAmount, marginPercentage, terms, notes, status, approvalRequired, approvedBy, approvedAt, sentAt, serviceLevel.

**QuotationLine** — quotationId, chargeCode, description, category, unit, quantity, buyRate, sellRate, taxRate, buyAmount, sellAmount, marginAmount, isDisbursement.

Statuses: `draft | pricing_review | approved | sent | accepted | rejected | expired | revised | converted | cancelled`.

### 5.4 Quotation rules

1. Only `accepted` quotations convert to a booking.
2. `expired` quotations cannot be accepted — refused in the domain layer with the expiry date in the message.
3. Revising a `sent` quotation creates **revision N+1 as a new record** sharing `quotationGroupId`; revision N becomes `revised` and is immutable.
4. `marginPercentage < settings.marginApprovalThreshold` sets `approvalRequired` and routes to `pricing_review`.
5. Historical revisions are never overwritten or deleted.
6. Totals are recomputed from lines on every write; stored totals are a cache, never the source of truth.

### 5.5 Booking

bookingNumber, quotationId, customerId, customerReference, shipperId, consigneeId, transportMode, direction, bookingDate, requestedPickupDate, requestedDeliveryDate, commercialSnapshot, status (`draft | confirmed | converted_to_shipment | cancelled`).

Rule: confirming a booking snapshots the commercial terms. Later quotation edits never mutate a confirmed booking.

### 5.6 Shipment

shipmentNumber, jobNumber, referenceNumber, bookingId, quotationId, customerId, shipperId, consigneeId, transportMode, direction, **shipmentType** (`direct | house`, `D-11`), **consolidationId?**, **awbMode** (`eawb | paper`, `D-30`), serviceLevel, incoterm, origin, destination, carrierId, warehouseId, flightNumber, flightDate, mawb, hawb, vesselName, voyageNumber, containerNumbers[], estimatedDepartureAt, actualDepartureAt, estimatedArrivalAt, actualArrivalAt, expectedDeliveryAt, deliveredAt, status, priority, priorityScore, complianceStatus, documentationStatus, financialStatus, securityStatus, screeningMethod?, securityDeclarationRef?, carrierSelectionRationale?, co2EstimateKg?, assignedOperationsUserId, slaTargetAt, **delayMinutes (derived, `D-06`)**, notes.

### 5.7 Cargo and CargoPiece (`D-02`)

**Cargo** (per shipment) — commodityDescription, hsCode, pieces, packageType, grossWeightKg, chargeableWeightKg, volumetricWeightKg, volumeCbm, declaredValue *(minor units)*, currency, dangerousGoods, dangerousGoodsClass, unNumber, packingGroup, packingInstruction, temperatureControlled, minimumTemperature, maximumTemperature, stackable, specialHandlingInstructions.

**CargoPiece** — cargoId, sequence, pieces, lengthCm, widthCm, heightCm, grossWeightKg, marks, receivedWeightKg?, condition?.

Validation:
- No negative quantities, weights, dimensions or values.
- Volumetric weight (air) = `Σ (L×W×H cm) / 6000`; chargeable weight = `max(gross, volumetric)`, rounded up per carrier rounding rules.
- Dangerous goods require the DG declaration document and a complete DG checklist.
- Temperature-controlled cargo requires min < max.
- Density outside 5–1000 kg/m³ raises a warning (not a block) naming the computed density.

### 5.8 Consolidation (`D-10`)

consolNumber, mawb, carrierId, flightNumber, flightDate, origin, destination, allotmentReference, status (`open | closed | departed | cancelled`), plannedPieces/Weight/Volume, actualPieces/Weight/Volume, buyCostTotal, allocationBasis (`chargeable_weight | pieces | volume | manual`), allocationRevision.

**CostAllocation** (`D-12`) — consolidationId, shipmentId, revision, basis, basisValue, allocatedAmount, allocatedBy, allocatedAt. Append-only per revision.

### 5.9 RouteMap and RouteMapMilestone (`D-04`)

**RouteMap** — shipmentId, templateId, revision, plannedAt, replanReason?, status.

**RouteMapMilestone** — routeMapId, sequence, code (FSU where applicable), label, plannedAt, actualAt?, slaOffsetMinutes, varianceMinutes (derived), status (`planned | met | at_risk | missed | skipped`), responsibleRole.

Derived rules (`D-06`, `D-07`): `varianceMinutes = actualAt − plannedAt`. Open milestone is `at_risk` when `now > plannedAt − slaOffsetMinutes` and `missed` when `now > plannedAt`. `shipment.delayMinutes` = variance of the latest met or missed milestone. All computed by pure functions on a local timer.

### 5.10 ShipmentEvent (append-only)

shipmentId, eventType, **eventCode (FSU/CIMP, `D-08`)**, title, description, location, occurredAt, recordedAt, source (`manual | carrier_api | gps | system | customer | simulated`), sourceReference, latitude, longitude, visibility (`internal | customer | both`), createdBy, metadata.

Events are idempotent by `(shipmentId, eventCode, sourceReference)`.

### 5.11 FSU code → status mapping (`D-08`, `D-09`)

| Code | Meaning | Sets shipment status | Route-map milestone |
|------|---------|----------------------|---------------------|
| `BKD` | Booked with carrier | `carrier_booked` | Carrier booked |
| `FOH` | Freight on hand | — | Freight on hand |
| `RCS` | Received from shipper | `warehouse_received` | Received from shipper |
| `RCT` | Received from transfer | — | Transfer receipt |
| `CCD` | Customs cleared (export) | `customs_cleared` | Export declaration accepted |
| `MAN` | Manifested | — | Manifested |
| `DEP` | Departed | `departed` → `in_transit` | Departed |
| `ARR` | Arrived | `arrived` | Arrived |
| `RCF` | Received from flight | — | Received from flight |
| `CCD` | Customs cleared (import) | `customs_cleared` (import leg) | Import cleared |
| `TFD` | Transferred | — | Transfer |
| `NFD` | Consignee notified | — | Consignee notified |
| `AWD` | Arrival documents delivered | — | Documents delivered |
| `DLV` | Delivered | `delivered` | Delivered |
| `DIS` | Discrepancy | raises incident | — |

### 5.12 Shipment state machine

Statuses: `draft, created, documents_pending, documents_under_review, compliance_review, compliance_hold, ready_for_carrier_booking, carrier_booked, pickup_scheduled, picked_up, warehouse_received, export_customs, customs_cleared, departed, in_transit, arrived, import_customs, delivery_scheduled, out_for_delivery, delivered, proof_of_delivery_received, billing_pending, financially_closed, closed, cancelled`.

Every transition is declared in one table:

```ts
interface TransitionRule {
  from: ShipmentStatus
  to: ShipmentStatus
  capability: Capability
  guards: TransitionGuard[]   // pure predicates returning {ok} | {ok:false, code, message}
  effects: TransitionEffect[] // event, notification, incident, milestone
}
```

`transitionShipment()` in `src/services/shipment-transition-service.ts` performs, in one Dexie transaction:

1. Look up the rule; unknown transition → refused with `E_TRANSITION_NOT_ALLOWED`.
2. Check capability → `E_FORBIDDEN`.
3. Run every guard; collect **all** failures (never stop at the first — the operator needs the full picture).
4. Apply the status change, bump `version`.
5. Append a `ShipmentEvent`.
6. Write an `AuditLog` entry.
7. Enqueue a `SyncOutboxEntry`.
8. Mark the corresponding route-map milestone actual and recompute downstream variance.
9. Emit notifications per the matrix in `user-flows.md` §6.
10. Raise an `Incident` where the rule declares one.

**Mandatory guards**

| Target status | Guard | Error code |
|---------------|-------|------------|
| `compliance_review` | all mandatory documents verified | `E_DOCS_INCOMPLETE` |
| `ready_for_carrier_booking` | no failed compliance check; DG checklist complete when DG | `E_COMPLIANCE_BLOCKED` |
| `ready_for_carrier_booking` | no unresolved `error` discrepancies | `E_DISCREPANCY_OPEN` |
| `carrier_booked` | carrier + flight + (MAWB or consol) present | `E_CARRIER_INCOMPLETE` |
| `warehouse_received` | received pieces recorded | `E_RECEIPT_INCOMPLETE` |
| `departed` | **every required customs filing `accepted`** (`D-14`) | `E_CUSTOMS_NOT_ACCEPTED` |
| `departed` | security screening satisfied or known consignor valid | `E_SECURITY_NOT_SATISFIED` |
| `delivered` | out for delivery recorded | `E_SEQUENCE` |
| `billing_pending` | POD document present | `E_POD_MISSING` |
| `financially_closed` | customer invoice issued; no open blocking incident | `E_BILLING_INCOMPLETE` |
| any forward transition | shipment not `compliance_hold`, not `cancelled`, not closed | `E_SHIPMENT_FROZEN` |

`cancelled` is reachable from any pre-`departed` status with `shipment:cancel` and a reason. `compliance_hold` is reachable from any pre-`departed` status and only exits via compliance release.

### 5.13 Document

shipmentId, customerId, documentType, fileName, mimeType, size, localBlob, remoteUrl, checksum, uploadedAt, uploadedBy, status, ocrStatus, ocrConfidence, extractedData, validationErrors, expiryDate, verifiedAt, verifiedBy, rejectionReason, syncStatus.

Types: `commercial_invoice, packing_list, hawb, mawb, certificate_of_origin, export_license, dangerous_goods_declaration, insurance_certificate, delivery_order, customs_declaration, proof_of_delivery, inspection_report, security_declaration, other`.

Statuses: `uploaded | processing | review_required | verified | rejected | expired`. OCR: `not_started | queued | processing | completed | low_confidence | failed`.

Rules: accept PDF/PNG/JPEG only, ≤ 10 MB; store checksum and flag likely duplicates; previews via object URLs revoked on unmount; extracted fields are editable before verification; **all OCR output is labelled simulated**.

**DocumentDiscrepancy** (`D-22`) — shipmentId, field, sourceA/valueA, sourceB/valueB, severity (`info | warning | error`), status (`open | resolved | accepted`), resolution, resolvedBy.

### 5.14 ComplianceCheck

shipmentId, checkType, status (`pending | passed | warning | failed | overridden`), severity, ruleCode, message, checkedAt, checkedBy, resolvedAt, resolvedBy, resolution, metadata.

Check types: `mandatory_documents, hs_code, export_license, dg_declaration, dg_checklist, document_expiry, weight_consistency, customer_compliance, customer_credit, security_status, sanctions_simulated`.

**DgChecklistItem** (`D-17`) — shipmentId, itemCode, label, required, result (`pass | fail | na`), note, checkedBy, checkedAt. A `failed` DG or customs check **cannot be overridden**; `warning` severity can, with a mandatory justification.

### 5.15 CustomsFiling (`D-13`)

shipmentId, filingType (`ens_ics2 | ams | export_declaration | import_declaration | transit`), houseLevel, status (`draft | ready | submitted | accepted | rejected | amended | cancelled`), mrn, submittedAt, respondedAt, rejectionCodes[], payloadSnapshot, filedBy, simulated.

Rules: requirement is resolved from `LaneRule`; a required filing not `accepted` blocks `departed`; rejection raises P2 and maps reason codes to fields; amendments create a new filing linked to the original.

### 5.16 Charge (`D-23`)

shipmentId, quotationId, consolidationId?, chargeCode, description, chargeType (`buy | sell | both`), category, vendorId, quantity, unit, currency, exchangeRate, buyRate, sellRate, taxRate, buyAmount, sellAmount, taxAmount, marginAmount, **costBasis** (`estimated | accrued | actual`), **isDisbursement**, vendorInvoiceId?, customerInvoiceId?, approved, source (`quotation | rate_card | manual | allocation | system`).

Categories: `air_freight, fuel_surcharge, security, handling, documentation, customs, duty_tax, pickup, delivery, warehouse, storage, insurance, other`.

**Financial service must compute:** total buy, total sell before tax, total tax, customer invoice total, gross margin, margin %, WIP (earned − billed) — each available on estimated, accrued and actual bases (`D-24`). **Disbursement lines are excluded from gross profit** and shown as recovered-at-cost.

### 5.17 Money (`D-25`)

```ts
type Money = { amountMinor: number; currency: string }   // integer minor units
```

All arithmetic lives in `src/domain/money`: `add`, `subtract`, `multiplyByRate`, `allocate` (largest-remainder, guarantees the sum equals the total), `convert` (explicit rate + rounding mode), `format` (locale). Floats are forbidden in the finance path; a test asserts no `number`-typed monetary field escapes the money module. Rounding is half-up at 2 decimals unless the currency says otherwise, applied once at the boundary.

### 5.18 Invoice

invoiceNumber, shipmentId, customerId, vendorId?, invoiceType (`customer | vendor | credit_note`), relatedInvoiceId?, currency, subtotal, taxTotal, disbursementTotal, total, paidAmount, balanceAmount, issueDate, dueDate, status, lineItems[], notes.

Statuses: `draft | approved | issued | partially_paid | paid | overdue | disputed | void`.

Rules: duplicate invoice numbers are detected and refused (device-prefixed sequences prevent offline collisions); issued invoices cannot be deleted — corrections are credit notes; payment application updates the balance; over-application beyond the remaining balance is refused; `overdue` is **derived** from due date and balance.

### 5.19 Payment

paymentNumber, invoiceId, customerId, vendorId, paymentType (`receivable | payable | refund`), amount, currency, paymentDate, paymentMethod, transactionReference, status (`pending | completed | failed | reversed`), notes.

### 5.20 Notification

userId, customerId, shipmentId, channel (`in_app | email_simulated | sms_simulated | push_simulated`), title, message, severity, status, createdAt, readAt, sentAt, failureReason, simulated.

Only `in_app` functions. Others go through `NotificationChannelAdapter` and are stored with `simulated: true`.

### 5.21 Incident

incidentNumber, shipmentId, module, errorCode, title, description, priority (`P1..P4`), status (`open | acknowledged | investigating | waiting_for_customer | resolved | closed`), detectedAt, acknowledgedAt, assignedTo, automaticActions[], escalationAt, rootCauseCode?, resolution, resolvedAt, resolvedBy, closedAt, metadata.

| Priority | Examples | Response target | Escalation |
|----------|----------|-----------------|------------|
| **P1** | Customs hold, DG violation, simulated sanctions match, app outage | Immediate | Every 15 min |
| **P2** | Flight cancellation, delay > 24h, missed customer SLA | 30 min | Hourly |
| **P3** | Missing invoice, OCR failure, document mismatch | 2 h | Every 4 h |
| **P4** | Dashboard issue, report generation error | 1 business day | Daily |

Escalation timers run locally and are simulated for external channels; in-app escalation is real.

### 5.22 AuditLog (append-only)

id, entityType, entityId, action, actorId, actorRole, occurredAt, before (partial), after (partial), changedFields[], reason?, correlationId, source (`user | system | sync`).

Rules: written inside the same transaction as the mutation; never updated or deleted; every override, approval, hold release, closure and reopen carries a mandatory `reason`; `correlationId` links all entries produced by one user action.

### 5.23 Sync entities

`SyncOutboxEntry` (operationId, entityType, entityId, operation, payload, baseVersion, createdAt, attemptCount, lastError, status), `SyncMetadata` (deviceId, lastSyncAt), `SyncConflict` (entityType, entityId, localSnapshot, remoteSnapshot, detectedAt, resolvedAt, resolution, resolvedBy).

Design detail lives in [`offline-sync.md`](./offline-sync.md).

---

## 6. Priority scoring

`priorityScore` is a pure, explainable function — no black box:

```
score = w1·serviceLevelWeight
      + w2·slaRiskFactor(routeMap)
      + w3·customerTierWeight
      + w4·cargoValueWeight
      + w5·dgOrTempControlFlag
      + w6·openIncidentSeverity
```

Weights live in settings. The UI shows the contribution of each term when a user asks why a shipment is at the top of the list. Any future ML scorer must fall back to this function when unavailable (`D-07`).

---

## 7. Validation

Zod schemas in `features/<feature>/schema.ts` are the **single** source of validation and are shared by forms and repositories. Repository writes re-validate — a bug in a form must not corrupt the database.

Cross-entity invariants (documents complete, checks passed, filings accepted) belong in domain guards, not in Zod.

---

## 8. Numbering

Format `PREFIX-{DEVICE}-{YY}{SEQ}` — e.g. `SHP-A7-26000142`. The device segment prevents collisions between offline devices; sequences are allocated in the same transaction as the entity. Prefixes: `INQ`, `QTN`, `BKG`, `SHP`, `JOB`, `CNS`, `INV`, `PAY`, `INC`.

---

## 9. Non-functional requirements

| Requirement | Target |
|-------------|--------|
| App shell loads offline | Cold start with no network, after one visit |
| Workboard first paint | < 200 ms from IndexedDB, 500-shipment dataset |
| Shipment list interaction | < 100 ms filter/sort, 5 000 records |
| Transition write | < 50 ms including audit + outbox |
| Bundle | Initial route < 250 KB gzipped; features lazy-loaded |
| Accessibility | WCAG 2.1 AA: keyboard-operable, labelled controls, visible focus, AA contrast, live-region announcements for async results |
| Locale | ISO 8601 UTC stored; `Intl` for all display |
| Data volume | 10 000 shipments + 50 000 events without UI degradation |
| Resilience | Reload mid-flow loses nothing already saved |

---

## 10. Testing

| Layer | Tool | Requirement |
|-------|------|-------------|
| Domain | Vitest, pure | **100% branch coverage** on money, state machine, route-map planning, compliance rules, scoring |
| Repositories | Vitest + fake-indexeddb | Every write asserts audit entry + outbox entry + version bump |
| Services | Vitest | Each transition guard tested for pass and fail; failures assert the error code |
| Hooks/UI | RTL | One test per flow proving the happy path and the primary blocked path |
| Sync | Vitest | Idempotent replay by `operationId`; conflict detection; offline queueing |
| Permissions | Vitest | Every capability denied for at least one role; customer cross-scope read denied |
| Accessibility | RTL | Keyboard path through each primary flow |

**Definition of done for any feature:** typecheck clean, lint clean, tests pass, new domain logic at 100% branch coverage, flow works offline per the `user-flows.md` matrix, audit entries verified, docs updated if behaviour changed.

---

## 11. Error codes

Domain refusals return typed codes, never bare strings: `E_TRANSITION_NOT_ALLOWED`, `E_FORBIDDEN`, `E_DOCS_INCOMPLETE`, `E_COMPLIANCE_BLOCKED`, `E_DISCREPANCY_OPEN`, `E_CARRIER_INCOMPLETE`, `E_RECEIPT_INCOMPLETE`, `E_CUSTOMS_NOT_ACCEPTED`, `E_SECURITY_NOT_SATISFIED`, `E_POD_MISSING`, `E_BILLING_INCOMPLETE`, `E_SHIPMENT_FROZEN`, `E_QUOTATION_EXPIRED`, `E_MARGIN_APPROVAL_REQUIRED`, `E_CREDIT_LIMIT_EXCEEDED`, `E_DUPLICATE_INVOICE_NUMBER`, `E_OVERPAYMENT`, `E_JOB_CLOSED`, `E_SEQUENCE`, `E_VALIDATION`.

Each code maps to one user-facing message that says what is wrong **and what to do next**.

---

## 12. Register of simulated surfaces

Nothing here is real. Each is behind an interface, returns `{ simulated: true, method }`, and renders with `<SimulatedBadge />`.

| Surface | Service | Real replacement |
|---------|---------|------------------|
| Authentication | `demo-auth-service` | OIDC/OAuth provider |
| OCR / document extraction | `ocr-service` | Document AI API |
| Document classification | `document-classifier` | Model or rules service |
| Sanctions / denied-party screening | `screening-adapter` | Licensed screening provider |
| Carrier rate options | `carrier-rate-provider` | WebCargo / cargo.one / CargoAi API |
| Carrier status feed | `carrier-feed-simulator` | FSU messages / ONE Record subscription |
| Customs transmission | `customs-transmission-adapter` | ICS2 / AMS gateway |
| Email / SMS / push | `notification-channel-adapter` | ESP / SMS gateway / Web Push |
| Delay prediction | `delay-prediction-service` | Trained model, same interface |
| CO₂ estimation | `emissions-service` | GLEC-accredited calculator |
| Exchange rates | `fx-rate-service` | FX rate API |
| Remote sync | `NoopSyncTransport` | REST/GraphQL or ONE Record transport |

**A test asserts every service registered as simulated appears in this table.** If a real integration is added, remove its badge, its `simulated` flag and its row together.

---

## 13. Extensibility

1. **New transport mode** = new enum value + a route-map template + lane rules + mode-specific optional fields. No duplicated workflow, no new state machine.
2. **New document type** = enum value + extraction field map + lane-rule reference.
3. **New compliance rule** = one pure predicate registered in the rule table.
4. **Real backend** = implement `SyncTransport` and swap it at composition. Repositories, domain and UI are untouched.
5. **Real AI** = implement the existing service interface; the deterministic version stays as the offline fallback (`D-07`).
