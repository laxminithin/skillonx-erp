# IQAC, Accreditation, Compliance & Institutional Quality (Campus OS Phase 7) — Freeze Validation

Status: **FROZEN** (development closure). Date: 2026-09-25. Branch:
`feat/examination-coe-operational-backend`.

## Scope actually built

Per `docs/CAMPUS_OS_PHASE7_PREIMPLEMENTATION_AUDIT.md` (Architecture Decision
— Option C, thin evidence/snapshot/orchestration layer), this pass adds:

1. **Accreditation framework/version/criterion registry**
   (`iqac_frameworks`, `iqac_framework_versions`, `iqac_criteria`) —
   configuration-driven, zero hard-coded NAAC/NBA/NIRF content. Versioning
   is a hard requirement: activating a new version retires the previous
   ACTIVE one for that framework, but a cycle's recorded
   `framework_version_id` never changes, so historical cycles keep the
   exact version they ran against.
2. **Metric engine** (`iqac_metrics`, `iqac_metric_values`) — SYSTEM_DERIVED
   or MANUAL metrics, with explicit missing-data semantics (`OK`, `ZERO`,
   `NO_DATA`, `NOT_APPLICABLE`, `NOT_CONFIGURED`, `SOURCE_ERROR`,
   `PENDING_VERIFICATION`) and a governed override path (reason + old/new
   value + actor + timestamp, always audited).
3. **Accreditation cycle + immutable freeze snapshot**
   (`iqac_cycles`, `iqac_snapshots`) — DRAFT → DATA_COLLECTION → REVIEW →
   APPROVED → FROZEN → SUBMITTED → CLOSED, with `iqac_cycles.status`
   row-locked on every transition. Freezing snapshots every metric value and
   evidence row scoped to the cycle as an append-only, immutable revision;
   a post-freeze correction adds a new revision with a mandatory reason,
   never mutates the original.
4. **Evidence linkage** (`iqac_evidence`) — reuses `documentEngine` by
   `document_id` for files (no new binary store); typed provenance
   (`SYSTEM_DERIVED`/`SYSTEM_DOCUMENT`/`MANUAL_UPLOAD`/`EXTERNAL_REFERENCE`);
   a verification lifecycle (`SUBMITTED`→`REVIEWED`/`VERIFIED`/`RETURNED`/
   `REJECTED`) with a hard self-verification block.
5. **Continuous improvement / action plans** (`iqac_action_plans`) — one
   engine shared by NBA gaps, NAAC observations, academic-audit findings,
   survey feedback, management review, IQAC meetings, and compliance gaps
   (`source_type`), forward-only status progression, terminal-state
   protection, and a reopen path requiring elevated permission + mandatory
   reason + audit trail.
6. **Academic/internal quality audits** (`iqac_audits`,
   `iqac_audit_findings`) — configuration-driven checklist (no hard-coded
   institution checklist), findings feed the *same* action-plan engine as
   #5, not a separate `audit_tasks` table.
7. **Generic governed committees** (`iqac_committees`,
   `iqac_committee_members`, `iqac_meetings`) — one capability for IQAC/
   Academic/Research/Statutory committees, not one module per committee;
   external members supported without fake employee records; minutes reuse
   `documentEngine` by id.
8. **Compliance calendar** (`iqac_compliance_items`) — requirement/
   authority/due-date/owner/evidence/status; "overdue" is a derived
   display-only flag computed at read time, never a silent mutation of
   stored status.
9. **Dashboard** — efficient COUNT-query aggregation (evidence pending,
   metrics needing attention, action plans overdue, audit findings open,
   compliance deadlines overdue, active cycles), scoped by college.
10. **Web workspace** (`/iqac`) — ONE workspace (`IqacLayout` +
    `IqacWorkspacePage`), tabbed (Dashboard/Frameworks/Cycles/Action Plans/
    Compliance), not separate NBA/NAAC/NIRF/IQAC coordinator portals.

