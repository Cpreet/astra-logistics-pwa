# Market Research — How Real Freight Forwarders Work (2026)

**Purpose:** this document records what current air-freight and forwarding platforms actually do, and states the concrete design decisions ASTRA takes as a result. Every decision here is reflected in [`spec.md`](./spec.md) and [`user-flows.md`](./user-flows.md).

**Researched:** July 2026. Re-validate before Phase 4; the standards landscape is moving fast.

---

## 1. Findings

### 1.1 ONE Record is the preferred data standard as of 1 January 2026

The IATA Cargo Services Conference endorsed **ONE Record** as the preferred data-sharing standard for air cargo effective 1 January 2026. It is not a message format — it is a **data model of linked "logistics objects"** (Shipment, Piece, Booking, Waybill, TransportMovement) each addressable by a URI, plus an API specification and a security specification. Airlines representing ~72% of global AWB volume are on track; industry awareness sits above 70% with roughly half declaring readiness. Forwarder TMS → airline system end-to-end flows are live in production (e.g. Schenker/Riege/Lufthansa).

**Implication for ASTRA:** a shipment is not one flat row with a status string. It is an aggregate of addressable sub-objects with a stable identity and an append-only event history. Our entity IDs must be URI-mappable, and our sync transport must be able to emit logistics objects rather than only CRUD payloads.

**Decisions:**
- `D-01` Every syncable entity carries a stable UUID that maps 1:1 to a future ONE Record logistics-object URI (`externalRefs.oneRecordUri?: string`).
- `D-02` Cargo is modelled at **piece level** (`CargoPiece`), not only at shipment level, so piece-level tracking and partial splits are representable.
- `D-03` The sync transport interface is payload-shape agnostic: `SyncTransport` takes outbox entries and an `EntityMapper`, so a `OneRecordSyncTransport` can be added without touching repositories or UI.

### 1.2 Status is a *milestone plan vs. actual*, not a single field — Cargo iQ

Cargo iQ members build a **route map** for every shipment at booking time: a planned shipment lifecycle where each stakeholder commits to a timestamp for each milestone. FSU messages update the actual times, and the platform continuously compares actual vs. planned per milestone, alerting when a milestone is missed so the route can be re-planned. Recent Cargo iQ work extends the route map into warehouse/handler operations for full supply-chain visibility.

**Implication for ASTRA:** the brief's single `status` enum plus `delayMinutes` is not enough to run an operations desk. Delay must be *derived per milestone* against a plan generated when the shipment is booked. This is what makes proactive delay detection possible offline and without AI.

**Decisions:**
- `D-04` Introduce a **`RouteMap`** aggregate: an ordered list of `RouteMapMilestone` records with `plannedAt`, `actualAt`, `varianceMinutes`, `slaOffsetMinutes`, `status` (`planned | met | at_risk | missed | skipped`).
- `D-05` The route map is generated deterministically from a **mode + lane + service-level template** at booking confirmation, then re-planned on disruption (a re-plan appends a new revision; it never overwrites history).
- `D-06` `shipment.delayMinutes` becomes derived, not stored-by-hand: it is the variance of the latest completed or overdue milestone.
- `D-07` "At risk" is computed locally by a pure function on a timer — no network, no AI required.

### 1.3 Milestones have standard codes — FSU / CIMP

Air cargo status is exchanged as **FSU (Freight Status Update)** messages with a fixed code vocabulary: `FOH` freight on hand, `RCS` received from shipper, `RCT` received from transfer, `MAN` manifested, `DEP` departed, `ARR` arrived, `RCF` received from flight, `CCD` customs cleared, `TFD` transferred, `NFD` notified consignee, `AWD` arrival documents delivered, `DLV` delivered, `DIS` discrepancy.

**Implication for ASTRA:** our `ShipmentEvent.eventCode` should not be invented. Using the real vocabulary makes the app credible, makes carrier-feed integration a mapping exercise instead of a redesign, and gives the customer portal a defensible tracking timeline.

**Decisions:**
- `D-08` `ShipmentEvent.eventCode` uses FSU/CIMP codes for air, with a documented mapping table from event code → shipment status transition (see `spec.md` §6).
- `D-09` Each transport mode registers its own milestone vocabulary; air ships first, sea/road/rail/courier reuse the same machinery.

### 1.4 Consolidation is the core of air forwarding — MAWB/HAWB

