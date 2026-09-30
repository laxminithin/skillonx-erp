# SkillonX Campus OS — Master Data Matrix

Date: 2026-09-26. Companion to `docs/CAMPUS_OS_PHASE13_FINAL_GAP_AUDIT.md`.

| Master | Authoritative Source | Duplication Found | Notes |
|---|---|---|---|
| Institution / College | `colleges` (platform tenant model) | None | `college_id` scoping enforced pervasively; tested cross-college denial in nearly every freeze doc |
| Campus / Building / Floor | Free-text `building`/`floor` strings on `rooms` | None (no hierarchy exists, but nothing conflicting either) | No normalized Campus→Building→Floor hierarchy anywhere; low-priority gap, build only when a real consumer (e.g. a future Security/Gate module) needs it |
| Department | Academic master, referenced by `faculty_users`, `students`, `academic_leadership_assignments` | None | — |
| Programme / Branch | Academic master | None | — |
| Academic Year / Semester / Section | Academic master (`academicClasses`/`academicMaster`) | None | — |
| Course | Academic master | None | — |
| Room | `rooms` (from academic timetable) | None — genuinely shared | Reused by Examination, Lab, Maintenance, Timetable, and now Events (Phase 11) via `room_id` FK |
| Hostel Room | `hostel_rooms` | Not linked to `rooms` | Independent table, documented, low-priority — not a functional problem today |
| Transport Stop/Route | `transport_stops`/`transport_routes` | Not linked to `rooms`/location hierarchy | Independent by nature (routes aren't rooms); not a defect |
| Student | `students` | None | Canonical, referenced everywhere |
| Employee / Faculty | `faculty_users` + `employees` | Two tables for one person | Documented architectural debt (auth/role vs HRMS profile), not urgent |
| Vendor | `procurement_vendors` | Transport (`vendor_reference`), Lab (`vendor`/`vendor_ref`), Maintenance (`vendor_name`/`vendor_ref`) store unlinked free text | Real, documented risk: the same real-world vendor can exist as inconsistent strings in up to 4 places. Recommended: extend `procurement_vendors` FK reuse into those three modules rather than building a parallel registry (unchanged recommendation from the 2026-09-23 audit) |
| Store / Stock location | `procurement` stores/stock ledger | Lab's local `lab_stock_items`/`lab_stock_movements` | Acknowledged, tracked exception (B4) |
| Asset Category | `assetManagement` | Lab's local asset register (`lab_assets`) remains separate by design | Lab-scoped, predates the generic register, frozen — not reopened |

## Confirmed clean (no action needed)

- No duplicate Student, Faculty, Parent, Alumni, or Applicant master —
  the per-audience separation is a deliberate, tested security boundary
  (relationship-authorized access), not accidental duplication.
- No duplicate Finance ledger anywhere — every domain module hands off to
  Finance via demand/reference records; none posts its own ledger.
- No duplicate Workflow/Approval engine being built going forward — the
  25+ existing per-module state machines are frozen-in-place by design;
  new work is expected to use `workflowEngine`.
