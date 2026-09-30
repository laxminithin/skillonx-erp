# SkillonX Portal & Engine Matrix

Audit date: 2026-09-23. Companion to [`docs/CAMPUS_DIGITISATION_GAP_AUDIT.md`](./CAMPUS_DIGITISATION_GAP_AUDIT.md) and [`docs/SKILLONX_CAMPUS_OS_ARCHITECTURE.md`](./SKILLONX_CAMPUS_OS_ARCHITECTURE.md).

> **Implementation status update (2026-09-24):** Campus OS Phase 0 (Vendor Master, Asset Management, Workflow/Approval Engine, Document/Evidence Engine), Phase 1 (Procurement + Stores & Inventory closure: GRN idempotency, Asset handoff), and Phase 2 (Canteen/Food Services, backend only) are all **FROZEN**. See [`CAMPUS_OS_PHASE0_FREEZE_VALIDATION.md`](./CAMPUS_OS_PHASE0_FREEZE_VALIDATION.md), [`CAMPUS_OS_PHASE1_FREEZE_VALIDATION.md`](./CAMPUS_OS_PHASE1_FREEZE_VALIDATION.md), and [`CAMPUS_OS_PHASE2_FREEZE_VALIDATION.md`](./CAMPUS_OS_PHASE2_FREEZE_VALIDATION.md). The rows below are corrected in place where their Class/status changed; everything else in this matrix (Security/Gate and beyond) remains proposed/not authorized.

Class legend (§20 of the audit brief):
**A** existing & sufficient · **B** existing but needs closure · **C** existing portal enhancement · **D** shared engine required · **E** new dedicated portal required · **F** integration only · **G** optional/institution-dependent · **H** out of scope/not justified

---

## Current Portals

| # | Portal | Shell | Primary users | Freeze status | Source modules |
| --- | --- | --- | --- | --- | --- |
| 1 | Faculty / Academic Staff Workspace | `AppLayout` (shared) | Faculty, HOD, Principal, Management, Coordinator, Mentor, Librarian, Transport staff, Placement staff, Procurement staff, HR | Mixed — most sub-domains frozen individually | `academicClasses`, `academicLeadership`, `hr`, `library`, `transport`, `placement`, `procurement`, `mentoring`, `attainment`, `copo`, `coEvaluation`, `gapAnalysis` |
| 2 | College Administration | `AdminLayout` | College Admin | Mixed | `admin`, broad admin scope |
| 3 | Platform Governance | `PlatformLayout` | Super Admin (multi-tenant) | FROZEN | `platform` |
| 4 | Accountant / Finance | `AccountantLayout` | Accountant / Finance Officer | FROZEN | `finance` |
| 5 | Exam Section / COE | `CoeLayout` | Controller of Examinations | FROZEN | `examination`, `questionPapers` |
| 6 | Lab Management | `LabLayout` | Lab Assistant / In-charge | FROZEN | `lab` |
| 7 | Maintenance / Facilities / IT Helpdesk | `MaintenanceLayout` | Maintenance Manager/Staff, Facilities Officer, IT Support | FROZEN | `maintenance` |
| 8 | Office Administration | `OfficeLayout` | Office Admin / Superintendent | FROZEN | `office`, `studentServices` |
| 9 | Admissions | `AdmissionsLayout` | Admissions Officer / Manager | FROZEN | `admissions` |
| 10 | Hostel / Warden | `HostelLayout` | Warden / Hostel staff | FROZEN | `hostel` |
| 11 | Student LMS | `StudentLmsLayout` | Student | COMPLETE (no formal freeze report) | `academicClasses`, cross-module student views |
| 12 | Parent / Guardian | `ParentPortalLayout` | Parent | FROZEN | `parent` |
| 13 | Alumni Self-Service | `AlumniPortalLayout` | Alumni | FROZEN | `alumni` |

**Current primary Web portal count: 13.** `/alumni-admin/*` (Alumni Officer/Coordinator) exists but has no dedicated shell — an architecture-consistency gap, not counted as a 14th portal.

---

## Full Output Matrix (§25 of the brief)

