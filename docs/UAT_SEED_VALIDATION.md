# UAT Seed Validation Report

Run date: 2026-09-27 (initial pass), extended 2026-09-28 (blocker-closure pass). Scope: Web-only UAT seeding validation for the SkillonX Campus OS Final Web Portal & UAT Readiness certification.

## 0. Closure pass summary (2026-09-28)

The initial pass (§§1–11 below) certified the seed infrastructure but left two UAT blockers open: no QA login for the Applicant portal, and no dedicated IQAC_COORDINATOR login. This closure pass:

- Closed the Applicant gap **without new seed code** — `seedAdmissionsQa.ts` (already in `seed:uat`) already produces a rich applicant fixture (`QA/ADM/2026/006`, `PAYMENT_PENDING`, verified document, ₹25,000 finance demand); it simply wasn't documented as the designated QA login. Now documented and verified via real UI login.
- Closed the IQAC gap with a **new** `seed:iqac-qa` step (`apps/api/src/scripts/seedIqacQa.ts`), added as step 7/7 in `seedUat.ts`. Drives the IQAC module's own service-layer functions (`createFramework`, `createFrameworkVersion`, `activateFrameworkVersion`, `createCriterion`, `createMetric`, `setManualMetricValue`, `createCycle`, `advanceCycle`, `submitEvidence`, `createActionPlan`, `createAudit`, `addFinding`, `createComplianceItem`) rather than raw table inserts, so every FK/status-transition/uniqueness rule is enforced identically to the real UI.
- Added `GRIEVANCE_OFFICER`/`STUDENT_WELFARE_OFFICER` QA identities to `seedOfficeQa.ts` (Student Services workspace had no role-specific login).
- Found and fixed a **role-string defect**: `seedOfficeQa.ts` seeded the Training & Placement QA account with `faculty_users.role = 'TP_OFFICER'`, but the backend's placement access control (`apps/api/src/modules/placement/access.ts`) only recognizes `PLACEMENT_OFFICER`/`T&P_OFFICER`/`TPO` — every placement API call 403'd. Fixed to `PLACEMENT_OFFICER`.
- Found and fixed a **frontend routing defect**: `apps/web/src/auth/ProtectedRoute.tsx`'s generic admin-role catch-all block was missing `/finance` from its path-exception whitelist (every sibling embedded workspace was listed), so `COLLEGE_ADMIN`/`SUPER_ADMIN` were bounced from `/finance` back to `/admin` despite an earlier, more specific check in the same file explicitly allowing them onto `/finance`. Added the missing `financePath` check.
- Revalidated all 8 previously-uncertain Class-B workspaces (Maintenance, Training & Placement, Events, Student Services, Mentoring, Procurement, Finance, Alumni Admin/CRM) with real UI logins using each workspace's intended role — see `docs/WEB_PORTAL_UAT_READINESS_MATRIX.md`.
- Tested the route-guard security question directly: logged in as a plain FACULTY user and hit `/hr/admin`, `/management`, `/hod`, `/placements` by direct URL. In every case the backend API returned `403 Forbidden` and no privileged data rendered — **classified SAFE**, confirming the missing frontend route guards are a defense-in-depth gap only, not an exploitable UAT blocker.
- Reran the full clean-DB → migrate → `seed:uat` → `seed:uat` (again) cycle from scratch with all fixes applied (§§12–14 below) and reran the full backend regression suite (§15).

## 1. Database starting state

A dedicated, brand-new MySQL schema (`skillonx_survey_uat_clean`) was created inside the existing `skillonx-survey-mysql` docker container (port 3307) specifically for this validation, so results are not contaminated by the long-lived shared dev database (`skillonx_survey`).

## 2. Migration result

```
DATABASE_URL=mysql://survey:survey@127.0.0.1:3307/skillonx_survey_uat_clean npx knex --knexfile knexfile.cjs migrate:latest
→ Batch 1 run: 105 migrations
```

**PASS** — zero → latest applied cleanly in a single batch, no errors.

## 3. UAT seed command

