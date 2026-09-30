# Events, Venue & Institutional Resource Booking — Freeze Validation

Date: 2026-09-26. Branch: `feat/examination-coe-operational-backend`.
Phase: Campus OS Phase 11. Pre-implementation audit:
`docs/CAMPUS_OS_PHASE11_PREIMPLEMENTATION_AUDIT.md`. Phase-level gates and
regression numbers: `docs/CAMPUS_OS_PHASE11_FREEZE_VALIDATION.md`.

## 1. What was built

A thin orchestration domain (`apps/api/src/modules/events/`) that owns only:

- the institutional event record and lifecycle,
- opt-in bookability configuration for existing rooms and assets,
- reservations,
- event registrations and participation,
- its own audit log.

Everything else is reused and referenced, not copied.

| Concern | Authority (reused) | How Phase 11 uses it |
|---|---|---|
| Venue identity, capacity, building/floor | `rooms` (Academic Timetable) | FK `campus_bookable_resources.room_id`; `rooms.status` read at booking time |
| Equipment identity/status | `campus_assets` (Asset Management, P0.2) | FK `campus_bookable_resources.asset_id`; status read via `findAssetRef` at booking time |
| Academic occupancy | Timetable | New additive read-only export `roomAcademicOccupancy` (timetable slots + overrides + holidays); no timetable writes |
| Examination occupancy | Examination | Read-only query over `exam_room_allocations × examination_subjects × examinations` |
| Approval | Workflow Engine (P0.3), unchanged | Per-college definitions `CAMPUS_EVENT_{DEPT|INST}[_FAC]`, entity `campus_event` |
| Evidence/reports | Document Engine (P0.4), unchanged | `entityType='campus_event'`, event-scoped authorization checked first |
| Notifications | `notifyFaculty` / `notifyStudent`, unchanged | In-app only, best-effort after commit |
| Departments / people | `departments`, `faculty_users`, `students` | FKs only |

Not duplicated: timetable, location hierarchy, asset register, facilities
tickets, finance, procurement/stores, document store, workflow engine,
academic attendance, notifications, clubs. No timetable rows are written;
academic occupancy is read.

## 2. Data model (migration `20261028100000_campus_os_phase11_events_resource_booking.cjs`, additive only)

| Table | Purpose |
|---|---|
| `campus_event_types` | Per-college configurable event types (lazily seeded defaults: SEMINAR, WORKSHOP, CONFERENCE, GUEST_LECTURE, HACKATHON, TECHNICAL_EVENT, CULTURAL_EVENT, SPORTS_EVENT, ORIENTATION, OTHER) |
| `campus_bookable_resources` | Which `rooms` / `campus_assets` are bookable, with setup/cleanup buffers, `requires_approval`, active flag. Exactly one of `room_id` / `asset_id` |
| `campus_events` | Event record, lifecycle status, organiser unit, department, visibility, capacity, registration window, planned budget (context only), workflow instance link, capacity-override audit fields |
| `campus_resource_reservations` | REQUESTED / CONFIRMED / REJECTED / CANCELLED; wall-clock start/end plus buffer-expanded block window; optional event link; per-college unique idempotency key |
| `campus_event_registrations` | Student / staff / external participants; participation ATTENDED / ABSENT |
| `campus_events_audit_log` | Append-only audit trail (actor, action, before/after JSON) |

No existing table is altered. `down` drops only these six tables.

## 3. RBAC (no new role)

| Role | Permissions |
|---|---|
| SUPER_ADMIN, COLLEGE_ADMIN | all |
| PRINCIPAL | organiser + viewAll, review, close, capacity override, reports |
| HOD | organiser + review (own department only, enforced in service), close, reports |
| FACULTY, NBA/RESEARCH coordinators, OFFICE_ADMIN, OFFICE_SUPERINTENDENT | organiser: create event, view, request reservation |
| IQAC_COORDINATOR | organiser + reports |
| FACILITIES_OFFICER | view, viewAll, review (Facilities step), capacity override, resource manage, reservation request/decide |
| MANAGEMENT, CHAIRMAN | institution-wide read + reports |
| Students | separate `requireStudentAuth` router: published events only, self-registration |