| Domain | Current Coverage | Current Owner | Repository Evidence | Gap | Class | Recommended Owner | Portal/Engine/Integration | Dependencies | Priority | Mobile Impact | Recommended Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Admissions | IMPLEMENTED, FROZEN | Admissions Officer | `admissions/*`, migration `20260926100000_admissions_management.cjs` | None | A | Admissions Officer | Portal (existing) | Finance, Student master | — | STUDENT MOBILE (applicant), STAFF WEB | No action |
| Stores / Stationery / Inventory | **FROZEN (2026-09-24)** | Stores/Purchase Officer | `procurement/*`, migrations `20261004100000_stores_procurement.cjs` + `20261020100000_campus_os_phase1_stores_procurement.cjs` | RFQ web forms, PO amendment workflow, Lab stock bridge, physical stock verification (all documented non-blocking known limitations, not §66 freeze blockers) | **A** (was B) | Stores Officer | Portal (existing, in shared shell) | Vendor Master (done), Asset Management (done), Finance | — | STAFF WEB | Closed. Still lacks its own dedicated layout shell (cosmetic, not functional) |
| Procurement / Purchase | FROZEN (same module as above) | Stores/Purchase Officer | same as above | same as above | **A** (was B) | same | same | same | — | STAFF WEB | Closed |
| Asset Management (generic) | **IMPLEMENTED, FROZEN (2026-09-23)** | Platform/Shared Services | `assetManagement/*`, migration `20261019100000_campus_os_asset_management.cjs`; consumed by Procurement's GRN asset handoff | None blocking (QR/barcode deliberately deferred, design-ready) | **A** (was D) | Platform/Shared Services | Shared Engine — delivered | Vendor Master (done) | — | ADMIN/STAFF WEB | Built. Lab's own local asset register remains separate by design (frozen, untouched) |
| Canteen / Mess / POS | **Canteen: FROZEN (2026-09-24, backend only).** Hostel Mess: unchanged, still frozen, still separate | Canteen Manager/Staff (new roles) | `canteen/*`, migration `20261021100000_campus_os_phase2_canteen.cjs`; reuses Procurement's item master + `createIssue`/`createReturn` | No Web/POS-terminal UI; no prepaid wallet (deliberate — see `CAMPUS_OS_PHASE2_FREEZE_VALIDATION.md`); not merged with Hostel Mess | **A** (was G) | Canteen Manager/Staff | Backend delivered; Web not built | Vendor Master (available, unused), Finance (settlement-handoff only, not touched) | — | STAFF WEB (not yet built) | Backend closed. Web/POS-terminal UI remains a real, explicit follow-up need |
| Facilities / Campus Maintenance (PM scheduling, vendor contracts) | **FROZEN (2026-09-24)** | Maintenance Manager | `maintenance/{preventive,tickets}.ts`, migration `20261022100000_campus_os_phase3_facilities_preventive.cjs` | No dedicated Web UI for preventive plans yet (API only); AMC/warranty read from `campus_assets`, not a separate contract entity (none was proven necessary — see Phase 3 audit) | **A** (was C) | Maintenance Manager | Existing Portal Enhancement — delivered | Vendor Master (done), Asset Management (done) | — | STAFF WEB (API only this pass) | Extended Maintenance; no new portal. See `CAMPUS_OS_PHASE3_PREIMPLEMENTATION_AUDIT.md` / `FACILITIES_MAINTENANCE_FREEZE_VALIDATION.md` |
| Security / Gate / Visitor Management | PARTIAL, duplicated | none (siloed in Hostel + Transport) | `hostel/gate.ts`, `hostel/visitors.ts`, `transport/passes.ts` | No campus-wide visitor/vendor/vehicle-entry/incident tracking | E | Security Staff (new role) | **New Dedicated Portal** | Vendor Master, Asset Mgmt, Workflow engine, Document engine | P1 | STAFF WEB + STUDENT MOBILE (digital pass, future) | Build next, per master matrix's own stated plan |
| Research / R&D / Grants | PARTIAL (CV-shaped only) | Faculty (self) | `facultyProfile` `faculty_records` (PUBLICATION/PATENT/PROJECT/CONSULTANCY) | No grants-administration workflow (proposal, budget, milestone, utilization, closure) | G | TBD | Optional | Faculty Profile | P3 | FACULTY MOBILE (future, if built) | Hold unless sponsored-research volume justifies |
| IQAC / Accreditation / Quality | PARTIAL, well-covered by proxy | Faculty/HOD via Attainment/CO-PO/Gap Analysis | `attainment` (NBA_COORDINATOR role, NBA 8.1.1/8.1.2 exports), `copo`, `coEvaluation`, `gapAnalysis` | No NAAC/AQAR criterion-level evidence vault spanning all modules | D | IQAC Coordinator | Shared Engine (evidence projection, not new data entry) | Attainment, HR, Finance, Library, Alumni, Placement | P2 | ADMIN WEB ONLY | Build a projection layer; never duplicate source data |
| Grievance / Help Desk | IMPLEMENTED, FROZEN | Grievance/Student Welfare Officer | `studentServices/grievances.ts`, case-engine migrations | Duplicates shape of Maintenance ticket engine (architectural debt, not action item) | A | Grievance/Welfare Officer | Portal (existing) | — | — | STUDENT MOBILE, STAFF WEB | No action; document duplication as debt only |
| Student Services / Registrar | IMPLEMENTED, FROZEN | Office Admin | `office/*`, `studentServices/*` | None material | A | Office Admin | Portal (existing) | Finance | — | STUDENT MOBILE, STAFF WEB | No action |
| Scholarship / Financial Aid | PARTIAL (staff-entered scheme registry only) | Accountant | `finance/scholarships.ts`, migration `20260904100000_finance_module.cjs` | No student application, eligibility engine, document upload, multi-step approval | C | Accountant / Finance Officer | Existing Portal Enhancement | Document engine, Workflow engine | P2 | STUDENT MOBILE (apply) + STAFF WEB (approve) | Extend Finance; do not spin out a new portal |
| Health Centre / Infirmary | NOT_FOUND | none | none found | Entire domain | G | TBD | Optional | Student master | P4 | STAFF WEB (if built) | Hold — no evidence of institutional need |
| Events / Venue / Resource Booking | NOT_FOUND (generic) | none (Alumni-only narrow instance) | `alumni_events`, Timetable room-conflict check | No generic auditorium/seminar-hall/equipment booking or approval | D | Admin / Management | Shared Engine | `rooms` master | P2 | STAFF WEB | Build reusing existing `rooms` table |
| Sports / Clubs / Student Activities | NOT_FOUND | none | CV tag only in `facultyProfile` | Entire domain | G | TBD | Optional | Student Services | P3 | STUDENT MOBILE (if built) | Hold unless requested |
| Incubation / IIC / Startup / IPR | NOT_FOUND | none | Alumni entrepreneurship (explicitly documented as not a research module) | Entire domain | G | TBD | Optional | Faculty Profile, Alumni | P4 | — | Hold |
| Legal / MoU / Contracts | NOT_FOUND | none | CV tags only | Entire domain | G | TBD | Optional | Governance | P4 | ADMIN WEB ONLY (if built) | Hold |
| IT Service Management | IMPLEMENTED, FROZEN | IT Support (inside Maintenance) | `maintenance/*`, `IT_SUPPORT` role | None | A | IT Support | Portal (existing, shared with Facilities) | — | — | STAFF WEB | No action |
| Communication / Notification Centre | PARTIAL (4 fragmented tables; email centralized; SMS/WhatsApp unavailable) | none (per-module) | `student_notifications`, `employee_notifications`, `hr_candidate_notifications`, `admission_applicant_notifications`, `mail/mailer.ts` | No unified notification schema/service | D | Platform/Shared Services | Shared Engine | — | P2 | Impacts all mobile-relevant portals indirectly | Consolidate 4 tables; decide SMS/WhatsApp provider only on request |
| Document / Records Management | **IMPLEMENTED, FROZEN (2026-09-23)**, no consumers yet by design | Platform/Shared Services | `documentEngine/*`, migration `20261019120000_campus_os_document_engine.cjs` — first real upload/download implementation in the repo | None blocking | **A** (was D) | Platform/Shared Services | Shared Engine — delivered | — | — | ADMIN/STAFF WEB | Built, for new work only. Existing per-module attachment tables (Grievance, Maintenance, Student Services, Faculty Profile, HR, Admissions) remain untouched by design |
| Governance / Meetings / Committees | NOT_FOUND | none | `platform_*` is SaaS tenant governance, not academic governance | Entire domain | G | TBD | Optional | — | P4 | ADMIN WEB ONLY (if built) | Hold |
| Lab / Workshop Management | IMPLEMENTED, FROZEN (integration debt) | Lab Assistant / In-charge | `lab/*`, migration `20260924100000_lab_management.cjs` | Local stock tables not bridged to canonical Stores engine | B | Lab Assistant | Portal (existing) | Procurement/Stores | P2 | STAFF WEB | Bridge stock only; do not reopen Lab logic |
| Vehicle / Fleet Maintenance | IMPLEMENTED | Transport Officer | `transport_vehicles`, `transport_vehicle_maintenance`, `transport_vehicle_documents` | Minor (no dedicated fuel/tyre log) | A | Transport Officer | Portal (existing, inside frozen Transport) | — | — | STAFF WEB | No action — Transport is frozen |
| Hostel Mess | IMPLEMENTED | Warden | `hostel` mess tables | None (scope is resident meal-plan only, by design) | A | Warden | Portal (existing, inside frozen Hostel) | — | — | STUDENT MOBILE (view), STAFF WEB | No action |
| Placement / Career Services | IMPLEMENTED, FROZEN | T&P Officer | `placement/*` | None material | A | T&P Officer | Portal (existing) | — | — | STUDENT MOBILE, STAFF WEB | No action |
| Mentoring / Student Success | IMPLEMENTED, FROZEN | Mentor (Faculty overlay) | `mentoring/*` | None | A | Mentor | Portal (existing, inside Faculty workspace) | Attendance, Assessments | — | FACULTY MOBILE (future) | No action |
| Vendor Master (cross-cutting) | **FROZEN (2026-09-23)** — canonical, `procurement_vendors` unchanged + `listVendorDirectory`/`findVendorRef` accessors; consumed by Asset Management | Procurement | `procurement_vendors`; unlinked free text in Transport/Lab/Maintenance **deliberately left unmapped** (never guess vendor identity, per Phase-0 brief §4.3) | None blocking | **A** (was D) | Platform/Shared Services | Shared Engine — delivered | — | — | ADMIN WEB ONLY | Built. Transport/Lab/Maintenance free-text fields remain a documented, non-urgent gap |
| Location / Space Master (cross-cutting) | PARTIAL (rooms shared for 4 consumers) | Academic Master | `rooms` table; Hostel/Transport separate | No Campus/Building/Floor hierarchy | D (low priority) | Platform/Shared Services | Shared Engine | — | P3 | ADMIN WEB ONLY | Extend only when a new consumer needs it (e.g. Security/Gate) |
| Workflow / Approval Engine (cross-cutting) | **IMPLEMENTED, FROZEN (2026-09-23)**, no consumers yet by design | Platform/Shared Services | `workflowEngine/*`, migration `20261019110000_campus_os_workflow_engine.cjs`. Deliberately **not** wired into Procurement's existing indent/PO approvals (architecture decision, `CAMPUS_OS_PHASE1_PREIMPLEMENTATION_AUDIT.md`) | None blocking | **A** (was D) | Platform/Shared Services | Shared Engine — delivered | — | — | — | Built, for new work only. Existing 25+ per-module approval implementations remain untouched by design |
| No-Due / Clearance completion | PARTIAL | Finance (aggregator owner) | `finance/clearance.ts` + Library/Hostel/Transport `clearance.ts` | Examination, Stores, Lab not wired in | C | Finance / Accountant | Existing Portal Enhancement | Examination, Stores, Lab | P1 | STUDENT MOBILE (view), STAFF WEB | Extend existing aggregator function |
| Guest house, staff quarters, parking, laundry, printing, courier, uniform, ID card, lost & found (9 items) | NOT_FOUND | none | zero repository footprint for all 9 | Entire domains | H | — | Out of scope | — | — | — | No action; no evidence of institutional demand |

