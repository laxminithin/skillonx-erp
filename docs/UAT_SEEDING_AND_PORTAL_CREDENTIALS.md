# UAT Seeding & Portal Credentials

Status: AUTHORITATIVE — supersedes `docs/LIVE_QA_SEED.md` for local/staging UAT bootstrap purposes. `LIVE_QA_SEED.md` remains valid for the narrower `survey.skillonx.net` staging-only bootstrap it documents; this file is the full Web-portal UAT credential matrix.

## A. Purpose

Gives a new environment (a freshly provisioned server, a clean CI database, or a reset local dev DB) one documented path to a database that can log into every authenticated Web portal in SkillonX Campus OS, using deterministic, non-production QA identities.

## B. Environment assumptions

- MySQL 8.4 reachable at `DATABASE_URL` (local dev default: `mysql://survey:survey@127.0.0.1:3307/skillonx_survey`, via the `skillonx-survey-mysql` docker-compose service).
- Root `.env` present with `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV` (see `apps/api/knexfile.cjs`).
- `NODE_ENV` is not `production`, **or** `ALLOW_TEST_SEED=true` is set — the seed scripts refuse to run otherwise.
- Node + the repo's npm workspaces installed (`npm install` at repo root).

## C. Database preparation

```bash
npm run db:up          # starts skillonx-survey-mysql if not already running
```

For a genuinely clean UAT database, create a fresh schema rather than reusing the long-lived dev database, then point `DATABASE_URL` at it for the commands below.

## D. Migration command

```bash
npm run migrate        # knex migrate:latest — 105 migrations as of this pass
```

Verified in this pass: 105/105 migrations apply cleanly, batch 1, on a brand-new schema.

## E. UAT seed command (authoritative)

```bash
cd apps/api && npm run seed:uat
```

This is the single orchestrator added in the first pass and extended in this closure pass (`apps/api/src/scripts/seedUat.ts`, `npm run seed:uat`). It runs, in order, the seven web-relevant QA seeders that previously had to be invoked by hand:

1. `seed:live-qa` — VVIET college, faculty/college-admin/super-admin/management logins, the full Student-LMS-E2E fixture graph, and HOD/Principal/Accountant/COE leadership accounts.
2. `seed:office-qa` — 20 office-portal role identities (Office Admin, HOD, Principal, Management, Accountant, COE, Admissions, Lab, Maintenance, Librarian, Warden, Transport, Placement Officer, HR, Super Admin, **Grievance Officer, Student Welfare Officer** variants scoped for office-workflow testing — the last two, and the `PLACEMENT_OFFICER` role-string fix, were added in this closure pass).
3. `seed:admissions-qa` — an admissions cycle, intake, and 10 applicants spanning every pipeline status (this is also the source of the Applicant-portal QA login — see row H).
4. `seed:lab-management` — labs, assets, stock, issues, faults, repairs, and the HOD/Principal leadership overlay for oversight testing.
5. `seed:maintenance` — 13 maintenance/IT-helpdesk tickets across every operational state.
6. `seed:parent-alumni-qa` (`apps/api/src/scripts/seedParentAlumniQa.ts`) — a Parent login linked to an active student, and an Alumni login with a `VERIFIED` profile. Neither the Parent nor Alumni Web portal had any QA seed before the first pass despite both being live, dedicated portals (`/parent`, `/alumni`).
7. `seed:iqac-qa` — **new in this closure pass** (`apps/api/src/scripts/seedIqacQa.ts`) — an IQAC_COORDINATOR login plus a full framework/version/criterion/metric/cycle/evidence/action-plan/audit/finding/compliance-item fixture set, driven through the module's own service-layer functions (not raw inserts) so every status-transition and uniqueness rule is enforced exactly as the real UI would trigger it. Closes the IQAC Coordinator UAT blocker.

**Not included** (by design — see Known Limitations): `seed:e2e-mobile-users` (mobile-only, requires `MOBILE_E2E_*_PASSWORD` secrets not needed for Web UAT) and `npm run seed` (knex `seed:run` — a destructive snapshot wipe-and-restore, incompatible with the additive QA seeders above; never run it after `seed:uat`).

