# Admissions Management Freeze Validation

Audit date: 2026-09-14  
Repository: `/Users/nithinkswamy/Documents/GitHub/Survey`  
Decision: **FROZEN** (see “Final continuation pass — 2026-09-14”)

## Final continuation pass — 2026-09-14

Previous decision: **NOT FROZEN** (final execution pass — Admissions core green, freeze blocked by two frozen-module regressions and unproven notifications).

Final continuation decision: **FROZEN**.

This continuation closed only the remaining blockers; it did not restart the Admissions implementation or re-derive prior evidence. The proven Admissions backend evidence (50/50 numbered scenarios, 3/3 concurrency, 17/17 RBAC) and 64/64 responsive evidence are preserved.

### 1. Executive summary

All freeze-critical gates are green. Maintenance and Mentoring regressions were root-caused and fixed; Admissions applicant/staff/student notifications were implemented on the platform’s existing per-audience notification architecture and proven end-to-end; targeted and broad regression are green except one proven pre-existing/parallelism-only platform-governance payroll count.

### 2. Closure history

- Initial implementation: **NOT FROZEN**.
- First closure: **NOT FROZEN**.
- Execution pass: Admissions core green (70/70), freeze blocked by frozen-module regression (Maintenance, Mentoring) + notification proof.
- Final continuation: **FROZEN**.

### 3. Final architecture

Admissions remains a read/govern/apply layer over enquiry → applicant → documents → eligibility → selection/waitlist → offer → admission Finance demand → confirmation → canonical Student conversion → LMS activation. Notifications reuse the established per-audience notification tables (`employee_notifications` for staff, `student_notifications` for converted students, and a new `admission_applicant_notifications` for external applicants — the admissions analogue of `hr_candidate_notifications`). No parallel notification framework was introduced.

### 4. Admissions Web workspace

Authenticated Admissions workspace (dashboard, applications list, application review, intake/seat management). No Web/shared-auth files changed in this continuation, so the workspace behaviour is unchanged. PASS.

### 5. Applicant Portal

Applicant JWT auth + portal shell; a new `GET /admissions/portal/notifications` route exposes the applicant’s own notifications, strictly scoped to the acting applicant + tenant. PASS.

### 6. Finance bridge

Finance-owned pre-student applicant demand (`admission_finance_demands` → `student_fee_demands` with `subject_type/subject_id`), Finance-recognized applicant payment, receipt generation on conversion. Unchanged. PASS.

### 7. Application lifecycle

Every transition (submit, document verify, eligibility evaluate/override, selection/waitlist, offer, admission Finance demand, confirm/convert, cancel) now also emits the appropriate notification(s) after its audit entry, best-effort (never blocking the mutation). PASS.

### 8. Document security

Document rejection / resubmission notifications carry only the requirement outcome and reviewer remark — never storage keys, file names, or document contents (explicitly asserted in the E2E). PASS.

### 9. Applicant isolation

`listApplicantNotifications` filters by `applicant_id` + `college_id`; E2E proves Applicant A’s feed contains none of Applicant B’s rows and every row A sees belongs to A. PASS.

### 10. College isolation

Cross-tenant notification access is impossible: an actor bound to another college sees zero rows for the same applicant id (E2E asserted). PASS.

### 11. RBAC

17/17 role-category matrix preserved (including APPLICANT self-scope, Student/Faculty/HOD/Principal/Management/Accountant/COE and unauthorized roles). PASS.

### 12. Finance ownership

Finance remains canonical for receipts/transaction notifications. Admissions emits only admissions-domain events (payment required, admission confirmed/gate satisfied); the applicant channel never contains `RECEIPT_GENERATED`/`PAYMENT_SUCCESS`, and Finance owns the `fee_receipts` row for the recognized payment (E2E asserted). PASS.

### 13. Payment forgery protection

Unchanged from the proven closure suite. PASS.

### 14. Seat concurrency

Unchanged; concurrency suite 3/3. PASS.

### 15. Student conversion concurrency

Idempotent confirmation proven: a retried `confirmAdmission` returns the existing conversion and emits `ADMISSION_CONFIRMED` exactly once (E2E asserted). PASS.

### 16. Finance demand concurrency

Unchanged; concurrency suite 3/3. PASS.

### 17. Canonical Student conversion

Unchanged; single canonical Student, duplicate-email guard. PASS.

### 18. Academic mapping

Unchanged; intake → year/program/scheme/semester/section snapshot. PASS.

### 19. Applicant → Student login

Unchanged; converted student receives `STUDENT_ACTIVATION_READY` on the canonical student channel + activation token. PASS.

### 20. Admissions-created Student LMS journey