---

## Summary Counts

Original audit (2026-09-23) figures, with the 2026-09-24 post-Phase-0/1/2 correction noted alongside.

| Category | Count (2026-09-23 audit) | Count (2026-09-24, post Phase 0+1+2) |
| --- | ---: | ---: |
| Current primary Web portals | 13 | 13 (unchanged — Phase 0/1/2 added no new portal shell; Canteen has backend only, no dedicated Web surface) |
| Existing & sufficient (Class A) | 8 | **15** (+ Stores/Procurement, Asset Management, Vendor Master, Workflow Engine, Document Engine, Canteen backend, Facilities/Maintenance PM — all now delivered/frozen) |
| Existing but needs closure (Class B) | 2 (Stores/Procurement/Stationery; Lab-to-Stores bridge) | 1 (Lab-to-Stores bridge only — Stores/Procurement's §66-scoped gaps are closed; RFQ forms/PO amendment/stock verification remain documented known limitations, not blockers) |
| Existing portal enhancement (Class C) | 3 | **2 remaining** (Scholarship/Financial Aid; No-Due completion, none attempted — Facilities PM/vendor-contract now delivered/frozen, reclassified above) |
| Shared engines required (Class D) | 8 | **3 remaining** (IQAC Evidence Aggregator, Events/Venue/Resource Booking, Communication/Notification Centre — Asset Management, Vendor Master, Workflow Engine, Document Engine, Location/Space Master reclassified above) |
| New dedicated portals required (Class E) | 1 | 1 (Security/Gate/Visitor Management — **not built**, not authorized this phase) |
| Integration-only (Class F) | 3 | 3 (unchanged) |
| Optional / institution-dependent (Class G) | 7 | **6** (Canteen backend delivered and reclassified to A; its Web/POS-terminal UI remains a real, explicit follow-up, not re-added to G) |
| Out of scope / not justified (Class H) | 9 | 9 (unchanged) |

**Recommended final primary Web portal count: 14** (13 existing + Security/Gate/Visitor Management, still not authorized). Canteen's own Web/POS-terminal UI, if/when built, would most naturally live inside the existing Procurement/Stores web surface (also not yet a dedicated shell) rather than as a 15th portal — no new portal count change is implied by Phase 2.
