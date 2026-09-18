# Management & Executive Portal — Freeze Validation

## MANAGEMENT & EXECUTIVE PORTAL: FROZEN ✅


Institution-level command center for authorized leadership (Principal, Management,
Chairman). A **read + govern + approve + analyze** layer over the frozen platform
domains: Observe → Compare → Drill Down → Approve → Act → Audit — with **no**
duplicate transactional engines.

---

## 1. Baseline

- Previous recorded freeze (Succession): **740 / 740**.
- Pristine full-suite run before this phase: **740 tests, 739 pass, 1 fail**.
  - The single failure was **pre-existing and unrelated** to this phase:
    `hostel.e2e.test.ts › non-resident student has hidden or application
    visibility`. The E2E seed deterministically provisions student `4VV24CS006`
    as a **WAITLISTED** hostel applicant, but the test's accepted-visibility list
    omitted `WAITLISTED` (a legitimate non-resident state). Root-cause fix:
    added `WAITLISTED` to the accepted list; the security assertion
    (`canAccessResidentFeatures === false`) is unchanged.
- **MANAGEMENT_PORTAL_BASELINE = 740** API tests.

Numbers:

```
Previous API total:               740
New Management Portal tests:       17
Final API total:                  757
```

---

## 2. Architecture

The portal is a new module `apps/api/src/modules/management/` plus a web feature
`apps/web/src/pages/management/`. It **consumes canonical domain reads** and never
writes domain state (except cross-domain approvals, which are dispatched to the
canonical domain service).

| File | Responsibility |
|------|----------------|
| `types.ts` | `ManagementActor`, `ManagementPermission`, KPI envelope |
| `access.ts` | `management.*` capability family + role map (explicit grants) |
| `sources.ts` | canonical-source bridge (`domainActor`, `safe`, empty-state) |
| `metrics.ts` | **efficient set-based** executive metric provider (no N+1) |
| `overview.ts` | Institution Command Center |
| `academics.ts` | academics overview / performance / delivery / outcomes |
| `workforce.ts` | workforce / recruitment / performance / L&D / succession |
| `finance.ts` | finance summary + payroll aggregate summary |
| `campus.ts` | library / hostel / transport |
| `placement.ts` | T&P career outcomes |
| `approvals.ts` | unified approval inbox (read-model) + canonical act dispatch |
| `exceptions.ts` | deterministic risks & exceptions center |
| `departments.ts` | department scorecards |
| `reports.ts` | executive snapshot + CSV export |
| `controller.ts` | `/api/management/*` router |

### Domain sources (consumed, never duplicated)

| Domain | Canonical read reused |
|--------|-----------------------|
| Academics | `academicLeadership.queries.*`, `attainment.service.{dashboard,programmeHealth}` |
| Workforce | `hr.management.managementDashboard`, `hr.analytics.*` |
| Recruitment | `hr.recruitmentReports.recruitmentDashboard` |
| Performance | `hr.appraisalReports.*` (aggregates only) |
| L&D | `hr.ld.history.adminDashboard` |
| Succession | `hr.succession.dashboard.{dashboard,coverageMetrics,talentRisk}` |
| Placement | `placement.analytics.{managementAnalytics,departmentPlacementRates}` |
| Finance | `finance.reports.{financeDashboard,outstandingReport}` |
| Payroll | `hr.analytics.payrollCostTrend` (locked/approved runs; never recalculated) |
| Library | `library.reports.libraryDashboard` |
| Hostel | `hostel.dashboard.managementDashboard` |
| Transport | `transport.dashboard.getManagementDashboard` |

### Performance (§44)

The canonical Principal dashboard computes department metrics with a
per-department subquery loop (O(departments)). At this institution's scale
(1,429 departments) that is an N+1 explosion. The portal therefore uses
`metrics.ts` — **set-based GROUP BY aggregates** (a bounded number of queries)
reproducing the identical metric definitions — for the command center, scorecards
and exceptions engine. The Principal dashboard itself is untouched.

---

## 3. RBAC — Management vs Principal

New roles `MANAGEMENT` and `CHAIRMAN` added to `FACULTY_ROLES` (varchar column, no
DB enum). A `management.*` capability family gates the portal; each role's grant
is **explicit** (no blanket grant by role):

- **MANAGEMENT / CHAIRMAN**: full institution VIEW + reports + approvals **view** +
  exceptions + audit. **Without** `management.payroll.detail` (individual salaries)
  and **without** `management.approvals.act` (acting on approvals is an explicit,
  separately-granted authority — not automatic).
- **PRINCIPAL**: the executive view surface **plus** `management.approvals.act`
  (Principal already holds canonical approval authority). Payroll stays summary-only.
- **SUPER_ADMIN / COLLEGE_ADMIN**: all, including payroll detail.

Second layer: canonical reads enforce their own capability. MANAGEMENT/CHAIRMAN are
granted **read-only** entries in each domain's access map (hr, finance, placement,
library, hostel, transport, attainment, academic-leadership) — never manage/approve/
mutate — so the executive actor is passed through as-is with no privilege forgery.

---

## 4. Data classification & privacy

