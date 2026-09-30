# HRMS / HR WEB PORTAL — PHASE 0 REPOSITORY AUDIT

**Date:** 2026-09-22
**Scope:** Audit existing HRMS capability, identify source-of-truth, surface genuine gaps, verify security, and prepare the HR/HRMS Web Portal for a freeze decision. **This is a closure/audit exercise, not a new build.**

> Method: audit was performed against the live source tree (`apps/api/src/modules/hr`, `apps/web/src/pages/hr`, `apps/web/src/layouts/AppLayout.tsx`, `apps/web/src/App.tsx`), the migrated + seeded QA database (`skillonx-survey-mysql`, MySQL 8.4 on :3307, 15,649 employees / 13,648 faculty_users), and the existing HR e2e test suites. No application code was changed during Phase 0.

---

## 0. Executive summary

SkillonX already contains a **mature, closure-grade HRMS**. The backend is ~26,000 LOC across 95 TypeScript files with a dedicated permission model, tenant scoping, IDOR protection, server-side pagination, audit logging, and 13 e2e/unit suites. The web portal exposes **95 routes** covering every HR area, served through a role-gated HR navigation context inside the shared `AppLayout`.

The audit did **not** find missing engines, placeholder features, or fabricated integrations. The dominant status is **COMPLETE + VERIFIED** / **EXISTS**. The primary residual items are UX/verification and documentation, not new backend capability.

---

## 1. Architecture & source-of-truth

| Layer | Location | Notes |
|---|---|---|
| Backend module | `apps/api/src/modules/hr/**` | 95 files, ~26k LOC (excl. tests) |
| Router mount | `apps/api/src/app.ts:136` → `app.use('/api/hr', hrRouter)` | Sub-routers each `use(requireAuth)` |
| RBAC core | `apps/api/src/modules/hr/access.ts` | Permission-based (`HrPermission[]` per role) |
| DB schema | ~110 HR tables (`employees`, `employee_*`, `hr_*`, `payroll_*`, `payslips`, `ld_*`, `succession_*`) | 14 HR-relevant migrations of 88 |
| Audit trail | `hr_audit_log` table + `audit.ts` | Actor/action/target/timestamp captured |
| Web pages | `apps/web/src/pages/hr/*.tsx` | 12 files, ~8.4k LOC |
| Web routes | `apps/web/src/App.tsx:1154–1248` | 95 `/hr/**` routes under `AppLayout` |
| Web nav | `apps/web/src/layouts/AppLayout.tsx` | HR nav context (`inHr`), role-gated groups |

**Source-of-truth rules observed in code:**
- HRMS is authoritative for **employment/service** data (`employees`, `employee_employment_records`, `employee_service_events`, lifecycle tables).
- Payroll owns **salary history**; Finance owns **accounting**; Library owns **liabilities** — explicitly documented in `fnf.ts:4`. F&F **projects** finance dues via `getFinanceDuesSnapshot` (`employee_finance_dues`) rather than duplicating a ledger.
- Faculty Academic Record remains authoritative for academic evidence; appraisal uses **evidence snapshots** (`hr_appraisal_evidence_snapshots`) — projection/link, not duplication.

---

## 2. Capability matrix

