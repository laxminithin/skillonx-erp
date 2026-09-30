# Student Services, Registrar Services & Academic Record Requests
## (Campus OS Phase 9) — Freeze Validation

Status: **FROZEN**. Date: 2026-09-25. Branch:
`feat/examination-coe-operational-backend`.

## Scope actually built

Per `docs/CAMPUS_OS_PHASE9_PREIMPLEMENTATION_AUDIT.md` (Architecture
Decision — Option B, minimal additive generalization of the existing
`studentServices` engine, user-confirmed scope: "Close the core registrar
gaps"), this pass adds:

1. **Transfer Certificate** (`TRANSFER_CERTIFICATE`, series `TC`) —
   config-driven request type: Finance/No-Due Clearance → HOD Approval →
   Principal Approval → Document Generation. Fee-gated (`TC_FEE`).
2. **Migration Certificate** (`MIGRATION_CERTIFICATE`, series `MC`) —
   Finance/No-Due Clearance → Principal Approval → Document Generation.
   Explicitly labelled institution-issued only; the description states the
   university-side migration process is external and not handled here
   (prompt §26 — no fabricated integration).
3. **Course Completion Certificate** (`COURSE_COMPLETION_CERTIFICATE`,
   series `CP`) — HOD Approval → Document Generation.
4. **Duplicate Certificate** (`DUPLICATE_CERTIFICATE`) — a new
   `certificates.ts:duplicateDocument` function distinct from the existing
   `reissueDocument` (which only applies to a REVOKED original): issues a
   separately-numbered copy of a still-**VALID** original, links it via a
   new `duplicate_of_id` column, and never mutates the original. Idempotent
   on retry (same unique `issue_key` convention as every other document
   path in this module).
5. **DOB correction** — added to `PROFILE_CORRECTION`'s field catalog and
   `profileCorrection.ts`'s `SAFE_FIELDS` map (`DOB → date_of_birth`, a new
   column). Applied only through the existing controlled correction flow —
   never a direct write.
6. **No-due auto-clearance gate** — the `FINANCE_CLEARANCE` workflow step
   (used by `NO_DUE_CERTIFICATE`, and now `TRANSFER_CERTIFICATE`/
   `MIGRATION_CERTIFICATE`) is validated against the existing cross-domain
   aggregator (`finance/clearance.ts:getFinancialClearance`, which already
   composed Finance+Library+Hostel+Transport) instead of trusting a manual
   sign-off. A pending due now hard-blocks the approval with a 409 naming
   the domains still owing; `SOURCE_ERROR`/`PENDING_INTEGRATION` domain
   statuses are never treated as cleared (the aggregator's own `cleared`
   boolean, which already encodes the institution's BLOCK/WARN/ALLOW
   policy, is the sole gate — nothing was reinterpreted).

Also fixed as a directly-caused prerequisite: `ensureCollegeServicesDefaults`
had a check-then-insert race on `student_service_request_types` (unique on
`college_id, code`) — surfaced by running the new catalog entries through
two test files in the same process. Fixed with a duplicate-key-safe
re-fetch (the same pattern already used elsewhere in this module and in
`research`/`documentEngine`), not a redesign.

Explicitly NOT built (per the audit's "already exists, authoritative
elsewhere" finding, and the user's chosen scope — deferred, not fabricated):
Alumni document requests, a dedicated `REGISTRAR` role (existing Office/
COE/College-Admin role structure already owns processing — prompt §7
explicitly warns against assuming one is needed), reusing `documentEngine`/
`workflowEngine` in place of `studentServices`'s own parallel tables (an
existing, working, pre-Phase-9 design choice, not something to refactor
opportunistically).

## Authoritative source-of-truth matrix (unchanged by this pass)

| Data | Authority |
|---|---|
| Student Identity | `students` table (Student Master) |
| Student Academic Record / Marks / Grades / Results | `examination` (`studentResults`, `studentAcademicRecord`) |
| Transcript / Marks Card content | `examination`, orchestrated (not recomputed) by `studentServices/certificates.ts` |
| Student Service Request | `studentServices/requestEngine.ts` |
| Service Configuration | `student_service_request_types` (per-college, seeded from `defaults.ts`) |
| Official Document (certificate/TC/migration/etc.) | `studentServices/certificates.ts` (`student_service_documents`) |
| No-Due / Clearance | `finance/clearance.ts:getFinancialClearance` (composing Finance/Library/Hostel/Transport) |
| Financial Demand / Payment / Refund | `finance` module |
| Grievance | `studentServices/grievances.ts` (Phase 8, frozen, untouched) |
| Document Storage (generic, unused by this module by design) | `documentEngine` |
| Approval Workflow (generic, unused by this module by design) | `workflowEngine` |
| Notifications | `academicClasses/studentNotifications.ts:notifyStudent` |
| Alumni Identity | `alumni` module (shares the underlying `students` row via `alumni_profile` overlay; no document-request path exists — deferred) |

## RBAC / IDOR / tenant isolation