## 4. Lifecycle

DRAFT → UNDER_REVIEW → (RETURNED ↔ UNDER_REVIEW) → APPROVED → SCHEDULED →
COMPLETED → CLOSED. REJECTED and CANCELLED are terminal. "Ongoing" is derived
from time, not stored. A postponement is an audited reschedule.

- **Approval chain:** a department event goes HOD → Principal; an
  institution-level event goes to the Principal. A Facilities step is
  appended when any requested resource has `requires_approval`. The HOD
  step is skipped when the organiser is HOD of that department.
- **Scheduling:** final approval triggers an atomic confirmation of all
  requested reservations in one transaction. If any conflict appeared
  meanwhile, the event stays **APPROVED — not scheduled** (Example A) and
  is never published.
- **Closed history:** once CLOSED, the following are rejected (tested):
  edit, reschedule, cancel, re-completion (report rewrite), participation
  changes and resource changes. Close is idempotent, and each transition
  leaves an audit row.

## 5. Booking rules (server-side)

- Overlap is `newStart < existingEnd AND newEnd > existingStart` on
  buffer-expanded windows. Back-to-back 10:00–11:00 / 11:00–12:00 is allowed
  when buffers are 0 (tested). Buffers are configurable per resource.
- Only CONFIRMED reservations block; REQUESTED does not.
- Blockers:
  - confirmed reservation
  - academic timetable occupancy (slots + overrides, holidays applied)
  - examination room allocation
  - asset status (UNDER_MAINTENANCE, LOST, DAMAGED, RETIRED, DISPOSED)
  - inactive room
  - inactive bookable resource
  - capacity below expected participants, unless overridden
- Capacity override needs `events.capacity.override`, a reason, and writes
  an audit row (tested).
- Start time must be in the future for new reservations.

## 6. Concurrency and idempotency (real MySQL, not mocks)

- Transactions run at READ COMMITTED with `SELECT … FOR UPDATE` on
  `campus_bookable_resources` in ascending id order. Lock order: event row,
  then resources.
- Conflicts are revalidated inside the lock, and `withDeadlockRetry` wraps
  the transaction.
- Reservation idempotency: a per-college unique key, re-checked under the
  resource lock; a duplicate-entry error falls back to the existing row
  (`idempotentReplay: true`).

| Mandatory race | Test | Result |
|---|---|---|
| Same venue (two overlapping events approved concurrently) | concurrent approvals of overlapping events for the same venue confirm exactly one | PASS |
| Same resource (room and asset ad-hoc) | concurrent ad-hoc bookings of the same room and the same asset confirm exactly one each | PASS |
| Last registration slot | the last registration slot goes to exactly one registrant; double registration idempotent | PASS |
| Duplicate submission | duplicate submissions create exactly one workflow instance | PASS |
| Same approval clicked twice | same approval clicked concurrently transitions exactly once | PASS |
| Reschedule conflict | concurrent reschedules into the same slot: exactly one wins; losing reschedule keeps original time | PASS |
| Cancel / rebook | cancel releases the venue in the same transaction so it can be rebooked; cancel idempotent | PASS |

## 7. Failure recovery

| Example | Behaviour | Evidence |
|---|---|---|
| A — approved but venue lost | Event stays APPROVED (not SCHEDULED), invisible to students/calendar, warning banner + "Retry scheduling" for organiser | e2e venue race test; browser: `/events/111` (staff banner), `/lms/events/111` → "Event not available" |
| B — retry | Same idempotency key → the same reservation, no duplicate; retry scheduling after blocker cleared confirms once | e2e reservation idempotency + cancel/rebook tests; perf probe replay path (201, same row) |
| C — notification failure | Notifications are sent after commit and swallowed on failure; booking state never rolls back | e2e Example C test (notifier forced to throw) |
| D — Finance | N/A: planned budget is context only; no ledger, demand, payment or refund is written | Code: no Finance import in `events/` |