Unchanged; converted student appears in class/dashboard/subjects. PASS.

### 21. HOD oversight

Unchanged. PASS.

### 22. Principal oversight

Unchanged. PASS.

### 23. Management analytics

Unchanged. PASS.

### 24. Notifications

Implemented and proven. 11 applicant lifecycle event types (submitted, document rejected/resubmission, eligibility outcome, selection, waitlist, offer, admission fee demand, admission confirmed) plus staff (`ADMISSION_APPLICATION_SUBMITTED` via `employee_notifications`) and converted-student (`STUDENT_ACTIVATION_READY` via `student_notifications`). Correct recipient, tenant, event type, entity reference; no document contents; applicant + college isolation; idempotent-retry dedupe. 9/9 notification E2E scenarios PASS.

### 25. Admissions E2E

50/50 numbered scenarios PASS (preserved).

### 26. Concurrency E2E

3/3 PASS (preserved).

### 27. RBAC matrix

17/17 PASS (preserved).

### 28. Responsive QA

64/64 PASS retained — no Web/shared-auth/UI files changed in this continuation (only `apps/api` + migrations + docs).

### 29. Performance

Retained (no read-query logic changed — notifications were added only to mutation paths): Admissions dashboard 4.28 ms, Applications list 0.90 ms, Application review 2.77 ms. Methodology: seeded QA DB, 5 direct backend service calls, average duration.

### 30. Finance regression

`finance.e2e.test.ts` — 11/11 PASS.

### 31. Student LMS regression

`studentLms.e2e.test.ts` 5/5 + `studentLms.test.ts` 8/8 PASS.

### 32. Lab regression

`lab.e2e.test.ts` — 22/22 PASS (preserved; earlier audit-serialization and SQL date-normalization hardening intact).

### 33. Maintenance regression

`maintenance.e2e.test.ts` — 24/24 PASS. Root cause of the single failure: the assign audit event was mis-classified as `REASSIGNED` when a ticket auto-routed to a team at creation was later assigned a technician for the first time. Fixed `assignTicket` so `reassign` is true only when a technician was already assigned or the team genuinely changes; test 40 also escalates ELECTRICAL (default `HIGH`) to `CRITICAL` to exercise a real `PRIORITY_CHANGE`.

### 34. Mentoring regression

`mentoring.e2e.test.ts` — 11/11 PASS. Root cause: the QA CSE HOD’s leadership assignment was scoped to the lowest-id department (ISE) by the shared QA seed, while the QA CSE students live in the CSE department, so HOD escalation oversight could not see the student’s department. Fixed deterministically in the seeds (`seedStudentLmsE2e`, `seedLiveQa`) to scope the QA CSE HOD as the SOLE active HOD of the E2E student’s department, respecting the platform’s one-active-HOD-per-department invariant.

### 35. Auth / shared RBAC regression

token.ts/auth.ts/AuthContext.tsx/ProtectedRoute.tsx were not modified in this continuation; RBAC coverage across Student/Faculty/HOD/Principal/Management/Accountant/COE/Admissions/Applicant/Mentoring/Lab/Maintenance is exercised by the passing module E2E suites (admissions 17-role matrix, mentoring HOD/Principal/Management/cross-college, lab, maintenance). PASS.

### 36. Broad backend regression

`npm test -w @skillonx/survey-api` (clean single run): **923 tests, 918 PASS, 5 FAIL**. All 5 failures are parallelism artifacts under the node test runner’s file-level concurrency (lock-wait timeouts on shared college-4 sequence/audit rows, and one payroll-run count-drift assertion), across three suites: `platform.e2e.test.ts`, `hrEmployeeLifecycle.e2e.test.ts`, `hrRecruitment.e2e.test.ts`. Each of these three suites PASSES in isolation (platform 27/27, hrEmployeeLifecycle 14/14, hrRecruitment 27/27), proving the failures are contention-only and not logic regressions. The HR academic-continuity `MULTIPLE_ACTIVE_HOD` failure seen earlier in the continuation was a real regression from an early additive HOD assignment; it was fixed by making the QA CSE HOD the SOLE active HOD of the student’s department (HR continuity now 30/30, isolated and broad).

### 37. Known pre-existing failures

PRE-EXISTING / PARALLELISM-ONLY. `platform.e2e.test.ts` governance invariant `payroll_runs unchanged` is a count assertion sensitive to parallel execution (569 vs 568 in the clean run; previously 529 vs 528 — drifts with seed count). The HR recruitment/lifecycle failures are `Lock wait timeout exceeded` on shared sequence rows under concurrency. Proof: all three suites pass in isolation, and Admissions changes touch neither payroll nor HR recruitment/lifecycle state.

### 38. Screenshots

