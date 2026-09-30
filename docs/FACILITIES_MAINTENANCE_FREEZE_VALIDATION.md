# Facilities / Maintenance — Phase 3 Extension — Freeze Validation

Date: 2026-09-24. Scope: the two proven Phase 3 gaps only — preventive
maintenance scheduling, and a real asset FK on `service_tickets` (with
warranty/AMC surfacing). No second work-order engine, no new asset/vendor
master, no new portal.

Related documents:
[`CAMPUS_OS_PHASE3_PREIMPLEMENTATION_AUDIT.md`](./CAMPUS_OS_PHASE3_PREIMPLEMENTATION_AUDIT.md),
[`MAINTENANCE_FACILITIES_IT_HELPDESK_FREEZE_VALIDATION.md`](./MAINTENANCE_FACILITIES_IT_HELPDESK_FREEZE_VALIDATION.md)
(the original, still-frozen ticket engine this extends),
[`ASSET_MANAGEMENT_FREEZE_VALIDATION.md`](./ASSET_MANAGEMENT_FREEZE_VALIDATION.md).

## Final decision

**PHASE 3 — FACILITIES & MAINTENANCE: FROZEN**

## Architecture decision (read this first)

The pre-implementation audit found a complete, frozen, generic work-order
engine already in place (`service_tickets` + 12 supporting tables). Building
a second one — even one styled as "Facilities" — would have been the exact
duplication this phase's brief warns against. So this pass is a **closure /
integration extension** of that existing engine, not a new engine:

1. **Preventive maintenance** (`maintenance_preventive_plans` +
   `maintenance_preventive_occurrences`) is new schema, because nothing like
   it existed anywhere in the repo. Its `generateDue()` produces ordinary
   `service_tickets` rows through the existing, unmodified `createTicket()` —
   the plan is metadata that decides *when* a ticket gets raised, not a
   parallel ticket model.
2. **Asset traceability** (`service_tickets.asset_id`) replaces reliance on
   a free-text `asset_ref` with a real FK to the canonical `campus_assets`
   register (P0.2), so maintenance activity is traceable from the asset side
   (an append-only `campus_asset_history` entry), without a second asset
   master and without ever mutating asset status directly.
3. **AMC/warranty** was *already* stored on `campus_assets`
   (`warranty_end_date`, `amc_reference`, `amc_expiry_date` — confirmed by
   the audit). No second contract/AMC table was built. Phase 3 only adds a
   read-only accessor (`findAssetRef`) so the Maintenance operator sees that
   data on the ticket — decision support, not a new data owner.

## Pre-implementation audit

**PASS** — see `CAMPUS_OS_PHASE3_PREIMPLEMENTATION_AUDIT.md`. Every
requirement in the Phase 3 brief was classified against direct source
evidence (file:line citations) before writing any code. Confirmed: the
generic ticket engine, routing/SLA/escalation, technician assignment, parts
requests, vendor master, workflow engine, document engine, and the
Transport/Lab/Hostel domain-specific maintenance tables all already exist
and needed no change. Confirmed missing: preventive scheduling and the
asset FK/warranty surfacing.

## Existing functionality reused (not duplicated)

- **Ticket engine** — `createTicket`, the 13-state status machine, SLA
  engine, routing engine, `service_teams`/`service_categories` — entirely
  unmodified in behavior; preventive-generated tickets are ordinary tickets.
- **Asset register** — `campus_assets` (P0.2, frozen) referenced by FK, never
  duplicated; its validated status state machine (`changeStatus`) is
  untouched — this extension never calls it and never writes to
  `campus_assets` at all, only to the append-only `campus_asset_history`.
- **Vendor Master (P0.1)** — a preventive plan's optional `vendor_id`
  references `procurement_vendors` directly; no second vendor master.
- **Location** — `rooms` reused as-is for a plan's optional room/building;
  no new location hierarchy.
- **RBAC convention** — the new `maint.preventive.manage` permission was
  added to `maintenance/access.ts`'s existing role→permission map, granted to
  the same manager-tier roles (`SUPER_ADMIN`, `COLLEGE_ADMIN`,
  `MAINTENANCE_MANAGER`, `FACILITIES_OFFICER`) that already hold
  `maint.config` — no new role was invented.
- **Audit** — `recordMaintAudit` (existing helper) used for plan
  create/update; ticket-level events continue through the existing
  `service_ticket_events` timeline unchanged.

## Workflow Engine / Document Engine — deliberately not adopted here

Both remain frozen, available, unused by Maintenance. The proven gap
(preventive scheduling) is a single-actor, permission-gated operation with
no genuine multi-step approval need, and ticket evidence already has a home
in `service_attachments`/`service_work_logs`. Retrofitting either frozen
foundation onto Maintenance's existing, working mechanisms would have been
speculative engineering, not an evidence-backed gap. See the audit doc's
"Why the Workflow Engine and Document Engine were not adopted here" section
for the full reasoning.

