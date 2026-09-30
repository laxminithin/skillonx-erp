# Scholarships, Financial Aid & Student Benefits — Freeze Validation

Date: 2026-09-25. Branch: `feat/examination-coe-operational-backend`.

## Architecture decision

**OPTION B — Minimal extension of existing Finance/Student capabilities.**
See `docs/CAMPUS_OS_PHASE10_PREIMPLEMENTATION_AUDIT.md` §4 for the evidence.
A scheme master, staff-entered scholarship/concession records, and an
idempotent demand-adjustment primitive (`applyScholarshipToDemands` →
`recalculateDemandTotals`) already existed inside Finance. This pass adds a
student application/eligibility/verification/approval layer on top,
reusing the already-frozen Workflow-style state machine pattern, the
Document Engine, and `notifyStudent`.

## Source-of-truth matrix

| Concern | Authority |
|---|---|
| Student identity, USN, programme/dept/batch/semester | `students` table (unchanged) |
| Academic performance (CGPA) | Examination `studentAcademicRecord()` — read-only |
| Attendance | Attendance `studentAttendanceSummary()` — read-only |
| Scholarship scheme, eligibility policy, application, verification, approval, sanction decision | New Phase 10 tables inside `finance/` |
| Fee demand, financial effect of a scholarship, payment, refund, ledger | Finance (`student_fee_demands`, `recalculateDemandTotals`) — unchanged authority |
| External government scheme status | Not integrated — `isExternal`/`externalPortalUrl` only; live status is `NOT_CONFIGURED` |
| Documents/evidence | Document Engine (P0.4), reused with an additive student-actor extension |
| Notifications | `notifyStudent()`, reused unchanged |

No ambiguous financial ownership: `scholarshipApplications.ts` never writes
to `student_payments`, `fee_receipts`, `student_refunds`, or ledger tables.
The only financial effect it triggers is `applyScholarshipToDemands`
(existing Finance code, exported and made trx-aware, not duplicated).

## What was built

Backend (`apps/api/src/modules/finance/`):
- `eligibility.ts` — deterministic, structured eligibility evaluator (no
  eval/executable code). Reads Examination CGPA and Attendance percentage
  read-only; treats missing source data as `PENDING_DATA`/`SOURCE_ERROR`,
  never as `INELIGIBLE` or zero. Self-declared income/category are
  distinguished from verified fact (always `PENDING_DATA` until a human
  verifies the evidence).
- `scholarshipApplications.ts` — application lifecycle: `DRAFT → SUBMITTED
  → UNDER_VERIFICATION → (RETURNED ⇄ UNDER_VERIFICATION) → VERIFIED →
  APPROVED → SANCTIONED → COMPLETED`, with terminal side-states `REJECTED`,
  `WITHDRAWN`, `CANCELLED`. Every transition is row-locked
  (`SELECT ... FOR UPDATE`) inside its own transaction and audited via the
  existing `finance_audit_log` (`recordFinanceAudit`, which already
  supported `actorType: 'STUDENT' | 'SYSTEM'`).
- `scholarships.ts` — `applyScholarshipToDemands` made an exported,
  transaction-aware function (previously private, db-only) so the sanction
  handoff can run atomically inside the same transaction as the
  application's status flip. `sanctionScholarship`'s existing call site is
  unchanged (still wraps its own transaction when no `trx` is passed).
- `notifications.ts` — four new `notifyStudent()` wrappers
  (submitted/returned/decision/sanctioned), following the exact pattern of
  the existing `notifyScholarshipSanctioned`/`notifyRefundProcessed`.
- `access.ts` / `types.ts` — two new `FinancePermission`s
  (`finance.scholarship_application.process`,
  `finance.scholarship_application.approve`), granted to `ACCOUNTANT` only
  (least privilege — no new `SCHOLARSHIP_OFFICER` role invented).
- `controller.ts` — staff routes under `/api/finance/scholarship-*` and
  student routes under `/api/student/finance/scholarship-*`.

