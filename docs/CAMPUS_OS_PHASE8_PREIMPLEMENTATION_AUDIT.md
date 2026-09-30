# Campus OS Phase 8 — Grievance, Helpdesk & Institutional Case Management
## Pre-Implementation Audit

Date: 2026-09-25. Branch: `feat/examination-coe-operational-backend`.

## Verified starting baseline

Read directly from `docs/CAMPUS_OS_PHASE7_FREEZE_VALIDATION.md`:

> Full backend regression (`npm test` in `apps/api`, single-concurrency):
> **249 suites / 1,473 tests / 1,473 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED
> / 0 TODO**, exit code 0, ~44.9 min.

This matches the prompt's claimed baseline exactly. No discrepancy found.

## Headline finding

**A full, frozen, general-purpose institutional case-management engine
already exists**: `apps/api/src/modules/studentServices/grievances.ts`
(833 lines) on table `student_grievances` + 10 satellite tables, frozen
2026-09-14 per `docs/GRIEVANCE_STUDENT_WELFARE_FREEZE_VALIDATION.md`. Its
own freeze doc explicitly frames it as "the canonical case engine" and
already documents integration **boundaries** (not duplication) with
Maintenance/Mentoring/Office/Finance/COE/Hostel/Transport/Library/Lab/T&P —
i.e. this is already almost exactly the architecture Phase 8 describes:

```
Case → Category/Routing → Assignee/Queue → Communication → Escalation →
Resolution → Closure/Feedback
```

Building a new, parallel "Case Management" engine would be a direct,
prohibited duplication (prompt §3, §100). Anything Phase 8 does must
extend this engine's proven boundary, not fork it.

## Audit by business concept (24 questions)

| # | Question | Status | Evidence |
|---|---|---|---|
| 1 | Generic ticket/case engine exists? | EXISTS (two) | `student_grievances` case engine (studentServices) — full triage/assignment/SLA/escalation/communication/confidentiality/appeal/feedback lifecycle. Separate, narrower `maintenance/tickets.ts` (`service_tickets`) — physical/IT-asset-scoped ticketing with its own SLA engine (`maintenance/sla.ts`). |
| 2 | `student_service_requests` serve this purpose? | PARTIAL, by design NOT the case engine | `studentServices/requestEngine.ts` — a typed request+approval catalog (certificates, profile correction, leave/permission), states DRAFT→SUBMITTED→UNDER_REVIEW→ACTION_REQUIRED→APPROVED/REJECTED→PROCESSING→READY→COMPLETED/CANCELLED. Deliberately separate from grievances because requests don't need triage/assignment/confidentiality/appeal. |
| 3 | Maintenance generic service tickets? | PARTIAL/BOUNDARY | `maintenance/tickets.ts` — real ticket engine (category, priority, assignee/team, SLA ack/resolve, routing, source-module linkage) but scoped to physical facilities/IT assets. Its own freeze doc states Maintenance roles do not receive raw grievance narrative — an intentional boundary, not a gap. |
| 4 | Grievances implemented? | EXISTS (canonical, frozen) | `student_grievances` + `grievances.ts`. |
| 5 | Complaints implemented? | EXISTS, fragmented | `hostel/complaints.ts` (`hostel_complaints`), `transport/complaints.ts` (`transport_complaints`) — simple OPEN/RESOLVED tables, independent of the grievance engine (by design — operational, not casework). |
| 6 | Helpdesk functionality present? | PARTIAL | Maintenance functions as the IT/facilities helpdesk (`docs/MAINTENANCE_FACILITIES_IT_HELPDESK_FREEZE_VALIDATION.md`). No module/route literally named "helpdesk"; grep for `HELPDESK` across `apps/api/src` and `apps/web/src` returns nothing. |
| 7 | Departmental queues present? | EXISTS | Grievance routing by category→role/module (`ROUTING` map, `grievances.ts`); maintenance routing by category/team (`maintenance/routing.ts`). |
| 8 | Assignment/reassignment present? | EXISTS | `student_grievance_assignments` table, `assignGrievanceSchema`; maintenance `assignedTo`/`teamId`. |
| 9 | Escalation present? | EXISTS, manual only | `escalateGrievance(actor, grievanceId, toRole, reason, isAutomatic)` writes to `student_grievance_escalations`; the `isAutomatic` flag exists on the row, but **no scheduler or SLA-breach trigger calls it automatically** anywhere in the codebase (confirmed: only `hr/scheduler.ts` runs a background job; nothing references `escalateGrievance` outside the manual API path) — a real, narrow, provable gap. |
| 10 | SLA tracking present? | EXISTS (two implementations) | Grievance: `response_sla_hours`/`resolution_sla_hours` per category (`categoryPolicy`). Maintenance: `maintenance/sla.ts` — more mature, with ack/resolve due dates, pause tracking, breach state (`computeState`, `overallSlaState`). |
| 11 | Case communication/history present? | EXISTS | `student_grievance_events`, `student_grievance_messages`, `student_grievance_notes` (TEAM/RESTRICTED visibility tiers). |
| 12 | Attachments/evidence supported? | EXISTS, deliberately NOT via documentEngine | Grievance module built its own `student_grievance_attachments` table with secured download rather than adopting the generic `documentEngine` — an explicit, documented choice in its freeze doc, not an oversight. `documentEngine` remains available generically for anything else Phase 8 might need. |
| 13 | Anonymous complaints supported? | MISSING (explicitly deferred) | Freeze doc: "Anonymous reporting remains intentionally disabled until reporter identity separation exists; UI/API do not falsely claim anonymous mode." `anonymous` boolean exists in `createGrievanceSchema` but is not functionally wired. Reusable precedent: `surveys/service.ts` `IDENTITY_MODES` (real identity-separation pattern), not yet applied here. |
| 14 | Confidential/restricted cases supported? | EXISTS | Grievance `confidentiality`: NORMAL/CONFIDENTIAL/RESTRICTED (`normalizeConfidentiality`, `RESTRICTED_CATEGORIES`), with tested RBAC boundaries denying HOD/Principal/Management/Accountant/COE/Office/Maintenance/Librarian/Warden/Transport/T&P/HR/Faculty raw access. |
| 15 | Appeal/reopen supported? | EXISTS | `appealSchema`, `reopenSchema`, `student_grievance_appeals`, `REOPENED` status. |
| 16 | Feedback after closure supported? | EXISTS | `feedbackSchema` (ACCEPTED/UNRESOLVED) in `studentServices/types.ts`. |
| 17 | Parent-originated requests supported? | EXISTS for requests, MISSING for grievances | `parent/service.ts` reuses `requestEngine.ts`'s `createParentInitiatedRequest`/`submitParentInitiatedRequest`/`parentActionOnRequest` for leave-style requests only. A parent cannot raise a grievance/case. |
| 18 | Student-originated requests supported? | EXISTS | Both `requestEngine.ts` and `grievances.ts` are student-originated. |
| 19 | Faculty-originated requests supported? | PARTIAL | `FacultyRequesterActor` type exists in `studentServices/types.ts`; maintenance tickets accept `requesterType` faculty/staff. No faculty-grievance path exists. |
| 20 | Alumni-originated requests supported? | MISSING | No grievance/case linkage anywhere in `apps/api/src/modules/alumni`. |
| 21 | Cross-domain links supported (pattern)? | EXISTS, proven pattern | Grievance `sourceModule`/`sourceEntityType`/`sourceEntityId` + `referralSchema` (`targetModule`/`targetEntityType`/`targetEntityId`/`safeReference`/`safeSummary`); identical convention in `maintenance/tickets.ts` and `documentEngine` (`entityType`/`entityId`). This is the established, reusable no-FK cross-module reference pattern. |
| 22 | Institutional Helpdesk web workspace exists? | MISSING as a distinct entity | Existing surfaces: `/lms/services/grievances(/new\|/:id)` (student), `/student-services/grievances(/:id)` (staff), `apps/web/src/layouts/MaintenanceLayout.tsx` (maintenance tickets). No `/helpdesk` or `/cases` unifying route. |
| 23 | Workflows that MUST NOT be duplicated | See table below. |
| 24 | Exact remaining gap | See "Gaps" below. |

