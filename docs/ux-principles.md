# ASTRA UX Principles

These decisions come from reviewing current (2026) guidance on logistics ERP dashboards and SaaS onboarding, then adapting it to an offline-first freight workspace.

## 1. Onboarding ends at the first useful screen

Research consensus: activation drops roughly 8% for every minute past the five-minute mark, and front-loading profile, billing, or workspace setup before first value is the most common onboarding mistake.

**What ASTRA does**

- `/welcome` asks exactly **one routing question** — “What do you do?” — and signing in is a single tap.
- No passwords, no profile forms, no workspace configuration.
- The six most common roles show first; the remaining four are behind “Show all 10 roles” (progressive disclosure).
- Sample customers and inquiries are already loaded, so the first screen is a working workspace rather than a blank slate.

## 2. Empty states are onboarding screens

Guidance: never show a blank screen. Explain what belongs here, why it matters, give one action, and offer a shortcut.

**What ASTRA does**

`EmptyState` takes `title`, `description`, `value` (why it matters), a primary `action`, and a `secondaryAction` hint. Example — the inquiries list explains the pipeline, then offers “Capture an inquiry” plus a note that lane templates fill most fields.

## 3. Dashboards surface exceptions, not counts

Logistics dashboards work best as operational intelligence: what threatens service or margin right now, with the action attached. Generic KPI walls slow dispatchers down.

**What ASTRA does**

- `src/domain/attention.ts` builds a severity-ranked queue: failed sync operations, credit holds, compliance reviews, passed or imminent pickup dates, stalled pricing, and idle lanes.
- Each row carries a colour-coded severity bar, a plain-language explanation, and a direct action link.
- Pipeline counts appear **below** the queue as secondary context.
- When nothing is wrong, the queue says so explicitly rather than rendering empty.

## 4. Role-based entry points

Shippers, dispatchers, and finance controllers need different homepages. `src/domain/role-home.ts` maps every role to a headline, a focus line, and a primary action, so the dashboard's top action matches the job to be done.

Permission-aware UI extends this: the activation checklist hides steps a role cannot perform, so read-only roles never see a dead-end prompt.

## 5. Activation is measured by outcomes, not tours

Checklists only help when completion predicts retention — “add a profile photo” items fail.

**What ASTRA does**

The checklist tracks four real outcomes: add a customer, capture an inquiry, advance it through the workflow, and save something offline. Progress is stored in IndexedDB (`activation_state`), is idempotent, dismissible, and disappears once complete.

## 6. Speed comes from keyboard and thumb, not menus

- **Command palette** (`⌘K` / `Ctrl+K`, or `/`) searches customers and inquiries and runs commands.
- **Shortcuts**: `g d`, `g i`, `g c`, `g a`, `g s` to navigate; `n` for a new inquiry.
- **Mobile**: bottom tab bar with a centre create button, opening an action sheet.
- **Forms**: sticky save bar within thumb reach, correct `inputMode` / `enterKeyHint`, autofocus on the first field.

## 7. Reduce typing before adding fields

- **Lane templates** (LHR → JFK, HKG → LAX, …) fill origin, destination, direction, and cargo in one tap.
- **IATA lookup** resolves `LHR` to “London Heathrow, GB” as you type, so no name field is required.
- **Smart defaults**: air + export, and the customer is preselected when only one exists.
- **Progressive disclosure**: the customer form asks for four fields; commercial terms sit behind “Commercial details”.

## 8. Offline state is always legible

- A persistent banner distinguishes “offline, saved on this device” from “queued for sync”.
- Toasts confirm each save and say where it went.
- Every record shows its sync status, and `/sync` exposes the operation queue.
- The simulated transport is labelled as such — the UI never implies a real backend exists.

## 9. Professional visual system

- Semantic tokens (`canvas`, `surface`, `raised`, `line`, `ink`, `muted`, `brand`, plus status colours) drive both light and dark themes from one set of classes.
- Inter Variable is bundled locally, so typography works offline.
- Tabular numerals for identifiers and metrics; 44px minimum touch targets; visible focus rings; `prefers-reduced-motion` respected.

## Sources reviewed

- SysGenPro — Logistics ERP dashboards for real-time visibility and exception management
- Glow Team — Logistics solution design UX best practices
- Myplanet — Logistics dashboard case study (progressive disclosure findings)
- Phenomenon Studio — Prioritizing UX in logistics products (role-based needs)
- Codivox, DesignRevision, Dot2shape, Masterly, UserOrbit — 2026 SaaS onboarding and empty-state guidance
