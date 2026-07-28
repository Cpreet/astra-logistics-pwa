# Offline-First Sync Design

## Principles

1. **IndexedDB (Dexie) is the operational database** for reads and writes.
2. **Write locally first** — UI never waits on network for mutations.
3. **Async sync** — A background processor drains the outbox when online.
4. **Layered boundaries** — UI → repositories → Dexie; sync → transport adapter.
5. **Idempotent operations** — Each outbox entry has a stable `operationId` (UUID).

## Local components (scaffold)

| Component | Responsibility |
|-----------|----------------|
| `AstraDatabase` | Dexie schema, migrations |
| `syncOutbox` table | Pending mutations with payload + entity refs |
| `syncMetadata` table | Last sync cursor, device id |
| `SyncEngine` | Poll connectivity, process outbox, update entity `syncStatus` |
| `RestSyncTransport` (stub) | Future REST/GraphQL implementation |

## Write path

```
UI action
  → domain validation (future)
  → repository.transaction
      → update entity (syncStatus: local → pending)
      → insert audit log (future)
      → enqueue SyncOutboxEntry
  → optional SyncEngine.flush() if online
```

## Outbox entry shape

- `operationId` — idempotency key for server
- `entityType` / `entityId` — target aggregate
- `operation` — `create` \| `update` \| `delete`
- `payload` — JSON patch or full document snapshot
- `baseVersion` — optimistic concurrency
- `createdAt`, `attemptCount`, `lastError`, `status`

## Read path

- TanStack Query (Phase 1+) with `queryFn` reading repositories
- Stale data served from IndexedDB immediately
- Background refresh when transport returns remote changes (future)

## Connectivity

- `navigator.onLine` + `window` `online`/`offline` events
- UI shows offline banner; sync engine pauses when offline
- Failed operations remain `failed` with retry backoff (exponential, capped)

## Conflict handling

When `baseVersion` ≠ server version:

1. Mark entity `syncStatus: conflict`
2. Store server snapshot in `syncConflicts` (future table)
3. Administrator UI resolves: keep local, keep remote, or merge fields

## PWA shell

- `vite-plugin-pwa` caches static assets (app shell)
- API calls are not cached in MVP (no backend)
- Service worker enables install and offline load of bundled JS/CSS/HTML

## Security note (MVP)

Demo authentication only. Sync transport will use real tokens when a backend exists; secrets are not stored in the outbox payload in production.

## Testing

- `fake-indexeddb` in Vitest for repository and outbox tests
- Verify: enqueue on write, status transitions, idempotent replay by `operationId`
