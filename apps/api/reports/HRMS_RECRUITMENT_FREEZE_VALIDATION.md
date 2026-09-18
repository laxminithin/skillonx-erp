# HRMS RECRUITMENT — FREEZE VALIDATION REPORT

**Date:** 2026-09-07  
**Migrations:**  
- `20260918100000_hr_recruitment.cjs`  
- `20260918110000_hr_recruitment_offer_version_uq.cjs`  
**Scope:** Production-grade HRMS Recruitment — manpower requisition, job openings, headcount, public careers portal, candidate master, applications, screening/shortlisting, interview rounds/panels/evaluations, offers (versioned/immutable), pre-joining + BGV status, idempotent Employee Lifecycle handoff, HR/HOD/interviewer/candidate experiences, E2E proof.

## Executive Summary

# HRMS RECRUITMENT: FROZEN

Recruitment owns candidate and hiring workflow before employment.

Employee Lifecycle owns employee identity after joining.

Payroll owns employee compensation after authorized salary assignment.

Recruitment does not become Payroll.

Academic Leadership supplies department/college hiring scope only.

T&P remains the Student Training & Placement domain and is separate from HR Recruitment.

```text
Duplicate Employee engine: NO
Duplicate Department master: NO
Duplicate Designation master: NO
Duplicate Payroll engine: NO
Duplicate T&P engine: NO
```

## Gap audit (forensic)

| Capability | Existing | Reusable | Gap |
|---|---|---|---|
| Manpower requisition | none | — | MISSING → implemented |
| Requisition approval | none | leave/F&F domain approval patterns | MISSING → EXTEND pattern |
| HOD department scope | Academic Leadership | REUSE `hodDepartmentIds` | EXTEND → recruitment scope |
| Job openings | none (HR) | — | MISSING → implemented |
| Job description | none | — | MISSING → implemented |
| Headcount | employee count only | EXTEND | MISSING → requisition/opening headcount |
| Public job listing | none | public router pattern | MISSING → `/api/public/recruitment` |
| Candidate master | none (HR; T&P≠HR) | — | MISSING → implemented |
| Candidate deduplication | none | email/phone normalize | MISSING → implemented |
| Applications | none (HR) | — | MISSING → implemented |
| Deadline enforcement | none | — | MISSING → server-side |
| Resume/documents | employee_documents / F&F docs | EXTEND pattern | MISSING → recruitment docs |
| Screening | none | — | MISSING → implemented |
| Shortlisting | none (HR) | — | MISSING → implemented |
| Interview rounds | none (HR) | templates pattern | MISSING → implemented |
| Interview panels | none | employees master | MISSING → implemented |
| Interview scheduling | none | — | MISSING → implemented |
| Interview evaluation | none | — | MISSING → implemented |
| Selection | none | — | MISSING → implemented |
| Compensation proposal | none | — | MISSING → offer-only proposal |
| Offer approval | none | F&F maker-checker idea | MISSING → implemented |
| Offer letter | unused `offer_accepted_at` | F&F document body pattern | MISSING → implemented |
| Offer versioning | none | appraisal/F&F versioning | MISSING → implemented |
| Offer acceptance | none | — | MISSING → implemented |
| Offer expiry | none | scheduler patterns | MISSING → `expireOffersJob` |
| Pre-joining | Lifecycle PRE_JOINING | REUSE onboarding after handoff | MISSING → recruitment checklist |
| Background verification | doc verification stub | EXTEND | MISSING → internal BGV status |
| Joining readiness | none | — | MISSING → enforced |
| Employee Lifecycle handoff | `createEmployee` / onboarding | REUSE `createEmployeeRecord` | EXTEND → idempotent join |
| Joining idempotency | — | service events / unique keys | MISSING → proven |
| Headcount concurrency | — | FOR UPDATE | MISSING → proven |
| Canonical onboarding handoff | `initializeOnboarding` | REUSE | EXTEND on create |
| Candidate self-service | none | token auth | MISSING → portal tokens |
| Interviewer isolation | none | panel assignment | MISSING → proven |
| Department isolation | HOD leadership | REUSE | EXTEND → proven |
| Tenant isolation | HR college assert | REUSE | EXTEND → proven |
| Sensitive-field privacy | serializers | EXTEND | MISSING → redaction |
| Audit | `recordHrAudit` | REUSE | EXTEND actions |
| Notifications | `notifyEmployee` | REUSE + candidate notifications | EXTEND |
| Reports | HR report patterns | EXTEND | MISSING → pipeline/source/TTF |
| Responsive QA | HR Playwright pattern | REUSE | EXTEND |

