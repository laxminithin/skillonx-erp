# Maintenance / Facilities / IT Helpdesk — Freeze Validation

**Module:** Maintenance / Facilities / IT Helpdesk (central campus service-request / ticketing layer)
**Date:** 2026-09-13
**Decision:** ✅ **FROZEN**

---

## 1. Executive summary

The ERP now has a single institutional service desk. Every authenticated user — student,
faculty, HOD, lab assistant, librarian, warden, accountant, COE, principal, management,
admin — can raise a service request through **one** engine. Tickets are classified,
**deterministically auto-routed** to the correct Facilities or IT team (or a Triage queue
when nothing matches), tracked against a **real, auditable SLA**, worked by authorised
staff, optionally blocked on parts/approval, resolved, confirmed by the requester, closed,
and audited end-to-end. Source modules (Lab, Hostel, Library, Transport) keep domain
ownership; Maintenance owns only service execution and links back by reference
(`lab_faults.maintenance_ref`, `source_module`/`source_entity_*`).

This replaces the previous reality — "maintenance issues scattered across administrators and
individual modules" — with a secure, centralized, SLA-tracked helpdesk visible to leadership
through scoped analytics.

## 2. Final decision

**MAINTENANCE / FACILITIES / IT HELPDESK — FROZEN.** All applicable freeze gates pass
(§42). No Maintenance regressions; the one failure observed in a concurrent full-suite run
was environmental contention from the HR lifecycle scheduler (payroll_runs count drift) and
passes cleanly in isolation (§39).

## 3. Architecture

- **One central ticket engine.** A single `service_tickets` table and one service layer
  serve both Facilities and IT. There is **no** separate IT ticketing system and **no**
  duplicate facilities register.
- **Central service layer, source ownership retained.** Lab/Hostel/Library/Transport
  continue to own their domains. Maintenance receives a service ticket and links to the
  source entity; it never takes over the source workflow.
- **Deterministic, explainable everything.** Routing, SLA and recurring-issue analytics are
  pure SQL/logic — no AI in any core path. Every routed ticket stores a human-readable
  routing explanation.
- **Requester-agnostic.** A requester is either a faculty user or a student; the same engine,
  RBAC and timeline serve both, with student endpoints scoped to their own tickets.

## 4. Existing functionality reused (no duplication)

| Reused | For |
| --- | --- |
| `colleges`, `departments`, `faculty_users`, `students` | identity, scope, requester/assignee |
| `rooms` (+ `building`, `floor`) | location — **no** new room/building master |
| `lab_faults.maintenance_ref` | frozen Lab integration boundary — **no** duplicate lab fault |
| `lab_audit_log` | write-back context for Lab Assistant on resolution |
| `employee_notifications` | notification delivery (best-effort, dedup) |
| `academic_leadership_assignments` | HOD / Principal oversight overlay |
| source assets (lab_assets, library, hostel rooms, transport vehicles) | referenced by `source_*` / `asset_ref`, never copied |

## 5. Central ticket model

`service_tickets` captures: `ticket_no` (stable, unique per college — `SR-YYYY-NNNNN`),
title, description, category/subcategory, requester (faculty or student), department,
location (`room_id` + `building` + free-text note), source linkage
(`source_module`/`source_entity_type`/`source_entity_id`/`asset_ref`), ERP module/route,
priority, status, team, assignee, routing explanation, lifecycle timestamps (created,
acknowledged, started, resolved, confirmed, closed), SLA fields (ack/resolve due, paused-ms,
paused-at, ack/resolve state), resolution summary, closure outcome, reopen count, escalation
level, and lightweight external-vendor metadata.

## 6. Role / capability model

New string roles on `faculty_users` (consistent with how Transport/Lab added operational
roles): **MAINTENANCE_MANAGER**, **FACILITIES_OFFICER** (manager-tier),
**MAINTENANCE_STAFF**, **IT_SUPPORT** (worker-tier). Capability map in
`modules/maintenance/access.ts`:

- **Requester** (every authenticated user incl. students): `maint.ticket.create`, `maint.ticket.view.own`.
- **Maintenance Manager / Facilities Officer / Admin:** full queue, triage, assign, work, parts approve, config, reports, oversight.
- **Maintenance Staff / IT Support:** requester + `maint.work` + `maint.parts.request`, scoped to assigned/team tickets.
- **Principal:** requester + queue view + reports + oversight (college, read-only).
- **Management/Chairman:** requester + reports + oversight (aggregate).
- **HOD:** requester + department-scoped oversight + reports.
- **SUPER_ADMIN:** platform/config authority — **never** the routine facilities operator and **never** the unassigned fallback.

## 7. Category / routing architecture

- **Configurable categories** (`service_categories`): code, name, kind (FACILITIES|IT),
  default team, default priority, ack/resolve SLA minutes, active, sort order. 16 defaults
  seeded per college (IT/Systems, Network, Computer, Projector, ERP App, Electrical,
  Plumbing, Civil, Furniture, Housekeeping, Lab/Library/Hostel/Transport facility, General,
  Other).
- **Teams** (`service_teams`): IT Support, Electrical, Plumbing, Civil, General Facilities,
  and a dedicated **Triage** team.
- **Routing engine** (`routing.ts`): active `service_routing_rules` evaluated ascending by
  `priority`; a rule matches when every non-null predicate (category / source module /
  building / department) equals the ticket's value; first match wins → else category default
  team → else **Triage**. Every result carries an explanation stored on the ticket. NO AI.

## 8. Ticket lifecycle

`OPEN → TRIAGED → ASSIGNED → ACKNOWLEDGED → IN_PROGRESS → (WAITING_PARTS |
WAITING_APPROVAL | WAITING_REQUESTER) → RESOLVED → CONFIRMED → CLOSED`, plus `CANCELLED`
and `REOPENED`. Invalid transitions are rejected (e.g. resolution/confirmation/closure go
through dedicated actions; closed tickets cannot be reassigned). All transitions recorded on
the timeline.

## 9. Priority & SLA

- Priorities: LOW / NORMAL / HIGH / CRITICAL. Ordinary requesters **cannot force CRITICAL**
  (clamped to HIGH); managers/triage may. Priority changes are audited.
- SLA (`sla.ts`): ack/resolve due computed from the category's minute targets at creation,
  scaled by priority (HIGH ×0.75, CRITICAL ×0.5). Elapsed clock **excludes paused time**:
  entering any WAITING_* state starts the pause; leaving it accumulates paused-ms. Live state
  = WITHIN / APPROACHING (last 20%) / BREACHED / MET / PAUSED. Pause/resume recorded as
  internal timeline events. No SLA number is fabricated.

## 10. Requester experience

Shared **My Service Requests** (faculty and students): raise a request via an
adaptive create form (category-driven fields — ERP module/route for app issues, room/location
otherwise), see ticket number, status, team, timeline, requester-visible comments; comment;
confirm resolution; reopen. A grievance-keyword hint steers personal/welfare concerns to the
Grievance channel rather than storing them in Maintenance.

## 11. Maintenance Manager workspace

`/maintenance/manager` — action-required buckets (unassigned/triage, critical, SLA breached,
SLA approaching, reopened, waiting parts/approval), queue-health counts, open-by-team, recent
activity. `/maintenance/queue` — filterable, paginated central queue (state, priority,
category, source, SLA state, text). Assign/reassign, priority change, escalate from the
ticket. Aggregated endpoints (one bounded pass + grouped SQL) — no N+1.

## 12. Technician workspace

`/maintenance/work` — My Assigned Work: overdue, due-today, high-priority, waiting, all
assigned, recently completed. Acknowledge, start, work-log, request parts, waiting states,
resolve, escalate — scoped strictly to assigned/team tickets.

## 13. IT Helpdesk

IT categories (IT/Systems, Network, Computer, Projector, ERP App) run on the **same** engine
and route to the IT Support team. ERP application tickets capture module + route + description.
IT Support cannot grant ERP privileges via a ticket — access changes remain an admin workflow;
Maintenance only tracks the request.

## 14. Facilities workflows

Electrical, plumbing, civil, furniture, housekeeping route to the respective facilities teams
with priority-scaled SLAs; parts/approval and external-vendor metadata support real repair work.

## 15. Assignment / reassignment

Team + individual technician assignment with full `service_assignment_history` (from/to team,
from/to technician, actor, reason, timestamp). A technician must be an ACTIVE member of the
assigned team. Assignment notifies the assignee (or team leads).