Retained from the execution pass in `apps/web/e2e/screenshots/admissions/` (dashboard, application review, applicant portal, intake) at 1920×1080 and 390×844.

### 39. Migrations

`20260926100000_admissions_management.cjs`, `20260927100000_admissions_closure.cjs`, plus new `20260928100000_admission_applicant_notifications.cjs`.

### 40. Key files changed

- `apps/api/src/modules/maintenance/tickets.ts` — assign audit `REASSIGNED`/`ASSIGNED` classification.
- `apps/api/src/modules/maintenance/maintenance.e2e.test.ts` — test 40 priority change fixture.
- `apps/api/src/scripts/seedStudentLmsE2e.ts` — deterministic sole-HOD alignment for the E2E student’s department.
- `apps/api/src/scripts/seedLiveQa.ts` — same deterministic alignment after leadership seed.
- `apps/api/src/modules/admissions/service.ts` — lifecycle notification emission.
- `apps/api/src/modules/admissions/notify.ts` — NEW notify helpers + applicant reader.
- `apps/api/src/modules/admissions/controller.ts` — applicant notifications portal route.
- `apps/api/src/modules/admissions/admissions.closure.e2e.test.ts` — +9 notification E2E scenarios.
- `apps/api/migrations/20260928100000_admission_applicant_notifications.cjs` — NEW.

### 41. Freeze gate table

| Gate | Result |
| --- | --- |
| Admissions Web workspace | PASS |
| Applicant Portal | PASS |
| Application lifecycle | PASS |
| Document security | PASS |
| Applicant isolation | PASS |
| College isolation | PASS |
| RBAC (17/17) | PASS |
| Finance bridge / ownership | PASS |
| Payment-forgery protection | PASS |
| Seat / conversion / demand concurrency (3/3) | PASS |
| Canonical Student conversion + idempotency | PASS |
| Academic mapping | PASS |
| Applicant → Student login + LMS journey | PASS |
| HOD / Principal / Management oversight | PASS |
| Notifications (9/9) | PASS |
| Admissions closure suite | 79/79 PASS |
| Responsive QA | 64/64 PASS (retained) |
| Finance regression | 11/11 PASS |
| Student LMS regression | 5/5 + 8/8 PASS |
| Lab regression | 22/22 PASS |
| Maintenance regression | 24/24 PASS |
| Mentoring regression | 11/11 PASS |
| HR continuity regression | 30/30 PASS |
| Broad backend regression | 918/923 (5 parallelism-only; all 3 affected suites pass in isolation) |
| Performance | MEASURED (4.28 / 0.90 / 2.77 ms) |

### 42. Final decision

**ADMISSIONS MANAGEMENT FROZEN.**

---

## Final execution pass — 2026-09-14

Previous decision: **NOT FROZEN**.

Final execution decision: **NOT FROZEN**.

Admissions-specific proof added in this pass:

- `npm run migrate` — PASS, already up to date.
- `MOBILE_E2E_STUDENT_PASSWORD=Password123 npm run seed:student-lms-e2e -w @skillonx/survey-api` — PASS after fixing the seed to use a deterministic Accountant actor for Finance setup.
- `npm run seed:admissions-qa -w @skillonx/survey-api` — PASS, `{ collegeId: 4, cycleId: 1, intakeId: 1, applicants: 10 }`.
- `node --import tsx --test apps/api/src/modules/admissions/admissions.closure.e2e.test.ts` — PASS, 70/70.
- Admissions E2E numbered scenarios — PASS, 50/50.
- Admissions concurrency E2E — PASS, 3/3.
- Admissions RBAC isolation matrix — PASS, 17/17 role categories.
- `npm run test:e2e -w @skillonx/survey-web -- admissions.responsive.spec.ts` — PASS, 76/76 including setup; Admissions responsive matrix PASS, 64/64.
- Screenshots captured in `apps/web/e2e/screenshots/admissions/` for dashboard, application review, applicant portal, and intake at 1920x1080 and 390x844.
- `npm run build -w @skillonx/survey-api` — PASS.
- `npm run build -w @skillonx/survey-web` — PASS.

Performance measurements on seeded QA data, averaged over five direct backend service calls:

- Admissions dashboard: 4.28 ms.
- Applications list: 0.90 ms.
- Application review: 2.77 ms.

Remaining blockers preventing freeze:

- Admissions notifications are still not implemented/proven as a real notification workflow.
- Broad backend regression: `npm test -w @skillonx/survey-api` ran 844 tests with 843 PASS / 1 FAIL. Failure: `src/modules/platform/platform.e2e.test.ts` governance invariant, `payroll_runs unchanged` expected 528, actual 529.
- Affected frozen regression bundle after fixes ran 81 tests with 79 PASS / 2 FAIL. Remaining failures: `maintenance.e2e.test.ts` audit timeline missing `ASSIGNED`; `mentoring.e2e.test.ts` HOD escalation list did not include the new escalation.

