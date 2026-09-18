# Grievance & Student Welfare Freeze Validation

Audit date: 2026-09-14  
Repository: `/Users/nithinkswamy/Documents/GitHub/Survey`

## Decision

**FROZEN**

Grievance & Student Welfare is frozen as the canonical case engine for student grievance and welfare concerns. The implementation preserves the existing Student Services entry points, adds dedicated grievance/welfare operational roles, keeps restricted confidentiality intact, adds secured case attachments, and completes the requested backend, responsive, performance, and regression gates.

## Architecture

One canonical case engine is implemented on `student_grievances`, with additive evidence tables:

- `student_grievance_sequences`
- `student_grievance_categories`
- `student_grievance_assignments`
- `student_grievance_events`
- `student_grievance_messages`
- `student_grievance_notes`
- `student_grievance_referrals`
- `student_grievance_resolutions`
- `student_grievance_appeals`
- `student_grievance_attachments`

The old `/api/student/grievances` and `/api/student-services/grievances` routes remain compatible. New/extended routes cover categories, dashboard, analytics, triage, assignment, clarification, internal notes, safe referrals, feedback, reopen, appeal, and attachment download.

## Boundary Decisions

| Area | Classification | Finding |
|---|---|---|
| `studentServices/grievances.ts` | EXTEND | Existing grievance flow remains the canonical case entry point. |
| Attachments | EXTEND | Added grievance-specific attachment metadata and secured download authorization; no generic attachment engine was introduced. |
| Maintenance Helpdesk | BOUNDARY / INTEGRATE | Facilities cases carry safe linked references; Maintenance roles do not receive raw grievance narrative by default. |
| Mentoring | BOUNDARY / INTEGRATE | Mentoring referrals can become welfare cases; mentors do not automatically receive confidential case details. |
| Office Administration | BOUNDARY | Administrative service processing stays in Office; grievance can reference administrative concerns without duplicating Office workflow. |
| Finance | BOUNDARY | Finance grievances can reference fee/demand/payment entities; Accountant does not get raw narrative and finance truth is not mutated. |
| COE / Examination | BOUNDARY | Exam grievances can reference exam/revaluation entities; COE does not get raw narrative and marks/results are not mutated. |
| Hostel / Transport / Library / Lab / T&P | BOUNDARY | Operational modules remain canonical; grievance records concern, routing, safe reference, status, and audit. |
| Anonymous reporting | DEFERRED | Explicitly rejected until reporter identity separation exists; UI/API do not falsely claim anonymous mode. |

## Role Model

Implemented dedicated operational roles:

- `GRIEVANCE_OFFICER`
- `STUDENT_WELFARE_OFFICER`

Supported participants:

- Student
- HOD with department-scoped non-restricted academic/general access
- Principal for oversight, without unrestricted raw access to restricted cases
- Management for de-identified aggregate analytics only
- SUPER_ADMIN as configuration-only, not default handler

Unauthorized destination roles are denied raw grievance/attachment access in tests: Accountant, COE, Office Admin, Maintenance, Librarian, Warden, Transport, T&P, HR, Faculty/Mentor, Management, and Super Admin.

## Confidentiality

Implemented levels:

- `NORMAL`
- `CONFIDENTIAL`
- `RESTRICTED`

Restricted cases:

- Do not appear to HOD by department membership alone.
- Do not expose narratives or restricted attachment metadata to Management.
- Do not expose raw narrative or restricted attachments to Principal automatically.
- Log privileged access/mutations through case events and Student Services audit.

## Evidence

| Gate | Result | Evidence |
|---|---:|---|
| Migration | PASS | `npm run migrate -w @skillonx/survey-api` applied `20260930110000_grievance_case_attachments.cjs` |
| API build / TypeScript | PASS | `npm run build -w @skillonx/survey-api` |
| Web build / TypeScript | PASS | `npm run build -w @skillonx/survey-web` |
| Focused backend closure suite | **60/60 PASS** | `node --import tsx --test apps/api/src/modules/studentServices/grievanceStudentWelfare.e2e.test.ts` |
| Case number concurrency | PASS | Scenario 30 |
| Assignment concurrency | PASS | Scenario 31 |
| Attachment security | PASS | Scenarios 39-60: owner access, officer access, restricted denial, path traversal guard, missing-file handling, metadata-only payloads |
| Privacy/RBAC matrix | PASS | Student/HOD/officer/welfare/principal/management positives plus destination-role denials |
| Responsive QA | **64/64 PASS** | `npx playwright test apps/web/e2e/grievance-student-welfare.responsive.spec.ts --config apps/web/playwright.config.ts` |
| Screenshot evidence | PASS | Desktop/mobile screenshots in `apps/web/e2e/screenshots/grievance-student-welfare` |
| Performance | PASS | Dashboard avg 2.3ms/p95 4.0ms; queue avg 3.7ms/p95 5.3ms; analytics avg 1.6ms/p95 2.1ms |
| Targeted frozen regression | PASS | 138/138 across Student Services, Mentoring, Maintenance, Office, Finance, Examination, Hostel, Transport, Library, Lab, Placement |
| Broad backend regression | **PASS** | `npm test -w @skillonx/survey-api`: 1060/1060, 197 suites, 0 failed |

## UI

Student LMS surface:

- `/lms/services/grievances`
- `/lms/services/grievances/new`
- `/lms/services/grievances/:id`

Staff workspace:

- `/student-services/grievances`
- `/student-services/grievances/:id`

Implemented UX capabilities include case category, confidentiality and urgency controls, supportive submission language, case reference display, timeline and conversation, clarification response, safe resolution display, feedback, reopen/appeal path, staff dashboard buckets, queue filters, triage, assignment, referral, internal notes, resolution, and attachment metadata/download links.

## Notes

- Anonymous reporting remains intentionally disabled until reporter identity separation exists.
- Category configuration UI can evolve later; backend category support exists.
- Committee membership can evolve later; current freeze uses dedicated officer roles and explicit authorization boundaries.

## Final Decision

**GRIEVANCE & STUDENT WELFARE FROZEN**

The module meets the closure bar without redesigning the canonical case engine, creating a second grievance system, adding a generic attachment subsystem, or weakening confidentiality.
