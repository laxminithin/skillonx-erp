# HR Analytics — Metric Dictionary

Single source of truth for every HR Analytics metric. Definitions are enforced
in code by `apps/api/src/modules/hr/analyticsCatalog.ts` and computed by
`apps/api/src/modules/hr/analytics.ts`. A metric is calculated **one way
everywhere** — HR dashboard, HOD, Principal, drilldowns and exports all consume
these definitions.

HR Analytics is a **read layer**. It never mutates canonical source records and
never recalculates payroll pay, appraisal scores or settlement amounts.

## Canonical status sets

| Set | Values |
|---|---|
| In-service | ACTIVE, PROBATION, CONFIRMED, ON_NOTICE, SUSPENDED, ON_LONG_LEAVE |
| Pre-service (excluded from headcount) | DRAFT, PRE_JOINING |
| Separated (terminal) | SEPARATED, RETIRED, TERMINATED |

## Date semantics

Every metric declares an explicit date basis. Timezone is **Asia/Kolkata**.

- **AS_OF** — a single point in time (headcount, tenure, F&F).
- **CUSTOM_RANGE** — `from`/`to` (defaults to trailing 12 months).
- **ACADEMIC_YEAR** — `academicYear=Y` ⇒ `Y-06-01 .. (Y+1)-05-31`.
- **FINANCIAL_YEAR** — `financialYear=Y` ⇒ `Y-04-01 .. (Y+1)-03-31`.

Historical questions are answered from **effective employment dates**, never from
today's active list.

## Permission model

| Permission | Grants |
|---|---|
| `hr.analytics.view` | Base analytics + workforce; gates domain views alongside the domain's own `.view` |
| `hr.analytics.payroll.aggregate` | Aggregate payroll cost / variance / department cost |
| `hr.analytics.payroll.detail` | Un-suppressed individual/small-group payroll figures |
| `hr.analytics.export` | Any analytics export (independent of dashboard access) |

Domain analytics additionally require the source domain's read permission
(`hr.attendance.view`, `hr.leave.view`, `hr.recruitment.view`,
`hr.performance.view`, `hr.fnf.view`). **HOD** actors are restricted to their own
department(s); everyone holding a college-wide reporting/management capability
sees the whole college. Payroll and performance detail apply **minimum group
size = 3** suppression.

## Metrics

| Key | Definition | Source | Date basis | Permission | Drilldown | Rounding |
|---|---|---|---|---|---|---|
| headcount.current | In-service employees with `date_of_joining <= as_of` | Lifecycle | AS_OF | hr.analytics.view | yes | integer |
| headcount.historical | `date_of_joining <= as_of AND (last_working_date IS NULL OR last_working_date > as_of)` and not pre-service | Lifecycle | AS_OF | hr.analytics.view | yes | integer |
| joiners | Employees with `date_of_joining` in period (offer acceptance is **not** a join) | Lifecycle | RANGE/AY/FY | hr.analytics.view | yes | integer |
| separations | COMPLETED `employee_separation_requests` with `last_working_date` in period, by type | Lifecycle | RANGE/AY/FY | hr.analytics.view | yes | integer |
| attrition | separations ÷ ((headcount_start + headcount_end) / 2) × 100 | Lifecycle | RANGE/AY/FY | hr.analytics.view | no | 2 dp |
| retention | (in service at start **and** still in service at end) ÷ (in service at start) × 100 — computed independently of attrition | Lifecycle | RANGE/AY/FY | hr.analytics.view | no | 2 dp |
| tenure.bands | Bucket `TIMESTAMPDIFF(YEAR, date_of_joining, as_of)` into <1 / 1–3 / 3–5 / 5–10 / 10+ | Lifecycle | AS_OF | hr.analytics.view | yes | integer |
| department.distribution | Per department: headcount, faculty, staff, joiners, separations | Lifecycle | AS_OF + RANGE | hr.analytics.view | yes | integer |
| workforce.movement | `employee_career_actions` (status APPLIED) by action_type in period | Lifecycle | RANGE | hr.analytics.view | no | integer |
| attendance.rate | Σ present_days ÷ Σ payable_days × 100 over `employee_monthly_attendance` (never from raw punches) | Attendance | MONTH/RANGE | + hr.attendance.view | no | 2 dp |
| lop.days | Σ `lop_days` over `employee_monthly_attendance` | Attendance | MONTH/RANGE | + hr.attendance.view | no | 2 dp |
| leave.days | Σ `requested_days` of APPROVED/COMPLETED leave by type (reasons never surfaced) | Leave | RANGE | + hr.leave.view | no | 2 dp |
| payroll.cost | Σ `gross_total` / `deduction_total` / `net_total` over APPROVED/LOCKED/POSTED runs (persisted header totals — never recalculated) | Payroll | MONTH/RANGE/FY | hr.analytics.payroll.aggregate | no | source dp |
| payroll.department | Per-department Σ from `payroll_run_employees`; groups < 3 suppressed without detail permission | Payroll | AS_OF (run) | hr.analytics.payroll.aggregate | detail-gated | source dp |
| payroll.variance | Delegated to `payrollReports.payrollVarianceReport` — Payroll owns variance | Payroll | MONTH | hr.analytics.payroll.aggregate | no | source dp |
| recruitment.funnel | Distinct applications reaching each stage APPLIED→…→JOINED (counted once, furthest stage) | Recruitment | RANGE | + hr.recruitment.view | yes | integer |
| recruitment.timeToFill | avg(days from requisition.approved_at to application.joined_at) for joins in period | Recruitment | RANGE | + hr.recruitment.view | no | 1 dp |
| recruitment.offerAcceptance | accepted ÷ (accepted + declined + expired) × 100 over latest offer per application | Recruitment | RANGE | + hr.recruitment.view | no | 2 dp |
| recruitment.vacancy | Σ approved_headcount of APPROVED/OPENED requisitions; published openings count | Recruitment | AS_OF | + hr.recruitment.view | no | integer |
| performance.completion | Stage counts (self / review / finalized) over base appraisals for a cycle | Appraisal | RANGE | + hr.performance.view | no | 2 dp |
| performance.distribution | Count by `final_rating_label` where `finalized_at IS NOT NULL` (finalized only; min group size; reviewer notes never exposed) | Appraisal | RANGE | + hr.performance.view | no | integer |
| fnf.aging | Case counts by status bucket + payable/receivable from signed `net_amount` | Final Settlement | AS_OF | + hr.fnf.view | no | source dp |

## Reconciliation invariants

- **Current headcount** equals a direct in-service Lifecycle count (proven in E2E).
- **Payroll**: analytics report persisted run-header totals; the reconciliation
  endpoint flags any header-vs-lines divergence (gross and employee-count are
  load-bearing invariants).
- **Recruitment**: every JOINED application is linked to a Lifecycle employee.
- **F&F**: no F&F case references a missing separation request.
- **Appraisal**: distinct appraised employees never exceed in-service employees.

## Notes

- Percentages guard against zero/empty/suppressed denominators (never NaN/Infinity).
- Suppressed sensitive aggregates return `null` + `suppressed: true`, never a
  misleading zero.
- Snapshot/cache layer is intentionally deferred; all metrics are computed
  query-time with server-side aggregation and scope enforcement.
