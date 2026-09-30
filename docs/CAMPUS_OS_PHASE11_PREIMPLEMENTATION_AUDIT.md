# Campus OS Phase 11 — Pre-Implementation Audit

**Scope:** Events, Venue & Institutional Resource Booking
**Branch:** `feat/examination-coe-operational-backend`
**HEAD at start:** `0d97f6db25cb9c6739a5686aec7cf32b5dd6efe6`
**Date:** 2026-09-26

## 0. Starting baseline

Claimed Phase 10 baseline (from `docs/CAMPUS_OS_PHASE10_FREEZE_VALIDATION.md`):

```
251 suites / 1,488 tests / 1,488 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED
```

Independent re-verification: a fresh full `npm test` run in `apps/api`
(single-concurrency, same command as every prior phase) was started before any
Phase 11 source change, log `apps/api/tmp/phase11_baseline_full.log`.
Result: see §0.1 (filled in from the actual run, not copied from the prompt).

### 0.1 Verified result

| Metric | Prompt claim | Verified |
|---|---|---|
| Suites | 251 | **251** |
| Tests | 1,488 | **1,488** |
| Pass | 1,488 | **1,488** |
| Fail | 0 | **0** |
| Cancelled | 0 | **0** |
| Skipped | 0 | **0** |
| Exit code | — | **0** |
| Duration | — | 2,845 s (≈47.4 min) |

The prompt's baseline matches the actual run exactly. Caveat: the run took ~47
minutes and overlapped with additive Phase 11 source edits (new files under
`apps/api/src/modules/events/` and the additive `roomAcademicOccupancy` export in
`timetable/service.ts`). The file list was fixed at start-up (the new
`events.e2e.test.ts` is not in the 251 suites) and no pre-existing test changed,
so the number is valid as a baseline; the final full regression in the freeze
validation doc is the authoritative post-change result.

### 0.2 Carried-forward Phase 10 limitation

Full 8-breakpoint responsive QA matrix for the Phase 10 scholarship pages was
not completed. Carried forward; Phase 10 is **not** reopened.

### 0.3 Git state before any Phase 11 change

- Branch `feat/examination-coe-operational-backend`, HEAD `0d97f6db`.
- `git status --porcelain`: 1,969 entries (1,393 untracked) — the large
  pre-existing dirty tree documented by every prior phase.
- `git diff --stat`: 576 files changed, 12,784 insertions, 1,865 deletions
  (pre-existing, not Phase 11).
- Snapshot saved to `tmp/phase11_pre_status.txt` for footprint comparison.

## 1. Audit method

Business-concept search (not keyword-only) across `apps/api/migrations/**`,
`apps/api/src/modules/**`, `apps/web/src/**` and `docs/**` for: event(s),
seminar, workshop, conference, guest lecture, FDP, hackathon, fest, orientation,
venue, room/resource/facility booking, reservation, auditorium, seminar hall,
lab booking, equipment booking, calendar, timetable, slot, availability,
conflict/overlap, registration, participant, attendance, check-in, QR,
certificate, event budget/fee/sponsorship, approval, organizer, event report,
evidence. Every finding below cites a concrete file/table/function.

## 2. Findings by capability