No new roles. `staffActionOnRequest`'s existing `canActAsRole` convention
(admin bypass + relationship-scoped MENTOR/CLASS_COORDINATOR checks) is
unchanged and applies identically to the four new certificate types.
Tenant isolation is unchanged (`college_id` scoping on every query) —
**tested**: duplicating another college's document via
`certificates.duplicateDocument` returns 404, not a leak.

## Concurrency / idempotency

- `duplicateDocument` reuses the exact unique-`issue_key` + `ER_DUP_ENTRY`
  retry pattern already proven in `generateCertificateForRequest` — a
  second call against the same request returns the already-issued
  duplicate instead of minting a second one. **Tested.**
- `nextCertificateNumber`'s existing `get_lock`-based sequence generation
  (unchanged) covers the new `TC`/`MC`/`CP`/`DUP` series identically to
  the pre-existing series.
- `ensureCollegeServicesDefaults`'s newly-fixed duplicate-key race
  (concurrent first-time seeding of the same college) is now safe —
  **directly exercised** by running the new-type test alongside two other
  suites that also seed the same shared college in the same process.

## Failure recovery / missing-data semantics

- `getFinancialClearance`'s `cleared` boolean is the sole authority for
  the `FINANCE_CLEARANCE` gate — a `SOURCE_ERROR`/`PENDING_INTEGRATION`
  domain status is never silently treated as cleared, because the gate
  only reads the aggregator's own already-policy-aware `cleared` field,
  never a raw per-domain status.
- `duplicateDocument` explicitly rejects duplicating a REVOKED document
  (must use `reissueDocument` instead) — **tested**, preventing two
  different "copy" code paths from producing inconsistent document
  history for the same original.

## Evidence

- **Migration up→down→up**
  (`20261026100000_campus_os_phase9_student_registrar_services.cjs`):
  PASS. Two FK-backed columns (`students.date_of_birth`,
  `student_service_documents.duplicate_of_id`/`.duplicate_reason`) added
  and cleanly rolled back (including an explicit `dropForeign` before
  `dropColumn`, required for the FK-backed column on MySQL).
- **TypeScript** (`cd apps/api && npx tsc --noEmit`): PASS, exit 0.
- **Focused suite** (`studentRegistrarServices.e2e.test.ts`): **7/7
  PASS** — TC blocked-then-cleared, Migration Certificate content,
  Course Completion Certificate, Duplicate Certificate (issuance,
  idempotency, tenant isolation), Duplicate-of-revoked rejection, DOB
  correction.
- **Pre-existing studentServices regression**
  (`studentServices.e2e.test.ts`, `grievanceStudentWelfare.e2e.test.ts`,
  `lecturerPortal.e2e.test.ts` run together with the new suite): **80/80
  PASS**, 0 fail — confirms the `ensureCollegeServicesDefaults` race fix
  and the new catalog entries don't disturb the existing bonafide/
  grievance/leave/mentor flows.
- **Finance focused regression** (`finance.e2e.test.ts`,
  `examRemuneration.e2e.test.ts`, touched via `getFinancialClearance`
  reuse): **21/21 PASS** — Finance remains frozen, its own clearance
  logic untouched.
- **Web TypeScript** (`cd apps/web && npx tsc --noEmit`): PASS.
- **Web production build** (`npm run build`): PASS.
- **Live browser verification**: logged in as a seeded student, confirmed
  all four new certificate types render correctly in the `/lms/services`
  catalogue with the right labels/descriptions/processing times; opened
  the Transfer Certificate form, confirmed the exact configured fields
  render, submitted it, and confirmed the request landed in
  `UNDER_REVIEW` / "Awaiting Fee Payment" with the correct 4-step timeline
  (Finance/No-Due Clearance → HOD Approval → Principal Approval →
  Document Generation) and a real request number
  (`VVIET/REQ/2026/000962`); opened the Duplicate Certificate form and
  confirmed the `originalDocumentId` field is now populated dynamically
  from the student's own valid certificates (`/api/student/certificates`,
  200 OK) instead of the generic renderer's static empty-options select
  (a pre-existing limitation shared by `GRADE_CARD`/`TRANSCRIPT`'s
  `semesterId` field, left as-is — not this pass's job to fix
  opportunistically). Zero console errors from any `/api/student/*` call
  used by this pass.
- **Full backend regression**: see
  `docs/CAMPUS_OS_PHASE9_FREEZE_VALIDATION.md`.

## Known limitations (non-blockers, matching prompt §100)

- Alumni document-request path: `NOT_CONFIGURED` — alumni share the
  underlying student record but have no route into this module.
- A dedicated `REGISTRAR` role: not created — existing role structure
  covers processing (confirmed sufficient by audit, not assumed).
- Digital signature: unchanged from the pre-existing state
  (`signatory_config` remains a text/label field, no cryptographic
  signing) — `NOT_CONFIGURED`, not fabricated.
- The generic web form renderer's static-`options` select for a
  server-computed field (`semesterId` on GRADE_CARD/TRANSCRIPT) was not
  retrofitted; only the one new field that had no usable static list
  (`originalDocumentId`) was given a targeted dynamic-population fix.

## Commit / Push / PR

Commit: NO. Push: NO. PR: NO.
