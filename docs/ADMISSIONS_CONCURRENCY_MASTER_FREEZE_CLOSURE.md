# Admissions Concurrency — Master Freeze Blocker A1 Closure

Date: 2026-09-26. Branch: `feat/examination-coe-operational-backend`.
Scope: **bug fix / correctness closure of Phase 13's sole Class-A finding
only.** Not Admissions Phase 2, not a redesign, not a refactor.

## 1. Authorization

`docs/CAMPUS_OS_PHASE13_FINAL_GAP_AUDIT.md` §2 identified exactly one
Class A Master Freeze blocker: a concurrency race in Admissions'
admission-number allocation. This document records the authorized,
minimal closure of that single defect.

## 2. Original defect

`apps/api/src/modules/admissions/service.ts`, `nextAdmissionNumber(trx,
collegeId)` (originally ~L207-217) allocates the next admission number by
`COUNT(*)` over `admission_student_conversions` filtered by
`college_id` and `admission_number LIKE '<COLLEGE_CODE>/ADN/<year>/%'`,
then returns `<COLLEGE_CODE>/ADN/<year>/<count+1, zero-padded>`. This is a
read-then-write sequence generation, not a DB sequence and not
`SELECT ... FOR UPDATE` on a shared counter row.

`confirmAdmission` (originally ~L892-1024) calls this inside a
`db.transaction`, taking `.forUpdate()` only on the specific **applicant
row being confirmed** (~L897) — a lock that serializes two calls
confirming the *same* applicant, but does nothing to protect the *shared*
admission-number sequence when two *different* applicants in the same
college/year are confirmed concurrently.

## 3. Root cause

Two concurrent `confirmAdmission` calls for two distinct applicants (same
college, same year) can both execute the `COUNT(*)` in
`nextAdmissionNumber` before either has committed its `INSERT INTO
students`. Both then compute the identical next number. The first to
commit succeeds; the second's `INSERT` hits a unique-constraint violation
and previously propagated as a raw, unhandled SQL error all the way to the
caller — a request-reliability defect (not a data-corruption defect,
since the constraint always prevented persistence of a true duplicate).

## 4. Schema protection (verified directly, not assumed)

Confirmed in `apps/api/migrations/20260926100000_admissions_management.cjs`:

- `students`: `CREATE UNIQUE INDEX students_college_admission_number_unique
  ON students (college_id, admission_number)` (line 16).
- `admission_student_conversions`: `t.unique(['college_id',
  'admission_number'], { indexName: 'adm_conv_college_admno_unique' })`
  (line 296).

Both are college-scoped (composite on `college_id` + `admission_number`),
not global — confirmed no cross-college coupling is introduced or was
ever present.

## 5. Fix — minimal, bounded retry

`apps/api/src/modules/admissions/service.ts`:

- Added `MAX_ADMISSION_NUMBER_ATTEMPTS = 5` and a precise
  `isAdmissionNumberConflict(err)` matcher: `true` only when the driver
  reports `ER_DUP_ENTRY`/`1062` **and** the SQL message contains one of
  the two known index names above (`students_college_admission_number_unique`
  or `adm_conv_college_admno_unique`). Any other error — foreign-key
  failure, validation failure, tenant failure, the pre-existing duplicate-
  *email* guard, Finance failure, programming error — is rethrown
  unchanged and is never retried.
- `confirmAdmission`'s body (the entire `db.transaction(...)` call,
  including applicant lock, idempotency check, number allocation, student
  insert, conversion insert, Finance-demand rehoming, and activation-token
  issuance) was extracted unchanged into an inner
  `runConfirmAdmissionTransaction()` function, called inside a `for` loop
  bounded at `MAX_ADMISSION_NUMBER_ATTEMPTS` attempts. On a matched
  conflict, the loop retries the **entire transaction** from scratch
  (fresh applicant lock, fresh idempotency check, fresh number
  computation) rather than patching around the single failing statement —
  this is safe because the duplicate-key error is the very first write in
  the transaction body (nothing else has been written yet when it fires),
  so a full-transaction retry has no partial state to clean up.
