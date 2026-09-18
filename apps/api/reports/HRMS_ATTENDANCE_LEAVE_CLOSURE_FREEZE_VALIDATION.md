# HRMS ATTENDANCE & LEAVE CLOSURE — FREEZE VALIDATION REPORT

**Date:** 2026-09-03  
**Migration:** `20260912100000_hr_attendance_closure.cjs` — **batch 39** (confirmed applied; max batch = 39)

## Executive Summary

# HRMS ATTENDANCE & LEAVE CLOSURE: FROZEN

All critical freeze gates are green. Do not begin Payroll until this freeze remains the accepted baseline.

## Metrics

| Metric | Result |
| --- | --- |
| Previous test total | 574 |
| New tests added (prior + this pass) | 3 |
| Final test total | **577** |
| Full regression (Run 1, sequential) | **577 / 577 PASS** |
| Full regression (Run 2, sequential) | **577 / 577 PASS** |
| Attendance E2E | **19 / 19 PASS** |
| Employee Lifecycle E2E | **14 / 14 PASS** |
| Academic Continuity E2E | **30 / 30 PASS** |
| Leave Coverage E2E | **6 / 6 PASS** |
| Attendance responsive browser QA | **51 / 51 PASS** (3 auth setup + 6 journeys × 8 viewports) |
| API build | **PASS** |
| Web build | **PASS** |

This closure pass added **0** new test cases (Scenario 16 already existed). It made Scenario 16 fail-hard and seed College B fixtures so tenant isolation can no longer silent-skip.

## Combined Regression Root Cause

Previous combined failure: **573 / 574** — Academic Continuity  
`substitute sees class in timetable with substitution badge`

Isolated AC: **30 / 30 PASS**. Failed only under combined order.

### Polluting suite
`hrLeaveCoverage.e2e.test.ts` (and prior AC cancel flows) left cancelled substitute coverage on the shared Anita / Ravi faculty employees.

### Polluted records / state
The badge test originally selected the latest `hr_leave_academic_coverage` row for Ravi with `coverage_type = SUBSTITUTE_FACULTY` and a non-null `timetable_override_id`, **without requiring**:

- leave status `APPROVED`
- coverage status `VERIFIED` / `COMPLETE`
- override status `ACTIVE`

After Leave / cancel flows, that latest row often pointed at a **CANCELLED** override. Production `facultyTimetable` only applies **ACTIVE** overrides, so `hit` was undefined and the assertion failed.

Reproduced: Leave → AC (badge failed on polluted CANCELLED override).  
Did **not** reproduce after isolation: Leave → AC **30 / 30**, Attendance → AC badge **PASS**.

Attendance was not the polluter. Shared faculty leave / timetable override rows were.

### Why cleanup did not remove it
Suites share Anita / Ravi / `SX-E2E-CSE-3A` college fixtures. Leave coverage tests cancel overlapping E2E leaves (DATE_OVERLAP hygiene) but left CANCELLED coverage + override rows in place. The AC badge test then picked the newest coverage row regardless of override status.

### Corrective isolation
In `hrAcademicContinuityClosure.e2e.test.ts` only:

- `findActiveSubstituteCoverageForFaculty()` joins coverage + ACTIVE `SUBSTITUTION` override + APPROVED leave + coverage `VERIFIED`/`COMPLETE`.
- Badge test uses that lookup, then seeds via `runSubstituteHappyPath` if no active row exists.
- `hrLeaveCoverage.e2e.test.ts` uses `uniqueLeaveDate()` so Leave no longer hard-fails on DATE_OVERLAP under combined runs.

### Evidence AC production semantics unchanged
- No changes to `academicContinuity.ts`, leave approval, override creation, or substitute badge product rules.
- Fix is test isolation only (query filters + fixture date uniqueness).
- Leave → AC: **30 / 30 PASS**.
- Attendance → AC badge: **PASS**.
- Scenario 44: attendance recalculation does not rewrite `timetable_overrides` or `academic_class_subject_faculty`.

## Feature Matrix

| Feature | Status |
| --- | --- |
| Attendance daily / monthly engine | PASS |
| Regularization | PASS |
| Month process / REVIEW / finalize / lock / reopen | PASS |
| Month lock blocks silent mutation | PASS |
| Payroll handoff (FINALIZED/LOCKED only) | PASS |
| Payroll rejects OPEN month | PASS |
| Explicit two-college tenant isolation E2E | PASS |
| Attendance ↔ Academic Continuity boundary | PASS |
| Lifecycle employment gates | PASS |
| Academic Continuity substitute / swap / reschedule | PASS |
| Responsive authenticated QA + screenshots | PASS |
| API build | PASS |
| Web build | PASS |
| Live biometric vendor integration | DEFERRED |
| GPS / facial / geofencing | DEFERRED |
| Complex rostering | DEFERRED |
| Overtime payroll calculation | DEFERRED |
| Sandwich leave automatic balance deduction | DEFERRED |
| Attendance CSV/XLSX export (register, absentee, late/early, regularization, LOP) | DEFERRED |