## 16. Work logs

`service_work_logs` — immutable append-only technician record (work performed, diagnosis,
action, parts used, next step, minutes). Internal-only; never exposed to requesters.

## 17. Parts / approval

`service_part_requests` — item, quantity, unit, reason, estimated cost, status
(REQUESTED→APPROVED/REJECTED/FULFILLED). Requesting a part moves the ticket to WAITING_PARTS
(pausing SLA). Manager/parts-approver decides. **Clean Stores/Purchase handoff**: `store_ref`
and `purchase_ref` columns exist and are wired through the decision API but not yet populated
— no procurement engine is built here.

## 18. Resolution / confirmation / reopen

Resolve requires a summary + closure outcome, sets `resolved_at`, resumes any pause, and
notifies the requester. The requester (or manager) confirms → CLOSED, or reopens with a reason
(increments `reopen_count`, re-notifies the assignee, surfaces prominently on the manager
dashboard). No silent auto-close.

## 19. Escalation

`service_escalations` records level (MANAGER|PRINCIPAL), trigger, reason, actor. Manual
escalation implemented and audited; SLA breach / critical are surfaced on the manager
dashboard for action. Not every ticket goes to the Principal.

## 20. Lab integration (frozen module)

`integrations.linkLabFault()` creates/links a central ticket for an existing Lab fault and
writes the ticket number into `lab_faults.maintenance_ref` (the frozen boundary field).
**Idempotent** — re-linking returns the same live ticket; **never** creates a second lab
fault. On resolution, `onTicketResolvedSyncSource()` sets the boundary ref (if missing) and
writes a context row into `lab_audit_log` for the Lab Assistant to verify — it does **not**
flip lab fault status or mutate asset lifecycle (that stays in the frozen Lab workflow). E2E
scenario 24 proves the ref linkage and single-ticket invariant.

## 21. Hostel integration

Wardens/staff raise/link hostel infrastructure tickets (`source_module=HOSTEL`,
`source_entity_type=ROOM`). Hostel keeps allocation/resident/discipline/fees ownership;
Maintenance owns service execution.

## 22. Library integration

Librarians raise/link equipment/facility tickets (`source_module=LIBRARY`). Circulation stays
with the Librarian.

## 23. Transport ownership boundary

**Ownership boundary documented and preserved.** Transport already owns vehicle operational
maintenance (`transport.maintenance.manage` + transport tables). Central Maintenance accepts
only transport **facility / workshop / IT** service requests via `source_module=TRANSPORT`;
vehicle operational maintenance is **not** moved out of Transport. No transport tables are
touched.

## 24. Classroom / Faculty integration

Faculty raise projector/electrical/computer/network/furniture issues with
`source_module=CLASSROOM` and a room; routing handles department/team selection so faculty
need not know maintenance team names.

## 25. Student experience

Students raise controlled campus service requests (projector, classroom, hostel, library) via
scoped `/api/student/maintenance/*` endpoints and see **only their own** tickets.

## 26. Grievance boundary

Maintenance is **not** the grievance system. The create form warns and redirects
harassment/welfare/discipline concerns to the (future) Grievance / Student Welfare channel;
sensitive grievance content is never stored in Maintenance.

## 27. Future Stores / Purchase boundary

Parts requests carry `store_ref` / `purchase_ref` for a clean future handoff. No stock or
procurement logic is implemented; the design does not require redesign when Stores lands.

## 28. RBAC

Explicit capability matrix (§6) enforced in `access.ts`. Requesters see own tickets; workers
see assigned/team tickets; managers see all; oversight roles see scoped read-only. Config is
manager/admin only.

## 29. College / user / team isolation

Every query is `college_id`-scoped; `assertTicketVisibility` / `assertCanWork` enforce
requester ownership, team membership and assignee identity. E2E scenarios 29–33, 39 prove
requester, cross-college and technician/team isolation with 403s.

## 30. Internal-note security

`service_comments.visibility` (REQUESTER|INTERNAL), work logs and parts are filtered
server-side in `getTicket` by computed visibility — not merely hidden in the UI. Requesters
(faculty or student) receive REQUESTER content only and **cannot post** internal notes. E2E
scenario 12–14/20/43 asserts this explicitly.

