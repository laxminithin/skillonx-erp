# UNIFIED TRAINING & PLACEMENT — FREEZE VALIDATION REPORT

**Date:** 2026-09-04  
**Migration:** `20260914100000_tp_leadership_assignments.cjs` (batch 41)  
**Precondition:** Academic Leadership HOD & Principal — **FROZEN** (API baseline **592**)

## Summary

```text
FROZEN
```

# UNIFIED TRAINING & PLACEMENT: FROZEN

## Baseline

```text
Previous API total: 592
```

(Academic Leadership freeze verified total.)

## New Tests

```text
New API tests: 8
```

Unified T&P lifecycle suite added 8 scenarios on top of the existing 9 placement seed invariants (17 placement module tests total).

## Final API Total

```text
Final API total: 600
Full Regression Run 1: 600 / 600 PASS
Full Regression Run 2: 600 / 600 PASS
```

## Architecture

```text
Training + Placement = ONE UNIFIED MODULE
```

Single backend domain under `apps/api/src/modules/placement/*`, shared routers, shared schema (`20260906100000_placement_module.cjs` + T&P assignment migration). No separate Training / Placement / TPO apps.

```text
T&P Officer = Employee + Institutional T&P Capability

Department T&P Coordinator
= Faculty/Employee + Department T&P Capability
```

Effective-dated rows in `tp_leadership_assignments` overlay capabilities. `faculty_users.role` is **not** replaced. Ending assignment leaves Faculty/Employee identity intact (E2E proven).

Principal = college-scoped **oversight** (`placement.management.view` / reports) — not automatic operational T&P admin.

## Reuse

Canonical systems reused (not duplicated):

| Domain | Reused |
| --- | --- |
| Student | YES |
| Employee | YES |
| Faculty | YES |
| Academic structure / enrollments | YES |
| Results / CGPA / backlogs via academic profile bridge | YES |
| Attendance (HR / class) | NOT mixed into training attendance |
| Finance | N/A for core T&P ops |
| Notifications | YES (`notifyStudent`) |
| Audit | YES (`placement_audit_log`) |
| Auth / RBAC | YES (permission families + assignment overlay) |
| Tenant isolation | YES (`college_id`) |

## Existing T&P audit (pre-implementation)

| Feature | Classification |
| --- | --- |
| Student placement profile | REUSE |
| Companies | EXTEND (update + contacts) |
| Company contacts | EXTEND |
| Placement drives (opportunities) | EXTEND (state machine) |
| Eligibility | REUSE (+ deadline) |
| Eligibility snapshot | REUSE |
| Applications | EXTEND (concurrency / transitions) |
| Shortlisting | REUSE |
| Tests / Interviews (rounds) | REUSE / EXTEND |
| Offers | EXTEND (duplicate guard / privacy) |
| Internships | REUSE (opportunity type) |
| Training programs | EXTEND |
| Training registration | EXTEND (self-register + capacity) |
| Training attendance | REUSE |
| Coordinators | EXTEND (effective-dated) |
| Department coordinators | EXTEND |
| Recruiters | DEFERRED (schema stub; portal disabled) |
| Notifications | EXTEND |
| Reports / analytics | EXTEND (department rates) |
| Principal oversight | EXTEND (UI + management API) |

## Security

| Gate | Result |
| --- | --- |
| Tenant isolation | PASS (college-scoped queries; cross-college company lookup empty) |
| Department isolation | PASS (coordinator student access 403 outside dept) |
| Student isolation | PASS (application / offer 404 for other student) |
| Offer privacy | PASS |
| Application ownership | PASS |
| Server-authoritative eligibility | PASS |
| Deadline enforcement | PASS (`DEADLINE_PASSED`) |
| Drive transition validation | PASS (`INVALID_DRIVE_TRANSITION`) |
| Assignment overlap | PASS (`DUPLICATE_ACTIVE_TP_ASSIGNMENT`) |
| Application concurrency | PASS (unique constraint + txn / `FOR UPDATE`) |
| Training capacity / duplicate | PASS |
| Offer duplicate | PASS (`DUPLICATE_OFFER`) |

## Regression

| Suite | Result |
| --- | --- |
| T&P E2E | **17 / 17 PASS** |
| Academic Leadership | **14 / 14 PASS** |
| Academic Continuity | **30 / 30 PASS** |
| Employee Lifecycle | **14 / 14 PASS** |
| Attendance Closure | **19 / 19 PASS** |
| Full Regression Run 1 | **600 / 600 PASS** (~44.3 min) |
| Full Regression Run 2 | **600 / 600 PASS** (~45.0 min) |

## Responsive

```text
viewports: 8 (1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932, 390×844, 360×800)
journeys: Officer/Admin T&P, HOD department T&P, Principal T&P oversight
test count: 30 / 30 PASS (6 auth/setup + 3 journeys × 8 viewports)
screenshot path: apps/web/e2e/screenshots/training-placement/
```

Captured at 1920×1080, 1024×768, 390×844: Officer Dashboard, Placement Drive, Applications, Training Dashboard, Department Coordinator Dashboard, Principal T&P Overview.

Student LMS T&P routes remain available under `/lms/placements/*` (existing student surface). SMS/WhatsApp and external recruiter self-service remain deferred.

## Builds

```text
API build: PASS
Web build: PASS
```

## Feature Matrix

| Feature | Status |
| --- | --- |
| Unified T&P engine | PASS |
| T&P Officer | PASS |
| T&P Coordinator | PASS |
| Department Coordinator | PASS |
| Faculty capability inheritance | PASS |
| Student T&P | PASS |
| Principal oversight | PASS |
| Company master | PASS |
| Company history | PASS |
| Placement drives | PASS |
| Eligibility | PASS |
| Eligibility snapshot | PASS |
| Applications | PASS |
| Shortlisting | PASS |
| Selection pipeline | PASS |
| Tests/interviews | PASS |
| Offers | PASS |
| Multiple-offer policy | PASS (college policy flags; existing semantics) |
| Internships | PASS |
| Training programs | PASS |
| Training registration | PASS |
| Training attendance | PASS |
| Training assessment | PASS (API primitives) |
| Certification | DEFERRED (document issuance UX) |
| Notifications | PASS |
| Audit | PASS |
| Reports | PASS |
| Analytics | PASS |
| Department isolation | PASS |
| Tenant isolation | PASS |
| Student isolation | PASS |
| Concurrency | PASS |
| Responsive QA | PASS |
| Builds | PASS |
| Full regression | PASS |
| Frozen-domain regression | PASS |
| External recruiter portal | DEFERRED |
| SMS / WhatsApp | DEFERRED |
| AI resume scoring | DEFERRED |

## Freeze checklist

```text
✓ Existing T&P functionality audited/reused
✓ One unified T&P engine
✓ T&P Officer operational
✓ Coordinators operational
✓ Department coordinators operational
✓ Faculty capability inheritance proven
✓ Student T&P operational
✓ Principal oversight operational
✓ Companies operational
✓ Drives operational
✓ Eligibility server-authoritative
✓ Applications safe/idempotent
✓ Selection pipeline operational
✓ Offers private and correct
✓ Training operational
✓ Department isolation proven
✓ Tenant isolation proven
✓ Student isolation proven
✓ Audit proven
✓ Notifications proven
✓ Concurrency proven
✓ API build PASS
✓ Web build PASS
✓ T&P E2E PASS
✓ Frozen regressions PASS
✓ Full Regression Run 1 PASS
✓ Full Regression Run 2 PASS
✓ Responsive QA PASS
✓ Screenshot evidence captured
```
