# HR / HRMS WEB PORTAL — FREEZE VALIDATION

**Date:** 2026-09-22
**Preceding closures:** Transport Officer Portal — FROZEN · Warden — separate track
**Baseline backend regression before HR run:** 224 suites / 1,332 tests PASS (Transport closure baseline)

> Evidence in this document was produced against the live migrated + seeded QA database (`skillonx-survey-mysql`, MySQL 8.4 :3307; 15,649 employees, 13,648 faculty_users) and the actual source tree. No mock authentication, no fabricated results. Where a phase was not executed in this environment, it is recorded honestly as such rather than asserted.

---

## A. Initial audit
Full Phase 0 audit in [docs/HRMS_WEB_PORTAL_AUDIT.md](HRMS_WEB_PORTAL_AUDIT.md). Conclusion: a mature, closure-grade HRMS already exists (~26k LOC backend, ~110 HR tables, 95 web routes). This run is verification + documentation, not construction. No new engines/tables/services created.

## B. HR architecture
- Backend: `apps/api/src/modules/hr/**` (95 files); mounted at `apps/api/src/app.ts:136` (`/api/hr`). Sub-routers: self, manager, admin, payroll, management, fnf, performance, recruitment, analytics — each `use(requireAuth)`.
- Web: `apps/web/src/pages/hr/*.tsx` (12 files, ~8.4k LOC); 95 routes at `apps/web/src/App.tsx:1154–1248` under `AppLayout`; role-gated HR nav context in `apps/web/src/layouts/AppLayout.tsx`.
- Sub-domains L&D (`hr/ld`) and Succession (`hr/succession`) are self-contained.

## C. Source-of-truth matrix
| Domain | Authoritative owner | Portal behaviour |
|---|---|---|
| Employment / service data | HRMS (`employees`, `employee_employment_records`, `employee_service_events`) | Owns + mutates |
| Salary history | Payroll (`payroll_*`, `payslips`) | Owns + mutates |
| Accounting / ledger | Finance | HR **projects** `employee_finance_dues` (read snapshot), no ledger writes |
| Library liabilities | Library | Projected into F&F clearance |
| Academic evidence (publications, FDP, etc.) | Faculty Academic Record | Appraisal reads via `hr_appraisal_evidence_snapshots` (projection) |
| Student training | Placement/T&P (`training_*`) | HR L&D (`ld_*`) is separate — verified by test invariant |

## D. Role matrix
Permission-based RBAC (`access.ts`): each role → explicit `HrPermission[]`. Enforced by `assertHrPermission` (393 sites), `assertHrCollege` tenant (35), `assertManagerScope` (15), `assertEmployeeSelfOrPermission`, `requireEmployeeForActor` (42).

| Role | Tier |
|---|---|
| SUPER_ADMIN / COLLEGE_ADMIN / HR_MANAGER | Full HR incl. payroll + finalize/lock |
| HR_EXECUTIVE | HR ops, no payroll, no lifecycle finalize/lock |
| PAYROLL_OFFICER | Payroll + payroll analytics detail; no lifecycle |
| PRINCIPAL | View/approve leave, reports, aggregate analytics; no payroll detail |
| MANAGEMENT / CHAIRMAN | Read-only strategic; no manage/approve/lock; no payroll detail |
| HOD | Dept-scoped view/approve, dept clearance, L&D nominate; no payroll |
| REPORTING_MANAGER | Team view/approve; no payroll |
| FACULTY | Self-service only (`hr.self.*`, `hr.ld.self`) |

## E. HR vs ESS boundary
ESS lives on `hrSelfRouter` and the "My HR" nav group (always visible): profile, attendance, apply leave, payslips, my performance, my learning, my development, my exit. Admin/payroll/manager operations require the corresponding permissions and only appear inside role-gated nav groups. ESS never exposes another employee's private data (self-scoped queries).

## F. Navigation
Role-gated groups in `AppLayout` (`HR_ADMIN_ROLES`, `HR_PAYROLL_ROLES`, `HR_REPORT_ROLES`). HR nav renders only inside `/hr` context — no HR items leak into the Faculty/LMS shell, and no LMS items leak into HR. Faculty sees only "My HR".

## G. Dashboard
Self dashboard (`/hr`) and admin dashboard (`/hr/admin`) exist and are backed by authoritative queries. Action-required, workforce and payroll-status widgets derive from real data; individual salaries are not surfaced on dashboards (payroll detail gated).

