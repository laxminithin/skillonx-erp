# HRMS PAYROLL — FREEZE VALIDATION REPORT

**Date:** 2026-09-04  
**Migration:** `20260915100000_hr_payroll_hardening.cjs`  
**Scope:** Harden existing Payroll module — input snapshots, LOP monetary calc, lock immutability, salary revision/arrears, Finance handoff, privacy, UI, E2E proof.

## Executive Summary

# HRMS PAYROLL: FROZEN

All critical contract invariants are PASS. Full & Final Settlement is **not** started.

## Contract Matrix

| Invariant | Final |
|---|---|
| Employee Lifecycle owns identity | PASS |
| Attendance owns LOP | PASS |
| Payroll owns monetary calculation | PASS |
| Finance owns accounting | PASS |
| Calculation input snapshot | PASS |
| Locked payroll immutable | PASS |
| Salary revisions preserve history | PASS |
| Self-only payslip access | PASS |
| HOD salary privacy | PASS |
| Cross-college server isolation | PASS |
| Finance posting idempotent | PASS |
| No duplicate engines | PASS |

## Architecture (frozen)

```text
Employee Lifecycle  = canonical employee / employment identity
Attendance Closure  = canonical payable-day / LOP quantity (attendancePayrollHandoff)
Payroll             = canonical monetary calculation + per-employee input snapshot
Finance             = canonical accounting (finance_payroll_postings journal)
```

### Snapshot lifecycle

```text
DRAFT            → inputs may refresh on next calculate
PROCESS/CALCULATE→ snapshot canonical inputs (payroll_run + employee JSON v1)
RECALCULATE      → intentionally refresh snapshot from current sources (pre-lock only)
APPROVED         → no uncontrolled input mutation
LOCKED / POSTED  → snapshot + results immutable
```

Recalculate refreshes salary + attendance together from current valid sources (no mixed stale snapshots).

### Reopen / Finance policy

- LOCKED payroll values are immutable.
- If `finance_posting_status = POSTED`, reopen is blocked until Finance reversal.
- Reversal uses Finance `reversePayrollPosting` (marks posting REVERSED, retains history; never deletes journals).
- APPROVED (unposted) may reopen to CALCULATED with reason.

## Historical integrity

```text
Locked payroll unchanged after salary revision: PASS
Locked payroll unchanged after salary-component change: PASS
Locked payroll unchanged after later attendance changes: PASS
Locked result direct mutation: BLOCKED
Retroactive correction uses arrear/controlled correction: PASS
```

## Finance

```text
Payroll → Finance handoff: PASS
Finance tenant validation: PASS
Finance mapping validation: PASS
Finance posting balance validation: PASS
Duplicate posting: BLOCKED / IDEMPOTENT
Concurrent posting: IDEMPOTENT
Posting reference persisted: PASS
Reopen/reversal policy: VERIFIED
```

Canonical posting identity: unique `finance_payroll_postings.payroll_run_id`.

## Privacy

```text
Employee own payslip: PASS
Employee other payslip: BLOCKED
Faculty salary access: BLOCKED
HOD salary leakage through Employee 360: BLOCKED (salaryCompensation=null without hr.payroll.view)
HOD direct payroll API: BLOCKED unless explicitly permissioned
Principal confidential detail: permission controlled
Cross-college payroll: BLOCKED
Unauthorized bank advice: BLOCKED (no bank duplication into payroll tables)
```

## Test metrics

```text
Previous API total: 600
New Payroll tests: 16
Final API total: 616

Payroll E2E: 16 / 16 PASS

Academic Continuity: 30 / 30 PASS
Employee Lifecycle: 14 / 14 PASS
Attendance Closure: 19 / 19 PASS
Academic Leadership: 14 / 14 PASS
Training & Placement: 17 / 17 PASS
Leave Coverage: 6 / 6 PASS

Full API Run 1: 616 / 616 PASS
Full API Run 2: 616 / 616 PASS

Responsive QA: 54 / 54 PASS (1 flake passed on retry)
API build: PASS
Web build: PASS
```

Screenshots: `apps/web/e2e/screenshots/hr-payroll/` (dashboard, structures, payslip, my-payroll at 1920 / 1024 / 390).

## Key implementation files

| Area | Path |
|---|---|
| Migration | `apps/api/migrations/20260915100000_hr_payroll_hardening.cjs` |
| Calculation engine | `apps/api/src/modules/hr/payrollCalc.ts` |
| Orchestration / lock | `apps/api/src/modules/hr/payroll.ts` |
| Salary / revision | `apps/api/src/modules/hr/salaryStructures.ts` |
| Adjustments / arrears | `apps/api/src/modules/hr/payrollAdjustments.ts` |
| Reports | `apps/api/src/modules/hr/payrollReports.ts` |
| Finance posting | `apps/api/src/modules/finance/payrollPosting.ts` |
| UI | `apps/web/src/pages/hr/HrPayrollPages.tsx` |
| E2E | `apps/api/src/modules/hr/hrPayroll.e2e.test.ts` |
| Responsive QA | `apps/web/e2e/hr-payroll.responsive.spec.ts` |

## STOP

Do **not** implement Full & Final Settlement, gratuity, leave encashment, notice pay, clearances, or relieving letters in this phase.