Individual steps remain runnable standalone (`npm run seed:live-qa`, `npm run seed:office-qa`, etc.) for targeted re-seeding.

## F. Rerun / idempotency behavior

`seed:uat` is safe to rerun at any time. Every step upserts by natural key (email, USN, code, ticket title, framework/cycle/audit name, etc.) rather than blind-inserting. Verified across two passes by running it twice against a from-scratch database each time: zero duplicate colleges, faculty, students, applicants, labs, tickets, parent, alumni, IQAC framework/cycle/action-plan/audit/compliance-item, or fee-demand rows on the second run (see `docs/UAT_SEED_VALIDATION.md`).

## G. Seeded tenant(s)

| Tenant | Code | Used for |
|---|---|---|
| Vidyavardhaka College of Engineering | `VVIET` | The single QA tenant for all Web-portal UAT in this pass. |
| QA Academic Leadership E2E College | `QA-AL-E2E` | Created only as a fallback by `ensureQaLeadershipUsers` if VVIET already has a conflicting active HOD/Principal; not used in a fresh seed. |

No separate `VTU_AFFILIATED` vs `AUTONOMOUS` tenant type exists in the schema — examination governance type (`college_examination_governance.governance_type`) defaults to `AUTONOMOUS` for every college and is not varied by these QA seeders. Institution-type-specific Examination testing (VTU-style governance) uses the separately maintained QA-VTU tenant referenced in `test(examination): authenticated VTU V1/duplicate/V2 lifecycle on QA-VTU tenant` (commit `996bb2aa`) — that tenant is backend/API-test scope, not part of this Web UAT seed.

## H. Portal / role / account matrix

All staff-family passwords are `Password123` unless noted. Student password is read from `MOBILE_E2E_STUDENT_PASSWORD` (defaults to `Student@123` if `seed:live-qa` sets it). Office-QA identities share `OfficeQA@123`.

