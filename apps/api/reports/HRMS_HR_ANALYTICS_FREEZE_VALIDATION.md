# HRMS HR ANALYTICS — FREEZE VALIDATION REPORT

_Generated 2026-09-08. HR Analytics is a read/analysis layer over the frozen HR
domains; it does not modify their canonical semantics._

## Domain ownership statement

```
Employee Lifecycle owns workforce identity/history.
Attendance & Leave own attendance/leave facts.
Payroll owns payroll monetary results.
Recruitment owns hiring process.
Performance owns appraisal results.
Final Settlement owns F&F orchestration/results.

HR Analytics owns derived metrics, dashboards and reports only.
Analytics does not become a transactional source of truth.
```

```
Duplicate Employee engine:    NO
Duplicate Attendance engine:  NO
Duplicate Payroll engine:     NO
Duplicate Recruitment engine: NO
Duplicate Appraisal engine:   NO
Duplicate F&F engine:         NO
```

Payroll variance is **delegated** to `payrollReports.payrollVarianceReport` — not
re-derived. Attendance is consumed from `employee_monthly_attendance` — never
recomputed from raw punches. Appraisal scores, payroll pay and settlement amounts
are read from canonical persisted values only.

## What was built

- **Metric catalog** (`hr/analyticsCatalog.ts`): 20 centralized metric definitions,
  canonical status sets, date semantics (as-of / range / academic-year /
  financial-year, Asia/Kolkata), attrition & retention formulas, tenure bands,
  scope resolution, minimum-group-size suppression.
- **Single analytics service** (`hr/analytics.ts`): workforce, attendance & leave,
  payroll, recruitment, performance, separation/F&F providers + cross-domain
  reconciliation + data quality + exports. No per-domain duplicate engines.
- **API** under `/api/hr/analytics/*` (25 endpoints incl. drilldowns & export).
- **RBAC**: added `hr.analytics.view`, `hr.analytics.payroll.aggregate`,
  `hr.analytics.payroll.detail`, `hr.analytics.export` to the existing role map.
  HOD gets base view only (department-scoped); payroll detail and export are
  independent capabilities.
- **Web dashboards**: Overview, Workforce, Attendance & Leave, Payroll,
  Recruitment, Performance, Separation & F&F, Data Quality — one KPI strip + a
  primary trend + secondary breakdowns each (no card-wall), with permission-aware
  RESTRICTED handling.
- **Metric dictionary**: `reports/HR_ANALYTICS_METRIC_DICTIONARY.md`.
- Snapshot/cache layer **DEFERRED** (query-time metrics with server-side
  aggregation and scope enforcement) — a performance-only deferral (§127).

## Test & build results

```
HR Analytics E2E:                 19 / 19 PASS

Frozen HR regression (single serial run):
  Academic Continuity Closure        PASS
  Employee Lifecycle             14 / 14 PASS
  Attendance Closure                 PASS
  Final Settlement                7 / 7  PASS
  Leave Coverage                     PASS
  Payroll                        16 / 16 PASS
  Performance / Appraisal        38 / 38 PASS
  Recruitment                    27 / 27 PASS
  HRMS invariants                    PASS
  → HR domain aggregate:        171 / 171 PASS, 0 fail

API build (tsc):                  PASS
Web typecheck (tsc -b):           PASS
Web build (vite):                 PASS

Previous API total:               690
New HR Analytics tests:            19
Final API total:                  709

Full API Regression Run 1:        709 / 709 PASS, 0 fail
Full API Regression Run 2:        709 / 709 PASS, 0 fail
Responsive QA (8 breakpoints):    110 / 110 PASS, 0 fail (39 screenshots)
```

Responsive QA ran across 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024,
430×932, 390×844 and 360×800 for HR admin, HOD and Principal, asserting no
horizontal overflow and visible touch targets on every analytics route.
Screenshots: `apps/web/e2e/screenshots/hr-analytics/`.

## Reconciliation statement (proven in E2E)

```
Current headcount reconciles to Lifecycle:              PASS (== direct in-service count)
Historical headcount uses effective dates:              PASS (joined<=asOf AND not-yet-left)
Joiners reconcile to canonical date_of_joining:         PASS
Tenure bands cover all in-service exactly once:         PASS
Recruitment JOINED all linked to Lifecycle employee:    PASS
F&F cases reference a canonical separation (no orphans): PASS
Appraised employees ≤ in-service employees:             PASS
Payroll analytics == persisted run-header totals:       PASS
Payroll header-vs-lines divergence is flagged:          PASS (see note)
```

**Note (payroll seed):** The seeded LOCKED run id=1 has a header
`deduction_total`/`net_total` that does not equal the sum of its own employee
lines (gross and employee_count DO match). This is a pre-existing Payroll seed
characteristic. Analytics report the canonical persisted header totals and the
reconciliation endpoint **flags** the divergence rather than absorbing it — which
is exactly its purpose.

## Privacy statement (proven in E2E)