Document Engine (`apps/api/src/modules/documentEngine/`) — additive,
justified extension:
- `types.ts`: `DocumentActor` becomes a discriminated union of
  `{facultyUserId}` (unchanged, still the only shape the public HTTP
  router — `documentEngineRouter`, staff-only, `requireAuth` — ever
  constructs) or `{studentId}` (new, used only for in-process calls from
  Finance's student-facing controller; never exposed as a new HTTP route).
- `access.ts`: added `STUDENT: ['document.upload']`; `ACCOUNTANT` gained
  `document.manage` (needed to review evidence it did not upload itself —
  confirmed necessary by a failing then passing E2E assertion).
- `service.ts`: upload/version/read/archive functions branch on
  `facultyUserId` vs `studentId` for ownership and read-access checks.
  Existing faculty-only call sites (IQAC) are behaviorally unchanged — full
  IQAC and Document Engine regression suites re-run below, 22/22 pass.
- Migration: `campus_documents.uploaded_by_faculty_id` relaxed to nullable,
  new nullable `uploaded_by_student_id` FK added. Exactly one is enforced
  in application code, not a DB CHECK (portability).

Database (new migration
`20261027100000_campus_os_phase10_scholarship_applications.cjs`, additive
only, no destructive changes to any existing table):
- `scholarship_eligibility_policies` — versioned per (scheme, academic
  year); a later edit creates a new version and never mutates a past one
  (historical immutability, directive §19/§70).
- `scholarship_applications` — the application record.
- `scholarship_application_slots` — a real DB unique index on
  `(college_id, student_id, scheme_id, academic_year_id)`, inserted inside
  the same transaction as SUBMIT when the scheme disallows multiple
  applications. This is the actual concurrency guard (see below), not an
  application-level check.
- `scholarship_schemes` gains additive columns (`provider_type`,
  `benefit_type`, `is_external`, `external_portal_url`,
  `allow_multiple_applications`, `renewal_allowed`, application window
  dates).
- `student_scholarships` gains a nullable `application_id` FK linking a
  sanctioned application to its Finance record.

Web (`apps/web/src/pages/finance/`):
- Student: "Apply for a Scholarship" (browse active schemes), "My
  Applications" (status list), application detail (edit while
  draft/returned, upload evidence, submit, withdraw).
- Staff: "Scholarship Applications" queue (status-filtered) inside the
  existing Accountant workspace, application detail (start verification,
  return, verify, approve, reject, sanction, mark completed, cancel).
- No new portal/workspace shell — both live inside the existing Finance
  student pages and the existing `AccountantLayout`, per the roadmap's own
  prior direction.

## Hard-gate evidence

**Duplicate application where prohibited (§16/§61/§62):** enforced by a
real unique DB index (`scholarship_application_slots`), not a
read-then-write check. Verified under real concurrent `Promise.allSettled`
submission of two drafts for the same (student, scheme, year) — exactly
one succeeds, the loser gets `409`.

**Double sanction / duplicate Finance effect (§37/§62/§63):**
`sanctionApplication` locks the application row, and if
`student_scholarship_id` is already set, returns the existing state as a
no-op instead of creating a second `student_scholarships` row or a second
demand adjustment. Verified: two concurrent sanction calls plus a third
sequential retry all resolve to exactly one `student_scholarships` row.

**Invalid terminal transition (§23):** no code path allows mutating
`REJECTED`/`WITHDRAWN`/`CANCELLED`/`COMPLETED` — every transition function
asserts the application's current status is in an explicit allow-list.
Verified: after REJECTED, `verify`/`approve`/`sanction`/`withdraw` all
throw.

**Student IDOR (§65):** every student-facing function filters by
`student_id = actor.studentId` at the query level (404, not 403, on
mismatch — no existence leak). Verified: student B cannot view, submit, or
withdraw student A's application.

**Tenant isolation (§64):** every staff-facing function filters by
`college_id = actor.collegeId`. Verified: an accountant from college 5
gets 404 on a college-4 application and it is absent from their queue
listing.

**Document IDOR (§67):** evidence documents are reached only through the
application's own ownership/tenant-scoped functions
(`listApplicationDocuments`/`listApplicationDocumentsForStaff`), which
call into Document Engine's own `assertReadAccess` (student-uploader-only,
or admin/`document.manage`). Verified: a second student's own,
application-scoped document listing does not surface another student's
upload.

**Eligible ≠ approved (§20):** `approveApplication` only hard-blocks when
`eligibility_status === 'INELIGIBLE'`; `PENDING_DATA`/`SOURCE_ERROR`
applications can still be approved by staff exercising judgment after
manually reviewing evidence — approval is never automatic from
eligibility.

**Missing data semantics (§21):** `eligibility.ts` never collapses missing
CGPA/attendance/income/category into `INELIGIBLE` or a numeric zero — each
unavailable source yields an explicit `PENDING_DATA` or `SOURCE_ERROR`
check with a human-readable detail string, captured in the frozen
`eligibility_snapshot`.