A forwarder issues a **HAWB** to each shipper and the airline issues one **MAWB** covering the consolidated shipment. Many houses reference one master. This hierarchy drives capacity buying, cost allocation, and customs filing responsibility.

**Implication for ASTRA:** the brief puts `mawb` and `hawb` as sibling fields on a single shipment, which cannot represent a consol. Without a consol entity, the pricing, carrier-booking and profitability flows are wrong for the most common real case.

**Decisions:**
- `D-10` Introduce a **`Consolidation`** aggregate holding the MAWB, carrier, flight, ULD data and buy-side cost; house shipments link via `consolidationId` and carry the HAWB.
- `D-11` A shipment may be **direct** (`shipmentType: 'direct'`, its own MAWB) or **house** (`shipmentType: 'house'`, joined to a consol). Both paths are first-class.
- `D-12` Consol buy costs allocate to houses by a chosen basis (chargeable weight, pieces, volume, manual) through an auditable `CostAllocation` record. Reallocation is versioned.

### 1.5 Customs filing is a gated pre-departure obligation — ICS2 / AMS

EU **ICS2 Release 3** went live 1 September 2025; as of 2026 it is fully operational and the final derogations expired 1 June 2026. Complete, accurate ENS data must be lodged **before departure**, at **house level**, and carriers increasingly push that obligation onto forwarders. Poor data means delay, penalty, or refusal of entry. The US equivalents (AMS/ACE) impose similar pre-departure timing.

**Implication for ASTRA:** customs is not a status the operator flips. It is a filing with its own lifecycle, its own reference number (MRN), its own rejection reasons, and it **blocks departure**.

**Decisions:**
- `D-13` Introduce a **`CustomsFiling`** entity (`filingType: ens_ics2 | ams | export_declaration | import_declaration | transit`, `status`, `mrn`, `submittedAt`, `respondedAt`, `rejectionCodes[]`, `houseLevel: boolean`, `filedBy`).
- `D-14` The state machine **hard-blocks** `departed` when a required filing for the lane is not `accepted`. The block is a guard in the domain layer, not a UI disable.
- `D-15` Filing requirement is resolved from a **lane rule table** (origin country, destination country, direction, mode), seeded for EU/US/UK/IN lanes, extensible without code changes.

### 1.6 Security screening and DG acceptance are hard gates before tender

Air cargo security runs on the **known consignor / regulated agent (RA3) / CCSF** model: cargo from a known consignor with unbroken secure custody is "known cargo"; otherwise it must be screened (X-ray, EDS, ETD) and a security declaration issued. Dangerous goods run on the **IATA DGR acceptance checklist** (separate radioactive/non-radioactive/dry-ice forms), with the shipper's declaration (DGD/e-DGD) and UN number, class and packing instruction verified before acceptance.

**Implication for ASTRA:** compliance checks are not generic "is the document present" rules. Two of them are legally structured checklists that gate cargo tender to the carrier.

**Decisions:**
- `D-16` `Customer` carries `securityStatus: known_consignor | account_consignor | unknown` with `validUntil`; the shipment inherits it and records `screeningMethod` and `securityDeclarationRef`.
- `D-17` DG shipments run a structured `dg_acceptance` compliance check backed by an itemised checklist (UN number, proper shipping name, class/division, packing instruction, quantity per package, overpack, state/operator variations, DGD present and signed). Any failed item blocks tender.
- `D-18` Sanctions/denied-party screening remains an **explicitly simulated adapter** — clearly labelled, never presented as real screening. A P1 incident is raised on a simulated match so the escalation path is exercised.

### 1.7 Operators work an exception queue, not a shipment list

Across 2026 platform reviews the same shift shows up: operators historically spent ~80% of their time moving data between screens; the modern pattern is **exception management** — the system detects delays, customs holds, missing documents and damage, classifies them, and routes them to the right specialist by rule. Quote turnaround has compressed from hours to minutes via automated quoting; document extraction handles 8–15 documents per shipment that arrive in irregular formats.

**Implication for ASTRA:** the default landing screen must not be a grid of all shipments. It must be a role-scoped, priority-ordered worklist of things that need a human. This is the single largest UX difference between a demo and a product.