## 8. Security

| Gate | Evidence | Result |
|---|---|---|
| Self-approval blocked (event review and reservation decision) | e2e | PASS |
| Wrong-department HOD cannot review | e2e | PASS |
| Tenant isolation (another college cannot read/mutate events, reservations, documents) | e2e | PASS |
| Same-tenant IDOR (other department, unrelated staff: no drafts, participants or mutations) | e2e | PASS |
| No participant/budget/internal-remark leak in public, student or calendar views | e2e (budget 7777777, `INTERNAL:` remark, SECRET purpose, staff-only event); browser probe scanned all student pages at 8 widths for `7777777`/`INTERNAL:`/`budget`: none | PASS |
| Document bypass (guessing ids, cross-event document id) | e2e | PASS |
| Closed history immutable, all transitions audited | e2e lifecycle test asserts audit rows | PASS |
| Search / filter / pagination server-side | `listEvents` (`q`, `status`, `mine`, `from`, `page`, `pageSize` ≤ 100), registrations paginated | PASS |

## 9. Web

Staff workspace **Events & Resources** (`/events/*`) inside the existing
staff `AppLayout`. It uses a dedicated nav group when inside `/events`,
following the HR portal precedent:

- Events list (Upcoming / My events / All visible, debounced server search, status filter, server pagination)
- New/Edit event
- Event detail (actions by status and permission, Example A banner, live-availability resource picker, approval trail, participants and participation marking, documents)
- Approvals (event review queue + ad-hoc resource request queue)
- Calendar (month agenda)
- Find a Venue (live availability + booking with idempotency key)
- My Bookings
- Resources (facilities: enable rooms/assets, buffers, approval flag, event types)
- Reports (aggregates only)

Student: **Campus Events** inside the existing Student LMS shell
(`/lms/events`, `/lms/events/:id`). It shows published events only, with
register/cancel.

### 9.1 Authenticated browser QA (live, local dev: Vite 5173 + API 4000, QA college `P11QA`)

Real logins via the staff and student login forms and endpoints:
organiser (FACULTY), PRINCIPAL, FACILITIES_OFFICER, student.

| Journey | Viewport(s) | Observed |
|---|---|---|
| Organiser events list | 1440×900 | Tabs, search, status filter, badges incl. "Approved — not scheduled" |
| Organiser event detail (scheduled 107) | 1440×900, 390×844 | Facts grid, confirmed venue, participant list with privacy note, approval trail with remarks |
| Example A event (111) | 390×844 | Warning banner explains the lost venue, "Retry scheduling", venue "Not confirmed" |
| Find a Venue with a real conflict | 390×844, 1440×900 | Seminar Hall A "Already reserved for an overlapping time", PA system blocked by `UNDER_MAINTENANCE`; Book disabled on both |
| Principal approvals + review (108) | 1440×900 | Only the Principal-step event listed (HOD-step event excluded); Approve/Return/Reject; trail shows HOD remark |
| Principal on `/events/resources` | 1440×900 | "Facilities only" gate |
| Facilities resources | 1440×900 | Enabled resources with source status; candidates from timetable room master and asset register |
| Facilities approvals | 390×844 | Pending projector request with Confirm/Reject |
| Student events list | 390×844 | Only the two published events; APPROVED-unscheduled 111 absent |
| Student event detail (107) | 390×844, 1440×900 | No budget/remarks/participants; registration card |
| Student direct URL to 111 | 1440×900 | "Event not available" |

Screenshots were captured with the Cursor browser tool into the local temp
directory. Each was visually inspected. They are ephemeral local evidence
and not committed.

### 9.2 Responsive matrix (360 / 390 / 412 / 768 / 1024 / 1280 / 1440 / 1920)

Automated probe (`apps/api/tmp/phase11_responsive_probe.js`) loaded each
route in a same-origin iframe at each width. It checked:

- document horizontal overflow (`scrollWidth > width`)
- elements extending past the viewport outside scroll containers
- unlabeled form controls
- unnamed buttons
- presence of an `h1`

| Route (role) | 8 widths | Overflow | Off-screen elements |
|---|---|---|---|
| `/events` (organiser) | all | none | none |
| `/events/107` (organiser) | all | none | none |
| `/events/new` (organiser) | all | none | none |
| `/events/calendar` (organiser) | all | none | none |
| `/events/availability` (organiser) | all | none | none |
| `/events/bookings` (organiser) | all | none | none |
| `/events/111` (organiser, Example A) | all | none | none |
| `/events/resources` (facilities) | all | none | none |
| `/events/approvals` (facilities) | all | none | none |
| `/events/reports` (facilities, gated) | all | none | none |
| `/lms/events` (student) | all | none | none |
| `/lms/events/107` (student) | all | none | none |
| `/lms/events/111` (student, not published) | all | none | none |

**Result: 13 routes × 8 widths = 104 checks, 0 overflow.**

### 9.3 Accessibility

- Every form control has an accessible name. The probe found one gap, the
  Title input on `/events/new`, because the shared `Field` label is not
  associated with its input. Fixed with `aria-label`; the shared component
  was not touched.
- There are no unnamed buttons. Nothing uses a click handler on a
  non-interactive element (source grep), and all actions are `<button>` or
  `<a>`, so everything is keyboard-operable.
- Every page renders an `h1`. The two permission-gated states lacked one;
  fixed by adding a `PageHeader`.
- Status is never conveyed by colour alone: badges carry text, and
  unavailable resources show a text reason.
- Known and pre-existing: the shared `Tabs` component has no
  `role="tab"`/`aria-selected`. It is a shared UI primitive used app-wide,
  so it was not modified this phase.

### 9.4 Defects found by QA and fixed this pass

1. **Approvals page render loop.** `useEventsMeta().can` was a new function
   every render and was used as an effect dependency. The facilities
   resource-request queue showed empty even though the API returned the
   pending request. Fixed with `useCallback`. Re-verified: bounded requests
   (5 in 3 s) and the pending request is shown.
2. The Upcoming tab was sorted latest-first. It now sorts soonest-first when
   only a lower date bound is given.
3. The Title input had no accessible name (above).
4. Gated pages had no `h1` (above).
5. The "Add venue / equipment" button wrapped on mobile. Renamed to "Add resource".
6. The student "Closes" line showed seconds in a different date format. It
   now uses the same short format.

## 10. Performance (local dev API, sequential, 5 warm-up + 60 timed requests each)

Raw log: `apps/api/tmp/phase11_perf.log`.

| Endpoint | p50 ms | p95 ms |
|---|---|---|
| GET `/api/events` (list) | 2.2 | 3.6 |
| GET `/api/events` (q + status filter) | 2.1 | 3.5 |
| GET `/api/events/:id` | 5.5 | 7.9 |
| GET `/api/events/meta` | 0.3 | 0.7 |
| GET `/api/events/availability` | 7.0 | 8.5 |
| GET `/api/events/calendar` (month) | 2.0 | 3.3 |
| GET `/api/events/:id/registrations` | 1.7 | 2.5 |
| GET `/api/events/reservations/mine` | 1.2 | 2.3 |
| GET `/api/events/review-queue` | 1.1 | 1.8 |
| GET `/api/events/reservations/queue` | 1.5 | 2.0 |
| GET `/api/events/resources` | 1.1 | 1.8 |
| GET `/api/events/reports/summary` | 1.1 | 2.4 |
| GET `/api/student/events` | 3.6 | 5.2 |
| GET `/api/student/events/:id` | 4.3 | 7.6 |
| POST `/api/events/reservations` (create, locked txn) | 11.4 | 18.8 |
| POST `/api/events/reservations` (idempotent replay) | 1.2 | 1.9 |

All 65 probe reservations were cancelled afterwards.

**Indexes:** `EXPLAIN` on the hot paths shows index use and no table scans:

- reservation overlap check: `crr_college_status_start_idx`
- event list order: `cev_college_start_idx`, backward index scan, covering
- registration lookup: `cereg_event_student_uq`

The dataset is small, so the numbers show the query plans rather than
behaviour at scale. **No additional index was added.** None is supported
by evidence; the migration's indexes already cover every measured query.

## 11. Known limitations (documented, not defects)

- A timetable change made **after** a booking is not blocked by the
  Timetable module, which is frozen and unaware of events. The next booking
  or scheduling action re-checks occupancy.
- Facilities has no "room out of service" state. Venue unavailability
  comes from `rooms.status = INACTIVE` or deactivating the bookable
  resource.
- Organiser roles without Document Engine upload permission cannot upload
  event evidence. The Document Engine RBAC is unchanged.
- Multi-day events block their resources continuously for the whole span.
- Admins (SUPER_ADMIN/COLLEGE_ADMIN) can act at any workflow step. This is
  existing Workflow Engine semantics.
- A resource that requires approval cannot be added after the event is
  approved. Only resources that need no approval can be added then; they
  are confirmed immediately after an availability check.
- A PRINCIPAL-organised institution event needs COLLEGE_ADMIN to act at the
  Principal step, because self-approval is blocked.
- For organiser roles without Workflow Engine capability (PRINCIPAL,
  OFFICE_ADMIN, NBA/IQAC coordinators), SUBMIT/CANCEL are recorded in the
  workflow history under the system actor with the same `facultyUserId`.
  The domain audit log records the real actor.
- An idempotent reservation replay returns 201 with `idempotentReplay: true`
  rather than 200.
- NOT_CONFIGURED / DEFERRED:
  - email, SMS and WhatsApp delivery (notifications are in-app only)
  - QR/RFID/biometric check-in
  - participation certificates
  - paid registration and sponsorship ledger
  - vehicle booking
  - waitlist
  - public event pages
  - external calendar sync
  - club/cell/committee identity (organiser unit is type + name; Phase 13)
- Domain event systems (Alumni events, HR L&D/FDP, T&P training/drives)
  were **not** rewired. They remain authoritative for their domains.

## 12. Source-of-truth matrix (final)

| Data | Owner (source of truth) | Phase 11 relationship |
|---|---|---|
| Rooms / venues, capacity, building/floor | Academic Timetable `rooms` | Referenced (FK), read-only |
| Equipment identity/status | Asset Management `campus_assets` | Referenced (FK), status read-only |
| Academic room occupancy | Timetable (`timetable_slots`, `timetable_overrides`, holidays) | Read-only via `roomAcademicOccupancy` |
| Exam room occupancy | Examination `exam_room_allocations` | Read-only query |
| Bookability, buffers, approval flag | **Events** `campus_bookable_resources` | Owned |
| Institutional events (non-domain) | **Events** `campus_events` | Owned |
| Reservations of rooms/assets | **Events** `campus_resource_reservations` | Owned |
| Event registration / participation | **Events** `campus_event_registrations` | Owned; not academic attendance |
| Event audit trail | **Events** `campus_events_audit_log` | Owned |
| Approval state/history | Workflow Engine | Used unchanged |
| Event documents/evidence | Document Engine | Used unchanged |
| Notifications | `employee_notifications` / `student_notifications` | Used unchanged, in-app only |
| Academic calendar | Timetable `academic_calendar_events` | Untouched; the Events calendar is a projection view, not an authority |
| Alumni events | Alumni | Untouched |
| FDP / employee L&D | HR | Untouched |
| Training / placement drives | T&P | Untouched |
| Event feedback | Surveys (`EVENT` type) | Untouched |
| Money | Finance | Not touched (budget is context only) |

## 13. Verdict

Events, Venue & Institutional Resource Booking: **FROZEN** with the
limitations in §11. Phase-level gates: see
`docs/CAMPUS_OS_PHASE11_FREEZE_VALIDATION.md`.