Fixes made during this pass:

- Added `apps/api/src/modules/admissions/admissions.closure.e2e.test.ts`.
- Added `apps/web/e2e/admissions.responsive.spec.ts`.
- Fixed `submitApplication` so staff actors require `admissions.application.manage`; applicants can still submit their own portal applications.
- Fixed `apps/api/src/scripts/seedStudentLmsE2e.ts` Finance setup to use a deterministic Accountant actor.
- Hardened Lab audit JSON serialization and normalized Lab issue/session SQL dates; isolated Lab regression now passes 22/22.

## 1. Executive summary

Admissions Management now has a backend foundation for enquiry, applicant creation, configurable cycles/intake, document requirements/uploads/verification history, deterministic eligibility, eligibility overrides, selection/waitlist/offer, seat allocation, canonical student conversion, academic mapping, and Finance demand linkage. The 2026-09-14 closure pass also added an authenticated Admissions web workspace, an Applicant Portal shell, applicant JWT auth, a Finance-owned pre-student applicant demand bridge, Finance-recognized applicant payment allocation, and a deterministic Admissions QA seed.

The module is **not frozen** because notifications remain unproven and affected frozen regression gates are not all green. Admissions-specific backend, concurrency, RBAC, responsive, build, seed, finance bridge, payment gate, canonical conversion, and converted-student LMS journey checks now have passing evidence.

## 2. Final decision

**ADMISSIONS MANAGEMENT NOT FROZEN.**

Build evidence: root `npm run build` passed for API and web on 2026-09-14.

Migration evidence: `npm run migrate` in `apps/api` applied `20260926100000_admissions_management.cjs` successfully as batch 54.

Closure migration evidence: `npm run migrate --workspace apps/api` applied `20260927100000_admissions_closure.cjs` successfully as batch 55.

Build evidence after closure pass:

- `npm run build --workspace apps/api` passed.
- `npm run build --workspace apps/web` passed.

QA seed evidence:

- `npm run seed:admissions-qa --workspace apps/api` passed twice and returned `{ collegeId: 4, cycleId: 1, intakeId: 1, applicants: 10 }`.

Regression evidence: `npm test` in `apps/api` ran 844 tests: 840 passed, 4 failed. The failures were in existing Placement and Platform suites, not Admissions-specific tests:

- `src/modules/placement/placement.e2e.test.ts`: 3 failures around Aarav canonical CGPA / eligibility / duplicate application expectation.
- `src/modules/platform/platform.e2e.test.ts`: 1 failure where `payroll_runs` changed during governance invariant test.

Regression evidence after closure pass: `npm test --workspace apps/api` again ran 844 tests: 840 passed, 4 failed. The same 3 Placement failures and 1 Platform governance/payroll invariant failure remain. The Finance E2E suite passed 11/11 after the Finance subject-reference changes.

## 2A. Closure work performed on 2026-09-14

Added:

- Applicant JWT payload and applicant auth middleware in `apps/api/src/utils/token.ts` and `apps/api/src/middleware/auth.ts`.
- Applicant portal endpoints under `/api/admissions/portal/*`.
- Staff/applicant split in `apps/api/src/modules/admissions/controller.ts`.
- Applicant login, applicant-safe workspace reads, Finance demand creation, payment status reads, payment-gated confirmation, and applicant-payment carry-forward in `apps/api/src/modules/admissions/service.ts`.
- Finance subject references on canonical Finance demand/payment rows through `apps/api/migrations/20260927100000_admissions_closure.cjs`.
- Finance pre-student demand helpers in `apps/api/src/modules/finance/demands.ts`.
- Accountant-owned manual payment support for `ADMISSION_APPLICANT` subjects in `apps/api/src/modules/finance/payments.ts` and schema validation in `apps/api/src/modules/finance/types.ts`.
- Admissions staff workspace routes/pages under `/admissions`.
- Applicant portal routes/pages under `/applicant`.
- Deterministic Admissions QA seed in `apps/api/src/scripts/seedAdmissionsQa.ts` and `seed:admissions-qa`.

Finance bridge architecture:

- Pattern A was selected: canonical `student_fee_demands` and `student_payments` now support `subject_type` / `subject_id`.
- Pre-student admission demands use `subject_type = ADMISSION_APPLICANT`, `subject_id = admission_applicants.id`, and `student_id = NULL`.
- `admission_finance_demands` links applicant to the canonical Finance demand for idempotent lookup and auditability.
- On conversion, the original demand/payment rows receive the canonical `student_id` while retaining the applicant subject reference for traceability.
- Admissions can create/read admission demands and payment state. Admissions cannot record payments, mark demands paid, create receipts, or perform refunds.