**Decisions:**
- `D-19` Every role's home is a **Workboard**: "Needs you now" (blocking, SLA-breaching), "Needs you today", "Watching". Built from a shared `WorkItem` projection, not per-page ad-hoc queries.
- `D-20` `Incident` records are auto-raised by domain rules (missed milestone, rejected filing, failed check, OCR low confidence) and auto-routed to a role by an `ExceptionRoutingRule` table.
- `D-21` Quoting supports **rate-card driven instant quotes**: a `RateCard`/`RateLine` table produces a draft quotation from lane + weight break in one action; the pricing executive edits rather than composes.
- `D-22` Document ingestion runs **cross-document reconciliation** (invoice vs. packing list vs. AWB: value, weight, pieces, party names) and emits `DocumentDiscrepancy` records — deterministic, offline, and the honest version of "AI document checking".

### 1.8 Forwarder accounting is job costing with accruals and disbursements

A shipment is a **job file**: an open file accumulating revenue and cost over weeks before closure. Best practice accrues estimated costs when known rather than waiting for the vendor invoice, so margin is visible in real time; the difference between earned revenue and billed revenue is a **WIP** position. **Disbursements** (money paid on the customer's behalf and recovered at cost — duty, VAT) must post to a balance-sheet clearing account and be excluded from gross profit, or revenue is inflated and margin looks wrong.

**Implication for ASTRA:** the brief's `Charge` with buy/sell amounts gives a gross margin number but not a *trustworthy* one. Accrual vs. actual and disbursement handling are what make the profitability screen real.

**Decisions:**
- `D-23` `Charge` gains `costBasis: estimated | accrued | actual`, `isDisbursement: boolean`, and `vendorInvoiceId`. Gross profit excludes disbursement lines.
- `D-24` Shipment P&L shows three columns: **estimated** (from quotation), **accrued** (current best cost), **actual** (invoiced both ways), plus WIP = earned − billed.
- `D-25` Monetary values are stored as **integer minor units** with an explicit currency; all arithmetic goes through `src/domain/money`. No floats anywhere in the finance path.
- `D-26` `financially_closed` freezes the job: further mutation requires an explicit, audited reopen by Finance or Administrator.

### 1.9 Booking capacity is bought on marketplaces

Forwarders procure air capacity through eBooking marketplaces (WebCargo, cargo.one, CargoAi) covering the majority of global capacity, comparing live schedules, rates and CO₂ in one place, then confirming an eBooking against the airline.

**Implication for ASTRA:** carrier selection should be a *comparison* step with a recorded rationale, not a dropdown. And the comparison source must be swappable for a real marketplace API later.

**Decisions:**
- `D-27` Carrier selection presents ranked options (cost, transit time, reliability score, CO₂ estimate) from a `CarrierRateOption` provider interface. The MVP provider is deterministic and local, labelled **simulated**; a marketplace adapter drops in later.
- `D-28` The chosen option and the **reason for not choosing the cheapest** are persisted on the shipment (`carrierSelectionRationale`) and audited — this is what managers actually review.
- `D-29` Estimated CO₂ per shipment is computed from a documented factor table and labelled as an estimate with its methodology.

### 1.10 e-AWB is the default, paper is the exception

e-AWB is the industry default under IATA eFreight; the document set and the acceptance procedure differ between eAWB and paper AWB lanes.

**Decisions:**
- `D-30` `Shipment.awbMode: 'eawb' | 'paper'`, defaulting to `eawb`; the required-document rule set is resolved per mode and per lane, so paper lanes demand the physical document set and eAWB lanes do not.

---

## 2. What changed versus the original brief

| Area | Original brief | Research-driven change | Decisions |
|------|----------------|------------------------|-----------|
| Shipment status | Single 24-value enum, manual `delayMinutes` | Enum **plus** a planned/actual route map; delay derived per milestone | D-04…D-07 |
| Events | Free-form `eventCode` | FSU/CIMP standard codes with a mapping table | D-08, D-09 |
| Consolidation | `mawb` + `hawb` fields on one shipment | `Consolidation` aggregate, house/direct shipment types, auditable cost allocation | D-10…D-12 |
| Customs | A shipment status (`export_customs`) | `CustomsFiling` entity with its own lifecycle that **gates departure**; lane rule table | D-13…D-15 |
| Compliance | Flat list of presence checks | Structured DG acceptance checklist + security/known-consignor status as tender gates | D-16…D-18 |
| Navigation | Module pages | Role-scoped exception Workboard as every role's home | D-19, D-20 |
| Quoting | Manual line entry | Rate-card instant quote, then human edit | D-21 |
| Documents | OCR extract → verify | OCR extract → **cross-document reconciliation** → discrepancy records | D-22 |
| Finance | Buy/sell/margin | Estimated vs. accrued vs. actual, WIP, disbursements excluded from GP | D-23…D-26 |
| Carrier | `carrierId` field | Ranked comparison with persisted rationale + CO₂ estimate | D-27…D-29 |
| Cargo | Shipment-level totals | Piece-level `CargoPiece` under a cargo summary | D-02 |
| AWB | `mawb`/`hawb` strings | `awbMode` drives the required-document rule set | D-30 |

Everything in the original brief is retained. Nothing above removes a requirement — each item makes a required workflow implementable against how the market actually operates.

---

## 3. Honesty constraints carried into the build

The brief is explicit that the app must never pretend a simulated integration is real. Research makes the temptation concrete, so the rule is stated as an implementation constraint:

1. OCR, sanctions screening, carrier rate options, CO₂ factors, delay prediction, carrier feeds and email/SMS/push delivery are **all simulated** in the MVP.
2. Each renders through a shared `<SimulatedBadge source="…" />` and each service returns `{ simulated: true, method: '…' }` in its result type — the flag is in the data, not only in the pixels.
3. `docs/spec.md` §12 lists every simulated surface; a test asserts every registered simulated service is listed there.

---

## Sources

- [IATA — ONE Record programme](https://www.iata.org/en/programs/cargo/e/one-record/)
- [IATA — ONE Record fact sheet (June 2026)](https://www.iata.org/en/iata-repository/pressroom/fact-sheets/fact-sheet-one-record/)
- [IATA — Survey shows growing awareness of ONE Record (Dec 2025)](https://www.iata.org/en/pressroom/2025-releases/2025-12-10-02/)
- [Air Cargo News — Air cargo outlines how to drive ONE Record adoption](https://www.aircargonews.net/iata-wcs/air-cargo-outlines-how-to-drive-one-record-adoption/1079991.article)
- [digital-cargo — Good practice: shipment tracking with ONE Record](https://github.com/digital-cargo/good-practice-shipment-tracking)
- [Guide to FSU messages](https://www.winwebconnect.com/Help%20Guides/Guide%20to%20FSU%20Messages.pdf)
- [Awery — FSU messages reference](https://docs.awery.com/main/fsu-messages)
- [Cargo iQ — milestones for planning and monitoring warehouse operations](https://www.cargoiq.org/blank-2/cargo-iq-s-new-milestones-for-planning-and-monitoring-warehouse-operations-adopted-by-cathay-pacific)
- [Air Cargo News — Cargo iQ improves shipment visibility](https://www.aircargonews.net/technology/airfreight-digitisation/cargo-iq-improves-shipment-visibility/)
- [FIATA — EU ICS2 Release 3 goes live 1 September 2025](https://fiata.org/n/eu-ics2-alert-ics2-release-3-goes-live-on-1-september-2025/)
- [CargoWise — ICS2 Release 3: how to prepare for key compliance changes](https://www.cargowise.com/news/ics2-release-3-how-to-prepare-for-key-compliance-changes/)
- [Maersk — ICS2 compliance guide](https://www.maersk.com/logistics-explained/customs-and-compliance/2025/08/14/ics2)
- [CBP — AMS air features](https://www.cbp.gov/trade/acs/ams/air-features)
- [CargoEZ — HAWB vs MAWB guide for forwarders](https://cargoez.com/blog/hawb-mawb-freight-forwarders-guide)
- [IATA — Dangerous Goods Regulations](https://www.iata.org/en/publications/dgr/)
- [IATA — 2026 dangerous goods checklist, non-radioactive (PDF)](https://www.iata.org/contentassets/b08040a138dc4442a4f066e6fb99fe2a/en_form_nonrad.pdf)
- [GoFreight — Generative AI in freight forwarding 2026](https://gofreight.com/blog/generative-ai-freight-forwarding)
- [Infox — AI in freight forwarding 2026](https://infox.com/blog/ai-in-freight-forwarding-2026)
- [Shipmnts — Real-time shipment P&L](https://shipmnts.com/blog/real-time-shipment-pl-visibility-freight-forwarders)
- [CargoWise — Accounting for freight forwarding](https://www.cargowise.com/solutions/cargowise-enterprise/accounting/)
- [Cargo Solutions Network — Best air cargo booking platforms in 2026](https://cargosolutionsnetwork.com/insights/best-air-cargo-booking-platforms-in-2026-a-freight-forwarders-guide)
- [CargoAi — products](https://www.cargoai.co/products/)
- [Nexportal — e-AWB, ONE Record and the standards behind air cargo](https://nexportal.nl/topics/iata)