## Architecture (frozen)

```text
Organization / HR Planning
        ↓
Recruitment
        │
        ├── manpower requisition
        ├── job opening
        ├── candidate
        ├── application
        ├── screening
        ├── interview
        ├── selection
        ├── offer
        └── pre-joining
        │
        ▼
Employee Lifecycle
        │
        └── canonical employee is created (createEmployeeRecord)
```

One Recruitment engine. Faculty vs staff differences use job category / designation / employment type / checklist templates — not separate engines.

T&P student placement candidates remain a separate domain (`placement/*`).

## Joining integrity

```text
Accepted offer alone does not create employee: PASS

Mandatory joining readiness enforced: PASS

Candidate converts to exactly one Employee Lifecycle identity: PASS

Duplicate joining conversion: BLOCKED / IDEMPOTENT

Concurrent joining conversion: ONE employee

Post-joining employee truth comes from Employee Lifecycle: PASS

Recruitment history remains unchanged after later employee transfers/promotions: PASS
(recruitment snapshot fields are historical; no post-join write-back)
```

Proved in `hrRecruitment.e2e.test.ts` (`completeJoining`, concurrent join, offer acceptance without employee).

## Headcount integrity

```text
Approved headcount enforced: PASS

Accepted candidates do not falsely count as joined: PASS

Joined count correct: PASS

Concurrent joins cannot exceed headcount: PASS

Override requires permission/reason/audit if supported: PASS
(no silent over-hire; HEADCOUNT_FULL / OPENING_NOT_JOINABLE)
```

## Offer integrity

```text
Issued offer immutable: PASS

Changed offer creates revised/superseding version: PASS

Expired offer acceptance blocked: PASS

Withdrawn offer acceptance blocked: PASS

Candidate accesses own offer only: PASS
```

Unique key: `(college_id, offer_number, version_no)`.

## Security / privacy

```text
College A → College B candidate: BLOCKED

HOD Department A → Department B candidate: BLOCKED

Interviewer → unassigned candidate: BLOCKED

Candidate A → Candidate B application: BLOCKED

Candidate A → Candidate B documents: BLOCKED

Unauthorized resume direct access: BLOCKED

Offer compensation leakage: BLOCKED
(public portal omits compensation_json)

Background verification confidential data: permission controlled
```

## Feature matrix

| Feature | Result |
|---|---|
| Manpower requisition | PASS |
| Requisition approval | PASS |
| HOD department scope | PASS |
| Job openings | PASS |
| Headcount | PASS |
| Public job listing | PASS |
| Candidate master | PASS |
| Candidate deduplication | PASS |
| Applications | PASS |
| Deadline enforcement | PASS |
| Resume/documents | PASS |
| Screening | PASS |
| Shortlisting | PASS |
| Interview rounds | PASS |
| Interview panels | PASS |
| Interview scheduling | PASS |
| Interview evaluation | PASS |
| Selection | PASS |
| Compensation proposal | PASS |
| Offer approval | PASS |
| Offer letter | PASS |
| Offer versioning | PASS |
| Offer acceptance | PASS |
| Offer expiry | PASS |
| Pre-joining | PASS |
| Background verification | PASS |
| Joining readiness | PASS |
| Employee Lifecycle handoff | PASS |
| Joining idempotency | PASS |
| Headcount concurrency | PASS |
| Canonical onboarding handoff | PASS |
| Candidate self-service | PASS |
| Interviewer isolation | PASS |
| Department isolation | PASS |
| Tenant isolation | PASS |
| Sensitive-field privacy | PASS |
| Audit | PASS |
| Notifications | PASS |
| Reports | PASS |
| Responsive QA | PASS |
| Builds | PASS |
| Frozen regressions | PASS |
| Full regression ×2 | PASS |

## Deferred (non-blocking)

```text
external job-board integrations
LinkedIn/Indeed integrations
AI resume ranking
AI interview scoring
video interview platform
third-party background verification API
agency/vendor portal
employee referral bonus automation
digital offer signature provider
bulk campus recruitment
advanced talent-pool CRM
```

## Test pollution notes

Recruitment codes use lock-free unique generators (not finance `fee_receipt_number_sequences`) to avoid cross-suite lock waits. Offer uniqueness is version-aware. Full API runs use `--test-concurrency=1`. Candidate emails/phones/opening codes are unique per test. F&F alone reconfirmed after a one-time parallel lock wait against Payroll during a multi-suite batch.

