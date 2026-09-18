# HRMS PERFORMANCE & APPRAISAL — FREEZE VALIDATION REPORT

**Date:** 2026-09-07  
**Migration:** `20260917100000_hr_performance_appraisal.cjs`  
**Scope:** Production-grade Performance & Appraisal — cycles, versioned templates, KPI/KRA, goals, system-derived evidence snapshots, self appraisal, reviewer workflow (HOD/Principal/manager), calibration, rating engine, development plans, lock/versioning, Employee/HOD/HR/Principal UI, E2E proof.

## Executive Summary

# HRMS PERFORMANCE & APPRAISAL: FROZEN

Performance & Appraisal is an evaluation layer. It does not own source facts.

## Domain contract

```text
Employee Lifecycle owns employee identity and reporting relationships.

Academic modules own academic evidence.

Attendance owns attendance evidence.

Survey owns feedback source data/anonymity.

Training & Placement owns T&P activity.

Performance & Appraisal owns appraisal workflow,
evidence snapshots, reviewer evaluation and final rating.

Duplicate Employee engine: NO
Duplicate Academic engine: NO
Duplicate Attendance engine: NO
Duplicate Survey engine: NO
Duplicate T&P engine: NO
```

## Gap audit (forensic)

| Capability | Existing | Reusable | Gap |
|---|---|---|---|
| Appraisal cycles | none | — | MISSING → implemented |
| Templates | none (survey ≠ appraisal) | — | MISSING → implemented |
| Template versioning | — | F&F/payroll version patterns | MISSING → implemented |
| KPI/KRA | none | — | MISSING → implemented |
| Goal setting | none | — | MISSING → implemented |
| Weightage | CO weightage analogy only | EXTEND pattern | MISSING → appraisal weights |
| Employee self appraisal | `/hr/me` shell | REUSE | MISSING → implemented |
| Evidence | gap/CBS upload pattern | EXTEND | MISSING → snapshots |
| Manager review | `assertManagerScope` | EXTEND | MISSING → appraisal review |
| HOD review | Academic Leadership | EXTEND | MISSING → appraisal review |
| Principal review | `/principal/*` | EXTEND | MISSING → appraisal review |
| HR moderation | HR permissions | EXTEND | MISSING → calibrate/finalize |
| Ratings | survey likert | REUSE instrument idea | MISSING → configurable scales |
| Academic evidence | allocation/lesson plans | REUSE read-only | EXTEND → snapshot |
| Attendance evidence | monthly attendance | REUSE | EXTEND → aggregate % |
| Student feedback | Survey ANONYMOUS | REUSE aggregates | EXTEND → min-response |
| Research evidence | none | — | DEFERRED |
| T&P contribution | placement assignments | REUSE | EXTEND → contribution flag |
| Development plan | none (L&D deferred) | — | MISSING → lightweight |
| Probation review | Lifecycle probation | REUSE | EXTEND → recommendation only |
| Appeal/reopen | F&F reopen | EXTEND | MISSING → versioned reopen |
| Reports | leadership/F&F report patterns | EXTEND | MISSING → appraisal reports |
| Audit | `recordHrAudit` | REUSE | EXTEND actions |
| Notifications | `notifyEmployee` | REUSE | EXTEND events |

## Architecture (frozen)

```text
Employee Lifecycle  = identity, employment, reporting, probation state
Academic            = teaching allocation, lesson plans, results (read-only evidence)
Attendance Closure  = faculty monthly attendance aggregates (read-only)
Survey              = anonymous course/faculty feedback aggregates
Training & Placement = T&P assignment evidence
Performance         = cycle + template version + goals + self/review/calibration
                      + evidence snapshot + final rating + development actions + lock
```

One appraisal engine. Faculty vs staff differences use template applicability + reviewer workflow — not separate engines.

Reviewer resolution policy (effective-date aware):

