# Security, Gate & Visitor Management — Freeze Validation

Scope frozen: **core only**, per explicit user selection — Gate/Location master, generic
Visitor/Visit lifecycle with server-side host validation, `SECURITY_MANAGER` /
`SECURITY_GUARD` RBAC roles, vendor/contractor gate entry (referencing the canonical
Vendor Master), and a general Security Incident log. Material Gate Pass, Asset
Outward/Return Pass, and a dedicated Security & Gate Web workspace were explicitly
deferred and are **not** part of this freeze (see docs/CAMPUS_OS_PHASE4_PREIMPLEMENTATION_AUDIT.md).

## New footprint

- Migration: `apps/api/migrations/20261023100000_campus_os_phase4_security_gate.cjs`
  — `security_gates`, `security_visitors`, `security_visits`, `security_visit_events`
  (append-only), `security_incidents`.
- Module: `apps/api/src/modules/security/` — `types.ts`, `access.ts`, `service.ts`,
  `controller.ts`, `security.e2e.test.ts`.
- `apps/api/src/app.ts` — 2 lines added (router import + mount at `/api/security`).

No file under a frozen module (`hostel`, `transport`, `procurement`, `assetManagement`,
`hr`, or their migrations) was created or edited by this work. Other modified files
present in the working tree (e.g. `hostel/access.ts`, `procurement/access.ts`) were
verified via `git diff` to be pre-existing uncommitted work unrelated to this session
(hostel gate-manage permission grants, procurement/canteen/asset-handoff grants) — not
touched here.

## Reuse over build

- **Vendor Master (P0.1)**: vendor/contractor visits resolve against the canonical
  `procurement_vendors` table via the existing `findVendorRef` export — no new vendor
  table was created.
- **Document Engine (P0.4)**: `security_visitors.photo_document_id` and
  `security_incidents.evidence_document_id` are real FK references into
  `campus_documents`, ready for a controller-layer `uploadDocument`/
  `listDocumentsForEntity` call. Not wired end-to-end for `SECURITY_MANAGER`/
  `SECURITY_GUARD` in this pass because `documentEngine/access.ts`'s role-permission
  map does not yet grant those roles `document.upload`/`document.manage` — extending
  that map was outside the approved file-touch scope for this pass (one-line follow-up).
- **Workflow Engine (P0.3)**: not wired into visit approval for the same reason
  (`workflowEngine/access.ts` doesn't yet grant the new roles). Visit approval instead
  uses direct state transitions (`decideVisit`), mirroring the same pattern
  `hostel/visitors.ts` already uses for its own REQUESTED→APPROVED lifecycle. This is a
  documented, deliberate simplification, not a gap in enforcement — approval is still
  server-side, permission-gated, and state-machine-enforced.
- **Hostel gate/visitor/outpass**: left entirely untouched and remains authoritative for
  hostel-resident movement. The new module is scoped to non-hostel campus visitors only
  (guest/vendor/contractor/official); no overlap or duplicate authority was introduced.

## Visit lifecycle

`REQUESTED → APPROVED → CHECKED_IN → CHECKED_OUT`, with `REJECTED` / `CANCELLED` /
`EXPIRED` as terminal states. Illegal transitions (e.g. `REJECTED → CHECKED_IN`,
`CHECKED_OUT → CHECKED_IN`) are rejected by an explicit transition table
(`VISIT_STATUS_TRANSITIONS` in `types.ts`), not by ad hoc checks.

## Concurrency & correctness (tested)

- **Concurrent check-in**: row-locked (`forUpdate`) transaction with a conditional
  update (`WHERE status = 'APPROVED'`) — only one of two simultaneous requests
  succeeds. Test: `two simultaneous check-in requests for the same visit: only one
  succeeds`.
- **Concurrent checkout**: idempotent under the same pattern — no duplicate history.
  Test: `checkout is idempotent under concurrency: only one succeeds, no duplicate
  history`.
- **Expiry**: an expired visit cannot be approved or checked in. Test: `an expired
  visit cannot be approved or checked in again`.
- **Tenant isolation / IDOR**: all lookups filter by `collegeId`; cross-college access
  returns not-found rather than another tenant's data. Test: `enforces tenant
  isolation / IDOR: cross-college access returns not found`.
- **RBAC**: `SECURITY_GUARD` cannot approve visits or manage the gate master; an
  unrelated role (e.g. `FACULTY`) is denied entirely. Test: `enforces RBAC:
  SECURITY_GUARD cannot approve; unrelated FACULTY role is denied entirely`.
- **Host validation**: host is resolved server-side against active faculty/student
  records; an unknown or inactive host is rejected — the client-submitted host id is
  never trusted directly. Test: `validates the host server-side: unknown or inactive
  host is rejected, never trusting client input`.
- **Vendor referencing**: vendor/contractor visits validate against
  `procurement_vendors` via `findVendorRef`. Test: `vendor/contractor visits reference
  the canonical procurement vendor master`.
- **Incident privacy**: incident detail requires `security.incident.view`; unrelated
  roles are denied. Test: `logs and manages security incidents, privacy-scoped from
  unrelated roles`.
- **Append-only movement history**: every lifecycle transition writes a new
  `security_visit_events` row; no prior event row is ever mutated or deleted.

## Migration validation

Ran `migrate:up` → `migrate:down` → `migrate:up` against the local MySQL test database.
All three steps completed cleanly with no orphaned foreign keys; `down()` drops child
tables (`security_visit_events`, `security_incidents`) before parents
(`security_visits`, `security_visitors`, `security_gates`), following the FK-drop-order
fix established in the Phase 3 facilities/preventive migration.

## Test results

- New module tests: `apps/api/src/modules/security/security.e2e.test.ts` — **10/10 PASS**.
- Full backend regression (independently re-run): **246 suites / 1,441 tests / 1,441
  PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED**, normal exit — exactly the pre-existing
  baseline (245 suites / 1,431 tests) plus these 10 new tests. Zero regressions.

## Known limitations (explicitly out of scope for this freeze, not defects)

- No Material Gate Pass (inward/outward/returnable movement referencing
  Stores/Procurement) — deferred by explicit scope selection.
- No Asset Outward/Return Pass referencing Asset Management — deferred by explicit
  scope selection.
- No dedicated Security & Gate Web workspace — backend only in this pass.
- No gate-level scoping table for guards (tenant-wide role check only) — flagged in
  `access.ts` as a natural follow-up mirroring `hostel_warden_assignments`.
- Workflow Engine / Document Engine role-permission maps not yet extended to
  `SECURITY_MANAGER`/`SECURITY_GUARD` — one-line follow-up in each module's
  `access.ts` when those integrations are prioritized.
- No RFID/ANPR/CCTV/biometric hardware integration — out of scope per governance rule,
  not a blocker.