### Sandwich leave
Setting remains available (`sandwichLeavePolicy`: `DISABLED` / `WEEKLY_OFF` / `HOLIDAY` / `BOTH`). Attendance engine does **not** apply sandwich deductions and does **not** mutate leave balances. Canonical Leave auto-deduction is not a safe reusable service for sandwich → **DEFERRED**.

### Exports
No reusable HR attendance export helper exists in the Attendance module. Existing ExcelJS usage (surveys, COPO, attainment, PYQ) would require new report endpoints and material scope expansion → **DEFERRED**.

## Tenant Isolation

`Scenario 16 — Explicit two-college tenant isolation E2E` now **seeds** College B when empty (COLLEGE_ADMIN, department, designation, employment type, ACTIVE employee). It no longer silent-returns when GSSS has no HR fixtures.

College A cannot:

- read College B daily / monthly attendance via `getEmployeeAttendanceAdmin` (**404**)
- see College B employees in its monthly register
- import punches for College B employee IDs (**404**)
- record / modify College B attendance (**404**)
- approve College B pending regularizations (**404** when a pending row exists)
- process / finalize / reopen College B month (closure APIs bind `college_id` to the actor; A ops leave B closure id/status unchanged)

Vice versa also asserted. College B daily counts, payable days, LOP, and closure status remain unchanged after forbidden attempts.

## Responsive QA

- **Test count:** 51 (3 auth setup + 6 journeys × 8 viewports)
- **Viewports:** 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932, 390×844, 360×800
- **Journeys:** Employee `/hr/attendance`, Regularization, Manager `/hr/manager/attendance`, HR register/closure `/hr/admin/attendance`, Settings, Holidays
- **Checks:** no horizontal overflow, primary actions visible, controls usable, headings/actions present
- **Result:** **51 / 51 PASS** (re-run 2026-09-03 14:00 IST)

### Screenshot paths
Under `apps/web/e2e/screenshots/hr-attendance/`:

- `employee-attendance-1920x1080.png`
- `employee-attendance-1024x768.png`
- `employee-attendance-390x844.png`
- `employee-regularization-390x844.png`
- `manager-attendance-1920x1080.png`
- `manager-attendance-1024x768.png`
- `manager-attendance-390x844.png`
- `hr-register-closure-1920x1080.png`
- `hr-register-closure-1024x768.png`
- `hr-register-closure-390x844.png`

## Regression Stability

- Run 1 — **577 / 577 PASS** (`--test-concurrency=1`)
- Run 2 — **577 / 577 PASS** (`--test-concurrency=1`)
- Focused Leave → AC: **36 / 36 PASS** (6 Leave + 30 AC)
- Attendance E2E: **19 / 19 PASS**
- Attendance → AC substitute badge: **PASS**
- Lifecycle isolated: **14 / 14 PASS**

Overlapping parallel full suites can produce MySQL `ER_LOCK_WAIT_TIMEOUT` / multi-minute lifecycle waits. That is environmental concurrency, not the AC assertion defect. Prefer single-flight sequential full runs for freeze confirmation.

## Month Lock Behaviour

Locked months:

- skip recalculation (`recalculateEmployeeRange` returns 0)
- reject attendance override (400)
- do not silently rewrite payable / LOP via engine upsert when records are locked
- require explicit reopen before mutation

Covered by Scenario 43.

## Payroll Handoff Contract

`getPayrollAttendanceHandoff` exposes only FINALIZED / LOCKED closures with:

employeeId, employeeNumber, month/year, employmentApplicableDays, workingDays, payableDays, lopDays, paidLeaveDays, unpaidLeaveDays, absenceDays, halfDays, closureId, closureStatus, calculationVersion.

OPEN months throw 400 — Scenario 42.

## Migration

Batch **39** remains applied. No new migration created for test isolation or tenant-fixture seeding.

## Deferred Items (explicit)

1. Live biometric vendor integration  
2. GPS / facial / geofencing  
3. Complex rostering  
4. Overtime payroll calculation  
5. Sandwich leave automatic balance deduction via canonical Leave service  
6. Attendance CSV/XLSX export suite  

Do not represent these as implemented.

---

**Freeze rule satisfied.** Do not begin Payroll until this freeze is accepted and remains green on the release branch.