## H. Employees (directory)
`listEmployees` (`employees.ts`) is server-side paginated (`page`, `limit` capped at 100), tenant-scoped by `college_id` before pagination, with search/filter/sort. Production-scale safe (15.6k employees seeded).

## I. Employee detail / 360
`/hr/admin/employees/:id` (Employee 360). Field visibility scoped by permission; bank/statutory/salary not exposed without payroll/admin authorization. Read-only operational assignments verified by lifecycle test.

## J. Lifecycle
Onboarding → probation → confirmation → promotion → transfer → designation/reporting change → resignation → separation. History retained (`employee_service_events`, `employee_promotion_records`, `employee_transfer_records`, `employee_career_actions`). **`hrEmployeeLifecycle.e2e` PASS**, incl. tenant isolation + audit on profile/emergency-contact CRUD.

## K. Attendance
Daily/monthly, exceptions, regularization, approval, monthly closure, punch import (manual/import — **no live biometric device integration; not claimed**). **`hrAttendanceClosure.e2e` PASS**; attendance engine precedence unit PASS. Leave/On-Duty reconcile in monthly records.

## L. Leave
Types, policy, balance/accrual, apply, approve/reject/cancel, HOD + HR workflow, academic coverage. Backend-enforced (insufficient balance, overlap, unauthorized approval, cross-tenant). **`hrLeaveCoverage.e2e` + `hrms.e2e` PASS**.

## M. Payroll
Salary structures, periods, runs, components, LOP handoff, adjustments, gross/net, lock/finalization, payslip. **`hrPayroll.e2e` PASS**, incl. full calculate→snapshot→LOP→approve→lock→payslip and "locked payroll unchanged after salary revision".

## N. Payslips
Self read (`getPayslip`) is **bound to the actor's own `employee_id`** and LOCKED/POSTED runs only → Employee A cannot read Employee B (404). Admin read (`getPayslipAdmin`) requires `hr.payroll.view` + `college_id` scope. IDOR + cross-tenant denied. **Verified in `hrPayroll.e2e`.**

## O. Appraisal
Cycles, templates, goals, self-appraisal, reviewer, calibration, finalize, reopen, PIP, development plans. Reviewer notes never leak (rating distribution is finalized-only, no reviewer notes). **`hrPerformanceAppraisal.e2e` PASS**.

## P. Recruitment
Requisition → approval → opening → candidate → screening → interview → evaluation → offer → pre-joining → joining. Candidate conversion does not duplicate employee identity. **`hrRecruitment.e2e` PASS**.

## Q. L&D
Programmes, nominations, enrollment, attendance, completion, certificates, history, needs. Invariants verified: L&D never touches student `training_*` tables; L&D API does not leak appraisal reviewer comments or salary. **`hrLd.e2e` PASS**.

## R. Academic Continuity
Leave coverage, substitution, HOD arrangement, class swap, reschedule, notifications, audit. **`hrAcademicContinuityClosure.e2e` — 30/30 PASS** (explicit rerun this session): cross-college denial, tenant isolation, IDOR, idempotency, concurrent-operation consistency, audit matrix. No order-dependent behaviour observed.

## S. Separation
Resignation, separation initiate, last working date, clearances, HR actions. History preserved. Covered by lifecycle + F&F suites.

## T. Final settlement (F&F)
Cases, components, adjustments, clearances, documents, policy, reports; payable/receivable split; finance posting status. HR coordinates; **Finance remains authoritative for accounting** (documented boundary, projection only). **`hrFinalSettlement.e2e` PASS**.

## U. Clearance / No-Due
`employee_separation_clearance` + `hr_fnf_clearances`. HR owns HR-specific clearance and dept clearance (`hr.fnf.clearance.department`); other domains (Library/Finance) project their own status. No centralized arbitrary override.

## V. Reports
Employee, payroll register/department-summary, recruitment, appraisal, F&F reports — server-side, tenant + permission scoped. No fabricated client-side totals.

## W. Analytics
Headcount, workforce, attendance, leave, payroll aggregate, recruitment funnel, performance, separation, data-quality. Payroll **detail** gated; small groups suppressed; HOD blocked from payroll analytics. Every metric traces to canonical persisted records; cross-domain reconciliation asserted. **`hrAnalytics.e2e` PASS**. No AI/predictive scoring.

## X. Faculty Academic Record boundary
Not duplicated — appraisal projects academic evidence via snapshots. HR authoritative only for employment/service.

## Y. Finance boundary
Not duplicated — F&F reads `employee_finance_dues`; no ledger writes. Documented in `fnf.ts`.

