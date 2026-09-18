# Lab Assistant / Laboratory Management — Web Closure Freeze Validation

**Module:** Lab Assistant & Laboratory Management
**Date:** 2026-09-13
**Decision:** ✅ **FROZEN**
**Source of truth:** `docs/ERP_WEB_MASTER_CLOSURE_MATRIX.md`

---

## 1. Executive summary

The ERP now has a secure, role-specific operational workspace for laboratory
management at `/lab/*`. Lab Assistants can answer the five operational
questions the closure demanded — *which labs am I responsible for, what is
available/missing/broken, what must be ready for the next practical, what was
issued/returned/consumed, and what needs repair/purchase/escalation* — while
Faculty Lab In-charge, HOD, Principal and Management receive scoped oversight.

The module deliberately **reuses** existing academic structures (rooms of type
`LAB`, the academic timetable, departments, faculty/student identities, the
academic-leadership overlay) and existing platform primitives (JWT auth,
per-module RBAC, audit log, employee notifications) rather than duplicating
them. Fault and repair records carry stable `maintenance_ref` linkage so a
future central Maintenance / IT Helpdesk module can adopt them without a
duplicate data model; requirements carry `purchase_ref` for a future
Stores/Purchase handoff.

## 2. Final decision

**FROZEN.** All applicable freeze gates pass with real evidence (see §28). No
invented PASS results. Deliberately deferred: Stores/Purchase execution and the
central Maintenance platform (clean handoff boundaries defined, §25).

## 3. Architecture

- **Backend:** Express module `apps/api/src/modules/lab/` following the repo's
  established `controller / access / audit / types + feature-service` shape
  (mirrors `transport`, `mentoring`). Actor is derived from the faculty JWT;
  every endpoint enforces college + role/capability + assigned-lab/department
  scope server-side.
- **Web:** A dedicated `LabLayout` (peer of `AccountantLayout` / `CoeLayout`)
  mounted at `/lab/*` with 11 pages, using the shared `components/ui` kit and
  `ProductShell`.
- **Data:** One additive, idempotent migration
  (`20260924100000_lab_management.cjs`) creating 15 normalized, college-scoped
  tables. No existing table was modified.

## 4. Existing functionality reused (no duplication)

| Reused | How |
| --- | --- |
| `rooms` (type `LAB`) | Lab physical location via `labs.room_id`; no building/room duplication. |
| `timetable_slots` | Practical sessions derived where a slot's `room_id` maps to a managed lab; **no second attendance system**. |
| `academic_leadership_assignments` | HOD/Principal oversight resolution (`hodDepartmentIds`, `isPrincipal`). |
| `faculty_users` / `students` / `academic_class_batches` / `departments` | Identities and academic grouping; recipients scoped to real identities. |
| `employee_notifications` | Faculty notifications (repair approval pending), best-effort + de-duped. |
| JWT auth middleware, `isAdminRole`/`isSuperAdmin` | Authentication and admin short-circuit. |
| `courses` | Practical course context on sessions/requirements. |

## 5. Role model

- **`LAB_ASSISTANT`** — new core role (`ROLE_LABELS`, `RoleLabel`). Owns
  operational activity on **assigned** labs only.
- **`LAB_INCHARGE`** — a **capability**, not a duplicate identity: a Faculty
  user with an active `lab_assignments` row of role `LAB_INCHARGE`. Grants
  academic oversight + first-level requirement/repair approval on that lab.
- **HOD / Principal** — via the existing leadership overlay; department-scoped
  and institution-scoped oversight respectively.
- **Management / Chairman** — aggregate read-only analytics.
- **SUPER_ADMIN / COLLEGE_ADMIN** — master configuration authority (not the
  routine operator).
- **Student** — limited read (`/api/student/lab/issues`); no admin workspace.
- **Accountant / COE** — explicitly no lab operations.

## 6. Schema / migration