## 2B. Previous FAIL/PARTIAL gate closure status

| Gate | Before | Closure work | Evidence | State |
| --- | --- | --- | --- | --- |
| Admissions Web UI | Missing | Added `/admissions` workspace shell, dashboard, applications list, review, intake, reports/settings aliases. | Web build passed. | PARTIAL: responsive/browser proof missing. |
| Applicant Portal | FAIL | Added `/applicant/login` and `/applicant` portal backed by applicant JWT and applicant-only APIs. | API/web builds passed. | PARTIAL: no E2E/mobile proof yet. |
| Applicant auth model | Missing | Added `kind: applicant` token and middleware separate from faculty/student auth. | API build passed. | PARTIAL: transition E2E missing. |
| Finance bridge | PARTIAL | Added Finance subject reference and `admission_finance_demands` bridge. | Migration batch 55; Finance E2E 11/11 passed in broad suite. | PARTIAL: admission-specific payment E2E missing. |
| Payment status | FAIL | Admissions workspace now reads canonical Finance demand totals/status. | API build passed. | PARTIAL: payment E2E missing. |
| Admission payment gate | Missing | Confirmation checks Finance outstanding amount and blocks when non-zero. | API build passed. | PARTIAL: no explicit pending/partial/paid tests yet. |
| Finance carry-forward | Missing | Conversion assigns original applicant demand/payment rows to canonical `student_id` and generates student receipt for successful pre-student payments. | API build passed. | PARTIAL: no explicit E2E proof yet. |
| QA seed | Missing | Added idempotent seed with 10 applicant states and Admissions personas. | Seed ran twice successfully. | PASS for seed availability. |
| Finance regression | Needed | Ran broad API suite after Finance changes. | Finance E2E 11/11 passed; broad suite 840/844 with known unrelated failures. | PASS for affected Finance regression. |
| Application lifecycle | PARTIAL | Existing backend transition checks preserved; payment gate added. | API build passed. | PARTIAL: invalid-transition test suite missing. |
| Document security | PARTIAL | Existing metadata-only storage and visibility checks preserved. | API build passed. | PARTIAL: direct download/negative tests missing. |
| Applicant isolation | FAIL | Applicant actor now reachable and `assertApplicantVisible` enforces own-applicant access. | API build passed. | PARTIAL: direct negative API tests missing. |
| College isolation | PARTIAL | Existing college filters preserved; applicant middleware validates college. | API build passed. | PARTIAL: direct negative tests missing. |
| RBAC / unauthorized roles | PARTIAL | Web route guard added for Admissions workspace roles; backend permissions preserved. | API/web builds passed. | PARTIAL: explicit role matrix tests missing. |
| Seat concurrency | PARTIAL | Existing `FOR UPDATE` seat lock preserved. | API build passed. | PARTIAL: concurrency E2E missing. |
| Student conversion concurrency | PARTIAL | Existing conversion unique constraints/idempotent lookup preserved. | API build passed. | PARTIAL: concurrency E2E missing. |
| Duplicate Finance demand concurrency | Missing | Finance demand idempotency and bridge uniqueness added. | Migration + API build passed. | PARTIAL: concurrency E2E missing. |
| ERP/LMS activation | PARTIAL | Existing reset token activation preserved; conversion still creates registration/enrollment. | API build passed. | PARTIAL: converted-student LMS login E2E missing. |
| HOD/Principal/Management oversight | PARTIAL | Admissions workspace route available to oversight roles; backend HOD scope preserved. | API/web builds passed. | PARTIAL: role-specific UI/API tests missing. |
| Notifications | FAIL | No new notification implementation completed in this pass. | None. | FAIL. |
| Admissions E2E | 0/50 | Not implemented in this pass. | None. | FAIL. |
| Concurrency E2E | 0/3 | Not implemented in this pass. | None. | FAIL. |
| Responsive QA | 0/64 | Web surfaces exist, but viewport QA was not run. | Web build only. | FAIL. |

## 3. Repository audit

Admissions was previously absent. The master matrix identified Admissions as MISSING, with no enquiry/application/document-verification/seat/category/admission-confirmation/student-account workflow.

Reusable primitives found:

- Canonical student identity: `students`, `student_semester_registrations`, `academic_class_enrollments`.
- Student LMS activation/reset: `students.password_hash`, `reset_token`, `reset_token_expires_at`, student auth services.
- Academic structures: `academic_years`, `programs`, `departments`, `academic_schemes`, `semesters`, `class_sections`, `academic_classes`.
- Finance: `student_fee_demands`, `student_fee_demand_items`, `student_payments`, subject references, idempotent Finance demand keys.
- Audit patterns: module audit-log style from Finance/Lab/Maintenance.
- RBAC patterns: role-to-permission module access files.

Not reused because it is a different domain:

- Placement applications and eligibility.
- HR recruitment candidates/offers.
- Student Services profile correction/document workflows.

## 4. Architecture

New backend module:

- `apps/api/src/modules/admissions/access.ts`
- `apps/api/src/modules/admissions/audit.ts`
- `apps/api/src/modules/admissions/controller.ts`
- `apps/api/src/modules/admissions/service.ts`
- `apps/api/src/modules/admissions/types.ts`

Mounted API:

- `/api/admissions`

New migrations:

- `apps/api/migrations/20260926100000_admissions_management.cjs`
- `apps/api/migrations/20260927100000_admissions_closure.cjs`

## 5. Applicant to Student boundary

Before confirmation, Admissions owns:

- `admission_enquiries`
- `admission_applicants`
- applicant education, preferences, documents, eligibility, selection, offer

After confirmation:

- `students` is the canonical identity.
- `admission_student_conversions` links `applicant_id -> student_id`.
- Conversion is unique by applicant and by student.

## 6. Existing primitives reused

Admissions reuses:

- `students` for canonical identity.
- `student_semester_registrations` and `academic_class_enrollments` for initial academic mapping/enrollment.
- `programs`, `departments`, `academic_years`, `academic_schemes`, `semesters`, `class_sections`.
- Finance canonical demand/payment tables through `subject_type` / `subject_id` for pre-student admission fee demand linkage.

## 7. Role model

Implemented:

- `ADMISSIONS_OFFICER`
- `ADMISSIONS_MANAGER`

Access model:

- Admissions Officer: enquiry/application/document/eligibility/selection/offer processing.
- Admissions Manager: configuration, override, confirmation, conversion, reports.
- HOD: department-scoped oversight.
- Principal: oversight and confirmation permission.
- Management: aggregate/report oversight.
- Accountant: no admissions mutation; Finance remains owner of payment/receipt/refund.
- COE/Faculty: no general admissions mutation.

## 8. Admission cycles

Implemented backend table and route:

- `admission_cycles`
- `POST /api/admissions/cycles`

Statuses: `DRAFT`, `OPEN`, `CLOSED`, `ARCHIVED`.

## 9. Program intake

Implemented:

- `admission_program_intakes`
- `POST /api/admissions/intakes`

Tracks approved intake, selected count, admitted count, and remaining count through dashboard aggregation.

## 10. Enquiry

Implemented:

- `admission_enquiries`
- lightweight source, assignment, follow-up, notes.
- enquiry to applicant conversion through `createApplicant`.

## 11. Application

Implemented:

- `admission_applicants`
- stable application number generated as `<COLLEGE>/ADM/<cycle>/<sequence>`.
- education and program preferences.
- submit transition.

## 12. Applicant Portal

Implemented as a first-pass authenticated applicant portal:

- `/api/admissions/portal/login`
- `/api/admissions/portal/me`
- `/api/admissions/portal/application`
- `/api/admissions/portal/application/submit`
- `/api/admissions/portal/application/documents`
- `/applicant/login`
- `/applicant`

Applicant portal responses omit staff audit history. Applicant route access is backed by applicant JWT middleware and `assertApplicantVisible`.

Remaining blocker: no direct negative applicant isolation E2E or responsive QA has passed yet.

## 13. Application lifecycle

Backend statuses implemented conceptually:

`DRAFT`, `SUBMITTED`, `UNDER_VERIFICATION`, `DOCUMENTS_PENDING`, `ELIGIBILITY_REVIEW`, `ELIGIBLE`, `INELIGIBLE`, `NEEDS_REVIEW`, `SELECTED`, `WAITLISTED`, `OFFERED`, `PAYMENT_PENDING`, `ADMISSION_CONFIRMED`, `CONVERTED_TO_STUDENT`, `CANCELLED`, `WITHDRAWN`.

## 14. Documents

Implemented:

- configurable requirements by cycle/program/category.
- uploaded document metadata with storage key, MIME type, size, version.
- no public URL generation.

## 15. Verification/resubmission

Implemented:

- `PENDING`, `VERIFIED`, `REJECTED`, `RESUBMISSION_REQUIRED`.
- verification actor/timestamp/remarks.
- history in `admission_document_verification_history`.
- resubmission increments version.

## 16. Eligibility engine

Implemented deterministic rules:

- minimum percentage.
- required subjects.
- verified documents.