```text
Prefer reporting_manager_employee_id when active and ≠ subject
Else Faculty/HOD path → academic leave approver (HOD / Principal)
Principal → configured manager only; else HR assigns
NEVER subject === reviewer
```

Transfer / changeover policy:

```text
Reviewer resolved as of
cycle.review_cutoff_date ?? cycle.review_end ?? cycle.period_end
using reporting / department / leadership as of that date.
```

State machines:

```text
Cycle: DRAFT → GOAL_SETTING → ACTIVE → SELF_REVIEW → MANAGER_REVIEW
     → CALIBRATION → FINALIZED → LOCKED

Appraisal: NOT_STARTED → GOALS_PENDING → GOALS_APPROVED
         → SELF_REVIEW_IN_PROGRESS → SELF_SUBMITTED
         → REVIEW_IN_PROGRESS → REVIEW_SUBMITTED
         → CALIBRATION → FINALIZED → LOCKED
```

## Historical integrity

```text
Finalized appraisal unchanged after later attendance changes: PASS

Finalized appraisal unchanged after later academic result changes: PASS
(evidence snapshot owned by appraisal; source mutations do not rewrite snapshot)

Finalized appraisal unchanged after template update: PASS
(template versioning — v1 remains attached)

Finalized appraisal unchanged after reviewer changeover: PASS
(reviewer_employee_id snapshotted on enrollment / resolution)

Locked appraisal direct mutation: BLOCKED

Corrections use controlled reopen/versioning: PASS
```

Proved in `hrPerformanceAppraisal.e2e.test.ts`.

## Score integrity

```text
Final score calculated server-side: PASS

Weight validation: PASS

Reviewer score preserved after calibration: PASS

Calibration reason/audit: PASS

Frontend cannot override final calculated rating: PASS
(no client finalScore accepted on finalize)
```

Canonical calculation: `appraisalScore.ts` (`roundScore`, `computeWeightedScore`, `mapScoreToRating`).

## Security / privacy

```text
Employee own appraisal: PASS
Employee another appraisal: BLOCKED

HOD own-department review: PASS
HOD other-department review: BLOCKED
HOD self-review: BLOCKED

Expired reviewer access: BLOCKED

Cross-college appraisal read: BLOCKED
Cross-college appraisal mutation: BLOCKED

Reviewer-only comments privacy: PASS
Anonymous survey identity leakage: BLOCKED
```

Leave medical/reason details are never included in attendance evidence payloads.

## Feature matrix

| Feature | Result |
|---|---|
| Appraisal cycles | PASS |
| Template management | PASS |
| Template versioning | PASS |
| KPI/KRA | PASS |
| Goals | PASS |
| Goal approval | PASS |
| System-derived evidence | PASS |
| Evidence snapshot | PASS |
| Academic evidence | PASS |
| Attendance evidence | PASS |
| Student feedback evidence | PASS |
| T&P evidence | PASS |
| Self appraisal | PASS |
| Reviewer resolution | PASS |
| HOD review | PASS |
| HOD self-review prevention | PASS |
| Principal review | PASS |
| HR administration | PASS |
| Calibration | PASS |
| Rating engine | PASS |
| Development plan | PASS |
| Probation recommendation | PASS |
| Promotion/increment recommendation | PASS |
| Reopen/versioning | PASS |
| Lock immutability | PASS |
| Employee self-service | PASS |
| Department isolation | PASS |
| Tenant isolation | PASS |
| Reviewer scope | PASS |
| Anonymous survey privacy | PASS |
| Audit | PASS |
| Notifications | PASS |
| Reports | PASS |
| Responsive QA | PASS |
| Builds | PASS |
| Frozen regressions | PASS |
| Full regression ×2 | PASS |

## Deferred (non-blocking)

```text
full Research Management System
external 360-degree reviewer portal
anonymous peer feedback engine
AI performance summaries / goal recommendations
forced ranking / succession planning
advanced competency framework
L&D course assignment automation
```

## Test pollution notes