```
cd apps/api && DATABASE_URL=...skillonx_survey_uat_clean npx tsx src/scripts/seedUat.ts
```

(the new `npm run seed:uat` orchestrator, added in this pass — see `docs/UAT_SEEDING_AND_PORTAL_CREDENTIALS.md` §E)

## 4. First seed run result

Ran end-to-end, 6/6 steps completed. One defect was found and fixed **during** this run (see §9) — after the fix, the full orchestrator completed with no errors and produced:

- 1 college (VVIET), 1 academic year, 2 departments, 1 program, 3 semesters
- 40 faculty_users rows (across seed:live-qa, office-qa, lab-management, maintenance)
- 7 students, 2 classes (1 active, 1 completed)
- 10 admission applicants across the full pipeline-status spectrum
- 3 labs, 5 lab assets, 2 stock items
- 13 maintenance tickets across every operational state
- 1 parent account (linked to student `4VV24CS001`), 1 alumni profile (linked to student `4VV24CS006`)

## 5. Second seed run result (idempotency)

Reran the identical `seed:uat` command against the same database with no schema changes in between.

**Result: PASS — fully idempotent.** Table counts before/after the second run were identical:

| Table | After run 1 | After run 2 |
|---|---|---|
| colleges | 1 | 1 |
| faculty_users | 40 | 40 |
| students | 7 | 7 |
| admission_applicants | 10 | 10 |
| labs | 3 | 3 |
| lab_assets | 5 | 5 |
| service_tickets (maintenance) | 13 | 13 |
| parent_users | 1 | 1 |
| alumni_profiles | 1 | 1 |
| academic_leadership_assignments (ACTIVE) | 2 | 2 |

The second run's console output contained only "Updated …" lines (password resets / field syncs), no "Created …" lines and no SQL errors — confirming every step's find-or-create logic correctly recognized existing rows.

## 6. Accounts created / reused

All accounts listed in `docs/UAT_SEEDING_AND_PORTAL_CREDENTIALS.md` §H were created fresh on the clean database in run 1, then reused (password reset only) on run 2 and on the separately-seeded long-lived dev database (`skillonx_survey`), confirming the same seed logic behaves correctly whether the target database is brand new or has years of accumulated QA/test data.

## 7. Tenant relationships

Single tenant (`VVIET`, code `VVIET`) carries every QA fixture for this pass. Departments CSE/ISE, one program (BE-CSE), semesters 2/3/7, one active class (`SX-E2E-CSE-3A`) and one completed class (`SX-E2E-CSE-2A`) anchor all downstream fixtures (students, labs, admissions, maintenance, parent/alumni links).

## 8. Fixture counts

See §4 above for the full breakdown. Deliberately minimal per-portal fixture counts (e.g. 10 applicants, 13 tickets, 5 lab assets) — sufficient for a meaningful golden-journey UAT walkthrough without large fake datasets, per the audit's own instruction to keep seed data minimal.

## 9. Duplicate checks — and one confirmed, fixed defect

Ran every rerun check described in §5 with zero duplicates found. However, the **first** clean-DB run surfaced a real, previously-hidden defect:

### Defect: `seedLabManagement.ts` wrote a `faculty_users.id` into an `employees.id` foreign key

**Symptom on the clean DB:** `seed:lab-management` (invoked internally by `seed:student-lms-e2e`) threw `Cannot add or update a child row: a foreign key constraint fails (academic_leadership_assignments, CONSTRAINT ..._employee_id_foreign)`. The exception was caught by a non-fatal `try/catch` in `seedStudentLmsE2e.ts`, so the failure was silent — but it aborted the rest of `seedLabManagement()` before it created any labs, assets, or stock, leaving the Lab Management portal's QA Lab Assistant account with **zero fixtures** to look at (`labs=0, lab_assets=0, lab_stock_items=0`).

