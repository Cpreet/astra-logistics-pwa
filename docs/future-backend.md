# ASTRA — Adding a Backend

The MVP is deliberately frontend-only. This document defines the seams that make a backend an **addition** rather than a rewrite, and recommends the order to build it.

Nothing here should be implemented during the MVP. It exists so MVP decisions do not foreclose it.

---

## 1. The contract that makes this possible

Four architectural choices carry the whole plan:

1. **UI never talks to storage.** It talks to hooks, which talk to repositories. Swapping what sits under a repository changes no component.
2. **Domain logic is pure and client-portable.** `src/domain/**` is TypeScript with no I/O — the same state machine, money and rule code can run on a Node backend, so the server enforces *identical* rules rather than a drifting re-implementation.
3. **Every mutation is already an idempotent, versioned operation** in the outbox: `operationId`, `entityType`, `entityId`, `action`, `payload`, `baseVersion`. That is a sync protocol payload, not just a local queue row.
4. **Every entity already carries `version` and UUID `id`.** Optimistic concurrency and client-generated identity are in place from day one, so offline creation works without server round-trips.

---

## 2. Interfaces to implement

```ts
interface SyncTransport {
  push(entries: SyncQueueEntry[]): Promise<SyncTransportResult[]>
  pull(since: string | null): Promise<RemoteChange[]>
}

interface ConflictResolver {
  detect(local: Entity, remote: Entity): SyncConflict | null
  resolve(conflict: SyncConflict, choice: Resolution): Promise<void>
}

interface ConnectivityService {
  isOnline(): boolean
  subscribe(fn: (online: boolean) => void): () => void
}
```

A real backend implements `SyncTransport` and is registered at composition. `LocalRepository`, `SyncEngine`, `ConflictResolver` and every feature module stay unchanged.

---

## 3. Recommended backend milestones

### M1 — Identity (highest value, smallest surface)
Replace demo auth with OIDC. The client already checks capabilities; the server becomes the authority on **who** the user is and **what** their role is. No sync yet. This alone makes ASTRA demonstrable to a real customer.

**Done when:** real login works, roles come from the provider, and demo auth is removed from the build (not merely hidden).

### M2 — Push-only sync
Implement `push()` against a REST API. The server validates each operation against the **same domain rules** (shared package), applies it, and returns per-operation results. Idempotency by `operationId`; the server persists processed IDs.

**Done when:** an offline device's queue drains to a real database, replay is provably safe, and a rejected operation surfaces the server's reason in the Sync Centre.

### M3 — Pull and multi-device
Add `pull(since)` with a change cursor. Introduce conflict detection on `baseVersion` mismatch and route conflicts into the existing `SyncConflict` UI — which already exists and needs no changes.

**Done when:** two devices editing the same shipment produce a conflict the Administrator resolves through the UI already built.

### M4 — Documents
Move Blobs to object storage. Client uploads to a signed URL; IndexedDB keeps metadata plus an optional cached copy for offline viewing. This is also where malware scanning belongs.

**Done when:** local storage no longer grows unbounded and documents survive device loss.

### M5 — Real integrations, one at a time
Each replaces a simulated adapter and deletes its badge (`spec.md` §12), in this order of business value:

1. **Carrier rate/booking** — a marketplace API (WebCargo, cargo.one, CargoAi). Replaces `carrier-rate-provider`.
2. **Carrier status feed** — FSU messages or a ONE Record subscription. Replaces `carrier-feed-simulator`. Because `ShipmentEvent.eventCode` already uses the FSU vocabulary (`D-08`), this is a mapping exercise.
3. **Customs** — ICS2/AMS gateway. Replaces `customs-transmission-adapter`. The `CustomsFiling` lifecycle already models submitted/accepted/rejected with MRN and reason codes.
4. **Screening** — licensed denied-party provider. Replaces `screening-adapter`. **Nothing may be described as screening until this lands.**
5. **Notifications** — ESP, SMS gateway, Web Push. Replaces `notification-channel-adapter`.
6. **OCR** — document AI. Replaces `ocr-service`; the deterministic version stays as the offline fallback.

### M6 — Accounting
Post to a general ledger. The three-basis charge model (estimated/accrued/actual) and disbursement clearing (`D-23`–`D-25`) already match how forwarder accounting posts, so this is integration rather than redesign.

---

## 4. ONE Record alignment

ONE Record is the preferred air-cargo data-sharing standard as of 1 January 2026 (`D-01`). Two MVP decisions keep the door open:

- `externalRefs.oneRecordUri` on every syncable entity — a stable local UUID maps to a logistics-object URI without a migration.
- Piece-level `CargoPiece` (`D-02`) — ONE Record models pieces as first-class objects; a shipment-level-only model would need reshaping later.

A `OneRecordSyncTransport` implementing the same `SyncTransport` interface can emit logistics objects instead of CRUD payloads. Repositories, domain and UI are untouched.

---

## 5. What must not change without a rewrite plan

Treat these as load-bearing:

| Decision | Why it matters |
|----------|----------------|
| Client-generated UUIDs | Offline creation without server round-trips |
| `version` on every entity | Optimistic concurrency and conflict detection |
| `operationId` idempotency | Safe replay; the entire retry story |
| Pure `src/domain` | Sharing rule code with the server |
| Integer minor units | Correct money across the client/server boundary |
| Append-only events and audit | Reconstructable history; regulator-defensible |
| FSU event vocabulary | Carrier integration is mapping, not redesign |

---

## 6. Suggested first server stack

Not prescriptive, but the path of least friction given the client:

- **Node + TypeScript**, so `src/domain` is shared verbatim as a package
- **PostgreSQL** — the model is relational, with append-only event and audit tables
- **REST** for sync (the operation log is a poor fit for GraphQL mutations), optionally GraphQL for read models later
- **Object storage** for documents with signed URLs
- One deployment artefact per environment, migrations in CI

The single most valuable server-side property: **the server runs the same state machine as the client.** If that holds, an offline device and the server can never disagree about whether a transition was legal — only about ordering, which the conflict resolver already handles.
