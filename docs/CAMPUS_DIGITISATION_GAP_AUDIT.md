# SkillonX Last-Mile Campus Digitisation — Gap Audit

Audit date: 2026-09-23
Mode: **AUDIT ONLY.** No product code, migrations, or schema were changed to produce this document.
Repository: `/Users/nithinkswamy/Documents/GitHub/skillonx-erp/skillonx-erp` (branch `feat/examination-coe-operational-backend`)

Companion documents:

- [`docs/SKILLONX_CAMPUS_OS_ARCHITECTURE.md`](./SKILLONX_CAMPUS_OS_ARCHITECTURE.md)
- [`docs/SKILLONX_PORTAL_AND_ENGINE_MATRIX.md`](./SKILLONX_PORTAL_AND_ENGINE_MATRIX.md)
- [`docs/SKILLONX_IMPLEMENTATION_ROADMAP.md`](./SKILLONX_IMPLEMENTATION_ROADMAP.md)

---

## 0. Method

This audit re-read the repository directly (`apps/api/src/modules`, `apps/api/migrations`, `apps/web/src/{App.tsx,layouts,pages}`, `docs/*FREEZE*`/`*AUDIT*`/`*CLOSURE*`) and cross-checked the existing `docs/ERP_WEB_MASTER_CLOSURE_MATRIX.md` (dated 2026-09-15) against current repo state, because several domains it lists as `PARTIAL`/`MISSING` have since closed (e.g. Library froze 2026-09-23). Four background research passes covered: (1) research/IQAC/governance/legal/incubation/sports, (2) canteen/assets/facilities/events/health/misc campus-life, (3) shared engines and master data (security/gate, vendor, location, person, notifications, documents, workflow, ticketing), (4) scholarship, no-due/clearance, and the authoritative portal/route inventory. Every claim below is evidence-backed (file/migration/table names); anything not directly observed is marked `NOT_FOUND` or `UNKNOWN`, never assumed.

**Zero-fabrication note:** where this audit disagrees with the 2026-09-15 master closure matrix (e.g. Library, Warden), the more recent, directly-verified repository/docs evidence is used.

---

## 1. Confirmed Frozen / Closed Domains

Verified directly against `docs/*FREEZE_VALIDATION.md` / `*CLOSURE*` decision lines, not merely assumed from the prompt's list:

| Domain | Decision line found | Evidence |
| --- | --- | --- |
| Examination / COE | `EXAMINATION / COE PORTAL — FROZEN` | `docs/EXAMINATION_FREEZE_VALIDATION.md`, `docs/EXAM_SECTION_COE_FREEZE_VALIDATION.md` |
| Library / Librarian | `LIBRARY / LIBRARIAN PORTAL — FROZEN` (2026-09-23) | `docs/LIBRARY_PORTAL_FREEZE_VALIDATION.md` |
| Hostel / Warden | FROZEN 2026-09-14 (master matrix) + closure audit 2026-09-23 found "no freeze blockers" | `docs/HOSTEL_MANAGEMENT_FREEZE_VALIDATION.md`, `docs/WARDEN_WEB_PORTAL_AUDIT_AND_CLOSURE.md` |
| Transport | `TRANSPORT OFFICER PORTAL - FROZEN` (2026-09-21) | `docs/TRANSPORT_OFFICER_PORTAL_FREEZE_VALIDATION.md`, `docs/TRANSPORT_MANAGEMENT_FREEZE_VALIDATION.md` |
| Finance / Accounts | `FINANCE / ACCOUNTS PORTAL — FROZEN` | `docs/FINANCE_PORTAL_FREEZE_VALIDATION.md`, `docs/ACCOUNTANT_FINANCE_OFFICER_FREEZE_VALIDATION.md` |
| HR / HRMS | `HR / HRMS PORTAL — FROZEN` | `docs/HRMS_PORTAL_FREEZE_VALIDATION.md` |
| Alumni 360 (C1–C8) | `ALUMNI C1–C8 MASTER FROZEN` | `docs/ALUMNI_360_MASTER_CLOSURE.md` |

These are treated as authoritative and **not reopened** by this audit, per the frozen-module protection rule (§28 of the audit brief).

Also verified as already implemented (not part of the original "known frozen" list, but materially complete):