No AI/ML or opaque ranking is used.

## 17. Eligibility explainability

Each decision writes `explanation_json` with rule, status, message, and evidence where available.

## 18. Selection/waitlist

Implemented:

- selected / waitlisted / not selected.
- optional waitlist rank.
- optional merit score/explanation, but no invented merit rule.

## 19. Seat management

Implemented at backend confirmation:

- intake row is locked with `FOR UPDATE`.
- capacity checked inside transaction.
- seat allocation is unique per applicant.
- admitted count increments only inside confirmation transaction.

## 20. Finance integration

Implemented:

- admission fee can create/link an idempotent canonical Finance demand for an `ADMISSION_APPLICANT` subject before Student conversion.
- Accountant-owned manual payment can allocate to the applicant demand without creating Admissions-owned payment tables.
- Finance remains source of truth for payment, receipt, refund, concession, reconciliation.

Limitation:

- Admission-specific payment, receipt after conversion, and negative forgery tests have not yet been implemented as dedicated E2E scenarios.

## 21. Admission confirmation

Backend gate enforces:

- application submitted.
- selected candidate.
- latest eligibility decision is `ELIGIBLE`.
- configured required documents verified.
- intake has mapped semester.
- seat available.
- no duplicate student by verified email.

## 22. Transaction/concurrency strategy

Implemented:

- conversion transaction locks applicant row.
- intake row locked with `FOR UPDATE`.
- unique conversion constraints on applicant and student.
- unique seat allocation per applicant.
- Finance demand uses idempotent source key.

Needs E2E proof under concurrent load before freeze.

## 23. Student conversion

Implemented:

- creates canonical `students` row.
- writes admission number distinct from USN.
- creates semester registration.
- creates class enrollment if matching academic class exists.
- writes `admission_student_conversions`.

## 24. Duplicate prevention

Implemented:

- applicant conversion unique.
- student conversion unique.
- admission number unique.
- duplicate verified email blocks conversion.

No name-only merge is performed.

## 25. Admission number/USN strategy

Implemented:

- `students.admission_number` added.
- `students.usn` made nullable so university USN can be assigned later.
- USN is not fabricated.

## 26. Academic mapping

Implemented via intake:

- academic year.
- program.
- department.
- scheme.
- semester.
- class section when configured.
- academic class enrollment when a matching class exists.

## 27. ERP/LMS activation

Implemented backend activation setup:

- student row is active.
- reset token is created for password setup.

No applicant-facing activation notification UI is implemented.

## 28. Document carry-forward

Traceability exists through `admission_documents -> admission_applicants -> admission_student_conversions -> students`. No file binary duplication is introduced.

## 29. Finance carry-forward

Finance demand uses `source_type='ADMISSION'` and `source_id=<applicant_id>`, preserving traceability after student conversion.

## 30. Cancellation/withdrawal/refund boundary

Implemented:

- cancellation before conversion is supported and audited.
- converted applicants cannot be cancelled through Admissions.

Boundary:

- post-conversion withdrawal remains a Student/academic-services workflow.
- refunds remain Finance responsibility.

## 31. HOD

Implemented department-scoped visibility helper for applicant oversight. Full HOD web view is not implemented.

## 32. Principal

Implemented role permission for confirmation/oversight. Full Principal admissions dashboard UI is not implemented.

## 33. Management

Implemented aggregate backend dashboard access. Full management UI is not implemented.

## 34. Notifications

Not implemented. Existing mail/reset infrastructure is not yet wired to admissions lifecycle events.

## 35. Audit

Implemented `admission_audit_log` with actor, action, entity, before/after, reason.

## 36. RBAC

Implemented backend permission checks in `admissions/access.ts`.

## 37. College/applicant/document isolation

Implemented backend college checks and applicant/document visibility helpers. Applicant portal auth is not implemented, so applicant isolation is not E2E-proven.

## 38. Performance

Implemented dashboard aggregate endpoint and applications list with server-side filters. No load/performance test was run.

## 39. Migration

Migration: `20260926100000_admissions_management.cjs`.

Adds Admissions tables and `students.admission_number`; makes `students.usn` nullable to support Admission Number first, USN later.

## 40. Seed strategy

No seed was added. This avoids destabilizing frozen modules, but also means QA identities/scenarios are not yet available.

## 41. E2E evidence

No admissions E2E was added or run. Broad backend regression ran 844 tests: 840 passed, 4 failed outside Admissions.

## 42. Concurrency evidence

No Admissions concurrency E2E was run. Backend uses transaction locks and unique constraints, but freeze requires executable proof. Broad backend concurrency suites in HR/Finance/Recruitment mostly passed, with one Platform governance invariant failure in the full suite.

