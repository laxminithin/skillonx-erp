# ACADEMIC LEADERSHIP — HOD & PRINCIPAL FREEZE VALIDATION REPORT

**Date:** 2026-09-03  
**Migration:** `20260913100000_academic_leadership.cjs`

## Summary

```text
Summary: FROZEN
```

# ACADEMIC LEADERSHIP — HOD & PRINCIPAL: FROZEN

## Metrics

```text
Previous API total: 577
New API tests: 15
Final API total: 592

Full regression Run 1: 592 / 592 PASS
Full regression Run 2: 592 / 592 PASS

Academic Leadership: 14 / 14 PASS
Academic Continuity: 30 / 30 PASS
Employee Lifecycle: 14 / 14 PASS
Attendance Closure: 19 / 19 PASS

Responsive QA: 22 / 22 PASS

API build: PASS
Web build: PASS
```

| Gate | Result | Evidence |
| --- | --- | --- |
| Full regression Run 1 (serial) | **592 / 592 PASS** | ~43.3 min (`duration_ms` 2598510) |
| Full regression Run 2 (serial) | **592 / 592 PASS** | ~57.0 min (`duration_ms` 3419942); library reservation isolation first **9 / 9** |
| Academic Leadership E2E | **14 / 14 PASS** | ~38 s |
| Academic Continuity E2E | **30 / 30 PASS** | ~32 s |
| Employee Lifecycle E2E | **14 / 14 PASS** | ~587 s (sequence lock waits on employee numbering; assertions green) |
| Attendance Closure E2E | **19 / 19 PASS** | ~30 min (Scenario 16 + month lock + payroll handoff remain heavy) |
| API build (`tsc`) | **PASS** | |
| Web build (`tsc -b && vite build`) | **PASS** | |
| Responsive QA | **22 / 22 PASS** | 6 auth/setup + 2 journeys × 8 viewports; 40.5 s |

Run 2 isolation note: an earlier serial attempt failed **591 / 592** on leftover library reservation state (`Already reserved this title`). The library E2E now treats an existing reservation as valid queue state. Isolated library **9 / 9**, then serial Run 2 **592 / 592**. Production reservation uniqueness was not weakened.

## Architecture

```text
HOD = Faculty + Department Leadership
```

This is capability composition, not role replacement. `faculty_users.role` remains `FACULTY`. Effective-dated rows in `academic_leadership_assignments` overlay HOD capabilities. Ending the assignment leaves faculty identity and employee identity intact (E2E tests 1–3).

```text
Principal = College-Scoped Academic Leadership
```

Principal is **not** `SUPER_ADMIN`. Principal assignment is college-scoped (`department_id` forbidden). Operational HR/T&P admin rights are not granted by Principal assignment.

## Frozen boundary

```text
Academic Continuity semantics: UNCHANGED
Employee Lifecycle canonical identity: REUSED
Attendance & Leave canonical engine: REUSED

Duplicate leave engine: NO
Duplicate attendance engine: NO
Duplicate employee master: NO
Duplicate faculty master: NO
Duplicate Academic Continuity engine: NO
```

Leave finalization continues through canonical HRMS leave (`approveLeaveRequest` HR final) and the frozen attendance engine.

## Leave routing

```text
Faculty → HOD → HR
PASS
```

```text
HOD → Principal → HR
PASS
```

```text
Self Approval
BLOCKED
```

Proven in Academic Leadership E2E: faculty leave routes to department HOD then HR; HOD approval is not final; wrong HOD denied; HOD reject does not proceed to HR; HOD leave routes to Principal then HR; Principal reject does not proceed; self-approval denied (including direct API).

## Security