| Domain | Status | Evidence |
| --- | --- | --- |
| Admissions | FROZEN (2026-09-14) | `docs/ADMISSIONS_MANAGEMENT_FREEZE_VALIDATION.md` |
| Stores / Purchase / Procurement / Inventory | **COMPLETE_NOT_FROZEN** | `docs/STORES_PROCUREMENT_FREEZE_VALIDATION.md` |
| Office Administration | FROZEN | `docs/OFFICE_ADMINISTRATION_FREEZE_VALIDATION.md` |
| Grievance / Student Welfare | FROZEN | `docs/GRIEVANCE_STUDENT_WELFARE_FREEZE_VALIDATION.md` |
| Maintenance / Facilities / IT Helpdesk | FROZEN | `docs/MAINTENANCE_FACILITIES_IT_HELPDESK_FREEZE_VALIDATION.md` |
| Mentoring / Student Advisory | FROZEN | `docs/MENTORING_STUDENT_ADVISORY_FREEZE_VALIDATION.md` |
| Lab / Workshop Management | FROZEN | `docs/LAB_ASSISTANT_LAB_MANAGEMENT_FREEZE_VALIDATION.md` |
| Parent / Guardian Portal | FROZEN | `docs/PARENT_GUARDIAN_PORTAL_FREEZE_VALIDATION.md` |
| Lecturer Portal Enhancement | Phase A/B FROZEN, Phase C PENDING — **NOT FROZEN overall** | `docs/LECTURER_PORTAL_ENHANCEMENT_FREEZE_VALIDATION.md` |

This materially changes the audit's starting assumption: **SkillonX is already a large, mostly-closed system.** The two portals the brief asked to specifically hold (Stationery, Canteen) are addressed in §9 and §12 below with direct repository evidence, not speculation.

---

## 2. Current Primary Web Portal Inventory

Source: full read of `apps/web/src/App.tsx` (1295 lines) and `apps/web/src/layouts/` (9 files, all wrapping a shared `ProductShell` primitive, plus 3 further dedicated non-`ProductShell` shells).

**Counting rule:** a *portal* is a distinct navigational shell (its own dedicated layout/shell component with its own nav/branding/route namespace). A shell that hosts multiple roles with role-based views inside it (e.g. `AppLayout` serving Faculty/HOD/Principal/Management/Mentor/Librarian/Transport-staff/Placement-staff/Procurement-staff/HR) counts as **one** portal, not one per role — because HOD/Principal are Faculty-plus-leadership-overlay, not a separate identity, and Librarian/Transport/Mentor/Procurement are capability overlays on the same Faculty shell, per the master closure matrix's own role inventory.

| # | Portal | Shell | Primary users | Status |
| --- | --- | --- | --- | --- |
| 1 | Faculty / Academic Staff Workspace | `AppLayout` (shared) | Faculty, HOD, Principal, Management, Coordinator, Mentor, Librarian, Transport staff, Placement staff, Procurement staff, HR staff/admin | Mixed (mostly frozen sub-domains) |
| 2 | College Administration | `AdminLayout` | College Admin | Mixed |
| 3 | Platform Governance | `PlatformLayout` | Super Admin (multi-tenant) | FROZEN |
| 4 | Accountant / Finance | `AccountantLayout` | Accountant / Finance Officer | FROZEN |
| 5 | Exam Section / COE | `CoeLayout` | Controller of Examinations | FROZEN |
| 6 | Lab Management | `LabLayout` | Lab Assistant / In-charge | FROZEN |
| 7 | Maintenance / Facilities / IT Helpdesk | `MaintenanceLayout` | Maintenance Manager/Staff, Facilities Officer, IT Support | FROZEN |
| 8 | Office Administration | `OfficeLayout` | Office Admin / Superintendent | FROZEN |
| 9 | Admissions | `AdmissionsLayout` | Admissions Officer / Manager | FROZEN |
| 10 | Hostel / Warden | `HostelLayout` | Warden / Hostel staff | FROZEN |
| 11 | Student LMS | `StudentLmsLayout` | Student | COMPLETE, no formal freeze report |
| 12 | Parent / Guardian | `ParentPortalLayout` | Parent | FROZEN |
| 13 | Alumni Self-Service | `AlumniPortalLayout` | Alumni | FROZEN |

**CURRENT PRIMARY WEB PORTAL COUNT: 13**

**Architecture note (not a new portal, but a real gap):** `/alumni-admin/*` (Alumni Officer/Coordinator routes) renders with **no layout element at all** — bare pages under a plain `<ProtectedRoute />`, no shared nav/shell. This is inconsistent with every other staff-facing domain and should be fixed as a small UI-consistency item, not counted as a 14th portal.

**Router-level RBAC note:** only `applicantOnly`, `parentOnly`, `alumniOnly`, `studentOnly`, `adminOnly` exist as named `ProtectedRoute` guards. Every other portal (Platform, Office, Accountant, CoE, Lab, Maintenance, Admissions, Hostel, and the whole `AppLayout` group) sits behind a bare authenticated guard, with role/permission gating happening in-page/in-nav rather than at the router. This is consistent with the module-local `*/access.ts` capability pattern documented below and is not, on its own, a defect — but it means router-level guard misconfiguration is not a safety net for these portals; the module `access.ts` files are the real boundary.