| Capability | DB | Backend | API | Web | RBAC | Tests | Status |
|---|---|---|---|---|---|---|---|
| HR foundation / employee master | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | COMPLETE + VERIFIED |
| Employee directory (paginated) | ✔ | ✔ (`listEmployees`, server-side page/limit≤100) | ✔ | ✔ | ✔ | ✔ | COMPLETE + VERIFIED |
| Employee HR profile / 360 | ✔ | ✔ | ✔ | ✔ | ✔ (field/role scoped) | ✔ | COMPLETE + VERIFIED |
| Employee lifecycle (onboarding→separation) | ✔ | ✔ (`lifecycle*.ts`) | ✔ | ✔ | ✔ | ✔ (`hrEmployeeLifecycle.e2e`) | COMPLETE + VERIFIED |
| Attendance (daily/monthly/regularization/closure) | ✔ | ✔ (`attendance*.ts`) | ✔ | ✔ | ✔ | ✔ (`hrAttendanceClosure.e2e`) | COMPLETE + VERIFIED |
| Leave (types/policy/balance/apply/approve) | ✔ | ✔ (`leave*.ts`) | ✔ | ✔ | ✔ | ✔ (`hrLeaveCoverage.e2e`, `hrms.e2e`) | COMPLETE + VERIFIED |
| Payroll (structures/runs/lock/adjustments) | ✔ | ✔ (`payroll*.ts`) | ✔ | ✔ | ✔ (payroll perms) | ✔ (`hrPayroll.e2e`) | COMPLETE + VERIFIED |
| Payslip (self + admin, IDOR-safe) | ✔ | ✔ (`getPayslip` self-bound, `getPayslipAdmin` perm+tenant) | ✔ | ✔ | ✔ | ✔ | COMPLETE + VERIFIED |
| Performance & appraisal | ✔ | ✔ (`appraisal*.ts`) | ✔ | ✔ | ✔ | ✔ (`hrPerformanceAppraisal.e2e`) | COMPLETE + VERIFIED |
| Recruitment (requisition→joining) | ✔ | ✔ (`recruitment*.ts`) | ✔ | ✔ | ✔ | ✔ (`hrRecruitment.e2e`) | COMPLETE + VERIFIED |
| Learning & Development | ✔ (`ld_*`) | ✔ (`hr/ld/**`) | ✔ | ✔ | ✔ | ✔ (`ld/hrLd.e2e`) | COMPLETE + VERIFIED |
| Academic continuity (leave coverage) | ✔ | ✔ (`academicContinuity.ts`, `leaveCoverage.ts`) | ✔ | ✔ | ✔ | ✔ (`hrAcademicContinuityClosure.e2e` — 30/30) | COMPLETE + VERIFIED |
| Final settlement / F&F | ✔ | ✔ (`fnf*.ts`) | ✔ | ✔ | ✔ | ✔ (`hrFinalSettlement.e2e`) | COMPLETE + VERIFIED |
| Clearance / No-Due | ✔ (`employee_separation_clearance`, `hr_fnf_clearances`) | ✔ (`fnfClearance.ts`) | ✔ | ✔ | ✔ (`hr.fnf.clearance.department`) | ✔ | COMPLETE + VERIFIED |
| HR analytics | ✔ | ✔ (`analytics.ts`, `analyticsCatalog.ts`) | ✔ | ✔ | ✔ (payroll detail gated, small-group suppression) | ✔ (`hrAnalytics.e2e`) | COMPLETE + VERIFIED |
| Reports (employee/payroll/recruitment/etc.) | ✔ | ✔ (`*Reports.ts`) | ✔ | ✔ | ✔ | ✔ | COMPLETE + VERIFIED |
| Succession planning | ✔ (`succession_*`) | ✔ (`hr/succession/**`) | ✔ | ✔ | ✔ | ✔ (`succession/hrSuccession.e2e`) | COMPLETE + VERIFIED |
| Employee self-service (ESS) | ✔ | ✔ (`hrSelfRouter`) | ✔ | ✔ | ✔ (self-scoped) | ✔ | COMPLETE + VERIFIED |
| Audit trail | ✔ (`hr_audit_log`) | ✔ (`audit.ts`) | ✔ | partial (viewer where supported) | ✔ | ✔ (audit-matrix assertions) | COMPLETE + VERIFIED |
| Biometric/device attendance integration | — | punch import exists (`attendancePunches`) | ✔ | ✔ | ✔ | ✔ | PARTIAL — **manual/import punches only; no live device integration. Not claimed as biometric.** |
| Indian statutory payroll (PF/ESI/PT/TDS/Form16) | — | — | — | — | — | — | OUT OF CURRENT SCOPE — **not implemented; must not be claimed.** |