Explicitly NOT built (per the audit's "already exists, authoritative
elsewhere" finding — reused, not duplicated): CO/PO/PSO mapping/attainment
recalculation (`copo`, `attainment`), survey capture/aggregation
(`surveys`), faculty CV data (`facultyProfile`), document storage
(`documentEngine`). No NAAC/NBA/NIRF/AISHE/AICTE regulatory content, no
external portal/API integration, no accreditation-outcome prediction.

## Authoritative ownership (unchanged)

| Data | Authoritative module |
|---|---|
| Faculty identity/service | HR |
| Faculty academic achievements | `facultyProfile` |
| Research/grants | `research` (Phase 6, frozen) |
| Students | Student/Admissions |
| Examination/results | `examination` |
| CO/PO/PSO mapping & attainment | `copo`, `attainment` |
| Survey responses | `surveys` |
| Placements | `placement` (T&P) |
| Alumni | `alumni` |
| Finance | `finance` |
| Library | `library` |
| Documents/evidence files | `documentEngine` |

Phase 7 (`iqac`) consumes, references, aggregates, and snapshots this data.
It owns only the registry/metric/cycle/evidence-link/action-plan/audit/
committee/compliance rows listed above — nothing that already exists
elsewhere was re-created.

## RBAC

No new roles introduced (`IQAC_COORDINATOR` and `NBA_COORDINATOR` already
existed in `apps/api/src/types/domain.ts` — confirmed by audit before
adding anything, per prompt §57). `iqac/access.ts` grants least-privilege
permissions per role; `IQAC_COORDINATOR` deliberately does **not** hold
`iqac.cycle.approve` — a real two-party control, since cycle approval
requires PRINCIPAL/MANAGEMENT/Admin sign-off. Tested in
`iqac.e2e.test.ts` ("RBAC: FACULTY cannot manage frameworks or metrics;
HOD is not granted cycle.approve") and reproduced live in the browser: an
IQAC_COORDINATOR clicking "Approve" on a REVIEW-status cycle is rejected by
the API and the cycle stays in REVIEW.

HOD department-scoping reuses the exact `hodDepartmentIds`/
`isHodOfDepartment` convention from `research/access.ts`; a HOD cannot enter
values for a MANUAL metric owned by a different department (tested).

## Self-verification block

`iqac/access.ts:assertNotSelfVerifying` hard-blocks the evidence submitter
from being its own verifier, even for `IQAC_COORDINATOR`. Tested in
`iqac.e2e.test.ts` ("evidence verification: self-verification is blocked
even for a coordinator").

## Concurrency

- `freezeCycle`: row-locks the cycle (`forUpdate`), asserts status is still
  `APPROVED` before writing. Under two concurrent freeze calls on the same
  cycle, exactly one succeeds and the other is rejected with a 409 — not a
  duplicate snapshot. **Tested** with real concurrent DB transactions
  (`Promise.allSettled`), asserting exactly 1 fulfilled / 1 rejected and
  exactly 1 snapshot row created.
- `submitCycle`/`closeCycle`: idempotent — a retry with the same
  `submissionReference` (submit) or a retry on an already-`CLOSED` cycle
  (close) returns the existing state instead of erroring, so a lost
  response after a successful transition is retry-safe. **Tested.**
- `updateActionPlan`/`closeActionPlan`/`reopenActionPlan`: row-locked,
  forward-only status transitions, terminal states (`CLOSED`/`CANCELLED`)
  protected from further mutation. **Tested.**
- `overrideMetricValue`/`setManualMetricValue`: row-locked upsert per
  `(metric_id, period_label)`.

## Missing-data semantics

`iqac_metric_values.value_status` is never silently collapsed to `0`/
`PASS`/`COMPLETE`/`COMPLIANT`. A `SYSTEM_DERIVED` metric with no registered
connector for its `source_module` recomputes to `NOT_CONFIGURED` (value
`null`); a connector that throws recomputes to `SOURCE_ERROR` with the
error captured in `raw_value`, never hidden. **Tested** ("missing-data
semantics: SYSTEM_DERIVED metric with no registered connector recomputes
to NOT_CONFIGURED, never 0"). No system-metric connector is wired in this
pass (see Known limitations) — this is itself the honest, non-fabricated
default, not a placeholder pretending to be real data.

## Snapshot / evidence provenance

`iqac_snapshots` is append-only: `freezeCycle` inserts revision 1;
`reviseCycleSnapshot` inserts revision 2+ with a mandatory reason, never
updates an existing row. **Tested** — the original revision-1 snapshot's
`reason` column stays `null` after a revision 2 is added, proving the
original is untouched (mirrors the DVV-style "preserve the original"
requirement, prompt §29).

`iqac_evidence.provenance` distinguishes `SYSTEM_DERIVED`/
`SYSTEM_DOCUMENT`/`MANUAL_UPLOAD`/`EXTERNAL_REFERENCE`; a manual upload is
never presented as system-generated.

## Tenant isolation / IDOR

Every query is scoped by `college_id = actor.collegeId`, mirroring the
convention used throughout the codebase. A cross-college actor gets 404 on
both reads and mutations for frameworks, versions, criteria, and cycles —
**tested** ("tenant isolation: cross-college actor gets 404 on reads and
mutations, not a leak").

## Evidence

- **Migration up→down→up**: PASS. `20261025100000_campus_os_phase7_iqac.cjs`
  applied (batch 91), rolled back cleanly (all 16 tables dropped in FK-safe
  order), reapplied (batch 91); `migrate:status` confirmed 0 pending both
  before and after.
- **TypeScript** (`cd apps/api && npx tsc --noEmit`): PASS, exit 0, no
  errors, on the first pass.
- **Focused suite** (`iqac.e2e.test.ts`): **13/13 PASS**, 0 fail/cancelled/
  skipped.
- **Web**: `npx tsc --noEmit` PASS; `npm run build` PASS (vite production
  build, no new errors — the pre-existing >500kB chunk-size warning is
  unrelated to this change).
- **Browser verification** (live, not just unit tests): logged in as a
  seeded `IQAC_COORDINATOR`, exercised the full `/iqac` workspace —
  Dashboard loads real aggregate counts; created a framework, activated a
  version; created and advanced a cycle through DRAFT→DATA_COLLECTION→
  REVIEW; confirmed the coordinator's "Approve" click is rejected by the
  API (two-party control enforced end-to-end, not just in the test suite);
  created an action plan. Zero console errors from any `/api/iqac/*` call
  (all 200 OK); the two unrelated 404s in console predate this change.
- **Full backend regression**: see `docs/CAMPUS_OS_PHASE7_FREEZE_VALIDATION.md`.

## Known limitations (non-blockers, matching prompt §99)

- No system-metric connector is wired (`SYSTEM_METRIC_CONNECTORS` registry
  is empty) — every `SYSTEM_DERIVED` metric recomputes to `NOT_CONFIGURED`
  until a connector is added for a specific `source_module`. This is
  additive, out-of-band configuration, not a schema change, and is the
  honest default rather than a guessed cross-module query against schemas
  this pass did not verify.
- NAAC/NBA/NIRF/AISHE/AICTE regulatory content: `NOT_CONFIGURED` — no
  criterion numbers, weights, or formulas were invented (prompt §9).
- No accreditation-outcome prediction (explicitly out of scope, prompt
  §100).
- Playwright/authenticated multi-breakpoint screenshot QA was not run for
  this pass (only a single-viewport manual browser walkthrough, see
  above) — an honest gap, not a claimed PASS.

## Commit / Push / PR

Commit: NO. Push: NO. PR: NO.