---

## 3. Shared-Engine Inventory

| Engine | Maturity | Evidence | Note |
| --- | --- | --- | --- |
| Identity / Auth | MATURE, **intentionally split** | Separate auth kinds: `faculty_users`, student auth in `academicClasses`, `parent_users`+`requireParentAuth`, `alumni` JWT kind, `admission_applicants` | Freeze docs (Parent, Alumni, Admissions) explicitly treat this separation as a **security feature** (relationship-authorized, no shared session), not a defect. Do not unify. |
| RBAC / capability model | MATURE pattern, **duplicated per module** | `*/access.ts` in ~25+ modules, `apps/api/src/utils/permissions.ts` core role helpers | Consistent convention, not a shared library — each module reimplements its own capability map. Low risk; pattern is disciplined. |
| Tenant isolation (`college_id`) | MATURE | Enforced pervasively; cross-college denial explicitly tested in nearly every freeze doc | No gap found. |
| Finance / Payments | MATURE, canonical | `apps/api/src/modules/finance` owns fee/demand/payment/receipt/refund; other modules hand off via demand/reference, never post their own ledger | Confirmed canonical — see §14. |
| Workflow / Approval | **DUPLICATED, no shared engine** | No generic approval/workflow utility in `apps/api/src/utils` or a `lib/` dir (does not exist); 25+ modules each hand-roll their own status enum/state machine | See §15. |
| Audit logging | **DUPLICATED, domain-local** | `lab_audit_log`, `office_register_events`, procurement audit table, Student Services audit — each module owns its own audit table | Functionally fine per-domain; no shared audit engine. |
| Documents / Evidence / Attachments | **DUPLICATED, no shared service** | `student_service_attachments`, `student_grievance_attachments`, `service_attachments` (maintenance), `facultyProfile` evidence, HR recruitment documents — each independent; **no S3/multer/object-storage abstraction found anywhere in `apps/api/src`** | See §17. |
| Notifications | **PARTIAL, fragmented** | 4 separate tables: `student_notifications`, `employee_notifications`, `hr_candidate_notifications`, `admission_applicant_notifications` — no shared `notifications` table | Email itself IS centralized via `apps/api/src/modules/mail/mailer.ts` (SMTP-or-console abstraction, used app-wide). SMS/WhatsApp explicitly `UNAVAILABLE` (`alumni/channels.ts`); `platform/service.ts` lists `sms` only as an unimplemented config placeholder. |
| No-Due / Clearance | **PARTIAL** | `finance/clearance.ts: getFinancialClearance()` aggregates Finance + `library/clearance.ts` + `hostel/clearance.ts` + `transport/clearance.ts` on demand (not a table) | `LAB` is hardcoded `'PENDING_INTEGRATION'`. **Examination and Stores/Procurement are not wired in at all** — no `EXAMINATION`/`STORES` key exists in the aggregator. See §18. |
| Inventory / Stores | MATURE, canonical (new) | `procurement_*` tables (item master, units, categories, stores, stock ledger, balances) — see Stores freeze doc | **Lab still runs its own separate `lab_stock_items`/`lab_stock_movements`**, an acknowledged, unresolved duplication per the Stores freeze doc's own "Known Limitations." See §13. |
| Asset Management (generic) | **NOT_FOUND as a shared engine** | Real asset register (`asset_tag`, custodian, history) exists **only** in `apps/api/src/modules/lab/assets.ts`; the Stores freeze doc itself states "no canonical Asset Management module was found" | See §D in the domain matrix. |
| Vendor Master | **NOT_FOUND as shared; duplicated** | Only `procurement_vendors` (in `procurement`) is a real FK'd table. Transport (`vendor_reference`), Lab (`vendor`/`vendor_ref`), Maintenance (`vendor_name`/`vendor_ref`, explicitly commented "NOT PROCUREMENT") are unlinked free text | See §11. |
| Location / Space Master | **PARTIAL** | Shared `rooms` table (from academic timetable) is reused by Examination, Lab, Maintenance, Timetable via `room_id` FK — genuinely shared for those four | Hostel has its own separate `hostel_rooms` (not linked to `rooms`); Transport has independent `transport_stops`/`transport_routes`. No normalized Campus→Building→Floor hierarchy exists. See §12. |
| Person / Party Master | **NOT unified — by design** | Fully separate tables: `students`, `faculty_users`, `employees` (HRMS), `parent_users`, `alumni_profiles`, `admission_applicants`, `procurement_vendors` | Cross-links exist per-pair (e.g. `alumni_profiles` → `students`) but there is no shared party master, and freeze docs treat the separation as deliberate. See §10. Note: `faculty_users` (auth/role) and `employees` (HRMS profile) are themselves two tables for the same person — a real, if minor, split worth tracking. |
| Ticketing / Case engines | **DUPLICATED (2 engines)** | `service_tickets` (Maintenance) vs. `student_grievances` + 7 satellite tables (Grievance case engine) — independently reimplement status/assignment/SLA/escalation | See §16. Likely a **legitimate** separation (confidentiality/appeal requirements differ), not pure accidental debt — flagged as architectural debt, not an action item, per frozen-module protection. |
| Scheduling (academic) | MATURE | `timetable_slots`, room-conflict checking | Domain-specific; not a generic booking engine — see §N. |
| Background jobs | MATURE pattern, domain-local | `transport/jobs.ts`, `library` `runLibraryJobs`, HR scheduler | Consistent pattern, no shared job engine; not currently a problem. |
| Search / Reporting / Exports | DOMAIN-SPECIFIC | Each portal has its own reports/exports pages (e.g. `attainment/exportService.ts` NBA worksheets) | No shared reporting/export engine found; not flagged as urgent — no evidence of duplicated effort causing real pain. |
| QR | NOT_FOUND | No QR generation/scanning evidence found in any module | Not currently used anywhere; classify as future integration only if a real need (e.g. Security gate passes) emerges. |

