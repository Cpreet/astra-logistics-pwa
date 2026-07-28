# ASTRA Documentation

**ASTRA — AI-Powered Freight Intelligence Platform.** Offline-first logistics ERP PWA, air freight first, extensible to sea, road, rail, courier, import and export.

## Start here

| Document | What it is |
|----------|------------|
| **[handoff.md](./handoff.md)** | **Read first.** Verified current state, what to do next, working agreement, PR checklist |
| [product-brief.md](./product-brief.md) | The original product brief, verbatim — the source requirement |
| [plan.md](./plan.md) | Phased delivery schedule with task IDs, dependencies and exit criteria |
| [spec.md](./spec.md) | Canonical engineering spec: architecture, domain model, state machine, permissions, screens, NFRs, acceptance criteria |
| [user-flows.md](./user-flows.md) | The 24 end-to-end flows (F1–F24), role workboards, offline matrix, navigation and notification maps |
| [market-research.md](./market-research.md) | 2026 market research and the design decisions (`D-01`–`D-30`) it drove |

## Supporting

| Document | What it is |
|----------|------------|
| [implementation-plan.md](./implementation-plan.md) | Phase-level plan and the high-level architecture diagram |
| [domain-model.md](./domain-model.md) | Entity overview and extensibility rules — companion to `spec.md` §5 |
| [state-machines.md](./state-machines.md) | Every state machine, its guards and its diagram |
| [offline-sync.md](./offline-sync.md) | Sync engine, queue, conflict handling, PWA shell |
| [security-notes.md](./security-notes.md) | What is simulated, real controls, production-hardening requirements |
| [future-backend.md](./future-backend.md) | Backend milestones and the seams that make them additive |
| [deploy-netlify.md](./deploy-netlify.md) | Deployment |

## Precedence

**`product-brief.md`** states the requirement → **`spec.md`** states how it is met → **`user-flows.md`** for user-facing behaviour → **`plan.md`** for sequencing. Fix the losing document in the same pull request. The brief itself is never edited; `spec.md` §21 traces every brief section to where it is implemented.

## Cross-reference keys

- `F1`–`F24` — user flows, defined in `user-flows.md`
- `D-01`–`D-30` — design decisions with market evidence, defined in `market-research.md`
- `P1-01`–`P9-06` — delivery tasks, defined in `plan.md`
- `E_*` — domain error codes, defined in `spec.md` §11
