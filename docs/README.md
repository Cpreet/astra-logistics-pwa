# ASTRA Documentation

**ASTRA — AI-Powered Freight Intelligence Platform.** Offline-first logistics ERP PWA, air freight first, extensible to sea, road, rail, courier, import and export.

## Start here

| Document | What it is |
|----------|------------|
| **[handoff.md](./handoff.md)** | **Read first.** Verified current state, what to do next, working agreement, PR checklist |
| [plan.md](./plan.md) | Phased delivery schedule with task IDs, dependencies and exit criteria |
| [spec.md](./spec.md) | Canonical engineering spec: architecture, domain model, state machine, permissions, NFRs |
| [user-flows.md](./user-flows.md) | The 24 end-to-end flows (F1–F24), role workboards, offline matrix, navigation and notification maps |
| [market-research.md](./market-research.md) | 2026 market research and the design decisions (`D-01`–`D-30`) it drove |

## Supporting

| Document | What it is |
|----------|------------|
| [domain-model.md](./domain-model.md) | Entity overview and extensibility rules — companion to `spec.md` §5 |
| [offline-sync.md](./offline-sync.md) | Sync engine, outbox, conflict handling, PWA shell |
| [implementation-plan.md](./implementation-plan.md) | Phase 0 record, superseded by `plan.md` |
| [deploy-netlify.md](./deploy-netlify.md) | Deployment |

## Precedence

When documents disagree: **`spec.md`** for rules and data → **`user-flows.md`** for user-facing behaviour → **`plan.md`** for sequencing. Fix the losing document in the same pull request.

## Cross-reference keys

- `F1`–`F24` — user flows, defined in `user-flows.md`
- `D-01`–`D-30` — design decisions with market evidence, defined in `market-research.md`
- `P1-01`–`P9-06` — delivery tasks, defined in `plan.md`
- `E_*` — domain error codes, defined in `spec.md` §11