## New migration

`20261022100000_campus_os_phase3_facilities_preventive.cjs`:
- `service_tickets.asset_id` (nullable FK → `campus_assets`, `ON DELETE SET
  NULL`, additive index) — `asset_ref` free text kept unchanged for
  non-FK sources (Lab/Hostel local assets).
- `maintenance_preventive_plans` — asset/category/team/vendor/room all
  optional FKs (asset-less, facility-level plans are supported), frequency
  unit/value, priority, checklist (JSON), `next_due_date`,
  `last_generated_date`, status (`ACTIVE`/`PAUSED`/`ENDED`).
- `maintenance_preventive_occurrences` — `UNIQUE(plan_id, occurrence_date)`,
  the idempotency guarantee; nullable `ticket_id` FK.

**Migration validation:** applied → rolled back → re-applied against the
live local MySQL test database. The first rollback attempt surfaced a real
MySQL constraint-ordering bug (cannot drop a column while its FK constraint
still exists); fixed by dropping the FK before the column in `down()`, then
re-validated: a full up → down → up cycle now completes cleanly with no
manual intervention. No destructive change to any frozen-domain data — the
only altered existing table (`service_tickets`) only gains a nullable
column.

## New/changed code

- **New module file**: `apps/api/src/modules/maintenance/preventive.ts` —
  plan CRUD, `listOccurrences`, `generateDue` (concurrency-safe, see below),
  `retryOccurrenceTicket` (failure recovery), `upcomingDue` (dashboard/report
  feed).
- **`maintenance/types.ts`**: new `maint.preventive.manage` permission; new
  `preventivePlanSchema`/`preventivePlanUpdateSchema`/`preventiveGenerateSchema`
  zod schemas; `createTicketSchema` gained an optional `assetId`.
- **`maintenance/access.ts`**: `maint.preventive.manage` granted to the same
  manager-tier roles as `maint.config`.
- **`maintenance/tickets.ts`**: `createTicket` accepts and validates
  `assetId` (tenant-scoped via `findAssetRef`); ticket read/list queries now
  join `campus_assets` and expose `assetId`/`asset.{assetTag,name,status,
  warrantyEndDate,amcReference,amcExpiryDate}`; `resolveTicket` and
  `createTicket` write best-effort, non-blocking asset-history entries.
- **`maintenance/controller.ts`**: `GET/POST /preventive/plans`,
  `GET/PATCH /preventive/plans/:id`, `GET /preventive/plans/:id/occurrences`,
  `POST /preventive/generate`, `POST /preventive/occurrences/:id/generate-ticket`.
- **`maintenance/dashboard.ts` / `reports.ts`**: manager dashboard gained a
  `preventiveDue` count/list (next 14 days); reports gained a `preventiveDue`
  section (next 30 days) — both gated behind `maint.preventive.manage`, so a
  technician's dashboard/report is unaffected.
- **Frozen-module change (smallest possible, justified)**:
  `apps/api/src/modules/assetManagement/service.ts` gained two additive
  exports — `findAssetRef` (read-only lookup, mirrors the existing
  `procurement/service.ts:findVendorRef` cross-module-read convention
  exactly) and `recordMaintenanceHistory` (append-only insert into
  `campus_asset_history`; **never** touches `campus_assets.status` or any
  other asset column — that remains exclusively behind the validated
  `changeStatus` state machine). No existing exported function, its
  signature, or its behavior was changed.

## Concurrency & idempotency (proven, not asserted)

- **Idempotent generation**: `UNIQUE(plan_id, occurrence_date)` is the
  independent backstop; the per-plan transaction locks the plan row
  (`forUpdate`) before reading/advancing `next_due_date`, so a concurrent
  caller either blocks and then finds nothing due, or hits the unique
  constraint. Verified: calling `generateDue` twice for the same due plan
  produces exactly one ticket and one occurrence row; the second call
  finds nothing due (the plan already advanced).
- **Concurrent generation**: three concurrent `generateDue` calls for the
  same due plan (`Promise.allSettled`) produce exactly **one** ticket and
  **one** occurrence row — verified against the real DB, not mocked.
- **Failure recovery**: an occurrence recorded but never given a ticket
  (simulating a mid-flight failure) is retryable via
  `retryOccurrenceTicket`, which fails loudly (409) if a ticket already
  exists — no duplicate ticket, no duplicate occurrence, no silent data
  loss.
- **Tenant isolation**: a plan/occurrence from one college cannot be read,
  updated, listed, or generated by an actor from another college (each
  scoped query includes `college_id`; cross-college reads return 404, not
  a data leak).