---

## 4. Full Domain Audit (A–Z)

Status legend: `NOT_FOUND` / `PARTIAL` / `IMPLEMENTED`. Class legend defined in §20 of the audit brief (A–H), reproduced in `docs/SKILLONX_PORTAL_AND_ENGINE_MATRIX.md`.

### A. Admissions / Enquiry / CRM — **IMPLEMENTED, FROZEN**
Full lead→application→verification→selection→admission→Finance→student-master lifecycle. `apps/api/src/modules/admissions/*`, migrations `20260926100000_admissions_management.cjs` + 2 more. Class **A**.

### B/C. Stores / Stationery / Procurement / Purchase — **IMPLEMENTED, COMPLETE_NOT_FROZEN**
Canonical `Consumer → Indent → Procurement → PO → GRN → Inventory → Finance` pipeline: item master, units, categories, stores, vendors, indents, approvals, RFQ/quotation, comparison, POs, GRNs, stock ledger, balances, issue/return/transfer/adjustment, reconciliation, Finance handoff. `apps/api/src/modules/procurement`, migration `20261004100000_stores_procurement.cjs`. Focused backend 8/8, broad backend 1206/1206. **Stationery is already correctly modeled as an item category inside this engine — it is not, and should not become, a separate portal** (see §9). Not frozen because: RFQ/quotation web forms are placeholder-only, PO amendment/version workflow incomplete, Lab's legacy stock tables are not yet bridged, no inventory valuation policy defined, asset handoff is type-only (no real Asset module to hand off to). Class **B**.

### D. Asset Management (generic, cross-department) — **NOT_FOUND**
No shared asset register. Lab has its own (`lab_assets`, `lab_asset_history`) but it is Lab-scoped only. IT/Library/Hostel/Administration have zero asset tracking (no barcode/QR, custodian, transfer, warranty, AMC, depreciation, disposal outside Lab). Explicitly acknowledged as a gap by the Stores freeze doc itself. Class **D — Shared Engine Required**.

### E. Canteen / Mess / POS — **PARTIAL**
Hostel already has resident mess management: `mess_plans`, `resident_mess_assignments`, `mess_menu_cycles`, `mess_menu_items`, `mess_feedback` (migration `20260907100000_hostel_module.cjs`), reachable at `/hostel/mess*`. This is plan assignment + weekly menu + feedback for **hostel residents only** — no POS/counter, no token/QR, no wallet, no per-meal payment/settlement, no consumption-vs-Stores linkage, no wastage tracking, no vendor/daily-closing, and nothing for day-scholars or staff. See §9 for the Stores/Canteen decision. Class **G** (Canteen/POS specifically — optional/institution-dependent); Hostel Mess portion is Class **A** (sufficient, frozen, do not touch).

### F. Facilities / Campus Maintenance (beyond ticketing) — **PARTIAL**
The central `service_tickets` engine (Maintenance, FROZEN) fully covers Electrical/Plumbing/Civil/Furniture/Housekeeping/IT routing, SLA, lifecycle, parts requests (`store_ref`/`purchase_ref` wired but unpopulated — clean Stores handoff, no procurement built into it). What is **not** present: preventive-maintenance scheduling, spare-parts-to-Stores auto-consumption, or a vendor service-contract/AMC concept (Maintenance tickets only carry free-text `vendorName`/`vendorRef`/`vendorStatus`, no vendor master link, no contract entity). Class **C — Existing Portal Enhancement** (extend Maintenance; do not build a second facilities system).