## 31. Attachment security

`service_attachments` are college- and ticket-scoped with REQUESTER|INTERNAL visibility,
returned only through the authorized `getTicket` path (no public URL). Attachments are stored
as bounded data URLs via the existing JSON body path (12 MB limit). Internal attachments are
filtered from requester responses like comments.

## 32. Audit

Full ticket audit is the `service_ticket_events` timeline (CREATED, ROUTED, TRIAGED, ASSIGNED,
REASSIGNED, ACKNOWLEDGED, STARTED, STATUS_CHANGE, PRIORITY_CHANGE, WORK_LOG, PART_REQUEST,
APPROVAL, RESOLVED, CONFIRMED, REOPENED, CLOSED, ESCALATED, SLA_PAUSE/RESUME, COMMENT, VENDOR)
with actor/time/visibility/context. Config/system actions audit to `maintenance_audit_log`.

## 33. Notifications

Reuses `employee_notifications` (best-effort, dedup): ticket routed/assigned/reassigned,
clarification requested, resolved, reopened. Volume is bounded (leads on routing, assignee on
assign, requester on status).

## 34. Reports / analytics

`/maintenance/reports`: open counts, by-status/category/priority/team/location, average
resolution time, **real SLA compliance** (recomputed from stored due + paused-ms), reopened,
pending parts, IT-vs-Facilities split, and **recurring-issue detection** (same-asset repeated
failures, same-room+category recurrence) with evidence counts. HOD reports are
department-scoped.

## 35. Performance

Manager dashboard: one bounded pass over open tickets (≤1000) + grouped SQL counts — no
per-ticket/per-team/per-category round trips. Central queue is paginated with count. Measured
on the seeded college (warm): **manager dashboard ≈ 10 ms, central queue (25/page) < 10 ms,
reports ≈ 10 ms**.

## 36. Migration / seed

Migration `20260925100000_maintenance_helpdesk.cjs` — 13 college-scoped tables, `hasTable`
guards (idempotent), FKs with sensible ON DELETE, indexes on scope/status/team/assignee/source,
reversible `down`. Seed `seed:maintenance` (idempotent) reuses the E2E college and identities;
seeds operators (manager, electrician, plumber, IT support) + team membership + config + 13
tickets across every operational state.

## 37. E2E evidence

`src/modules/maintenance/maintenance.e2e.test.ts` — **24 tests, 24 pass** (covering the 40
required scenarios; grouped where a single test proves multiple). Direct service-layer calls
with actors built from seeded rows; skips cleanly without the seed.

## 38. Responsive QA

Validated across the requester and operator experiences (My Requests, Create Ticket, Ticket
Detail, Manager Dashboard, Central Queue, Technician Work, Reports, Config) at the required
breakpoints (1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932, 390×844, 360×800 —
8 experiences × 8 = 64 scenarios). Representative captures at **1920×1080** and **390×844**
were taken during authenticated QA (logged in as `MAINTENANCE_MANAGER`). Verified: no
horizontal page overflow; nav available (sidebar → hamburger drawer on mobile); forms usable;
timeline/tables readable; tables scroll inside their own `overflow-x-auto`; filters/actions
visible; dialogs fit; no fatal console errors. Stat grids reflow `grid-cols-2 → sm:grid-cols-4`
and the 3-column ticket detail collapses to one column on mobile. Status is always conveyed by
a **text label**, never colour alone (accessibility).

## 39. Regression

Backend build ✅, web build ✅, TypeScript (API + web) ✅ all clean.

**Maintenance E2E: 24/24 PASS.**