### Authoritative ownership — must not be duplicated

| Workflow | Authoritative owner |
|---|---|
| Exam revaluation/challenge/grievance | `examination/revaluation.ts` (`exam_revaluation_requests`) — frozen COE lifecycle; grievance module only cross-references it via `EXAMINATION` category, never raw narrative |
| Hostel leave/outpass, complaints | `hostel` module (`hostel_complaints` + separate leave/outpass tables) |
| HR leave | `hr/leave.ts`, `leaveCalc.ts`, `leaveCoverage.ts` |
| Maintenance work orders | `maintenance/tickets.ts` (`service_tickets`) |
| Finance refunds/receipts | `finance/scholarships.ts` (`listStudentRefunds`) and other Finance transaction tables |
| Student grievances/welfare | `studentServices/grievances.ts` (`student_grievances`) — the canonical, frozen case engine |

## Gaps (real, narrow, provable)

1. **No SLA-breach auto-escalation trigger.** `escalateGrievance`'s
   `isAutomatic` flag exists but nothing calls it — escalation is
   currently 100% manual.
2. **No non-student case originators.** Faculty and Alumni cannot raise a
   case at all; Parent can only raise a leave-style *request*
   (`requestEngine`), not a grievance/case.
3. **No unifying "Helpdesk & Cases" web workspace** spanning Maintenance
   tickets + Student Services grievances for an operator who needs to see
   both (today they are two separate portals by design/boundary).
4. **No true anonymous reporting** — explicitly deferred by the prior
   freeze pending a real identity-separation design (Survey's
   `IDENTITY_MODES` is the proven pattern, not yet applied here).
5. **No HR disciplinary/grievance case workflow** — HR only has leave
   management; staff-vs-staff or staff disciplinary casework has no home.
6. **No Finance query/dispute case workflow** — only transactional
   refund/receipt records exist, no "I have a question about my fee"
   case path (though `FINANCE` may already be a grievance category via
   the boundary pattern — needs confirming before treating as a gap).

None of these are proven institutional requirements from user-supplied
context — they are gaps *relative to the Phase 8 prompt's aspirational
scope*, not gaps a stakeholder has asked for. Per prompt §101/§54,
several of these (anonymous reporting, specialized HR/Finance case
workflows) are legitimate `DEFERRED`/`NOT_CONFIGURED` outcomes unless
proven otherwise.

## Architecture decision

Given the headline finding, the smallest-correct options are narrower than
Phase 7's:

- **Option D — no substantial new engine required** for the core ask
  (grievance/complaint/helpdesk casework): it already exists, is frozen,
  and already implements categories, routing, queues, assignment,
  lifecycle, SLA, escalation (manual), confidential/restricted tiers,
  appeal/reopen, feedback, and cross-domain safe-reference linking to
  every other domain named in the prompt (exam, hostel, maintenance,
  finance, HR-adjacent).
- **Option B — narrow, additive closure** is justified only for the
  specific real gaps above (#1–3), each independently small: wire an
  SLA-breach scheduler to the existing `isAutomatic` escalation path,
  add FACULTY/ALUMNI/PARENT originator support to the existing engine
  (not a new one), and/or add a unifying read-only Helpdesk dashboard
  web route over the two existing engines.

This is a genuine scope decision, not an implementation detail — see
chat for the question posed to the user before any code is written.