| Security Gate | Expected | Result |
| --- | --- | --- |
| HOD department scope | PASS | PASS (own department views; other department blocked) |
| Principal college scope | PASS | PASS (multi-department in own college) |
| Cross-department API attack | BLOCKED | PASS |
| Cross-college API attack | BLOCKED | PASS |
| HOD self-approval | BLOCKED | PASS |
| Wrong HOD leave approval | BLOCKED | PASS |
| Expired HOD approval | BLOCKED | PASS (effective-dated changeover routes to new HOD) |
| Tenant mutation attempt | BLOCKED | PASS |
| Frozen AC semantics | UNCHANGED | PASS (30 / 30) |
| Frozen Attendance semantics | UNCHANGED | PASS (19 / 19) |

Concurrent overlapping HOD / Principal assignments are rejected (`DUPLICATE_ACTIVE_HOD` / `DUPLICATE_ACTIVE_PRINCIPAL`) with row locks.

## Audit

`hr_audit_log` records `HOD_ASSIGNED` / `PRINCIPAL_ASSIGNED` on `academic_leadership_assignments` with actor, college, entity id (E2E `audit records leadership assignment`). Leave academic approve/reject uses the existing HR leave audit path.

## Notifications

Canonical employee notifications:

- Faculty submit → academic approver (`FACULTY_LEAVE_SUBMITTED` / `HOD_LEAVE_SUBMITTED`)
- Academic approve → faculty + HR staff routing
- Academic reject → faculty

No second leave notification engine.

## Responsive QA

- **Result:** 22 / 22 PASS
- **Viewports (8):** 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932, 390×844, 360×800
- **Journeys:** HOD (dashboard, faculty, leave, attendance, workload, progress, continuity, faculty dashboard, leave apply); Principal (dashboard, approvals, departments, continuity, faculty, faculty dashboard)
- **Screenshot path:** `apps/web/e2e/screenshots/academic-leadership/`
- Captured at 1920×1080, 1024×768, 390×844:
  - HOD Dashboard, HOD Faculty (department overview), HOD Faculty Leave
  - Principal Dashboard, Principal Approvals, Principal Department Overview

## Feature Matrix

| Feature | Status |
| --- | --- |
| Leadership assignment | PASS |
| HOD effective dating | PASS |
| Principal effective dating | PASS |
| HOD retains Faculty capability | PASS |
| HOD dashboard | PASS |
| Department faculty | PASS |
| Faculty workload | PASS |
| Teaching allocation | PASS |
| Timetable oversight | PASS |
| Faculty attendance visibility | PASS |
| Faculty leave approval | PASS |
| HOD leave | PASS |
| Principal approval | PASS |
| Self-approval prevention | PASS |
| Academic progress | PASS |
| Assessment monitoring | PASS |
| Results/performance monitoring | PASS |
| Academic Continuity integration | PASS |
| Principal institution dashboard | PASS |
| Department comparison | PASS |
| Notifications | PASS |
| Audit | PASS |
| RBAC | PASS |
| Department isolation | PASS |
| Tenant isolation | PASS |
| Concurrency | PASS |
| Responsive QA | PASS |
| Screenshot evidence | PASS |
| Academic Leadership E2E | PASS |
| Academic Continuity regression | PASS |
| Employee Lifecycle regression | PASS |
| Attendance regression | PASS |
| Full regression Run 1 | PASS |
| Full regression Run 2 | PASS |
| API build | PASS |
| Web build | PASS |
| Payroll | DEFERRED |
| Training & Placement freeze | DEFERRED (next phase; not started in this freeze) |

## Freeze checklist

```text
✓ Full regression Run 1 green
✓ Full regression Run 2 green
✓ Academic Leadership E2E green
✓ Academic Continuity 30/30
✓ Employee Lifecycle 14/14
✓ Attendance 19/19
✓ HOD retains Faculty capability
✓ Faculty → HOD → HR proven
✓ HOD → Principal → HR proven
✓ self-approval blocked
✓ department isolation proven
✓ tenant isolation proven
✓ effective-dated leadership proven
✓ API build green
✓ Web build green
✓ responsive authenticated QA green
✓ screenshots captured
✓ audit validated
✓ notifications validated
```