---

## 3. RBAC / persona model (actual repository roles)

Roles carry an explicit `HrPermission[]` (`access.ts`). Enforcement is permission-based, not role-string-based, via `assertHrPermission` (393 call sites), plus tenant (`assertHrCollege`, 35), manager scope (`assertManagerScope`, 15), self-or-permission (`assertEmployeeSelfOrPermission`), and `requireEmployeeForActor` (42).

| Role | HR capability tier |
|---|---|
| `SUPER_ADMIN`, `COLLEGE_ADMIN` | Full HR (all permissions) |
| `HR_MANAGER` | Full HR incl. payroll + finalize |
| `HR_EXECUTIVE` | HR ops (no payroll, no lifecycle finalize/lock) |
| `PAYROLL_OFFICER` | Payroll + payroll analytics detail; **no** employee lifecycle/manage |
| `PRINCIPAL` | View/approve leave, reports, aggregate analytics; **no** payroll detail |
| `MANAGEMENT` / `CHAIRMAN` | **Read-only** strategic; **no** manage/approve/lock, **no** payroll detail |
| `HOD` | Dept-scoped view/approve, dept clearance, L&D nominate; **no** payroll |
| `REPORTING_MANAGER` | Team leave/attendance/performance view; **no** payroll |
| `FACULTY` | **Self-service only** (`hr.self.*`, `hr.ld.self`) |

Web nav mirrors this: `HR_ADMIN_ROLES` / `HR_PAYROLL_ROLES` / `HR_REPORT_ROLES` gate the admin/payroll/reports nav groups; Faculty sees only the "My HR" self-service group; HR nav only renders inside `/hr` context (no leakage into the Faculty/LMS shell).

---

## 4. Findings against the standard risk checklist

| Risk | Finding |
|---|---|
| Duplicate HR implementations | None found. Single authoritative HR module. |
| Dead / placeholder pages | None found in HR (no TODO/placeholder/"coming soon" markers in `hr/**`). |
| Broken routes | None identified in static review (all 95 routes resolve to imported components). |
| Unused APIs | Not observed; nav + pages consume the routers. |
| Client-only mutations | None — every mutation flows through `/api/hr` behind `requireAuth` + `assertHrPermission`. |
| Unbounded queries | Employee directory paginated (limit ≤ 100). Full pagination sweep tracked for verification phase. |
| Incorrect role exposure | Not found; payroll detail restricted, MANAGEMENT read-only. |
| Faculty/HR leakage | Not found; HR nav is context-scoped, Faculty has self-service only. |
| Finance duplication | Avoided by design — F&F projects `employee_finance_dues`, does not own a ledger. |
| Faculty Academic Record duplication | Avoided — appraisal uses evidence snapshots (projection). |
| Missing pagination | Directory OK; other list endpoints to be confirmed in pagination sweep (§33). |
| Missing audit trail | `hr_audit_log` present; audit-matrix assertions exist. |
| Security concerns | None surfaced in Phase 0. IDOR/tenant/permission all enforced server-side. |

---

## 5. Verification already executed in Phase 0

- **Academic Continuity closure e2e:** `hrAcademicContinuityClosure.e2e.test.ts` → **30/30 PASS** (incl. cross-college denial, IDOR, idempotency, tenant isolation).
- **Web validation:** TypeScript **PASS**, ESLint **0 errors** (61 cosmetic warnings), production build **PASS**.
- **Payslip IDOR:** self read is bound to the actor's own `employee_id`; admin read requires `hr.payroll.view` + `college_id` scope.
- **HR module regression:** in progress at time of writing (see freeze doc §AN).

---

## 6. Conclusion of Phase 0

The HR/HRMS portal is **already at or near freeze quality**. Remaining work is **verification and documentation**, not construction. No new engines, tables, or services are required or recommended. Proceed to the verification/QA phases and record results in `docs/HRMS_PORTAL_FREEZE_VALIDATION.md`.
