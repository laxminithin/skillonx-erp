# Admissions — Phase 5 Freeze Validation (Parent Provisioning Extension)

Scope: this document validates the single, explicitly-approved Phase 5 addition to
the existing, already-frozen Admissions module — **parent account provisioning at
admission conversion**. It does not re-validate the Admissions core (enquiry,
application, documents, eligibility, selection, offer, Finance handoff, Student
conversion), which remains governed by `docs/ADMISSIONS_MANAGEMENT_FREEZE_VALIDATION.md`
and was not reopened, modified, or re-tested beyond confirming zero regressions.

## What was added

1. **`guardianSchema`** (`apps/api/src/modules/admissions/service.ts`) — replaces the
   previously free-form, unvalidated `guardian: z.record(z.unknown())` field on
   `applicantSchema` with a real structured shape: `name`, `email`, `phone`,
   `relationship`, all optional/nullable, `.strict()`.
2. **`provisionGuardianAccount()`** — a best-effort, transactional, idempotent step
   run after `confirmAdmission`'s main transaction commits. If the applicant's
   `guardian_json` has both a `name` and `email`, it creates or reuses a
   `parent_users` row (dedup by globally-unique `email`) and creates/reactivates a
   `parent_student_links` row (`verification_state='VERIFIED'`, `is_active=true`)
   linking that parent to the newly converted student.
3. **`activateResetForParent()`** — mirrors the existing `activateResetForStudent`
   convention (hashed token, 7-day expiry) rather than `parent/service.ts`'s own
   weaker `forgotParentPassword` convention (unhashed token, 1-hour expiry) — a
   deliberate, documented choice for a stronger initial-activation flow.
4. **`updateApplicantGuardian()`** + **`PATCH /api/admissions/applications/:id/guardian`**
   — the only way guardian data can actually be captured today, since no existing
   Admissions UI wrote to `guardian_json` before this change. Gated by the existing
   `admissions.application.manage` permission and existing tenant-scoping
   (`assertApplicantVisible`).
5. **Web UI**: a small "Guardian / Parent" panel added to
   `AdmissionsApplicationReviewPage` (`apps/web/src/pages/admissions/AdmissionsPages.tsx`)
   with four controlled inputs and a Save button against the new endpoint.

## Design decisions and their rationale

- **Best-effort, non-blocking**: `provisionGuardianAccount` runs in its own
  `try/catch` after the main conversion transaction, so a bug or transient failure
  here can never roll back or block student conversion. A failure is recorded as an
  audit entry (`APPLICANT_GUARDIAN_PROVISION_FAILED`) rather than surfaced as an
  error to the caller — the Student record is the priority; guardian linkage is
  best-effort and recoverable (retry is safe, see below).
- **Idempotent on retry**: `confirmAdmission` already short-circuits to the existing
  conversion when called again for an already-converted applicant; the guardian step
  runs on that path too and is naturally idempotent — parent lookup-by-email plus an
  `onConflict(...).merge(...)` on `parent_student_links`' existing unique key
  (`college_id, parent_user_id, student_id`) mean a retry reuses the same parent and
  the same link row rather than duplicating either.
- **Concurrency-safe parent creation**: two concurrent conversions sharing a guardian
  email race on `parent_users`' global unique `email` index; the loser's insert throws
  a duplicate-key error, which is caught and treated as "the winner already created it"
  — the loser re-selects and reuses that row. Tested directly (see below).
- **Cross-college conflict, not silent merge**: `parent_users.email` is a *global*
  unique constraint (not scoped per college — an existing architectural fact, not
  introduced here). If a guardian email already belongs to a parent at a *different*
  college, this code does not attempt to reassign or merge that account — it logs an
  `APPLICANT_GUARDIAN_LINK_CONFLICT` audit entry and skips linkage, leaving the
  ambiguous case for human review rather than guessing. Student conversion still
  succeeds.
- **No parent account is created without both a name and an email** — a bare phone
  number or partial guardian blob is not enough to safely create a login-capable
  account (email is the only unique identity anchor available), so provisioning is
  skipped silently (`SKIPPED_NO_DATA`) in that case; conversion is unaffected.

## Tests (new file: `apps/api/src/modules/admissions/guardianProvisioning.e2e.test.ts`)

All 9 tests pass, independently re-run and confirmed:

1. Complete guardian data → verified parent account + verified, active link created.
2. Idempotent retry of `confirmAdmission` on an already-converted applicant → no
   duplicate parent or link rows.
3. Second applicant, same college, same guardian email → reuses the existing parent
   row, creates a second link for the second child (no duplicate parent).
4. Guardian email already belongs to a parent at a different college → no new parent,
   no link, conversion still succeeds, conflict is audit-logged.
5. No usable guardian data → conversion succeeds, zero parent-account side effects.
6. Concurrent `confirmAdmission` for two applicants sharing a guardian email → exactly
   one `parent_users` row exists afterward (race-condition test, real DB transactions).
7. `PATCH .../guardian` succeeds for `ADMISSIONS_MANAGER`.
8. `PATCH .../guardian` is denied for an unrelated role (`FACULTY`).
9. `PATCH .../guardian` enforces tenant isolation (cross-college applicant id is not
   accessible).

Existing `admissions.closure.e2e.test.ts` (79 tests, the full pre-existing frozen
Admissions regression suite) re-run alongside the new file: **88/88 pass**, confirming
this change did not disturb the existing frozen behavior.

## A pre-existing issue discovered, not introduced, not fixed

During concurrency test design, a **latent, pre-existing race condition** was found in
`nextAdmissionNumber` (used by `confirmAdmission`, unrelated to this change): it derives
the next admission number via a plain `count()+1` without row-level locking, so two
genuinely concurrent conversions at the same college could in principle collide on the
`students` table's `(college_id, admission_number)` unique constraint. This is a gap in
the already-frozen Admissions core, out of scope for this approved change (frozen
module, no authorization to modify its numbering logic), and is reported here rather
than silently patched. The new concurrency test (#6 above) was written to assert the
actual invariant this feature owns — exactly one parent row for a shared email — rather
than assuming both concurrent conversions must succeed, since that already-existing
numbering race is orthogonal to guardian provisioning correctness.

## Regression

- Admissions-focused: 88/88 PASS (79 pre-existing + 9 new).
- Full backend suite (independently reviewed against the agent's own run): **247
  suites / 1,450 tests / 1,450 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED** — exactly the
  Phase 5 starting baseline (246 suites / 1,441 tests) plus the 9 new tests (+1 suite).
- TypeScript: `apps/api` `tsc --noEmit` clean; `apps/web` `typecheck` clean; `apps/web`
  production build succeeded.

## Known limitation (explicit, not a defect)

Public applicant self-service submission (an unauthenticated online application-start
flow) remains unbuilt, as explicitly deferred by user scope selection — every
enquiry/applicant entry point still requires a staff actor. This was documented as an
open, non-blocking item in the pre-implementation audit and was not attempted here.