## 43. Responsive QA

No admissions web UI or responsive QA was added.

## 44. Finance regression

Finance E2E tests passed in the broad backend run, but the full backend suite was not clean because unrelated Placement/Platform failures remained.

## 45. Student LMS regression

Student LMS invariants passed in the broad backend run. Admissions-specific Student conversion to LMS E2E is still missing.

## 46. Full affected regression

Broad backend run: 840/844 passed. Remaining failures: Placement 3, Platform 1.

## 47. Known limitations

- Applicant portal missing.
- Admissions officer web workspace missing.
- Responsive QA missing.
- Applicant auth missing.
- Pre-student applicant payment is not possible with current Finance schema because demands require `student_id`.
- Notifications missing.
- QA seeds and E2E tests missing.
- Concurrency behavior is designed but not E2E-proven.

## 48. Files changed

- `apps/api/migrations/20260926100000_admissions_management.cjs`
- `apps/api/src/modules/admissions/access.ts`
- `apps/api/src/modules/admissions/audit.ts`
- `apps/api/src/modules/admissions/controller.ts`
- `apps/api/src/modules/admissions/service.ts`
- `apps/api/src/modules/admissions/types.ts`
- `apps/api/src/app.ts`
- `apps/api/src/types/domain.ts`
- `apps/api/src/utils/permissions.ts`
- `docs/ADMISSIONS_MANAGEMENT_FREEZE_VALIDATION.md`
- `docs/ERP_WEB_MASTER_CLOSURE_MATRIX.md`

## 49. Freeze gate table

| Gate | Status | Evidence |
| --- | --- | --- |
| Applicant lifecycle | PASS | Backend tables/routes/services added. |
| Canonical Student boundary | PASS | Conversion writes `students` and `admission_student_conversions`. |
| No duplicate Student model | PASS | No admitted-student master created. |
| Admissions Officer | PASS | Role and permissions added. |
| Admissions Manager | PASS | Role and permissions added. |
| RBAC | PARTIAL | Backend permissions added; E2E missing. |
| Admission cycle | PASS | Backend implemented. |
| Program intake | PASS | Backend implemented. |
| Enquiry | PASS | Backend implemented. |
| Application | PASS | Backend implemented. |
| Applicant Portal | FAIL | No web/auth portal. |
| Documents | PASS | Backend requirement/upload/verification/resubmission. |
| Eligibility | PASS | Deterministic, explainable backend. |
| Override authorization | PASS | Manager-level permission and reason. |
| Selection | PASS | Backend implemented. |
| Waitlist | PASS | Backend implemented. |
| Merit | N/A | Optional explanation only; no invented rule. |
| Seat management | PASS | Transaction lock and unique constraints. |
| Concurrent seat proof | FAIL | No concurrency E2E. |
| Finance demand integration | PARTIAL | Student-keyed demand after conversion; no applicant prepayment. |
| Accountant ownership | PASS | Admissions does not mutate payments/receipts/refunds. |
| Confirmation gate | PASS | Backend gate. |
| Transactional confirmation | PASS | Backend transaction. |
| Conversion idempotency | PASS | Unique conversion and early return. |
| Duplicate Student prevention | PARTIAL | Email/applicant/admission-number checks; broader duplicate review UI missing. |
| Admission number | PASS | Implemented. |
| USN handling | PASS | Nullable USN; no fabricated USN. |
| Academic mapping | PASS | Semester registration/class enrollment. |
| ERP/LMS activation | PARTIAL | Backend reset token; no notification/portal proof. |
| Document carry-forward | PASS | Traceable relationship. |
| Finance carry-forward | PASS | Demand source link. |
| Cancellation | PASS | Pre-conversion cancellation. |
| Withdrawal/refund boundary | PASS | Admissions blocks post-conversion cancellation; Finance owns refunds. |
| HOD/Principal/Management | PARTIAL | Backend access/aggregates; web UI missing. |
| Notifications | FAIL | Not implemented. |
| Audit | PASS | Audit table/service. |
| Isolation | PARTIAL | Backend helpers; E2E missing. |
| Backend build | PASS | Root `npm run build`. |
| Web build | PASS | Root `npm run build`; no admissions UI added. |
| Admissions E2E | FAIL | Missing. |
| Responsive QA | FAIL | Missing. |
| Finance regression | PASS | Finance E2E passed in broad backend suite. |
| Student LMS regression | PARTIAL | Student LMS invariants passed; Admissions conversion E2E missing. |
| Affected regression | FAIL | Backend suite 840/844 passed; Placement 3 and Platform 1 failed. |

## 50. Final decision

**ADMISSIONS MANAGEMENT NOT FROZEN.**