### G. Security / Gate / Visitor Management — **PARTIAL, duplicated, campus-wide missing**
Hostel (`hostel/gate.ts`, `hostel/visitors.ts`) has resident gate/outpass/visitor check-in/out. Transport (`transport/passes.ts`) has pass verification. Both are siloed — grepping `gate_pass|visitor|security_incident|watchlist|blacklist|vehicle_entry` across every other module returns **zero** hits. There is no campus-wide visitor registration/approval, material gate pass, vendor/contractor entry log, or security-incident/watchlist tracking anywhere. This is exactly the domain the master closure matrix itself names as the **next planned module** after Stores. Class **E — New Dedicated Portal Required**.

### H. Research / R&D / Grants — **PARTIAL**
`facultyProfile` (`faculty_records` table, migration `20261005100000_faculty_academic_profile.cjs`) logs `PUBLICATION`, `PATENT`, `PROJECT` (`SPONSORED|FUNDED|GRANT`), `CONSULTANCY`, `RESEARCH_GUIDANCE` per faculty, with evidence + verification workflow — CV-shaped, not grants-administration-shaped. No proposal submission, funding-agency workflow, budget/sanction tracking, milestone/utilization/expenditure, PI/Co-PI/research-student as first-class entities, ethics approval, or project-closure workflow. Class **G — Optional/institution-dependent** (no evidence of institutional demand beyond CV logging; elevate only if the institution has real sponsored-research volume).