**Government schemes not fabricated (§10/§95):** no SSP/NSP/DBT/eligibility
content was hardcoded. `isExternal`/`externalPortalUrl` are configuration
fields only; external status is `NOT_CONFIGURED`.

## Test results

Focused Phase 10 suite
(`finance/scholarshipApplications.e2e.test.ts`): **8/8 PASS** — full
lifecycle + financial handoff, duplicate-application rejection, concurrent
duplicate submission, idempotent concurrent sanction, terminal-state
protection, student IDOR, tenant isolation, document evidence
visibility/IDOR.

Finance module regression (`finance/*.test.ts`, includes the pre-existing
`finance.e2e.test.ts` and `examRemuneration.e2e.test.ts`): **29/29 PASS**
(21 pre-existing + 8 new).

Document Engine + Workflow Engine + IQAC regression (the only other
consumers of the two shared engines this phase touched): **31/31 PASS**
(9 Document Engine + 13 IQAC + 9 Workflow Engine) — zero regressions from
the `DocumentActor` union type change or the `ACCOUNTANT` permission grant.

TypeScript: API `npx tsc --noEmit` — PASS, exit 0. Web `npx tsc --noEmit`
— PASS, exit 0.

Web production build (`npm run build`): PASS (pre-existing chunk-size
warning only, unrelated to this change).

Migration `20261027100000_campus_os_phase10_scholarship_applications.cjs`:
UP → DOWN → UP — all PASS (the DOWN required an explicit `dropForeign`
before `dropColumn` for MySQL's FK constraint; fixed and re-verified).

Live browser verification (authenticated, real dev MySQL, both roles):
- Student journey: login → Apply for a Scholarship → academic year ID +
  Apply → application detail (DRAFT) → the pre-existing E2E-test slot
  guard correctly blocked a second submission for an already-completed
  scheme with the exact expected message ("You already have an active
  application for this scheme and academic year") → confirmed via "My
  Applications" showing every DRAFT/SUBMITTED/REJECTED/COMPLETED state
  created by the automated tests, matching the API-level results exactly.
- Staff journey: login as Accountant → Scholarship Applications queue
  (tenant-scoped, status-filtered) → opened a SUBMITTED application →
  Start Verification → Mark Verified → Approve → entered a sanctioned
  amount (₹750) → Sanction → status became `COMPLETED` with `Sanctioned:
  ₹750` displayed, matching the `REDUCE_DEMAND` policy's synchronous
  financial handoff.
- Screenshots: 390×844 (student "Apply for a Scholarship", mobile) and
  1440×900 (staff "Scholarship Applications" queue, desktop) — both
  visually inspected, no overflow, no broken layout, sidebar nav entry
  present and correctly highlighted.

All scholarship-scheme/application test fixtures created during this
verification pass (24 dynamically-coded `E2E-SCH-*` schemes and their
applications/slots/documents/student_scholarships) were deleted from the
dev database afterward. The pre-existing `college_finance_policies`
`scholarship_treatment = REDUCE_DEMAND` value for college 4 was read
before use and matched the value already in place — no policy state was
changed net of this pass.

## Known limitations (acceptable per directive §95)

- SSP/NSP/other government portal integration: `NOT_CONFIGURED`.
- DBT/direct bank transfer: not implemented — `student_scholarships` has
  no bank-account column anywhere in the schema, by design (directive
  §29 — do not collect bank details unless genuinely required).
- Aadhaar/government identifiers: not collected anywhere in this feature.
- Full 8-breakpoint responsive QA (360/390/412/768/1024/1280/1440/1920)
  and the full authenticated Web QA matrix across all six representative
  pages were **not run** — only the two mandated screenshot breakpoints
  (390×844, 1440×900) and one authenticated golden-path journey per role
  were verified live. This is the one open item against directive
  §73–§75's full scope; the core mechanics (concurrency, idempotency,
  IDOR, tenant isolation, terminal-state protection, the financial
  handoff) are proven at the service layer with 8 dedicated E2E tests
  plus a live end-to-end browser run of the exact same journeys.
- Renewal flow: not implemented (`renewal_allowed` is a configuration flag
  on the scheme only; no renewal workflow consumes it yet).
- Reporting/aggregation dashboards (scheme-wise/programme-wise/beneficiary
  totals): not implemented — out of the proven-gap list for this pass.