| # | Capability | Evidence | Classification |
|---|---|---|---|
| 1 | Institutional (non-alumni) event record | No `events`/`campus_events` table or module. `academic_calendar_events` (`20260901090000_academic_timetable.cjs:150`) has an `EVENT` type (`timetable/types.ts:7-18`) but is a **date-only calendar marker** (title, start/end date, `blocks_teaching`, notes) — no organizer, time, venue, approval, registration, participation or report | **MISSING** |
| 2 | Alumni events | `alumni_events` + `alumni_event_registrations` (`20261003100000_alumni_management.cjs:144-178`); `alumni/service.ts:567-614` (`listEvents`, `registerEvent` with row-locked capacity check); venue is free text; audience = alumni network only | **DOMAIN-SPECIFIC BY DESIGN** (frozen) |
| 3 | T&P training / drive scheduling | `training_programs`, `training_sessions` (`scheduled_at`, free-text `venue`), `training_attendance_records`, `placement_drives` (free-text `venue`) — `20260906100000_placement_module.cjs:380-557` | **DOMAIN-SPECIFIC BY DESIGN** (frozen) |
| 4 | HR L&D / FDP programmes | `ld_programs` (capacity, registration window, free-text `venue`), `ld_program_sessions`, `ld_nominations`, `ld_enrollments`, `ld_attendance`, `ld_completions`, `ld_certificates` — `20260919100000_hr_employee_ld.cjs:28-270` | **DOMAIN-SPECIFIC BY DESIGN** (HR authoritative for employee L&D/FDP) |
| 5 | IQAC meeting/event-like records | `iqac_meetings` (committee meetings, date-only), `iqac_evidence` (provenance + `source_module/source_record_type/source_record_id` + `document_id`) — `20261025100000_campus_os_phase7_iqac.cjs:168-308` | **DOMAIN-SPECIFIC BY DESIGN**; IQAC can *reference* event evidence via its existing `source_*` columns — no change needed |
| 6 | Location / room master | `rooms` (`college_id, name, code, building, floor, type ∈ CLASSROOM/LAB/SEMINAR_HALL/AUDITORIUM/OTHER, capacity, status`) — `20260901090000_academic_timetable.cjs:10-25`, `timetable/types.ts:1`, CRUD `timetable/service.ts:204-257`. Already reused as canonical location by `campus_assets.location_room_id`, `service_tickets.room_id`, `labs.room_id`, `maintenance_preventive_plans.room_id`, `exam_room_allocations.room_id` | **EXISTING & SUFFICIENT / SHARED FOUNDATION AVAILABLE** |
| 7 | Campus/building/floor hierarchy | `rooms.building`/`rooms.floor` strings only; no campus/block tables (only `hostel_blocks/floors/rooms`, hostel-specific) | **EXISTING BUT PARTIAL** — sufficient for venue selection; no new hierarchy justified |
| 8 | Venue / room booking | No reservation table references `rooms` outside Academic Timetable (`timetable_slots`, `timetable_overrides`) and Examination (`exam_room_allocations`) | **MISSING** |
| 9 | Shared equipment reservation | `campus_assets` (P0.2) has identity/status/location but no reservation concept; `lab_assets` is lab-local inventory | **MISSING** |
| 10 | Academic room occupancy | `timetable_slots.room_id` + `timetable_overrides.room_id` (ROOM_CHANGE/EXTRA/MAKEUP/SPECIAL/CANCELLED) expanded by non-exported `expandSlots` (`timetable/service.ts:999-1211`) which applies holidays and overrides | **EXISTING & SUFFICIENT** (authoritative) — **INTEGRATION REQUIRED**: no exported read-only room-occupancy query exists |
| 11 | Exam room occupancy | `exam_room_allocations.room_id` × `examination_subjects.exam_date/start_time/end_time` | **EXISTING & SUFFICIENT** — read-only query possible without touching Examination |
| 12 | Conflict detection | Timetable only: `findConflicts` (`timetable/service.ts:486-606`) is class/faculty/room-for-a-class-slot oriented (requires `academicClassId`), not usable for arbitrary datetime ranges | **EXISTING BUT PARTIAL** (domain-specific) |
| 13 | Asset availability status | `ASSET_STATUSES` incl. `UNDER_MAINTENANCE, LOST, DAMAGED, RETIRED, DISPOSED` (`assetManagement/types.ts:15-38`); cross-module read accessor `findAssetRef` (`assetManagement/service.ts:109`) | **SHARED FOUNDATION AVAILABLE** |
| 14 | Facilities availability for venues | `service_tickets.room_id/asset_id` (Phase 3) — a ticket does **not** mean "out of service"; Facilities has no room-unavailability state. Asset `UNDER_MAINTENANCE` is the authoritative maintenance block for equipment; `rooms.status=INACTIVE` for venues | **EXISTING BUT PARTIAL** — read-only use of asset/room status only |
| 15 | Approval | Workflow Engine (P0.3) `workflowEngine/service.ts` (definitions, versioned, role-per-step, row-locked `performAction`, terminal protection); consumed by Research (`research/service.ts:110-164,323-409`) with lazy per-college definition bootstrap + self-approval guard | **SHARED FOUNDATION AVAILABLE** |
| 16 | Participant registration | Only domain-specific (Alumni, HR L&D, T&P training) | **MISSING** for institutional events |
| 17 | Event attendance / check-in | Domain-specific only (`alumni_event_registrations.checked_in_at`, `ld_attendance`, `training_attendance_records`); academic `attendance_sessions` is class attendance and must not be reused | **MISSING** for institutional events |
| 18 | Event evidence / report | Document Engine (P0.4) `documentEngine/service.ts` generic `entityType/entityId`, versioning, checksum, server-generated storage keys; consumed in-process by Finance (Phase 10) | **SHARED FOUNDATION AVAILABLE** |
| 19 | Certificate generation | `ld_certificates` (HR), Student Services certificate requests (bonafide etc.) — no generic event-participation certificate | **OPTIONAL** → DEFERRED |
| 20 | Event fee / payment | Finance owns `fee_heads`, `student_fee_demands`, payments, receipts, refunds; no event linkage | **INSTITUTION-DEPENDENT** → NOT_CONFIGURED (no paid-registration requirement evidenced) |
| 21 | Notifications | `employee_notifications` via `maintenance/notify.ts:notifyFaculty` (best-effort, dedupe key); `student_notifications` via `academicClasses/studentNotifications.ts:notifyStudent` (dedupe key) | **SHARED FOUNDATION AVAILABLE** (in-app only; no email/SMS claimed) |
| 22 | Common calendar | `academic_calendar_events` + `timetable/service.ts:listCalendarEvents/facultyCalendar` = academic calendar authority; Alumni/Examination link to it by `calendar_event_id` | **EXISTING BUT PARTIAL** — a calendar *view* over events+reservations is acceptable; a second calendar *authority* is not |
| 23 | Clubs / cells / committees identity | No club/cell master; `iqac_committees` is generic governed committees (IQAC) | **MISSING** → out of scope (Phase 13); organizer unit recorded as type + free-text name, department via canonical `departments` |
| 24 | Vehicle booking | Transport owns vehicles/routes (`20260908100000_transport_module.cjs`) | **DEFERRED** (no event-vehicle requirement evidenced) |
| 25 | Surveys "Event feedback" | `SURVEY_TYPES` includes `EVENT` (`types/domain.ts:7`) | **EXISTING & SUFFICIENT** (feedback stays in Surveys) |
| 26 | Roles | `FACILITIES_OFFICER`, `PRINCIPAL`, `HOD`, `FACULTY`, `COLLEGE_ADMIN` exist (`utils/permissions.ts` ROLE_LABELS); HOD dept resolution helper pattern (`research/access.ts:70-79`) | **EXISTING & SUFFICIENT** — no new role needed |