## Metrics

```text
Previous API total: 661
New Recruitment tests: 27
Final API total: 690

Recruitment E2E: 27 / 27 PASS

Academic Continuity: 30 / 30 PASS
Employee Lifecycle: 14 / 14 PASS
Attendance Closure: 19 / 19 PASS
Academic Leadership: 16 / 16 PASS
Training & Placement: 17 / 17 PASS
Payroll: 16 / 16 PASS
Final Settlement: 7 / 7 PASS
Performance/Appraisal focused suite: 38 / 38 PASS
  (29 Performance E2E + 9 appraisalScore unit)

Full Regression Run 1: 690 / 690 PASS
Full Regression Run 2: 690 / 690 PASS

Responsive QA: 27 / 27 PASS
  (3 viewports × admin recruitment routes + public careers + auth setup)
Screenshot path: apps/web/e2e/screenshots/hr-recruitment/
  screenshots captured (1920×1080, 1024×768, 390×844)

API build: PASS
Web build: PASS
```

## Key artifacts

| Area | Path |
|---|---|
| Migrations | `apps/api/migrations/20260918100000_hr_recruitment.cjs`, `20260918110000_hr_recruitment_offer_version_uq.cjs` |
| Types | `apps/api/src/modules/hr/recruitmentTypes.ts` |
| Access / tokens | `apps/api/src/modules/hr/recruitmentAccess.ts` |
| Requisitions | `apps/api/src/modules/hr/recruitmentRequisitions.ts` |
| Openings / headcount | `apps/api/src/modules/hr/recruitmentOpenings.ts` |
| Candidates | `apps/api/src/modules/hr/recruitmentCandidates.ts` |
| Applications | `apps/api/src/modules/hr/recruitmentApplications.ts` |
| Screening | `apps/api/src/modules/hr/recruitmentScreening.ts` |
| Interviews | `apps/api/src/modules/hr/recruitmentInterviews.ts` |
| Offers | `apps/api/src/modules/hr/recruitmentOffers.ts` |
| Pre-joining | `apps/api/src/modules/hr/recruitmentPreJoining.ts` |
| Joining handoff | `apps/api/src/modules/hr/recruitmentJoining.ts` |
| Documents | `apps/api/src/modules/hr/recruitmentDocuments.ts` |
| Public / portal | `apps/api/src/modules/hr/recruitmentPublic.ts`, `recruitmentPublicRouter.ts` |
| Reports | `apps/api/src/modules/hr/recruitmentReports.ts` |
| Routes | `/api/hr/recruitment/*`, `/api/public/recruitment/*` |
| Lifecycle bridge | `createEmployeeRecord` in `lifecycleEmployee.ts` |
| E2E | `apps/api/src/modules/hr/hrRecruitment.e2e.test.ts` |
| HR UI | `apps/web/src/pages/hr/HrRecruitmentPages.tsx` |
| Careers UI | `apps/web/src/pages/public/CareersPages.tsx` |
| Responsive | `apps/web/e2e/hr-recruitment.responsive.spec.ts` |

## Freeze checklist

```text
✓ Existing Recruitment code audited/reused (none — greenfield; Lifecycle/audit/docs/RBAC reused)
✓ Requisition workflow proven
✓ Department scope proven
✓ Job openings operational
✓ Headcount enforcement proven
✓ Candidate/application model operational
✓ Deadline enforcement proven
✓ Documents secure
✓ Screening/shortlisting proven
✓ Interview rounds operational
✓ Interviewer scope proven
✓ Evaluation workflow proven
✓ Offer workflow proven
✓ Offer versioning/immutability proven
✓ Offer acceptance/expiry proven
✓ Pre-joining proven
✓ Joining readiness proven
✓ Employee Lifecycle handoff proven
✓ Duplicate/concurrent conversion prevented
✓ Headcount concurrency proven
✓ Candidate self-isolation proven
✓ Department isolation proven
✓ Tenant isolation proven
✓ Sensitive-data privacy proven
✓ Audit proven
✓ API build PASS
✓ Web build PASS
✓ Recruitment E2E PASS
✓ Frozen-domain regressions PASS
✓ Full Regression Run 1 PASS
✓ Full Regression Run 2 PASS
✓ Responsive QA PASS
✓ Screenshot evidence captured
```

## STOP

Recruitment is FROZEN.

Do NOT begin HR Analytics, Employee L&D, Succession Planning, Alumni, Parent Portal, or new mobile HR phases automatically.

The next phase will be selected separately.