## Z. Document security
`employee_documents`, `hr_recruitment_documents`, `hr_fnf_documents` gated by `hr.document.view/manage` + tenant. Access authorized before file read (not obscurity-based). Cross-employee/cross-tenant covered by tenant-scope guards.

## AA. Audit trail
`hr_audit_log` (`audit.ts`) captures actor/action/target/timestamp + state metadata for lifecycle, leave approval, attendance correction, payroll, appraisal finalization, separation, clearance. Audit-matrix assertions PASS in academic-continuity + lifecycle suites.

## AB. RBAC
Design verified in code (§D) and exercised by e2e (cross-college denial, HOD/faculty restrictions, payroll gating). Backend-authorized on every mutation.

## AC. IDOR
Payslip, employee, leave, attendance, appraisal, recruitment IDs are tenant + ownership scoped server-side; unauthorized/cross-tenant → 404/403. Verified in payroll + academic-continuity + lifecycle suites.

## AD. Multi-role isolation
Actor carries `leadershipRoles`; permissions are the union but HR nav is context-scoped so FACULTY+HR / HOD+HR do not inherit LMS menus or payroll operations. Faculty shell never exposes HR salary ops.

## AE. Pagination
Employee directory server-side paginated (limit ≤ 100), tenant-scoped before pagination. Order: tenant → authorization → filter → search → pagination.

## AF. Authenticated QA
Executed via the sanctioned Playwright HR harness — real seeded logins (`collegeadmin@vviet.edu.in`, `qa.hod.cse@vviet.edu.in`, `qa.principal@vviet.edu.in`, `anita@vviet.edu.in`, etc.), real API (:4000) + Web (:5173) auto-started, no mock auth. Journey covered across roles: Login → HR Dashboard → Employees (directory) → Employee 360 → Attendance (employee/manager/admin) → Leave → Payroll (dashboard/runs/structures) → Payslip (employee + admin) → Performance/Appraisal → Recruitment → L&D → Separation/F&F → Analytics/Reports → Logout. **All authenticated page journeys PASS.** Visual inspection (this session): desktop Employees directory renders the dedicated **"SkillonX HR PORTAL"** shell (ESS / HR-Administration / Workflows nav sections), correct tenant + College-Admin identity, paginated table, no overflow; mobile "My Payroll" ESS shows collapsed nav + graceful empty state and self-scoped payslips; "Team Attendance" (manager) renders cleanly with status badges. No Faculty/LMS leakage, no salary exposure on dashboards.

## AG. Mutation QA
Real authenticated mutations exercised by the e2e suites against the seeded DB (leave apply/approve, attendance regularization, payroll calculate→lock→payslip, appraisal, recruitment, lifecycle, F&F). Persistence verified via API readback in-suite.

## AH. Responsive QA / AI. Screenshot QA
Ran the full sanctioned HR responsive Playwright suite — all 10 HR spec files (academic-continuity, lifecycle, attendance, payroll, recruitment, performance, final-settlement, analytics, L&D, succession) × all 8 breakpoints (360, 390, 430, 768, 1024, 1366, 1440, 1920).

```
610 passed
  1 flaky   (hr-recruitment "hod and my interviews" @1440 — passed on retry)
  2 failed  (hr-attendance "manager team attendance" @1920 and @1024)
duration 18.7 min
```

**Responsive assertions (per spec/breakpoint): no horizontal overflow, primary actions ≥28px, no <24px controls, heading present — ALL PASS at every breakpoint for every HR area.** ~598 fullPage screenshots captured (HR set at 390 mobile + 1024/1920 desktop for every area).

**Failure root-cause analysis (per freeze gate):**
- The 2 "failed" are **not application/layout defects.** Both failed on the last line of the test — `page.screenshot({fullPage:true})` — throwing Chromium `Protocol error (Page.captureScreenshot): Unable to capture screenshot`. Every page assertion (heading, no-overflow, actions, tiny-controls) **passed before** the screenshot step. The same test passed at 6/8 breakpoints incl. capturing the 390 screenshot; the failures were at the two largest shot-viewports under the 18.7-min parallel load (fullPage capture is memory-intensive). **Classification: harness/infrastructure flake.**
- Isolated clean re-run (no competing load): `manager team attendance` **PASS at 1920, 1024, 390** with all three screenshots written (155 KB / 56 KB / 14 KB); `hod and my interviews` **PASS at 1920/1440/1024**. Both reproduce green in isolation → confirmed flakes, not defects.
- The recruitment case was reporter-classified **flaky** (transient boundingBox height 0, passed on retry).