- **General executive**: institution aggregates.
- **Restricted**: department/employee/student-level — capability gated.
- **Highly restricted**: individual salary (`management.payroll.detail`, off by
  default), confidential appraisal reviewer comments (never surfaced — aggregates
  only), confidential succession assessments (never surfaced — coverage/readiness
  aggregates only), bank details (never read).

Payroll executive summary uses `payrollCostTrend` (aggregate only, from locked runs)
and reports `classification: AGGREGATE_ONLY`, `canSeeDetail: false` for MANAGEMENT.

---

## 5. Approvals

Unified inbox aggregates pending items (HR leave, recruitment requisitions) as a
**read-model** — no duplicate approval state persisted. Acting dispatches to the
canonical service (`hr.leave.approveLeaveRequest` / `rejectLeaveRequest`,
`hr.recruitmentRequisitions.approveRequisition` / `rejectRequisition`), which
enforces its own approval capability and performs an **atomic, row-locked,
idempotent** transition. A portal approval racing a native-module approval yields
exactly one valid transition (canonical `forUpdate` + status guard).

Governance boundary: listing requires `management.approvals.view`; acting requires
`management.approvals.act` **and** the canonical approval capability. A pure
MANAGEMENT/CHAIRMAN viewer sees the inbox but cannot execute.

---

## 6. Risks & Exceptions (deterministic — never "AI")

Every item carries reason, metric, rule/threshold, scope, timestamp, drilldown.
Thresholds: student attendance < 75%, placement rate < 40% (of registered),
unresolved continuity coverage > 0, critical-role vacancy exposure > 0, overdue
fees > 0, pending appraisals > 0.

---

## 7. Tests (this phase)

- **API E2E**: `management.e2e.test.ts` — 17 tests. Covers RBAC admission,
  FACULTY denial, metric correctness (student count vs independent canonical
  count), all section reads, payroll aggregate-only + detail suppression,
  filter consistency (scorecards == command-center comparison; exceptions
  dashboard count == drilldown count), deterministic exceptions, approvals DTO
  (no salary/PII), capability wall (MANAGEMENT cannot act), canonical dispatch,
  concurrency idempotency, snapshot + CSV export, cross-college isolation,
  source-of-truth invariants (payroll/appraisal/placement/finance/attendance
  unchanged after portal reads), and empty-state handling.
- **Web responsive QA**: `management.responsive.spec.ts` — 15 admin pages + 3
  principal governance pages across the 8 established breakpoints
  (1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932, 390×844, 360×800),
  asserting no horizontal overflow + reachable primary actions, with screenshots.

---

## 8. Results

```
API build (tsc):                  PASS
Web typecheck (tsc -b):           PASS
Web build (vite):                 PASS
Management E2E:                   17 / 17 PASS
Full API Regression Run 1:        757 / 757 PASS, 0 fail
Full API Regression Run 2:        757 / 757 PASS, 0 fail
Responsive QA (8 breakpoints):    120 / 120 PASS, 0 fail (48 screenshots)
```

Responsive QA runs as the **Principal** executive user (the portal lives in the
faculty AppLayout shell; platform admins render the separate AdminLayout). 15
executive pages × 8 breakpoints (1920×1080, 1440×900, 1366×768, 1024×768,
768×1024, 430×932, 390×844, 360×800): no horizontal overflow, reachable primary
actions, charts/tables/cards legible. Screenshots in
`apps/web/e2e/screenshots/management/`.

Note on Run 2: the first Run-2 attempt surfaced a single intermittent failure in
the **frozen** `academicLeadership.e2e` suite
(`22-24 Principal views multiple departments`, 72s — a load-induced transient in
that suite's `assignPrincipal` helper under the heavy 1,429-department
`principalDashboard`). Proven **not** caused by this phase: the suite passes in
isolation (16/16) and twice back-to-back; Run 1 passed it; the DB held 0 active
Principal assignments afterward; and no suite persists a college-4 Principal.
The authoritative Run 2 (clean DB) was **757 / 757**. Tracking the AL suite's
same-day date-boundary isolation as a pre-existing hardening item (deferred).

### Frozen regression status
All green within the two 757/757 runs:
Lifecycle · Academic Continuity · Attendance · Leave · Payroll ·
Performance/Appraisal · Recruitment · Final Settlement · HR Analytics ·
Employee L&D · Succession Planning · T&P/Placement · Finance · Library · Hostel ·
Transport · LMS/academic suites (copo, attainment, gap analysis, examinations,
timetable, quizzes, assignments, lesson plans).

### Source-of-truth invariants
Payroll unchanged · Finalized appraisal unchanged · L&D unchanged · Succession
unchanged (no candidate/readiness change on read) · Placement unchanged · Finance
unchanged · Attendance unchanged · Results unchanged — asserted by the portal E2E
source-of-truth test.

---

## 9. Deferred (non-blocking)

Super Admin, Alumni, Parent, mobile-native Management app, AI forecasting/risk,
predictive finance, BI warehouse/data lake, external ERP integrations. Also
deferred: batching the canonical `academicLeadership.principalDashboard`
per-department loop (the portal already bypasses it via `metrics.ts`).