- If every attempt genuinely conflicts, a controlled `AppError(409, ...,
  'ADMISSION_NUMBER_CONTENDED')` is thrown instead of the raw SQL
  exception.
- No new table, no new migration, no distributed lock, no queue, no
  numbering-format change. Existing admission numbers are untouched; no
  renumbering or backfill was performed.

## 6. Retry-scope precision (§7 of the closure brief)

Verified by an added regression test (`admissions.closure.e2e.test.ts`,
"5. an unrelated conflict...") that the pre-existing duplicate-*email*
guard (`POTENTIAL_DUPLICATE_STUDENT`, unrelated `students.email` logic)
still surfaces immediately and is not masked or retried by the new loop.

## 7. Evidence — pre-fix reproduction, then post-fix verification

Per the closure brief's explicit instruction not to fabricate a
reproduction, the fix was verified against a real, deliberately temporary
before/after comparison using the actual MySQL test database (not a
simulation):

1. Added the new concurrency test (below) with the retry loop **in
   place**.
2. Temporarily reverted only the retry wrapper (via direct edit, not
   `git stash`, to avoid touching unrelated pre-existing uncommitted work
   already in this file — see §9) back to the original direct
   `db.transaction(...)` call.
3. Ran the new test **3 times** against the reverted code:
   **all 3 runs failed**, each with `ER_DUP_ENTRY` on
   `students.students_college_admission_number_unique`, e.g.:
   `Duplicate entry '4-VVIET/ADN/2026/00723' for key
   'students.students_college_admission_number_unique'`. This is a
   genuine, reliably reproduced race — not a one-off flake.
4. Restored the fix exactly as designed.
5. Re-ran the same test: **PASS**, consistently.

## 8. Test evidence

Two tests added to the existing (already-frozen) suite file
`apps/api/src/modules/admissions/admissions.closure.e2e.test.ts`, inside
the pre-existing "Admissions closure concurrency E2E" describe block
(which already had 3 tests — same-applicant double-confirm, one-seat-race,
and Finance-demand race — but, as the Phase 13 audit found, none of them
actually proved two *distinct*, *both-legitimate* confirmations succeed
concurrently):

- **Test 4 — "two distinct applicants confirmed concurrently BOTH succeed
  with distinct admission numbers (A1 closure)"**: two applicants, each
  with their own 500-seat intake (so seat-capacity contention, already
  covered by test 2, cannot confound this test), same college, confirmed
  via `Promise.allSettled` truly concurrently. Asserts: both fulfilled;
  exactly one conversion row per applicant; the two admission numbers are
  different; both match the unchanged `<CODE>/ADN/<year>/<00000>` format;
  two distinct `students` rows exist with two distinct `admission_number`
  values.
- **Test 5 — "an unrelated conflict (duplicate email) is NOT retried or
  swallowed by the admission-number retry loop"**: mirrors the existing
  "34. duplicate Student prevention" test's own collision setup (a
  `students` row inserted directly with a colliding email, bypassing the
  applicant-level email-uniqueness index) and asserts `confirmAdmission`
  still rejects immediately with `/canonical student already exists/`.

Mapped against the closure brief's required test list (§20):