Migration `20260924100000_lab_management.cjs` (deterministic, college-scoped,
backward-compatible, seed-safe, reversible `down`). Tables: `labs`,
`lab_assignments`, `lab_assets`, `lab_asset_history`, `lab_stock_items`,
`lab_stock_movements`, `lab_issues`, `lab_sessions`, `lab_faults`,
`lab_repairs`, `lab_software`, `lab_software_requests`, `lab_requirements`,
`lab_maintenance_schedules`, `lab_audit_log`. Every table carries `college_id`
with an FK to `colleges` and appropriate composite indexes.

## 7. Lab master

`labs` layers over a `room` (reused) and holds `department_id`, `lab_type`,
`capacity`, `status`, `code` (unique per college). Assignments preserve history
(status `ACTIVE`/`ENDED`, `effective_from`/`effective_to`).

## 8. Asset model

`lab_assets` supports asset tag (stable, QR/barcode-ready, unique per college),
serial, category (configurable set), asset class (`ASSET`/`COMPUTER`/
`ACCESSORY`), make/model, purchase/cost/vendor, warranty + AMC dates, custodian,
and computer/system metadata (hostname, system #, processor, RAM, storage, OS).
**Operational status** (`AVAILABLE`/`IN_USE`/`FAULTY`/`UNDER_REPAIR`/`RESERVED`/
`RETIRED`/`LOST`) is separate from **physical condition** (`GOOD`/`FAIR`/`POOR`/
`DAMAGED`). Retired assets are never deleted and cannot be reactivated. Every
status/condition/location/custodian change writes `lab_asset_history`.

## 9. Stock model

`lab_stock_items` tracks opening/current stock, unit, min threshold. Every
change flows through `lab_stock_movements` (`RECEIPT`/`ISSUE`/`RETURN`/
`CONSUMPTION`/`TRANSFER`/`ADJUSTMENT`/`SCRAP`) inside a DB transaction with
`SELECT … FOR UPDATE`; **negative stock is blocked**. Low stock is derived
(`current_stock <= min_threshold`).

## 10. Issue / return

`lab_issues` supports reusable assets, accessories and stock, to Faculty /
Student / Lab / Department recipients (identities strictly validated to the
college). Asset issue flips the asset to `IN_USE`; return restores `AVAILABLE`
(or `FAULTY` if returned damaged, `LOST` if reported lost). Overdue is derived
from `expected_return` and surfaced on the dashboard and issues list.

## 11. Practical-session readiness

`upcomingSessions` reads the academic `timetable_slots` for the next N days for
rooms mapped to scoped labs — **the timetable is not duplicated**. Readiness
records (`lab_sessions`) overlay a slot+date with a configurable checklist and
status (`NOT_STARTED`→`IN_PREPARATION`→`READY`→`ISSUE_REPORTED`→`COMPLETED`).

## 12. Fault / repair

`lab_faults` (severity, impact, lifecycle `OPEN`…`CLOSED`) auto-marks a linked
asset `FAULTY`. `lab_repairs` implements request → approve (In-charge/HOD/admin)
→ in-progress → complete, driving the asset through `UNDER_REPAIR` back to
`AVAILABLE` and resolving the linked fault. Both carry `maintenance_ref`.

## 13. Software

`lab_software` stores **metadata only** (name, version, license type/count,
expiry, installation status, vendor reference) — **no license keys/secrets**.
`lab_software_requests` implements Faculty/In-charge request → Lab Assistant/IT
review → complete/reject.

## 14. Requirements / purchase handoff

`lab_requirements` supports typed requests (`NEW_ASSET`/`REPLACEMENT`/
`CONSUMABLES`/`SOFTWARE`/`REPAIR`/`UPGRADE`) with academic justification,
semester, student strength, current stock and derived shortfall. Approval chain:
`SUBMITTED` → `INCHARGE_APPROVED` → `HOD_APPROVED` → `PRINCIPAL_APPROVED` →
`FULFILLED` (admin/Stores, records `purchase_ref`), or `REJECTED`. Full
procurement intentionally not built; `purchase_ref` is the Stores handoff.

## 15. Lab In-charge oversight

`/lab/oversight` scoped to assigned labs; Faculty In-charge get asset health,
faults, pending approvals and low stock without full inventory administration.

## 16. HOD oversight

Department-scoped (via leadership overlay). HOD sees only labs in departments
they lead, cannot mutate operations (`oversight`-only), and can approve
requirements/repairs and manage assignments within their department.

## 17. Principal / Management oversight

Principal and Management/Chairman get institution-wide read-only analytics
(department comparison, per-lab readiness, faults, backlogs, pending approvals).

## 18. RBAC

`access.ts` defines a per-role permission map (`labPermissionsForRole`) plus
scope enforcement (`assertLabAccess` with `operate`/`oversight` modes,
`scopedLabIds`). Admin short-circuits; Accountant/COE/Student get no lab
permissions.

## 19. Isolation

- **College:** every query and `assertLabAccess`/`loadLab` filter by
  `college_id`; cross-college reads return 404.
- **Assignment:** a Lab Assistant may only operate labs where they hold an
  active `LAB_ASSISTANT` assignment; Faculty need a `LAB_INCHARGE` assignment.
- **Department:** HOD limited to labs of departments they lead.
- **Role:** Accountant/COE/Student denied at the permission layer.

## 20. Audit

`lab_audit_log` records create/update, status/condition change, transfer, stock
movement, issue/return, fault create/status, repair create/update, software
create/review, requirement create/approve/reject/fulfill, assignment changes.
Asset lifecycle additionally keeps `lab_asset_history`.

## 21. Performance

The dashboard is a single endpoint using batched, grouped queries run in
parallel (`Promise.all`) — no per-asset fan-out. E2E asserts the dashboard
responds in < 4 s (observed ≈ 30 ms on the seeded dataset). Asset list is
paginated + server-filtered.

## 22. E2E evidence

Backend suite `apps/api/src/modules/lab/lab.e2e.test.ts` — **22/22 pass**
(dashboard, scope, unassigned denial, asset CRUD + status history, retired
guard, stock receipt/consume/negative-block, issue→return + overdue, timetable
sessions + readiness, fault→repair lifecycle, software + request, requirement
approval chain, In-charge/HOD/Principal oversight, reports, cross-assistant
denial, faculty-without-incharge denial, Accountant/COE/Student denial, college
isolation, audit, performance).

## 23. Responsive QA

`apps/web/e2e/lab-management.responsive.spec.ts` — 13 authenticated scenarios ×
**8 breakpoints** (1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932,
390×844, 360×800) all pass, asserting **no horizontal overflow** at every width.
Covers dashboard, labs, asset register + detail, stock, issue/return, sessions,
faults/repairs, software, requirements, reports, direct reload, HOD oversight,
Principal oversight, and Accountant denial. Screenshots at 1920 and 390 in
`apps/web/e2e/screenshots/lab/`.

## 24. Regression

- Backend build (`tsc -p`) — **PASS** (exit 0).
- Web build (`tsc -b && vite build`) — **PASS**.
- Affected backend suites — **74/74 pass**: lab 22, timetable 8,
  academic-leadership 10, mentoring 17, management 17 (shared role/leadership/
  timetable plumbing and `app.ts` routing confirmed unregressed).
- ESLint — no repo ESLint config present; strict TypeScript compile is the
  enforced static-analysis gate and passes for both apps.

## 25. Maintenance integration boundary

Lab faults/repairs are the single source of lab-side breakdown data. They carry
`maintenance_ref` (and repairs additionally) so the future central Maintenance /
IT Helpdesk module can link a lab fault → service request → maintenance ticket
**without a duplicate repair model**. The whole helpdesk platform is
intentionally out of scope for this phase.

## 26. Known limitations

- Stores/Purchase execution not built — requirements stop at approval + a
  `purchase_ref` handoff field.
- Central Maintenance module not built — boundary fields present, no ticket sync.
- QR/barcode: asset tags are stable + unique + printable (scan-ready); a browser
  scanner UI is not a freeze blocker and is deferred.
- Document attachments: not wired in this phase (no lab-specific uploads);
  reuse of existing storage is a future enhancement.
- Preventive-maintenance schedules table + services exist; a dedicated web page
  is deferred (surfaced via reports/oversight).

## 27. Files changed

**Backend (new):**
- `apps/api/migrations/20260924100000_lab_management.cjs`
- `apps/api/src/modules/lab/{types,access,audit,notify,labs,assets,stock,issues,sessions,faults,repairs,software,requirements,maintenance,dashboard,oversight,reports,controller}.ts`
- `apps/api/src/modules/lab/lab.e2e.test.ts`
- `apps/api/src/scripts/seedLabManagement.ts`

**Backend (modified):**
- `apps/api/src/app.ts` (mount `labRouter`, `studentLabRouter`)
- `apps/api/src/utils/permissions.ts` (`LAB_ASSISTANT` label)
- `apps/api/src/scripts/seedStudentLmsE2e.ts` (invoke lab seed)
- `apps/api/package.json` (`seed:lab-management` script)

**Web (new):**
- `apps/web/src/lib/labApi.ts`
- `apps/web/src/layouts/LabLayout.tsx`
- `apps/web/src/pages/lab/{shared,LabDashboardPage,LabsPage,LabAssetsPage,LabStockPage,LabIssuesPage,LabSessionsPage,LabFaultsPage,LabSoftwarePage,LabRequirementsPage,LabReportsPage,LabOversightPage}.tsx`
- `apps/web/e2e/lab-management.responsive.spec.ts`

**Web (modified):**
- `apps/web/src/App.tsx` (routes) · `auth/ProtectedRoute.tsx` (admin `/lab` allow, LAB_ASSISTANT home) · `pages/LoginPage.tsx` (landing) · `components/Brand.tsx` (role label)
- `apps/web/e2e/auth.setup.ts` (labassistant auth + seed check)

**Docs:** this report + `docs/ERP_WEB_MASTER_CLOSURE_MATRIX.md`.

## 28. Freeze gate table

| Gate | Result |
| --- | --- |
| Lab Assistant identity/capability | PASS |
| Lab In-charge model (Faculty + assignment) | PASS |
| RBAC | PASS |
| College isolation | PASS |
| Lab assignment isolation | PASS |
| Dashboard | PASS |
| Navigation | PASS |
| Direct-load / reload | PASS |
| Lab master | PASS |
| Asset register | PASS |
| Asset status/condition | PASS |
| Asset history | PASS |
| Computer/system inventory | PASS |
| Consumable stock | PASS |
| Stock movement + low-stock | PASS |
| Issue / return + overdue | PASS |
| Timetable integration | PASS |
| Session readiness | PASS |
| Batch/Faculty context | PASS |
| Fault logging | PASS |
| Repair workflow | PASS |
| Maintenance integration boundary | PASS |
| Software inventory | PASS |
| Software request workflow | PASS |
| Requirement request | PASS |
| Approval workflow | PASS |
| Warranty/AMC tracking | PASS |
| Preventive maintenance (data/services) | PASS (no dedicated page — §26) |
| Lab In-charge oversight | PASS |
| HOD oversight + dept isolation | PASS |
| Principal oversight | PASS |
| Management analytics | PASS |
| Student denied admin | PASS |
| Accountant denied | PASS |
| COE denied | PASS |
| Other department/lab denied | PASS |
| Audit | PASS |
| Backend build | PASS |
| Web build | PASS |
| TypeScript | PASS |
| ESLint | N/A (no repo config; tsc strict passes) |
| Lab E2E (22/22) | PASS |
| Responsive QA (8 breakpoints) | PASS |
| Regression (74/74 affected) | PASS |

## 29. Final decision

**LAB ASSISTANT / LABORATORY MANAGEMENT — FROZEN.**