Appraisal and F&F E2E seeders persist `FACULTY` on `faculty_users.role` when the actor concept is HOD/Principal, so `legacyHodEmployees` / `legacyPrincipalEmployees` are not polluted. Leadership uses `academic_leadership_assignments` with non-overlapping effective windows. Full API runs use `--test-concurrency=1 --test-force-exit` (same isolation as Attendance / F&F freezes).

## Metrics

```text
Previous API total: 623
New Appraisal tests: 38
  (29 Performance E2E + 9 appraisalScore unit)
Final API total: 661

Performance/Appraisal E2E: 29 / 29 PASS
appraisalScore unit: 9 / 9 PASS

Academic Continuity: 30 / 30 PASS
Employee Lifecycle: 14 / 14 PASS
Attendance Closure: 19 / 19 PASS
Academic Leadership: 14 / 14 PASS
Training & Placement: 17 / 17 PASS
Payroll: 16 / 16 PASS
Final Settlement: 7 / 7 PASS

Affected Academic/Survey suites: included in full regression — PASS

Full Regression Run 1: 661 / 661 PASS
Full Regression Run 2: 661 / 661 PASS

Responsive QA: 27 / 27 PASS
  (3 viewports × employee/HOD/HR/principal routes + auth setup)
Screenshot path: apps/web/e2e/screenshots/hr-performance/
  15 screenshots captured (1920×1080, 1024×768, 390×844)

API build: PASS
Web build: PASS
```

## Key artifacts

| Area | Path |
|---|---|
| Migration | `apps/api/migrations/20260917100000_hr_performance_appraisal.cjs` |
| Types | `apps/api/src/modules/hr/appraisalTypes.ts` |
| Score engine | `apps/api/src/modules/hr/appraisalScore.ts` |
| Reviewer | `apps/api/src/modules/hr/appraisalReviewer.ts` |
| Evidence | `apps/api/src/modules/hr/appraisalEvidence.ts` |
| Orchestration | `apps/api/src/modules/hr/appraisal.ts` |
| Reports | `apps/api/src/modules/hr/appraisalReports.ts` |
| Routes | `/api/hr/performance/*`, `/api/hr/me/performance/*` |
| E2E | `apps/api/src/modules/hr/hrPerformanceAppraisal.e2e.test.ts` |
| UI | `apps/web/src/pages/hr/HrPerformancePages.tsx` |
| Responsive | `apps/web/e2e/hr-performance.responsive.spec.ts` |

## Freeze checklist

```text
✓ Existing performance functionality audited/reused (none — greenfield evaluation layer)
✓ Cycles operational
✓ Templates operational
✓ Template versioning proven
✓ KPI/KRA operational
✓ Goal workflow proven
✓ Canonical evidence integrations proven
✓ Evidence snapshot proven
✓ Self appraisal proven
✓ Reviewer hierarchy proven
✓ HOD self-review blocked
✓ HOD/Principal workflow proven
✓ Calibration proven
✓ Score engine proven
✓ Final rating proven
✓ Development plan proven
✓ Lock immutability proven
✓ Historical integrity proven
✓ Employee privacy proven
✓ Department isolation proven
✓ Tenant isolation proven
✓ Anonymous feedback privacy proven
✓ Audit proven
✓ API build PASS
✓ Web build PASS
✓ Performance E2E PASS
✓ Frozen-domain regressions PASS (serial)
✓ Affected Academic/Survey regressions PASS (via full suite)
✓ Full Regression Run 1 PASS (661 / 661)
✓ Full Regression Run 2 PASS (661 / 661)
✓ Responsive QA PASS (27 / 27)
✓ Screenshot evidence captured
```

## STOP

```text
HRMS PERFORMANCE & APPRAISAL: FROZEN
```

Do NOT start Recruitment, HR Analytics, Employee L&D, Succession Planning, Alumni, Parent Portal, or new mobile phases.

Recruitment is the next major HRMS phase.