```
HOD own-department aggregate:          PASS
HOD other department:                  BLOCKED (403 on out-of-scope department)
HOD individual salary / payroll:       BLOCKED (no payroll permission)
Unauthorized payroll aggregate:        BLOCKED
Small payroll groups (<3):             SUPPRESSED for non-detail actors (null, flagged)
Performance rating distribution:       FINALIZED-ONLY; reviewer notes never in payload
Cross-college analytics:               BLOCKED (per-college scope, verified)
Overview restricted cards:             Rendered RESTRICTED, never a real number
```

## History statement

```
Historical headcount from effective dates (stable after current transfers): PASS
Payroll analytics tied to locked/approved runs (persisted totals):          PASS
Performance distribution tied to finalized appraisals:                      PASS
Recruitment funnel preserves historical stage reach:                        PASS
No snapshot layer overwrites source history (query-time only):              PASS
```

## Export statement (proven in E2E)

```
Authorized export (hr.analytics.export):   PASS (CSV + XLSX, with metadata header)
Unauthorized export (HOD, no export perm): BLOCKED
Payroll export requires payroll.aggregate: PASS (principal ok, HOD blocked)
Tenant / department scope in exports:      Enforced via the same scoped services
Export metadata (report/filters/who/when): PASS
```

## Feature matrix

| Capability | Status |
|---|---|
| Metric catalog / central definitions | PASS |
| Historical headcount (effective dates) | PASS |
| Current headcount | PASS |
| Joiners / Separations | PASS |
| Attrition (documented formula) / Retention | PASS |
| Tenure bands | PASS |
| Department workforce distribution | PASS |
| Workforce movement | PASS |
| Attendance / Leave / LOP analytics | PASS |
| Payroll analytics (aggregate) | PASS |
| Payroll privacy (aggregate/detail split, suppression) | PASS |
| Recruitment funnel / time-to-fill / offer acceptance / vacancy | PASS |
| Performance completion / distribution (finalized-only) | PASS |
| F&F analytics | PASS |
| Cross-domain reconciliation | PASS |
| Data quality | PASS |
| Filters / drilldowns | PASS |
| Aggregate/detail RBAC | PASS |
| Tenant isolation | PASS |
| Department (HOD) isolation | PASS |
| Exports + export security | PASS |
| HR / HOD / Principal dashboards (server-scoped) | PASS |
| Cache isolation | DEFERRED (no cache layer built) |
| Historical snapshots | DEFERRED (query-time metrics) |
| API build / Web build | PASS |
| Frozen HR regressions | PASS (171/171) |
| Full API regression ×2 | PASS (709/709 ×2) |
| Responsive QA + screenshots | PASS (110/110, 39 shots) |

## Deferred (legitimate)

Snapshot/cache/scheduled-rollup layer, AI/predictive attrition, flight-risk,
external salary benchmarking, workforce-planning simulation, succession analytics.
None of the freeze-critical items (metric correctness, tenant isolation, HOD
scope, payroll confidentiality, historical headcount, source reconciliation,
export security) are deferred.

## Freeze status

# HRMS HR ANALYTICS: FROZEN

All freeze criteria are met:

```
✓ Existing analytics/reporting audited (top-level analytics module = Survey; per-domain reports reused)
✓ Metric definitions centralized (analyticsCatalog + metric dictionary)
✓ Current headcount proven (reconciles to Lifecycle)
✓ Historical headcount proven (effective dates)
✓ Joiners/separations proven
✓ Attrition definition documented and tested (deterministic)
✓ Attendance/leave analytics proven (canonical monthly records)
✓ Payroll totals reconciled (persisted header totals; divergence flagged)
✓ Payroll privacy proven (HOD blocked, small-group suppression, aggregate/detail split)
✓ Recruitment funnel reconciled (monotonic; JOINED = Lifecycle conversion)
✓ Performance analytics reconciled (finalized-only; no reviewer-note leakage)
✓ F&F analytics reconciled (no orphan cases)
✓ Cross-domain reconciliation proven
✓ HOD scope proven; Principal/HR scope proven
✓ Tenant isolation proven
✓ Historical integrity proven
✓ Export security proven
✓ API build PASS; Web build PASS
✓ HR Analytics E2E PASS (19/19)
✓ Frozen regressions PASS (171/171)
✓ Full Regression Run 1 PASS (709/709); Run 2 PASS (709/709)
✓ Responsive QA PASS (110/110, 8 breakpoints)
✓ Screenshot evidence captured (39)
✓ Metric dictionary produced
```

Deferred (documented, non-blocking): snapshot/cache/scheduled-rollup layer and
its cache-isolation tests — a performance-only deferral; all metrics are computed
query-time with server-side scope enforcement, so no cross-tenant cache surface
exists to leak.

## STOP

Per the execution contract, work stops at the HR Analytics freeze. The next
domain (Employee L&D / Succession / Alumni / Parent Portal / mobile phases) is
**not** started automatically.