- **RBAC**: `MAINTENANCE_STAFF` (a technician role) is rejected with a
  permission error on every preventive endpoint; only manager-tier roles
  can create/update/generate.
- **Asset-status safety**: linking or resolving a ticket against an asset
  never mutates `campus_assets.status` — verified directly (`status`
  remains `IN_STOCK` after linking a ticket).

## Web portal/workspaces

**None built this pass.** The existing 10-page Maintenance Web workspace
(`apps/web/src/pages/maintenance/*`) is unchanged. Preventive plans/
occurrences are API-only for now — a genuine, documented gap (see Known
Limitations), not hidden or claimed as done. No new portal was created, per
the brief's own instruction not to fragment Facilities into more portals.

## Focused regression

- **New preventive suite** (`preventive.e2e.test.ts`): **8/8 PASS** — RBAC,
  asset-less plans, idempotent generation, concurrent generation, tenant
  isolation, asset FK + warranty/AMC surfacing, asset-history traceability,
  failure recovery.
- **Existing Maintenance suite** (`maintenance.e2e.test.ts`, unchanged):
  **24/24 scenarios PASS** — confirms the extension did not alter existing
  ticket-engine behavior.
- **Asset Management suite** (`assetManagement.e2e.test.ts`, unchanged):
  **7/7 PASS** — confirms the two additive exports did not affect
  registration, assignment, transitions, concurrency, or tenant isolation.

## Phase 0 / Phase 1 regression

- Workflow Engine: **9/9 PASS**
- Document Engine: **9/9 PASS**
- Procurement/Stores (incl. GRN idempotency, Asset handoff, concurrency):
  **19/19 + 7/7 + 9/9 PASS**
- Lab (existing Maintenance/Lab integration boundary): **22/22 PASS**

All frozen modules unchanged in behavior; none required modification beyond
the two additive Asset Management exports documented above.

## Full backend regression

**245 suites / 1,431 tests / 1,431 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED**
(prior clean baseline: 244 suites / 1,423 tests — the +1 suite / +8 tests
is exactly the new `preventive.e2e.test.ts` file; no other suite's test
count changed).

## Known limitations (reported, not fabricated)

- No Web UI for preventive plans/occurrences (API only).
- No AMC/vendor-contract *entity* — AMC/warranty is read from the existing
  `campus_assets` fields, not owned by a new table. If a future need
  requires more than a reference+expiry (e.g. contract documents, multiple
  historical AMC terms per asset), that is a genuine, separate, larger gap
  — not built here because the audit found no proven current requirement
  for it beyond what already exists.
- No automatic/scheduled generation (cron) — `generateDue` is
  manager-triggered on demand. Per the brief's own §28/§54, no predictive or
  autonomous scheduling was in scope; this can be wired to the existing
  scheduled-task infrastructure later without a data-model change.
- No SLA/escalation applied to preventive-generated tickets beyond what the
  ticket's category already carries — preventive tickets are ordinary
  tickets, so they inherit the same SLA/routing as any other ticket in that
  category.
- No notification when a plan becomes due — visible via the manager
  dashboard/report instead (`employee_notifications` was not extended,
  consistent with the brief's own instruction not to build a new
  notification mechanism).

## Frozen modules changed

Two additive, non-breaking exports in `assetManagement/service.ts`
(`findAssetRef`, `recordMaintenanceHistory`) — no existing export,
signature, or behavior changed; Asset Management's own focused regression
(7/7) re-verified green.

## Git footprint

New: `apps/api/migrations/20261022100000_campus_os_phase3_facilities_preventive.cjs`,
`apps/api/src/modules/maintenance/preventive.ts`,
`apps/api/src/modules/maintenance/preventive.e2e.test.ts`,
`docs/CAMPUS_OS_PHASE3_PREIMPLEMENTATION_AUDIT.md`,
`docs/FACILITIES_MAINTENANCE_FREEZE_VALIDATION.md`,
`docs/CAMPUS_OS_PHASE3_FREEZE_VALIDATION.md`.
Modified: `apps/api/src/modules/maintenance/{types,access,tickets,controller,dashboard,reports}.ts`,
`apps/api/src/modules/assetManagement/service.ts`,
`docs/SKILLONX_CAMPUS_OS_ARCHITECTURE.md`,
`docs/SKILLONX_PORTAL_AND_ENGINE_MATRIX.md`,
`docs/SKILLONX_IMPLEMENTATION_ROADMAP.md`.
No other file touched; the large pre-existing set of unrelated
uncommitted changes already in the working tree (Examination/COE,
Hostel, Library, Procurement, HR, etc. from other in-progress sessions)
was left exactly as found.