| Required test | Covered by |
|---|---|
| TEST A — two different applications, both succeed, different numbers | New test 4 |
| TEST B — same application confirmed concurrently → one canonical Student | Existing test "1. same Applicant converted concurrently" (unchanged, still passes) |
| TEST C — sequential idempotent confirmation → existing Student returned | Existing "33. conversion idempotency" (unchanged, still passes) |
| TEST D — admission-number unique-conflict retry succeeds | New test 4 (the underlying mechanism proven by §7's before/after) |
| TEST E — non-admission-number DB error not swallowed | New test 5 |
| TEST F — Finance demand remains singular | Existing "3. same Finance demand created concurrently" (unchanged, still passes) |
| TEST G — Parent linkage remains singular/idempotent | Out of scope for A1 (Parent provisioning is separate, untracked, pre-existing work — see §9); its own dedicated test, `guardianProvisioning.e2e.test.ts` "6. concurrent confirmAdmission for two applicants sharing a guardian email creates exactly one parent row", passed in the full serialized regression run (§11) |
| TEST H — tenant isolation remains intact | Existing "47. cross-college isolation" (unchanged, still passes); A1's fix does not alter college-scoping |

## 9. Frozen-module and dirty-tree boundary

`git status` at the start of this session already showed
`apps/api/src/modules/admissions/service.ts` and a new, untracked
`apps/api/src/modules/admissions/guardianProvisioning.e2e.test.ts` as
pre-existing, uncommitted work from an earlier session (Parent
provisioning after admission conversion — `provisionGuardianAccount`,
`updateApplicantGuardian`, `activateResetForParent`, `guardianSchema`).
**This closure did not create, modify, or depend on that code** — it was
already present when this turn began and was left exactly as found.
Confirmed by isolating the diff to only the retry-loop insertion (verified
by direct comparison of Edit-tool calls, not by `git diff`, since `git
diff` against the last commit necessarily also shows that pre-existing
uncommitted work as part of the same file's diff).

While running the full pre-existing `guardianProvisioning.e2e.test.ts`
file in isolation alongside the admissions closure suite (i.e., not via
the project's own `npm test`, which serializes with
`--test-concurrency=1`), its test 6 failed on a *different* unique
constraint (`admission_applicants.adm_app_college_appno_unique`,
application-**number** generation — a different function than the one
closed here) in 1 of that ad hoc run's attempts. This did not recur in
the canonical full regression run (§11), which uses the project's own
`--test-concurrency=1` invocation and passed cleanly. This is flagged as
an **observation for a possible future, separately-authorized closure of
an analogous race in application-number generation** — it is not part of
A1, was not touched, and does not affect this closure's verdict.

## 10. Focused Admissions regression

`npx tsx --test src/modules/admissions/admissions.closure.e2e.test.ts
src/modules/admissions/guardianProvisioning.e2e.test.ts`:

**89/90 PASS** (the 1 failure is the pre-existing, out-of-scope,
non-reproducing-under-canonical-invocation observation in §9). Both new
tests (4 and 5) passed, along with all 88 other Admissions tests
(closure, RBAC isolation, notifications) — no regression in any existing
Admissions behavior.

## 11. Full backend regression

Required because source changed. `npm test` (the project's own
`--test-concurrency=1` invocation) from `apps/api`:

**252 suites / 1,510 tests / 1,510 PASS / 0 FAIL / 0 CANCELLED /
0 SKIPPED**, normal exit (~49 minutes).

**Delta from the 252/1,508 baseline: +2 tests, +0 suites** — exactly the
two new tests added to the existing `admissions.closure.e2e.test.ts` file.
No existing test disappeared, failed, or was skipped. The
`guardianProvisioning.e2e.test.ts` test flagged in §9 passed cleanly in
this canonical run.

## 12. TypeScript / build

`npx tsc --noEmit -p .` (apps/api): **PASS**, 0 errors — checked after the
fix, after the temporary pre-fix revert, and again after restoring the
fix.

Web source changes: **NONE.**

## 13. Performance

Not separately profiled. The fix adds no unbounded retry (hard cap of 5
attempts), no new locking beyond the pre-existing `forUpdate()` on the
applicant row, no global serialization, and no additional scans — each
retry attempt re-runs exactly the same bounded queries the original code
already ran once. **Performance: NOT SEPARATELY PROFILED**, consistent
with the closure brief's instruction not to fabricate p50/p95 figures.

## 14. Final verdict

**ADMISSIONS CONCURRENCY MASTER FREEZE BLOCKER — CLOSED**

- Defect: concurrent admission-number allocation race (read-then-write
  `COUNT(*)`, no retry, no sequence).
- Root cause: `nextAdmissionNumber`'s uncoordinated read races across
  concurrent `confirmAdmission` transactions for different applicants.
- Schema protection: `students_college_admission_number_unique` and
  `adm_conv_college_admno_unique`, both college-scoped composite unique
  indexes — confirmed, unchanged.
- Fix: bounded (5-attempt) whole-transaction retry, matched precisely to
  those two index violations only.
- Retry scope: precise — matched by driver error code + index name.
- Retry bound: 5 attempts, then a controlled `AppError(409,
  'ADMISSION_NUMBER_CONTENDED')`.
- Concurrent distinct confirmations: **PASS** (new test 4; pre-fix
  reproduced 3/3, post-fix passes consistently).
- Concurrent same-application confirmation: **PASS** (existing test 1,
  unchanged).
- Admission-number uniqueness: **PASS**.
- Student conversion idempotency: **PASS** (existing test 33, unchanged).
- Finance integration: **PASS** (existing test 3 + "39. Finance
  carry-forward", unchanged).
- Parent provisioning: **PASS** (out-of-scope module's own test, passed
  in canonical run — §9).
- Tenant isolation: **PASS** (existing test 47, unchanged; fix does not
  alter college-scoping).
- Focused Admissions: **89/90 PASS** (1 pre-existing, out-of-scope,
  non-reproducing-under-canonical-invocation observation — §9).
- Affected regressions: Student — covered by Admissions closure suite
  (conversion/idempotency tests, unchanged); Parent — covered by
  `guardianProvisioning.e2e.test.ts`, PASS in canonical run; Finance —
  covered by tests 3/25/39, unchanged, PASS.
- Full backend: **252 suites / 1,510 tests / 1,510 PASS / 0 FAIL /
  0 CANCELLED / 0 SKIPPED — normal exit.**
- Delta from baseline: +2 tests, +0 suites — exactly the two new
  concurrency-closure tests; nothing else changed.
- TypeScript/API build: **PASS**.
- Web source changes: **NONE.**
- Performance: **NOT SEPARATELY PROFILED** (no unbounded retry/locking/
  scan introduced).

Documentation:
- `docs/ADMISSIONS_CONCURRENCY_MASTER_FREEZE_CLOSURE.md` (this document)
- `docs/CAMPUS_OS_PHASE13_FINAL_GAP_AUDIT.md` (A1 reclassified CLOSED)
- `docs/SKILLONX_CAMPUS_OS_FINAL_COVERAGE_MATRIX.md` (Admissions row
  updated)

Frozen modules changed: **Admissions only** — approved correctness fix,
scoped to `nextAdmissionNumber`/`confirmAdmission`. No other frozen module
was touched. Finance: NO. Student: NO (only consumed via the existing,
unchanged insert path). Parent: NO. Examination: NO. HR: NO.

Other Phase 13 findings: **UNCHANGED / NOT AUTHORIZED.** Nothing else from
the Phase 13 gap audit was touched.

Git footprint: `apps/api/src/modules/admissions/service.ts` (modified,
+29/-1 lines net for the retry wrapper itself — the larger diff stat
against HEAD also includes pre-existing, unrelated uncommitted Parent-
provisioning work that predates this session, see §9);
`apps/api/src/modules/admissions/admissions.closure.e2e.test.ts` (modified,
+71 lines, two new tests); this document (new). Pre-existing dirty-tree
state: PRESERVED.

Commit: NO. Push: NO. PR: NO.

**FINAL VERDICT: PHASE 13 CLASS-A BLOCKER A1 — CLOSED**

**PHASE 13 FINAL GAP AUDIT MAY NOW BE RECLASSIFIED: FROZEN**

**MASTER FREEZE AUTHORIZED: NO**

STOP.
