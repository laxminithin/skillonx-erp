# SkillonX Campus OS — Final Portal Matrix

Date: 2026-09-26. Companion to `docs/CAMPUS_OS_PHASE13_FINAL_GAP_AUDIT.md`.
A portal is counted only if it is a distinct navigational shell (its own
layout/nav/route namespace) — a role overlay inside an existing shell
(HOD/Principal inside Faculty, Librarian/Transport/Mentor inside Faculty)
is not a separate portal. Source: `apps/web/src/App.tsx` and
`apps/web/src/layouts/*`, cross-checked against
`docs/SKILLONX_PORTAL_AND_ENGINE_MATRIX.md`.

| # | Portal / Workspace | Primary Role(s) | Backend Engine(s) | Status | Dedicated Shell? | Responsive? | Frozen? | Operationally Usable? |
|---|---|---|---|---|---|---|---|---|
| 1 | Faculty / Academic Staff Workspace | Faculty, HOD, Principal, Management, Coordinator, Mentor, Librarian, Transport staff, Placement staff, Procurement staff, HR | `academicClasses`, `academicLeadership`, `hr`, `library`, `transport`, `placement`, `procurement`, `mentoring`, `attainment`, `copo`, `coEvaluation`, `gapAnalysis` | Mixed (sub-domains individually frozen) | Yes (`AppLayout`) | Yes (per sub-domain QA) | Mostly | Yes |
| 2 | College Administration | College Admin | broad admin scope | Mixed | Yes (`AdminLayout`) | Partial | No | Yes |
| 3 | Platform Governance | Super Admin | `platform` | FROZEN | Yes (`PlatformLayout`) | Yes | Yes | Yes |
| 4 | Accountant / Finance | Accountant/Finance Officer | `finance` | FROZEN | Yes (`AccountantLayout`) | Yes | Yes | Yes |
| 5 | Exam Section / COE | Controller of Examinations | `examination`, `questionPapers` | FROZEN | Yes (`CoeLayout`) | Yes | Yes | Yes |
| 6 | Lab Management | Lab Assistant/In-charge | `lab` | FROZEN | Yes (`LabLayout`) | Yes | Yes | Yes |
| 7 | Maintenance / Facilities / IT Helpdesk | Maintenance Manager/Staff, Facilities Officer, IT Support | `maintenance` | FROZEN | Yes (`MaintenanceLayout`) | Yes | Yes | Yes |
| 8 | Office Administration | Office Admin/Superintendent | `office`, `studentServices` | FROZEN | Yes (`OfficeLayout`) | Yes | Yes | Yes |
| 9 | Admissions | Admissions Officer/Manager | `admissions` | FROZEN, **1 open defect (A1)** | Yes (`AdmissionsLayout`) | Yes | Yes | Yes, with the noted concurrency caveat |
| 10 | Hostel / Warden | Warden/Hostel staff | `hostel` | FROZEN | Yes (`HostelLayout`) | Yes | Yes | Yes |
| 11 | Student LMS | Student | `academicClasses` + cross-module | COMPLETE, no formal freeze report | Yes (`StudentLmsLayout`) | Unknown (not formally re-verified) | No | Yes |
| 12 | Parent / Guardian | Parent | `parent` | FROZEN | Yes (`ParentPortalLayout`) | Yes | Yes | Yes |
| 13 | Alumni Self-Service | Alumni | `alumni` | FROZEN | Yes (`AlumniPortalLayout`) | Yes | Yes | Yes |

**Current primary Web portal count: 13** — unchanged since the
2026-09-24 portal matrix; Phase 3 through Phase 12 added no new portal
shell.

## Known architectural gap (not a 14th portal)

`/alumni-admin/*` (Alumni Officer/Coordinator routes) renders with no
layout element — bare pages under a plain `<ProtectedRoute />`. Carried
forward unchanged; a UI-consistency fix, not a missing portal.

## Not yet built (still not authorized)

- **Security / Gate / Visitor Management** — a unified Security Web
  Workspace remains the one Class E "new dedicated portal required" item.
  Hostel gate/visitors and Transport pass verification remain siloed.
  Carried forward since Phase 4; not escalated by this audit.
- **Canteen POS/terminal Web UI** — Canteen backend is frozen (Phase 2);
  no Web/POS-terminal surface exists yet. If built, it belongs inside the
  existing Procurement/Stores web surface, not as a 15th portal.

**Recommended final primary Web portal count if the above two are ever
built: 14** (13 existing + Security/Gate/Visitor Management). Canteen's
UI would not add a portal count.