**Root cause:** `apps/api/src/scripts/seedLabManagement.ts` called `ensureLeadership(collegeId, Number(hod.id), 'HOD', cseId)`, passing `faculty_users.id` where `academic_leadership_assignments.employee_id` requires an `employees.id`. On the long-lived shared dev database this bug was masked — an `employees` row happened to already exist at a numerically coincidental id, or the leadership rows created separately by `seedLiveQa.ts`'s own (correct) `ensureQaLeadershipUsers()` path had already run first in a prior session. On a genuinely clean database, no such coincidence exists and the FK insert fails outright.

**Fix applied:** Added an `ensureEmployeeForFacultyUser()` helper (mirroring the correct pattern already used in `apps/api/src/modules/academicLeadership/qaUsers.ts`) that finds-or-creates the `employees` row for a given `faculty_users` id before resolving its leadership assignment, and changed both `ensureLeadership` call sites in `seedLabManagement.ts` to use the resulting `employees.id`. File: `apps/api/src/scripts/seedLabManagement.ts`.

**Verification:** rerunning `seed:lab-management` standalone against the clean DB after the fix completed with no errors and produced 3 labs / 5 assets / 2 stock items as expected; `academic_leadership_assignments` correctly showed HOD (employee id 9) and PRINCIPAL (employee id 10) rows, matching the rows independently created by `seedLiveQa.ts`'s own leadership seeding.

### Defect #2 (self-introduced, fixed same pass): `seedParentAlumniQa.ts` idempotency gap

While adding the new Parent/Alumni seed script (created in this pass to close the seed gap described in §M of the credentials doc), the first run against the long-lived dev database failed with `ER_DUP_ENTRY` on `alumni_profiles.alumni_profile_college_email_unique` — the script's own "does this already exist" check only looked up by `student_id`, but the dev database already had a stale `alumni_profiles` row for the same QA email under a different `student_id` (left over from an earlier partial run against a different student set). Fixed by widening the existence check to match on `student_id` **or** `(college_id, email)`, and updating rather than re-inserting when either matches. Re-verified idempotent on both the clean DB and the dev DB afterward.

## 10. Login verification

Real browser UI logins (typed into the actual `/login`, `/lms/login`, `/parent/login`, `/alumni/login` forms — not API/storageState shortcuts) were performed for 17 accounts covering every primary role family: SUPER_ADMIN, COLLEGE_ADMIN, MANAGEMENT, HOD, PRINCIPAL, ACCOUNTANT, COE, STUDENT, PARENT, ALUMNI, OFFICE_ADMIN, WARDEN, LIBRARIAN, TRANSPORT_OFFICER, ADMISSIONS_OFFICER, HR_MANAGER, LAB_ASSISTANT. All 17 authenticated successfully and landed on the expected shell/route (see credentials doc §H for the per-role landing route, including the two documented HOD/MANAGEMENT landing-route discrepancies). Parent and Alumni logins were additionally confirmed to show live, correct data (attendance/fees/results for the linked child; verified status/events/opportunities for the alumni profile), not just an empty shell.

## 11. Known limitations (as of the initial 2026-09-27 pass — superseded by §16 below)

Carried from `docs/UAT_SEEDING_AND_PORTAL_CREDENTIALS.md` §M: no seeded login for `APPLICANT`, `EXAMINER` (no Web route), `IQAC_COORDINATOR` (dedicated account), `CANTEEN_MANAGER` (no Web portal), or a dedicated `SECURITY` portal account (Security Web Workspace itself remains deferred by design). Library portal has a seeded login but no book/circulation fixtures. Mobile QA and VTU-governance-specific Examination QA are out of scope for this pass (see credentials doc for detail).

## 12. Closure-pass clean-DB migration (2026-09-28)

A fresh `skillonx_survey_uat_clean` schema was recreated from scratch (dropped and re-created) to validate all closure-pass changes end to end, independent of the long-lived dev database.

```
DATABASE_URL=...skillonx_survey_uat_clean npx knex --knexfile knexfile.cjs migrate:latest
→ Batch 1 run: 105 migrations
```

**PASS** — same migration count as the initial pass, zero errors.

## 13. Closure-pass first seed run (7/7 steps)

```
DATABASE_URL=...skillonx_survey_uat_clean npx tsx src/scripts/seedUat.ts
```