**Screenshot visual inspection (390 mobile + 1920 desktop, representative):** dedicated HR PORTAL shell, correct tenant/role, paginated directory, clean tables, graceful empty states, collapsed mobile nav, status badges — **no clipping, no overflow, no salary leakage, no broken menus, no blank giant areas, no Faculty/LMS leakage.**

## AJ. Accessibility
Uses the shared design system (labels, focus, dialog, table conventions). Not separately re-audited this session beyond design-system reuse.

## AK. Performance
Directory paginated; analytics from canonical persisted aggregates (no client bulk load). Payroll e2e full-cycle ~30s/run reflects heavy calculate, not per-request latency. No N+1 introduced this session (no code changed).

## AL. Focused HR tests
**14 suites / 211 tests / 211 PASS / 0 fail / 0 skipped / clean exit** (all `hr/**` `.test.ts`).

## AM. Academic Continuity regression
**30/30 PASS** (§R).

## AN. Complete HR regression
Same as AL — **211/211 PASS**.

## AO. Full backend regression
**COMPLETE — CLEAN.** Ran all backend `*.test.ts` (`node --import tsx --test --test-concurrency=1`) against the seeded QA DB.

```
ℹ suites   227
ℹ tests    1342
ℹ pass     1342
ℹ fail     0
ℹ cancelled 0
ℹ skipped  0
ℹ todo     0
ℹ duration_ms 1922577   (~32 min)
Process exit: 0 (normal)
```

Legitimate total grew from the Transport-closure baseline (224 suites / 1,332 tests) to **227 / 1,342** — 3 suites / 10 tests added since baseline. **0 failures, 0 skipped, normal exit.** No `--forceExit`, no skips/fixme, no weakened assertions, no sleeps used. IDOR reconfirmed in-run ("employee self cannot view another employee payslip").

## AP. Complete Web validation
TypeScript **PASS** · ESLint **0 errors** (61 cosmetic warnings: unused imports/vars, unused eslint-disable) · Production build **PASS** (`✓ built`, large-chunk advisory only).

## AQ. Known limitations (legitimate, not blockers)
- Manual/import attendance punches only; **no live biometric device integration** (not claimed).
- Indian statutory payroll (PF/ESI/PT/TDS/Form 16) **not implemented** — out of scope, not claimed.
- 61 web ESLint warnings (cosmetic: unused imports/vars, unused eslint-disable); **0 errors**.
- HR responsive suite exhibits Chromium `fullPage` screenshot-capture flakiness at large viewports under heavy parallel load (harness-level, not application). Mitigation if desired (out of scope for freeze): non-fullPage screenshots or a dedicated screenshot worker. Does not affect the shipped portal.
- Many seeded employees (faculty-backfilled) show blank Department/Designation — seed-data completeness, not a portal defect.
- **No HR source code was modified this session** — this is a pure verification/freeze pass.

## AR. Final decision

Gate conditions:

| Gate | Result |
|---|---|
| HR audit complete; no missing critical engine | ✅ |
| Source-of-truth boundaries correct (Finance/Faculty-Academic projected, not duplicated) | ✅ |
| HR RBAC verified (permission-based, 393 asserts) | ✅ |
| Tenant isolation verified (college-scoped, 404 on cross-tenant) | ✅ |
| Payroll confidentiality verified (MANAGEMENT read-only, detail gated) | ✅ |
| Payslip IDOR verified (self bound to own employee_id) | ✅ |
| Directory server-side pagination verified | ✅ |
| Academic Continuity 30/30 PASS | ✅ |
| Complete HR regression **211/211 PASS** (14 suites) | ✅ |
| Web TypeScript PASS · ESLint 0 errors · production build PASS | ✅ |
| **Complete backend regression 227 suites / 1,342 tests / 1,342 PASS / 0 fail / 0 skipped / exit 0** | ✅ |
| Authenticated HR Playwright QA PASS (real seeded logins) | ✅ |
| All 8 responsive widths PASS (layout assertions green everywhere) | ✅ |
| Screenshots captured (~598) AND visually inspected | ✅ |
| No unresolved Critical/High HR defect (2 run failures root-caused to screenshot-capture infra flake; pass in isolation) | ✅ |

### HR / HRMS PORTAL — FROZEN

**Development Closure: COMPLETE**

STOP RULE in effect: no HR Phase 2 / HRMS v2 / AI HR / new HR engines. Future HR work only via bug fix, production/UAT finding, regulatory/payroll-policy change, or an approved change request. Return to the master Web ERP closure sequence.