## 3. Explicit answers

1. **Is an Event module already present?** No institutional one. Only domain-specific event records (Alumni, HR L&D, T&P training/drives, IQAC meetings) and date-only academic calendar markers.
2. **Does Alumni already have Events?** Yes — `alumni_events` + registrations with capacity; domain-specific, frozen; remains so.
3. **Does T&P already have training/event scheduling?** Yes — training programmes/sessions/attendance and placement drives, free-text venue.
4. **Does HR/FDP already have events/programmes?** Yes — `ld_programs`/sessions/enrollments/attendance/certificates (HR authoritative for FDP).
5. **Does IQAC store meeting/event-like records?** Committee meetings only; IQAC evidence can reference any module record by `source_*`.
6. **Is venue/room booking implemented?** No.
7. **Is resource booking implemented?** No.
8. **Is room/location master available?** Yes — `rooms` (with SEMINAR_HALL/AUDITORIUM/LAB/CLASSROOM types and capacity).
9. **Is campus/building/floor/location data available?** Building/floor as attributes of `rooms`; no separate hierarchy — none will be created.
10. **Does timetable already reserve classrooms/labs?** Yes — `timetable_slots.room_id` with overrides.
11. **Can timetable availability be queried?** Not for arbitrary rooms/datetime ranges — `expandSlots` is private and `findConflicts` needs a class probe. A small additive, read-only exported query is required.
12. **Does Asset Management contain bookable equipment?** It contains the equipment identity/status; no bookable flag (and not every asset should be bookable).
13. **Can Facilities expose venues/resources?** Venues come from `rooms`; Facilities has no availability state beyond tickets. Asset status is the maintenance block.
14. **Is conflict detection implemented anywhere?** Only in timetable (academic-only) and admissions seat allocation; nothing for event/venue.
15. **Is approval implemented?** Shared Workflow Engine exists and is proven (Research).
16. **Is participant registration implemented?** Only domain-specific.
17. **Is attendance/check-in implemented?** Only domain-specific.
18. **Is event evidence/reporting implemented?** No; Document Engine available.
19. **Is certificate generation implemented?** Not for events; deferred.
20. **Is event fee/payment supported?** No; Finance authoritative; NOT_CONFIGURED.
21. **Are notifications reusable?** Yes (`notifyFaculty`, `notifyStudent`).
22. **Can Document Engine be reused?** Yes, unchanged, in-process (Finance precedent).
23. **Can Workflow Engine be reused?** Yes, unchanged (Research precedent).
24. **Is there already a common calendar?** Academic calendar only; events/reservations need a *projection* view, not a new authority.
25. **What exact gaps are proven?**
    - G1 Institutional event record + lifecycle (department/institution/club/cell/committee organised seminars, workshops, guest lectures, hackathons, fests, etc.) — nothing owns these today.
    - G2 Shared reservation layer over canonical `rooms` and `campus_assets` with server-side, concurrency-safe conflict detection.
    - G3 Read-only academic-occupancy integration (timetable + examination) so academically occupied rooms are never shown/booked as free.
    - G4 Opt-in bookability configuration (which rooms/assets are bookable, buffers, whether facilities approval is required) — cannot live on frozen `rooms`/`campus_assets`.
    - G5 Event approval via Workflow Engine with self-approval protection.
    - G6 Institutional-event registration with server-enforced capacity, and event participation marking (separate from academic attendance).
    - G7 Event evidence/report via Document Engine with event-scoped authorization.
    - G8 Staff workspace + Student discovery/registration inside existing shells.