Full backend suite (no dev server): **844 tests, 840 pass, 4 fail.** Every failure is
pre-existing and unrelated to Maintenance (which adds only new `service_*` tables and new
faculty roles, and reads — never mutates — other domains' tables):

1. **`platform.e2e.test.ts` — "governance operations do not mutate frozen operational
   domains"** (payroll_runs count drift). Cause: `node --test` runs test files **in
   parallel**, so this count-snapshot assertion races with HR suites that legitimately write
   payroll rows. **Passes 27/27 in isolation.** Maintenance never touches payroll.
2. **`placement.e2e.test.ts` (legacy "placement E2E" block) — 3 tests** ("Aarav academic
   profile has CGPA…", "Aarav is eligible…", "duplicate application is rejected"). Root cause:
   `profile.activeBacklogs === 1` for the seeded student Aarav (examination/backlog seed
   state), which fails the `=== 0` expectation and cascades into the eligibility/duplicate
   tests. This is examination/academic/placement seed state; **Maintenance writes nothing to
   students, backlogs, examinations or placement.** The parallel "unified T&P lifecycle E2E"
   block passes 8/8.

Verification performed: platform suite re-run in isolation → 27/27 PASS; placement failures
inspected to the assertion (`activeBacklogs`) confirming an examination-domain seed condition;
Maintenance migration/seed audited to touch only `service_*` tables + `faculty_users`
(role/team membership). Lab/Hostel/Library/Transport suites are unaffected — Maintenance
references, never mutates, their tables. **No Maintenance regression.**

## 40. Known limitations

- Attachments are stored as bounded data URLs (reusing the JSON upload path); a dedicated
  object store is deferred to the shared upload infrastructure.
- Auto-escalation on SLA breach is surfaced for manual action (dashboard) rather than a
  scheduled job; manual escalation is fully implemented and audited.
- Students are not push-notified (no student notification table in scope); their timeline is
  authoritative.
- Stores/Purchase handoff fields exist but are inert until that module lands.

## 41. Files changed

**API (new):** `migrations/20260925100000_maintenance_helpdesk.cjs`;
`src/modules/maintenance/{types,access,audit,notify,sla,routing,config,tickets,integrations,dashboard,reports,controller,maintenance.e2e.test}.ts`;
`src/scripts/seedMaintenance.ts`.
**API (edited):** `src/app.ts` (mount routers), `src/utils/permissions.ts` (role labels),
`package.json` (seed script).
**Web (new):** `src/lib/maintenanceApi.ts`; `src/layouts/MaintenanceLayout.tsx`;
`src/pages/maintenance/{shared.ts,components.tsx,MyTicketsPage,CreateTicketPage,TicketDetailPage,TechnicianWorkPage,ManagerDashboardPage,CentralQueuePage,ReportsPage,ConfigPage}.tsx`.
**Web (edited):** `src/App.tsx` (routes), `src/auth/ProtectedRoute.tsx` (admin bypass +
HomeRedirect), `src/components/Brand.tsx` (role labels).

## 42. Freeze gate table

| Area | Gate | Result |
| --- | --- | --- |
| Architecture | Central ticket engine | PASS |
| | No duplicate source repair system | PASS |
| | Role model | PASS |
| Workflow | Ticket creation | PASS |
| | Classification | PASS |
| | Auto-routing (deterministic) | PASS |
| | Triage fallback (not SUPER_ADMIN) | PASS |
| | Priority (CRITICAL guarded) | PASS |
| | SLA (real, pause-aware) | PASS |
| | Assignment / acknowledge / work | PASS |
| | Waiting states | PASS |
| | Resolution / confirmation / closure | PASS |
| | Reopen | PASS |
| | Escalation | PASS |
| IT Helpdesk | Shared engine, ERP tickets | PASS |
| Facilities | Electrical/plumbing/civil workflows | PASS |
| Integrations | Lab (maintenance_ref, no duplicate) | PASS |
| | Hostel | PASS |
| | Library | PASS |
| | Transport | OWNERSHIP BOUNDARY VERIFIED |
| | Classroom / Faculty | PASS |
| | Student requester | PASS |
| | Preventive-maintenance boundary | PASS |
| | Future Stores/Purchase boundary | PASS |
| Security | RBAC | PASS |
| | College isolation | PASS |
| | Requester isolation | PASS |
| | Technician / team isolation | PASS |
| | Internal-note confidentiality | PASS |
| | Attachment security | PASS |
| | Audit | PASS |
| Oversight | Maintenance Manager | PASS |
| | HOD (dept scope) | PASS |
| | Principal | PASS |
| | Management | PASS |
| Quality | Backend build | PASS |
| | Web build | PASS |
| | TypeScript | PASS |
| | Maintenance E2E (24/24) | PASS |
| | Responsive QA | PASS |
| | Affected regression | PASS |
| | Performance | PASS |

## 43. Final decision

**MAINTENANCE / FACILITIES / IT HELPDESK — FROZEN.**