### I. IQAC / Accreditation / Quality — **PARTIAL, well-covered by proxy**
`attainment` (has an explicit `NBA_COORDINATOR` role and generates literal "NBA 8.1.1"/"NBA 8.1.2" worksheets), `copo`, `coEvaluation`, `gapAnalysis` collectively **are** the CO/PO/PSO attainment and NBA evidence source — this is real, substantive coverage, not a gap. Missing: no NAAC/AQAR/SSR/criterion-level entity, no cross-cutting evidence vault spanning all criteria (research, HR, finance, library, alumni, placement), no submission/snapshot packaging for an accreditation cycle. Repo-wide search for "aqar"/"ssr"/"criterion" returned zero hits. Class **D — Shared Engine Required** (an evidence-**projection** layer over existing modules — explicitly must not duplicate source data, per the audit brief's own principle).

### J. Grievance / Help Desk — **IMPLEMENTED, FROZEN**
Canonical case engine: triage, assignment/reassignment, clarification, internal notes, safe referrals, SLA, resolution, appeal/reopen, restricted-case isolation, secured attachments, de-identified management analytics. `studentServices/grievances.ts` + migrations `20260930100000_grievance_student_welfare_case_engine.cjs`/`20260930110000`. Class **A**. (Duplication against Maintenance's separate ticket engine is documented as architectural debt in §16 — not reopened.)

### K. Student Services / Registrar — **IMPLEMENTED, FROZEN**
Certificates, transcripts, verification, profile correction, secure attachments, Finance-demand linkage — now under the dedicated Office Administration workspace plus Student Services primitives. Class **A**.

### L. Scholarship / Financial Aid — **PARTIAL**
`finance/scholarships.ts` + migration `20260904100000_finance_module.cjs`: `scholarship_schemes` (code/name/provider only, no eligibility rules) and `student_scholarships` (`APPLIED`/`SANCTIONED` — a 2-state flag). `createStudentScholarship` is **staff-side data entry**, not a student application; no document upload, no verification step, no multi-level approval chain, no renewal logic. Finance correctly remains the money owner. Class **C — Existing Portal Enhancement** (add application/eligibility/document/approval inside Finance; do not build a separate portal).

### M. Health Centre / Infirmary — **NOT_FOUND**
Exhaustive search found zero genuine hits (only unrelated string matches like "clinic" meaning "a clinic on [topic]" in content generation). Class **G — Optional/institution-dependent**.

### N. Events / Venue / Resource Booking — **NOT_FOUND (generic)**
Only two narrow instances exist: Timetable's room-conflict check for periodic class scheduling, and Alumni's `alumni_events`/`alumni_event_registrations` (free-text `venue` string, alumni-only, no conflict prevention). No generic auditorium/seminar-hall/lab/conference-room/equipment booking, no request/approval workflow, no external-guest or event-expense tracking anywhere. Class **D — Shared Engine Required** (reuse the existing `rooms` master).

### O. Sports / Clubs / Student Activities — **NOT_FOUND**
Only a faculty-side CV tag (`facultyProfile` `INSTITUTIONAL_CONTRIBUTION` domain includes `STUDENT_ACTIVITY`/`NSS` as free text). No student-facing club/team/event-registration/achievement system. Class **G — Optional/institution-dependent**.

### P. Incubation / IIC / Startup / IPR — **NOT_FOUND**
`alumni_entrepreneurship` is alumni self-reported venture data, explicitly documented in `docs/ALUMNI_C8_FREEZE_VALIDATION.md`/`ALUMNI_IMPACT_C7_FREEZE_VALIDATION.md` as **not** a research/incubation module. Patent/IPR exists only as faculty CV entries (see H). No IIC cell, hackathon tracking, idea/prototype pipeline, or commercialization workflow. Class **G — Optional/institution-dependent**.

### Q. Legal / MoU / Contracts — **NOT_FOUND**
Only two stray CV-tag hits (`facultyProfile` `INDUSTRY_INTERACTION` enum value `'MOU'`; Alumni's `MOU_COLLABORATION` engagement-dimension tag) — neither is a contract-management entity. No partner-institution table, validity/renewal/expiry-alert fields anywhere. Class **G — Optional/institution-dependent**.

### R. IT Service Management — **IMPLEMENTED, FROZEN**
Fully inside Maintenance: `IT_SUPPORT` role, same `service_tickets` engine, IT/Systems/Network/Computer/Projector/ERP-App categories. No second system needed. Class **A**.

### S. Communication / Notification Centre — **PARTIAL**
See §3 shared-engine table. Class **D — Shared Engine Required**.

### T. Document / Records Management — **PARTIAL**
See §3 shared-engine table. Class **D — Shared Engine Required**.

### U. Governance / Meetings / Committees — **NOT_FOUND**
`platform_*` tables are SaaS tenant/platform governance (feature flags, announcements, branding) — not institutional academic governance. No Governing Council/Academic Council/BoS/Finance Committee entities, no agenda/minutes/resolution/action-item tracking. Class **G — Optional/institution-dependent**.

### V. Lab / Workshop Management — **IMPLEMENTED, FROZEN (with a known integration debt)**
Full lab workspace: master, asset register + history, consumable stock ledger, issue/return, timetable-driven practical readiness, fault/repair (with `maintenance_ref` boundary to central Maintenance), software inventory, requirement approval chain. The one open item: Lab's stock tables are still local and not bridged to the canonical Stores engine (documented in both freeze docs). Class **B — Existing, needs closure** (bridge only; do not reopen Lab's frozen business logic).

### W. Vehicle / Fleet Maintenance (inside Transport) — **IMPLEMENTED**
`transport_vehicles`, `transport_vehicle_documents` (insurance/fitness/permit/pollution/registration expiry), `transport_vehicle_maintenance` (type, scheduled/started/completed, odometer, vendor reference, cost reference), `transport_incidents`. No dedicated fuel log or tyre-specific fields found, but this is a minor enhancement, not a gap, and **Transport is frozen — not reopened**. Class **A**.

### X. Hostel Mess — **IMPLEMENTED** (see E above)
Class **A** for the resident-mess scope it actually covers; do not reopen Hostel.

### Y. Placement / Career Services — **IMPLEMENTED, FROZEN**
Company CRM, jobs, drives, eligibility, applications, offers, internships, training, coordinators, recruiter portal. `docs/` T&P freeze evidence. Class **A**.

### Z. Mentoring / Student Success — **IMPLEMENTED, FROZEN**
Full 360 view, rule-based risk engine, sessions/actions/follow-ups/escalation/referrals, 3-tier confidentiality, oversight chain. Class **A**.

### Unlisted domains actually searched (§8 of the brief)
Guest house, staff quarters, parking, laundry, printing/photocopying, courier, uniform, ID card, lost & found — **all NOT_FOUND**, zero repository footprint (confirmed by direct grep of every term; the only near-matches were unrelated — e.g. "photocopy" refers to exam-answer-script photocopy requests, "uniform" refers to statistical uniformity). No evidence of institutional demand for any of these. Class **H — Out of scope / not justified** at this time.

---

## 5. Master-Data Duplication Audits (§§10–12 of the brief)

### 10. Person / Party Model
`students`, `faculty_users`, `employees`, `parent_users`, `alumni_profiles`, `admission_applicants`, `procurement_vendors` are fully independent tables. This is **not** accidental — every freeze doc for Parent/Alumni/Admissions explicitly treats the separate-identity-per-audience model as a deliberate security boundary (a parent knowing a student ID/USN/receipt-ID is insufficient to access data; access derives only from a verified `parent_student_links` row). **Recommendation: do not unify.** The one real, minor gap: `faculty_users` (auth/role) and `employees` (HRMS profile) are two tables for the same person — track as architectural debt, not urgent.

### 11. Vendor Master
Only `procurement_vendors` is a real table with FK integrity (referenced by indents, RFQs, quotes, POs). Transport, Lab, and Maintenance each store an unlinked free-text vendor name/reference. **Risk:** the same real-world vendor (e.g. an AMC contractor who also supplies Stores items) can exist as inconsistent, unreconciled strings in three places. Class **D — Shared Engine Required**: extend `procurement_vendors` FK reuse into Transport/Lab/Maintenance rather than building a parallel registry.

### 12. Location Master
`rooms` (from academic timetable) is genuinely shared across Examination, Lab, Maintenance, and Timetable via `room_id` FK — this part already works. Hostel's `hostel_rooms` and Transport's `transport_stops`/`transport_routes` are independent, unlinked tables. No Campus→Building→Floor normalized hierarchy exists anywhere (building/floor are free-text strings on `rooms`). **Recommendation:** low-priority consolidation — extend the existing `rooms` reuse pattern to Hostel/Transport only if/when a real cross-cutting consumer (e.g. Security/Gate, or a future Events/Venue engine) needs it; do not build a new hierarchy speculatively.

---

## 6. Duplication Audits (§§13–18 of the brief)

### 13. Inventory Duplication
One canonical engine (`procurement_*`) plus one legitimate, acknowledged holdout: Lab's local `lab_stock_items`/`lab_stock_movements` (frozen, pending a documented future bridge). No other module (Hostel, Library, Transport, IT) has an independent inventory implementation. This is a **clean** result — the audit found one canonical engine and one tracked exception, not sprawl.

### 14. Financial Duplication
Finance (`apps/api/src/modules/finance`) is the sole financial ledger/payment/receipt/settlement owner. Domain modules (Examination, Hostel, Transport, Library, Student Services, Office, Procurement) correctly own only the *reason*/*obligation* and hand off to Finance via demand records or (for Procurement) an idempotent `procurement_finance_handoffs` table — none of them post their own ledger. No violation found.

### 15. Approval Duplication
Confirmed: no shared Workflow/Approval engine exists. 25+ modules independently define their own status enum/state machine (Procurement indents, Grievance case engine, Lab requirement chain, Student Services certificate requests, Admissions stages, etc.). This is real duplicated effort, though each individual implementation appears sound (tested, freeze-evidenced). Class **D — Shared Engine Required**, but **only for new work** — retrofitting frozen modules is explicitly out of scope (§28).

### 16. Help Desk Duplication
Maintenance's `service_tickets` and Student Services' grievance case engine are two independently-built engines with a similar shape (status/assignment/SLA/escalation). Both are frozen. This is flagged as **architectural debt**, not an action item: the separation may be legitimate (grievances carry confidentiality/appeal/reopen requirements facilities tickets don't need), and the frozen-module-protection rule means neither should be reopened or merged without a material operational/security reason.

### 17. Document Duplication
Confirmed: every module that stores attachments (Grievance, Maintenance, Student Services, Faculty Profile, HR Recruitment, Admissions, Gap Analysis) does so independently, with no shared file/document service and no object-storage (S3/multer) abstraction found anywhere. Class **D — Shared Engine Required**, for new work only.

### 18. No-Due / Clearance Audit
`finance/clearance.ts` aggregates Finance + Library + Hostel + Transport live (via per-module `getXNoDueStatus` functions, not a shared table). **Gaps, directly confirmed:** `LAB` is hardcoded `'PENDING_INTEGRATION'`; **Examination and Stores/Procurement are entirely absent** from the aggregator (no key exists for either). Examination has its own separate `examination/eligibility.ts` clearance concept that is not fed into the aggregator. This is a genuine control-risk gap: a student can currently be marked clear without a confirmed Stores/Lab equipment return or a wired Examination sign-off. Class **C — Existing Portal Enhancement** (extend the existing aggregator function; both source modules already exist).

---

## 7. Mobile Impact (§19 of the brief, planning only — nothing implemented)

| Domain / Engine | Mobile impact |
| --- | --- |
| Security / Gate / Visitor (new portal) | STAFF WEB (gate desk) + possibly STUDENT MOBILE (digital gate pass) — plan only |
| Asset Management (engine) | ADMIN WEB ONLY / STAFF WEB (no student/parent-facing surface) |
| Vendor Master (engine) | ADMIN WEB ONLY |
| Workflow/Approval, Document/Evidence engines | NO MOBILE (backend/shared infra only) |
| Communication/Notification Centre | Impacts all existing mobile-relevant portals indirectly (student/parent notification delivery) — engine itself is backend |
| Events/Venue/Resource Booking | STAFF WEB primarily; STUDENT MOBILE only if student-facing booking is ever added |
| Scholarship enhancement | STUDENT MOBILE (application) + STAFF WEB (Finance approval) |
| No-Due aggregator completion | Backend only; surfaces through existing Student/Parent mobile-relevant views |
| Canteen/POS (if ever built) | STUDENT MOBILE + STAFF WEB (counter POS is typically a web/kiosk surface, not mobile) |

No mobile app currently exists in this repository (`apps/web` is the only frontend); all of the above is forward planning language only, per the audit brief's instruction not to implement mobile.

---

## 8. Orphaned / Ownerless Functionality (carried forward, re-verified)

The master closure matrix's own "Orphaned / Ownerless Functionality" and "Duplication / Role Confusion" sections were spot-checked and remain accurate for the items not already closed by Office/Grievance/Maintenance freezes:

- `COLLEGE_ADMIN` is no longer a fallback for Finance or Exam operations (both closed), but grievance defaults for facilities/library/hostel/transport routing predate the Grievance case-engine closure — this should be re-verified in a future pass since Grievance is now frozen with dedicated officer roles.
- HR admin remains a capability/designation rather than an explicit core role — noted, not a blocker.

---

## 9. Special Decision — Stores & Canteen (§31 of the brief)

**1. Should Stationery remain/become a standalone portal, or become Stores & Inventory?**

**Stores & Inventory — already done, not Stationery.** The repository already implements a canonical Stores/Procurement/Inventory engine (`apps/api/src/modules/procurement`) with item master, categories, units, stores, stock ledger, issue/return/transfer/adjustment. Stationery is correctly just one `inventory_item_categories` row inside this engine, consumed by any department via an indent — exactly the intended architecture. **No work needed; no separate Stationery portal should ever be built.** The only remaining work is *closing* this module's existing freeze gates (RFQ web forms, PO amendment, Lab stock bridge) — see roadmap.

**2. Should Canteen be standalone, or should Canteen + Hostel Mess become Food Services?**

**Neither yet — hold, per the brief's own instruction.** Evidence shows these are genuinely different problems today: Hostel Mess (frozen, resident meal-plan/menu/feedback) has no POS/payment/wallet/consumption-tracking dimension at all, and a general Canteen (day-scholar/staff POS with tokens, wallet, settlement) has **zero** implementation anywhere. They are not currently duplicating each other — Hostel Mess never built a payment or consumption layer to duplicate. **When/if Canteen is greenlit**, it should be architected as a thin POS/order layer that reuses: Finance (payment/wallet), Inventory/Stores (stock consumption posting), and Identity (recognizing student/staff/day-scholar). It should **reference** Hostel Mess's menu concepts by pattern, not by reopening the frozen Hostel module. A unified "Food Services" framing is reasonable *in principle* but should not be decided or built until Canteen itself is actually approved — combining them prematurely risks reopening frozen Hostel code for no proven benefit.

**3. Shared engines that must exist BEFORE either is implemented further:**

- Vendor Master consolidation (canteen/stores vendors should not create a fourth vendor silo)
- Asset Management (kitchen/counter equipment)
- Workflow/Approval engine (if Canteen ever needs vendor onboarding or subsidy approval)
- No-Due aggregator completion (Stores is already omitted from no-due; adding Canteen debt without fixing this first compounds the same gap)

Neither Stores nor Canteen requires **new** implementation work right now beyond what's already listed in the roadmap; Canteen specifically remains **not recommended** until an institution explicitly requests day-scholar/staff POS.

---

## 10. Master Freeze Impact (§32 of the brief)

**Answer: B — a small, targeted set of P0/P1 items should close before calling SkillonX a complete Campus OS.** Specifically:

- Stores/Procurement itself is **COMPLETE_NOT_FROZEN** with named, unresolved critical gates (RFQ forms, PO amendment, Lab bridge) — freezing the platform while its own newest major module is unfrozen would be inconsistent.
- Security/Gate/Visitor is the master closure matrix's own explicitly stated "next module," and today it is genuinely unsafe at campus scale (no vendor/contractor entry log, no security-incident tracking, two non-reusable silos).
- No-Due omits Examination and Stores entirely — a live financial/academic control gap, not a cosmetic one.

However, this is a **small, scoped** punch list, not a large program: **13 of 14 recommended portals already exist** (many frozen), and **most of the 26 audited domains are Class A (sufficient) or Class G (optional/no demand evidence)**. Do not read this as "significant new development required" — read it as "four shared engines + one portal + finishing two modules already in flight."

---

## 11. Summary Table (source of truth for the other three docs)

See `docs/SKILLONX_PORTAL_AND_ENGINE_MATRIX.md` for the full Domain × Class × Owner × Dependency × Priority × Mobile matrix (§25 of the brief).
