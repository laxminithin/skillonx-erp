# SkillonX Campus OS — Final Coverage Matrix

Date: 2026-09-26. Companion to `docs/CAMPUS_OS_PHASE13_FINAL_GAP_AUDIT.md`.
Consolidates `docs/CAMPUS_DIGITISATION_GAP_AUDIT.md`,
`docs/SKILLONX_PORTAL_AND_ENGINE_MATRIX.md`, and every
`docs/CAMPUS_OS_PHASE{0..12}_FREEZE_VALIDATION.md` into one current table.

Gap-class legend: **A** existing & sufficient · **B** existing but needs
closure · **C** existing portal enhancement · **D** shared engine required
· **E** new dedicated portal required · **F** integration only ·
**G** optional/institution-dependent · **H** out of scope/not justified ·
**I** duplicate/do not build · **J** out of scope (governance)

| Domain | Authoritative Engine | Primary Role | Web Access | Status | Freeze Status | Gap Class | External Dependency | Master-Freeze Blocker? | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Admissions / Enquiry CRM | `apps/api/src/modules/admissions` | Admissions Officer/Manager | Dedicated portal | IMPLEMENTED | FROZEN | A (CLOSED — was A) | — | No — CLOSED | Concurrency race in admission-number generation, closed via bounded retry; see `docs/ADMISSIONS_CONCURRENCY_MASTER_FREEZE_CLOSURE.md` |
| Stores / Procurement / Inventory | `procurement` | Stores/Purchase Officer | In Faculty shell | IMPLEMENTED | FROZEN | A | — | No | RFQ forms/PO amendment/Lab bridge are documented non-blocking limitations |
| Asset Management | `assetManagement` | Platform/Shared Services | Admin/Staff web | IMPLEMENTED | FROZEN | B | — | No | `listAssets` fixed 500-row cap, no offset (B2) |
| Vendor Master | `procurement_vendors` | Procurement | Admin web | IMPLEMENTED | FROZEN | A | — | No | Transport/Lab/Maintenance free-text vendor fields remain unlinked (low priority) |
| Workflow / Approval Engine | `workflowEngine` | Platform/Shared Services | — | IMPLEMENTED | FROZEN | A | — | No | Built for new work only; 25+ existing per-module approvals untouched by design |
| Document / Evidence Engine | `documentEngine` | Platform/Shared Services | — | IMPLEMENTED | FROZEN | A | — | No | Existing per-module attachment tables remain untouched by design |
| Canteen / Mess / POS | `canteen` (backend), `hostel` (mess) | Canteen Manager; Warden | Backend only (Canteen); portal (Hostel Mess) | PARTIAL | Canteen backend FROZEN; Hostel Mess FROZEN | A (delivered scope); Web/POS UI still G | — | No | Canteen Web/POS terminal UI is a real, explicit, un-built follow-up |
| Facilities / Maintenance / IT Helpdesk | `maintenance` | Maintenance Manager/Facilities Officer/IT Support | Dedicated portal | IMPLEMENTED | FROZEN | A | — | No | Preventive maintenance delivered API-only (no dedicated Web UI yet) |
| Security / Gate / Visitor Management | `security`, `hostel/gate.ts`, `transport/passes.ts` | Security Staff (new); Warden; Transport | Partial (Hostel gate only) | PARTIAL | Phase 4 partial, not fully frozen | E | — | No (long-standing, not escalated by new evidence) | Material Gate Pass, Asset Outward/Return Pass, unified Security Web Workspace remain deferred (carried since Phase 4) |
| Research / Grants / Innovation | `research` | PI/Co-PI (Faculty) | Backend + partial web | IMPLEMENTED | Phase 6 FROZEN | B | — | No | Research Web Workspace, institutional IPR lifecycle, consultancy expansion deferred |
| IQAC / Accreditation / Governance | `iqac` | IQAC Coordinator | Dedicated workspace | IMPLEMENTED | Phase 7 FROZEN | A | Official NAAC/NBA/NIRF/AISHE content is external | No | Generic committee/meeting model also covers Academic Council/BoS/Governing Council (§6 of gap audit) — not a separate gap |
| Grievance / Help Desk (case engine) | `studentServices/grievances.ts` | Grievance/Welfare Officer | Dedicated | IMPLEMENTED | FROZEN; Phase 8 expansion FROZEN | B | — | No | Attachment **upload** path was never built (only metadata + download) — B3 |
| Student Services / Registrar | `office`, `studentServices` | Office Admin | Dedicated | IMPLEMENTED | FROZEN | B | — | No | Registrar role, digital signature still deferred (Phase 9) |
| Scholarships / Financial Aid | `finance/scholarships.ts` | Accountant | In Finance shell | PARTIAL | Phase 10 FROZEN, 1 documented limitation | C | SSP/NSP/DBT external | No | Full 8-breakpoint responsive QA still deferred |
| Innovation / Incubation / IIC | — | — | — | NOT_CONFIGURED | Phase 12 FROZEN (audit-only, Option D) | G | — | No | Repository's own governance docs held this "indefinitely" before Phase 12 started |
| Events / Venue / Resource Booking | `events` | Organiser roles | Backend + Web | IMPLEMENTED | Phase 11 FROZEN | A | — | No | Club identity explicitly deferred to "Phase 13" in Phase 11's own limitations list — see Sports/Clubs row below |
| Examination / COE | `examination` | Controller of Examinations | Dedicated | IMPLEMENTED | FROZEN | A | VTU manual import, not live | No | — |
| Library | `library` | Librarian (designation) | Dedicated | IMPLEMENTED | FROZEN | A | — | No | — |
| Hostel / Warden | `hostel` | Warden | Dedicated | IMPLEMENTED | FROZEN | A | — | No | — |
| Transport | `transport` | Transport Officer | Dedicated | IMPLEMENTED | FROZEN | A | — | No | Bus/student fleet only — no institutional-fleet (official cars) concept; see G row |
| Finance / Accounts | `finance` | Accountant | Dedicated | IMPLEMENTED | FROZEN | A | Payment gateway production config, bank reconciliation external | No | Canonical ledger for the whole platform |
| HR / HRMS / Payroll | `hr` | HR Admin (capability) | Dedicated | IMPLEMENTED | FROZEN | A | PF/ESI/PT/TDS/Form-16 statutory filing external | No | — |
| Mentoring / Student Advisory | `mentoring` | Mentor (Faculty overlay) | In Faculty shell | IMPLEMENTED | FROZEN | A | — | No | — |
| Lab / Workshop Management | `lab` | Lab Assistant/In-charge | Dedicated | IMPLEMENTED | FROZEN | B | — | No | Local stock tables not yet bridged to Stores (B4, carried forward) |
| Alumni | `alumni` | Alumni Officer/Coordinator | Dedicated (+ `/alumni-admin` no-shell gap) | IMPLEMENTED | Phase 9 FROZEN | B | — | No | Document requests, dedicated Registrar role, digital signature deferred |
| Placement / T&P | `placement` | T&P Officer | Dedicated | IMPLEMENTED | FROZEN | A | — | No | Also owns `student_projects`/`student_achievements` (see Student-360 row) |
| Office Administration / E-office | `office` | Office Admin | Dedicated | IMPLEMENTED | FROZEN | A | — | No | Inward/outward register + file movement already covers e-office needs (§6 of gap audit) |
| Platform Governance | `platform` | Super Admin | Dedicated | IMPLEMENTED | FROZEN | A | — | No | — |
| Parent Portal | `parent` | Parent | Dedicated | IMPLEMENTED | FROZEN | A | — | No | — |
| Student LMS | `academicClasses` + cross-module | Student | Dedicated | IMPLEMENTED | Complete, no formal freeze report | A | — | No | — |
| No-Due / Clearance | `finance/clearance.ts` (aggregator) | Finance | Aggregated view | PARTIAL | — | C | — | No | Examination and Stores still not wired into the aggregator |
| Communication / Notification Centre | 4 fragmented tables + `mail/mailer.ts` | per-module | — | PARTIAL | — | D | SMS/WhatsApp unavailable | No | Consolidation still not built |
| Health Centre / Infirmary | — | — | — | NOT_FOUND | — | G | — | No | No institutional demand evidenced |
| Sports / Clubs / Student Activities / NSS / NCC | — | — | — | NOT_FOUND (tags only) | — | G | — | No | Events can tag `SPORTS_EVENT`/organizer `CLUB`; no club/membership/achievement entity |
| Legal / MoU / Contracts | — | — | — | NOT_FOUND | — | G | — | No | — |
| Academic student projects (mini/major/capstone) | `placement.student_projects` | T&P (as owner) | In Placement shell | PARTIAL | — | C | — | No | Portfolio/resume-scoped; no UG/PG/CAPSTONE enum, no academic evaluation workflow |
| Student achievement / Student-360 | `placement` (projects/experiences/achievements/resume) | T&P | In Placement shell | PARTIAL | — | D | — | No | Placement/resume-scoped; not a Faculty-Academic-Record equivalent |
| Institutional Fleet (official vehicles) | — | — | — | NOT_FOUND | — | G | — | No | Transport is student/staff bus fleet only |
| Parking | — | — | — | NOT_FOUND | — | H | — | No | — |
| Official Duty / TA-DA reimbursement | `hr` (OD leave type only) | HR | In Faculty/HR shell | PARTIAL | — | C | — | No | No linked expense-claim/reimbursement entity |
| Campus ID / unified QR identity | — | — | — | NOT_FOUND | — | G | — | No | Library card, hostel ID, transport pass, hall ticket remain separate |
| RFID / Biometric access control | — | — | — | NOT_CONFIGURED | — | H | Hardware integration | No | — |
| Lost & Found | — | — | — | NOT_FOUND | — | H | — | No | — |
| Guest house / staff quarters / laundry / printing / courier / uniform | — | — | — | NOT_FOUND (all) | — | H | — | No | Zero repository footprint, unchanged |