All 7 steps (including the new `seed:iqac-qa`) completed with **zero errors** on the first attempt against the clean database — the two defects described in §9 and in §0 above were already fixed in the script source before this run, so the clean-DB run itself surfaced no new failures.

## 14. Closure-pass second seed run (idempotency)

Reran the identical command against the same (now-populated) database.

**Result: PASS — fully idempotent.** Exit code 0, zero "Created …" lines (only "Updated …"), zero SQL errors. Table counts identical before/after:

| Table | After run 1 | After run 2 |
|---|---|---|
| colleges | 1 | 1 |
| faculty_users | 43 | 43 |
| students | 7 | 7 |
| admission_applicants | 10 | 10 |
| labs | 3 | 3 |
| service_tickets (maintenance) | 13 | 13 |
| parent_users | 1 | 1 |
| alumni_profiles | 1 | 1 |
| iqac_frameworks (code=QA-NAAC) | 1 | 1 |
| iqac_cycles (name=QA IQAC Cycle 2026) | 1 | 1 |
| iqac_action_plans (QA seeded overdue finding) | 1 | 1 |
| iqac_audits (name=QA IQAC Audit 2026) | 1 | 1 |
| iqac_compliance_items (QA seeded compliance item) | 1 | 1 |
| student_fee_demands | 4 | 4 |

`faculty_users` grew from the initial pass's 40 to 43 (the 2 new Grievance/Welfare identities + 1 new IQAC Coordinator), exactly as expected — no unexplained growth.

The temporary clean-DB schema was dropped after validation completed.

## 15. Closure-pass backend regression

Because this pass changed production frontend source (`apps/web/src/auth/ProtectedRoute.tsx`) in addition to seed scripts, a full backend regression was mandatory (not just an affected-suite subset).

```
DATABASE_URL=...skillonx_survey NODE_ENV=test node --import tsx --test --test-concurrency=1 <all *.test.ts>
```

First full-suite run: **252 suites / 1,510 tests / 1,509 PASS / 1 FAIL / 0 CANCELLED / 0 SKIPPED**. The single failure was `hrAcademicContinuityClosure.e2e.test.ts` → "concurrent swap accept vs decline yields single final state" (`CLASS_CONFLICT: This class already has a makeup session at 09:00–09:55`). This test file has no relationship to anything changed in this pass (no HR/leave-coverage source or fixtures were touched). Reran the same file in isolation immediately after: **30/30 PASS**, including that exact test — confirming a pre-existing timing/fixture-collision flake under full-suite sequential execution, not a regression introduced by the `PLACEMENT_OFFICER` role fix, the `ProtectedRoute.tsx` `/finance` fix, or any of the new seed scripts. A second, immediate full-suite rerun confirmed clean: **252 suites / 1,510 tests / 1,510 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED** — exact match to the Master Frozen baseline. The single failure in the first run is conclusively a pre-existing timing flake, not a regression from this pass's changes.

Build gates rerun after all closure changes: API TypeScript build PASS, Web TypeScript build PASS, ESLint 0 errors (60 pre-existing warnings, unchanged), Web production build PASS.

## 16. Known limitations (current, supersedes §11)

- `EXAMINER` (no Web route — N/A), `CANTEEN_MANAGER` (no Web portal — N/A), and a dedicated `SECURITY` portal account (Security Web Workspace deferred by design — N/A) remain without a QA login, but none of these are UAT blockers since no corresponding Web surface requires one.
- Library portal has a seeded login but no book/circulation fixtures (legitimate empty state).
- Events, Mentoring, and Procurement workspaces have no fixture data seeded (legitimate empty state, confirmed functional via clean network requests — not a defect).
- `/hr/*`, `/hod/*`, `/principal/*`, `/management/*`, `/placements/*`, `/events/*` still lack frontend route-level guards (nav-hidden only) — tested and classified SAFE this closure pass (backend returns 403 on every privileged endpoint tested).
- Mobile QA and VTU-governance-specific Examination QA remain out of scope for this Web-only pass.