| Portal (route) | Role | Login | Password | Landing route on real login | Seed source | Status |
|---|---|---|---|---|---|---|
| Platform Governance `/platform` | SUPER_ADMIN | `admin@skillonx.com` | `Password123` | `/platform` | seed:live-qa | Verified (real UI login) |
| Admin `/admin` | COLLEGE_ADMIN | `collegeadmin@vviet.edu.in` | `Password123` | `/admin` | seed:live-qa | Verified (real UI login) |
| Faculty / default `/dashboard` | FACULTY | `anita@vviet.edu.in` | `Password123` | `/dashboard` | seed:live-qa | Verified in Gate 4 |
| Faculty (substitute) `/dashboard` | FACULTY | `ravi@vviet.edu.in` | `Password123` | `/dashboard` | seed:live-qa | Verified in Gate 4 |
| Management workspace `/management` (nav, not landing) | MANAGEMENT | `qa.management@vviet.edu.in` | `Password123` | `/dashboard`, then nav to `/management` | seed:live-qa | Verified (real UI login) — **doc gap fixed**: MANAGEMENT is not in `landingPathForUser`; lands at `/dashboard`, reaches `/management` via sidebar nav (`isManagement` flag) |
| HOD workspace `/hod` (nav, not landing) | FACULTY + HOD leadership overlay | `qa.hod.cse@vviet.edu.in` | `Password123` | `/dashboard`, then nav to `/hod` | seed:live-qa (leadership assignment), seed:lab-management, seed:maintenance | Verified (real UI login + `/hod` content confirmed live) |
| Principal workspace `/principal` (nav, not landing) | FACULTY + PRINCIPAL leadership overlay | `qa.principal@vviet.edu.in` | `Password123` | `/dashboard`, then nav to `/principal` | seed:live-qa | Verified (real UI login) |
| Accountant `/accountant` | ACCOUNTANT | `qa.accountant@vviet.edu.in` | `Password123` | `/accountant` | seed:live-qa (qaUsers) | Verified (real UI login) |
| COE `/coe` | COE | `qa.coe@vviet.edu.in` | `Password123` | `/coe` | seed:live-qa (qaUsers) | Verified (real UI login) |
| Lab Management `/lab` | LAB_ASSISTANT | `qa.labassistant@vviet.edu.in` | `Password123` | `/lab` | seed:lab-management | Verified (real UI login) — **defect fixed this pass** (see UAT_SEED_VALIDATION.md) |
| Lab Management (ISE) `/lab` | LAB_ASSISTANT | `qa.labassistant.ise@vviet.edu.in` | `Password123` | `/lab` | seed:lab-management | Seeded, not separately UI-tested |
| Maintenance (manager) `/maintenance/manager` | MAINTENANCE_MANAGER | `qa.maint.manager@vviet.edu.in` | `Password123` | `/maintenance/manager` | seed:maintenance | Seeded; landing route not yet UI-verified this pass |
| Maintenance (staff) `/maintenance/work` | MAINTENANCE_STAFF | `qa.maint.electrician@vviet.edu.in`, `qa.maint.plumber@vviet.edu.in` | `Password123` | `/maintenance/work` | seed:maintenance | Seeded |
| IT Support `/maintenance/work` | IT_SUPPORT | `qa.itsupport@vviet.edu.in` | `Password123` | `/maintenance/work` | seed:maintenance | Seeded |
| Office Administration `/office` | OFFICE_ADMIN | `office.admin.qa@vviet.edu.in` | `OfficeQA@123` | `/office` | seed:office-qa | Verified (real UI login) |
| Office (superintendent) `/office` | OFFICE_SUPERINTENDENT | `office.superintendent.qa@vviet.edu.in` | `OfficeQA@123` | `/office` | seed:office-qa | Seeded |
| Admissions `/admissions` | ADMISSIONS_OFFICER | `qa.admissions.office@vviet.edu.in` (office-qa) / `qa.admissions.officer@example.edu` (admissions-qa) | `OfficeQA@123` / `Password123` | `/admissions` | seed:office-qa, seed:admissions-qa | Verified (real UI login) |
| Admissions (manager) `/admissions` | ADMISSIONS_MANAGER | `qa.admissions.manager@example.edu` | `Password123` | `/admissions` | seed:admissions-qa | Seeded |
| Hostel / Warden `/hostel` | WARDEN | `qa.warden.office@vviet.edu.in` (office-qa) / `qa.warden@vviet.edu.in` (student-lms-e2e) | `OfficeQA@123` / `Password123` | `/hostel` | seed:office-qa, seed:student-lms-e2e | Verified (real UI login) |
| Library `/library` | LIBRARIAN | `qa.librarian.office@vviet.edu.in` | `OfficeQA@123` | `/library` | seed:office-qa | Verified (real UI login). No library book/circulation fixtures seeded (see Known Limitations). |
| Transport `/transport` | TRANSPORT_OFFICER | `qa.transport.office@vviet.edu.in` | `OfficeQA@123` | `/transport` | seed:office-qa | Verified (real UI login) |
| HR Portal `/hr/admin` | HR_MANAGER | `qa.hr.office@vviet.edu.in` | `OfficeQA@123` | `/hr/admin` | seed:office-qa | Verified (real UI login) |
| Training & Placement `/placements` (nav) | PLACEMENT_OFFICER | `qa.tp.office@vviet.edu.in` | `OfficeQA@123` | `/dashboard`, then nav to `/placements` | seed:office-qa | Verified (real UI login, live company/opportunity/offer data) — **defect fixed this closure pass**: seed previously used role string `TP_OFFICER`, which the backend's placement access control does not recognize (only `PLACEMENT_OFFICER`/`T&P_OFFICER`/`TPO`) — every request 403'd. Fixed to `PLACEMENT_OFFICER`. |
| IQAC `/iqac` | IQAC_COORDINATOR | `qa.iqac.coordinator@vviet.edu.in` | `Password123` | `/dashboard`, then nav to `/iqac` | **seed:iqac-qa (new this closure pass)** | Verified (real UI login, full dashboard: 1 evidence pending, 1 metric needing attention, 1 overdue action plan, 1 open audit finding, 1 overdue compliance deadline, 1 active cycle) |
| Student Services — Grievance queue `/student-services/grievances` | GRIEVANCE_OFFICER | `qa.grievance.office@vviet.edu.in` | `OfficeQA@123` | `/student-services/grievances` | **seed:office-qa (role added this closure pass)** | Verified (real UI login, live grievance case queue) |
| Student Services — Welfare | STUDENT_WELFARE_OFFICER | `qa.welfare.office@vviet.edu.in` | `OfficeQA@123` | `/student-services/grievances` | **seed:office-qa (role added this closure pass)** | Seeded, not separately UI-tested (same workspace as Grievance Officer, different case-category visibility) |
| Student LMS `/lms` | STUDENT | `e2e.approved@student.skillonx.test` / USN `4VV24CS001` | `Student@123` (`MOBILE_E2E_STUDENT_PASSWORD`) | `/lms` | seed:live-qa → seed:student-lms-e2e | Verified (real UI login) |
| Parent Portal `/parent` | PARENT | `qa.parent@vviet.edu.in` | `Password123` | `/parent` | **seed:parent-alumni-qa (new this pass)** | Verified (real UI login, full data readback) |
| Alumni Portal `/alumni` | ALUMNI | `qa.alumni@vviet.edu.in` | `Password123` | `/alumni` | **seed:parent-alumni-qa (new this pass)** | Verified (real UI login, full data readback) |
| Applicant Portal `/applicant` | APPLICANT | Application number `QA/ADM/2026/006`, email `qa.admission.6@example.edu` | `Password123` | `/applicant` | seed:admissions-qa (already produced this fixture; **now documented as the designated QA Applicant account this closure pass** — no new seed code was needed) | Verified (real UI login; shows `PAYMENT_PENDING` status, 7-stage progress bar, verified document, ₹25,000 outstanding finance demand) — login requires all three of application number + email + password (see §J for the exact payload shape) |
| Security / Gate | SECURITY (a hostel-shared oversight role, not a dedicated portal) | *(none seeded)* | — | n/a — Security Web Workspace is deferred by design (Gate 4) | n/a | Deferred, not a UAT blocker |