## 4. Architecture decision

**OPTION A — a shared institutional Event & Resource Booking domain is genuinely
missing**, implemented as a *thin orchestration domain* that owns only:
event record + lifecycle, bookability configuration, reservations, event
registrations/participation, and its audit log. Everything else is reused:

| Concern | Reused authority |
|---|---|
| Venue identity/capacity/location | `rooms` (Academic Timetable) — referenced by FK |
| Equipment identity/status | `campus_assets` (P0.2) — referenced by FK, status read via `findAssetRef` |
| Academic occupancy | Timetable (new additive read-only export) + Examination (read-only query) |
| Approval | Workflow Engine (unchanged) |
| Documents/evidence | Document Engine (unchanged) |
| Notifications | `notifyFaculty` / `notifyStudent` (unchanged) |
| Departments | `departments` |
| Identities | `faculty_users`, `students` |

Why not the alternatives: **B** — no existing event/resource capability is
general enough (all are domain-specific and frozen; generalising Alumni/HR/T&P
events would break frozen domains). **C** — existing domain event systems do not
cover department/institutional events, so a reservation layer alone leaves G1
unaddressed. **D** — gaps G1–G7 are proven. Domain modules (Alumni, HR, T&P) are
**not** rewired this phase; they may consume the reservation layer later.

## 5. Scope decisions derived from the audit

- **Event types:** configurable per college (`campus_event_types`), lazily seeded
  with evidence-based defaults (SEMINAR, WORKSHOP, CONFERENCE, GUEST_LECTURE,
  HACKATHON, TECHNICAL_EVENT, CULTURAL_EVENT, SPORTS_EVENT, ORIENTATION, OTHER).
  FDP/training/placement/alumni types are **not** seeded — those domains own them.
- **Ownership:** `organizer_unit_type ∈ INSTITUTION/DEPARTMENT/CLUB/CELL/COMMITTEE/OTHER`;
  department via canonical `departments.id`; club/cell/committee as a name only
  (no new identity tables — Phase 13).
- **Lifecycle:** DRAFT → UNDER_REVIEW → (RETURNED ↔) APPROVED → SCHEDULED →
  COMPLETED → CLOSED; REJECTED and CANCELLED terminal. "Ongoing" is derived from
  time, not stored. Postponement = audited reschedule.
- **Approval chain:** department events HOD → Principal; institution-level events
  Principal; a Facilities step is appended when any requested resource is
  configured `requires_approval`. Definitions are Workflow Engine data, so an
  institution can publish a different chain version without code change.
- **Reservation semantics:** REQUESTED (non-blocking) → CONFIRMED (blocking) /
  REJECTED / CANCELLED. Overlap `newStart < existingEnd AND newEnd > existingStart`
  on buffer-expanded windows (buffers configurable per resource, default 0), so
  10:00–11:00 and 11:00–12:00 do not conflict without buffers.
- **Concurrency:** every confirmation/reschedule locks the involved
  `campus_bookable_resources` rows `FOR UPDATE` in ascending id order, then
  revalidates conflicts, academic occupancy, asset/room status and capacity
  inside the same transaction.
- **Multi-resource atomicity:** all of an event's reservations are confirmed in
  one transaction or none are; the event only becomes SCHEDULED on success.
- **Registration:** students (self), staff (self) and external participants
  (organizer-entered minimal record, no account). Capacity enforced under an
  event row lock. Alumni participants stay in Alumni Events. Waitlist deferred.
- **Participation:** organizer marks ATTENDED/ABSENT after start; not academic
  attendance. QR/RFID/biometric: NOT_CONFIGURED.
- **Certificates:** DEFERRED. **Paid registration / sponsorship:** NOT_CONFIGURED;
  planned budget is context-only (no ledger). **Vehicles:** DEFERRED.
- **Public pages / external calendar sync:** NOT_CONFIGURED.

## 6. Planned footprint

- New migration `apps/api/migrations/20261028100000_campus_os_phase11_events_resource_booking.cjs` (additive only).
- New module `apps/api/src/modules/events/` (types, access, audit, service, controller, e2e test).
- Additive read-only export in `apps/api/src/modules/timetable/service.ts` (`roomAcademicOccupancy`) — focused timetable regression required.
- `apps/api/src/app.ts` router mounts.
- Web: pages inside existing shells (see freeze doc).
- No change to Alumni, HR, T&P, Finance, Procurement, Stores, Asset Management, Facilities, Document Engine, Workflow Engine, IQAC, Examination.