## I. Login route

`http://<host>/login` for all staff-family portals (Faculty, Admin, Platform, Accountant, COE, Lab, Maintenance, Office, Admissions, Hostel/Warden, Library, Transport, HR). Separate login routes: `/lms/login` (Student), `/parent/login` (Parent), `/alumni/login` (Alumni), `/applicant/login` (Applicant).

## J. Expected landing route

See the matrix above. Two documented discrepancies from the seed scripts' own printed summaries (both non-blocking, both confirmed by live login):

- `seedLiveQa.ts`'s own console output claims HOD lands at `/hod` and Management at `/management`. In reality, `landingPathForUser()` (`apps/web/src/auth/ProtectedRoute.tsx:28`) has no case for `HOD`/`MANAGEMENT`/`PRINCIPAL` role strings (because these accounts' `faculty_users.role` is `FACULTY`, with HOD/Principal/Management-ness carried as a separate `leadership`/role overlay) — real login lands at `/dashboard`, and the workspace is reached via sidebar navigation, not automatically on login.

The Applicant Portal (`/applicant/login`) is not an email+password form like every other portal — it requires **all three** of application number, email, and password (`POST /api/admissions/portal/login` body: `{ applicationNumber, email, password }`). Use the exact triple in the credentials matrix row above.

## K. Important fixture relationships

- All QA staff/student/applicant/ticket/lab fixtures hang off one college (`VVIET`, code `VVIET`) and one E2E class (`SX-E2E-CSE-3A`), created by `seed:live-qa` → `seed:student-lms-e2e`. Every other seeder (`office-qa`, `admissions-qa`, `lab-management`, `maintenance`, `parent-alumni-qa`) requires this class to exist first and soft-skips (does not error) if it is absent — hence the fixed dependency order in `seed:uat`.
- The QA Parent account is linked to the "approved" E2E student (`4VV24CS001`) via `parent_student_links` (`VERIFIED`, primary guardian) so the Parent Portal's attendance/fees/results views show real data.
- The QA Alumni account reuses student `4VV24CS006` as its historical record (`alumni_profiles.student_id`), marked `lifecycle_state=ACTIVE`, `verification_state=VERIFIED` so login succeeds immediately (the real claim flow otherwise requires COE/Admin verification).

## L. How to reset / reseed UAT

Re-run `npm run seed:uat` (from `apps/api/`) at any time — it is additive/idempotent and will not duplicate or corrupt existing QA data. To fully reset, drop and recreate the schema, rerun `npm run migrate`, then `npm run seed:uat`.

## M. Known limitations

- **No seeded login for**: `EXAMINER` (no dedicated Web route exists for Examiner — N/A, not a gap), `CANTEEN_MANAGER` (Canteen is API-only/deferred, no Web portal — N/A), a dedicated `SECURITY` portal account (Security Web Workspace itself is deferred by design per Gate 4 — the `SECURITY` role string only grants Hostel-portal access today — N/A). PARENT, ALUMNI, APPLICANT, and IQAC_COORDINATOR were all closed across the two UAT passes and are now fully seeded and verified — see the matrix above.
- **Library fixtures**: a Librarian login is seeded, but no book/copy/loan/circulation fixture data exists in any of the seed scripts — the Library portal will show a legitimate empty state on first login, not seed failure.
- **Events, Mentoring, Procurement fixtures**: these Class-B workspaces have no event/mentee/procurement-item fixture data seeded anywhere. Confirmed in this closure pass to be a *legitimate* empty state, not a defect — the workspace shell, navigation, and API calls all function correctly (verified via network-request inspection, all 200 OK) and simply have zero rows to show. Not a UAT blocker since the workspaces are reachable and functional.
- **`/hr/*`, `/hod/*`, `/principal/*`, `/management/*`, `/placements/*`, `/events/*`** have no `ProtectedRoute` path-prefix enforcement in the frontend (access is nav-hidden, not route-blocked) — any authenticated non-student user can reach these URLs directly. **Tested this closure pass**: logged in as a plain FACULTY user (no HOD/Management/HR/Placement privilege) and navigated directly to `/hr/admin`, `/management`, `/hod`, and `/placements`. In every case the frontend shell rendered (self-service-only nav, or an explicit "access required" banner) and the underlying privileged API call (`/api/hr/admin/dashboard`, `/api/management/overview`, `/api/academic-leadership/hod/dashboard`, `/api/placements/dashboard`) returned `403 Forbidden` with zero privileged data exposed. **Classified SAFE** — backend authorization is intact; the missing frontend route guard is a defense-in-depth gap only, not an exploitable UAT blocker.
- **`/finance` dead route — fixed this closure pass**: `apps/web/src/auth/ProtectedRoute.tsx`'s generic admin-role catch-all redirected any `COLLEGE_ADMIN`/`SUPER_ADMIN` user away from `/finance` back to `/admin`, even though a separate, earlier check in the same file explicitly allows admin roles onto `/finance`. The catch-all's path-exception list was missing `/finance` (every sibling embedded workspace — `/hr`, `/lab`, `/maintenance`, `/admissions`, `/hostel`, `/alumni-admin`, `/procurement`, `/transport`, `/iqac`, `/events` — was already listed). Fixed by adding the missing `financePath` check. Verified: COLLEGE_ADMIN now reaches `/finance` and sees the live Finance Dashboard (collections, outstanding, recent transactions).
- **Mobile QA** (`seed:e2e-mobile-users`) is out of scope for this Web-only pass and requires its own `MOBILE_E2E_*_PASSWORD` secrets.
- **VTU-governance-specific Examination QA** uses a separately maintained tenant (QA-VTU, per commit `996bb2aa`), not part of `seed:uat`.

## N. Security note

All passwords above are non-production, deterministic QA values (`Password123`, `Student@123`, `OfficeQA@123`) intended only for local/staging UAT databases. The seed scripts refuse to run in `NODE_ENV=production` unless `ALLOW_TEST_SEED=true` is explicitly set — remove that flag from any production `.env` immediately after use. Do not reuse these passwords, emails, or identities outside a QA/UAT environment.
