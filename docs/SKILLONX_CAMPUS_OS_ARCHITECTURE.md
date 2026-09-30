# SkillonX Campus OS — Target Architecture

Audit date: 2026-09-23. Companion to [`docs/CAMPUS_DIGITISATION_GAP_AUDIT.md`](./CAMPUS_DIGITISATION_GAP_AUDIT.md).

**This document describes the smallest coherent architecture that digitises essentially every recurring campus process without duplicate systems. It was a planning document when written; as of 2026-09-24, Campus OS Phase 0 (§5 below: Asset Management, Vendor Master, Workflow/Approval, Document/Evidence engines), Phase 1 (Procurement/Stores' GRN idempotency + Asset handoff), Phase 2 (Canteen/Food Services, backend only — no wallet, no Web UI, deliberately not merged with Hostel Mess), and Phase 3 (Facilities/Maintenance — preventive-maintenance scheduling + a real asset FK on service tickets, extending the already-frozen Maintenance ticket engine; no second work-order model, no new asset/vendor master) have since been implemented and frozen — see `docs/CAMPUS_OS_PHASE0_FREEZE_VALIDATION.md`, `docs/CAMPUS_OS_PHASE1_FREEZE_VALIDATION.md`, `docs/CAMPUS_OS_PHASE2_FREEZE_VALIDATION.md`, and `docs/CAMPUS_OS_PHASE3_FREEZE_VALIDATION.md` for authoritative current status. Everything else below (Security/Gate onward) remains planning only, not authorized.**

---

## 1. Domain Structure (derived from repository evidence, not the candidate template)

The repository's actual module boundaries already cluster cleanly into these groups. This structure is derived, not imposed — every module named below exists today.

### ACADEMIC
Academic Master, Academic Classes, Academic Content, Timetable, Assignments, Lesson Plans, Quizzes, Surveys, Question Bank/Papers/Questions, CO-PO, Co-Evaluation, Gap Analysis, Attainment (NBA), Content Beyond Syllabus, Examination/COE, Library.

### PEOPLE
Auth (per-audience identity), HR/HRMS, Academic Leadership (HOD/Principal overlay), Faculty Profile (CV/research/evidence), Mentoring.

### STUDENT LIFECYCLE
Admissions, Academic Classes (enrolment), Student Services (certificates/registrar), Grievance/Student Welfare, Placement, Alumni, Parent Portal.

### CAMPUS OPERATIONS
Hostel, Transport, Lab, Maintenance/Facilities/IT Helpdesk, Procurement/Stores/Inventory, Office Administration.

### FINANCIAL
Finance (fees, payments, receipts, refunds, scholarships/concessions, payroll/F&F posting — the sole ledger).

### RESEARCH & QUALITY
Attainment, CO-PO, Co-Evaluation, Gap Analysis (collectively the NBA/IQAC evidence source), Faculty Profile research records.

### GOVERNANCE
Platform (SaaS tenant governance), Management/Executive, Admin.

### SHARED PLATFORM
Mail, Meta, Dashboard, Analytics, core permissions/RBAC utilities.

This is the same eight-group shape the audit brief proposed (§27) — repository evidence confirms it, with two adjustments: "Research" and "Quality/IQAC" are the same cluster in this codebase today (attainment/copo/gapAnalysis serve both), and there is no standalone "Governance" module beyond Platform/Management — institutional governance (councils/committees) does not exist (Class G, optional).

---

## 2. Current Portals (13) — grouped by domain

| Group | Current portals |
| --- | --- |
| ACADEMIC | Faculty/Academic Staff Workspace (`AppLayout`), Exam Section/COE (`CoeLayout`), Lab (`LabLayout`) |
| PEOPLE | (served inside Faculty Workspace + Admin; no separate HR portal shell — HR pages live under `AppLayout`/`/hr/*`) |
| STUDENT LIFECYCLE | Student LMS (`StudentLmsLayout`), Admissions (`AdmissionsLayout`), Parent (`ParentPortalLayout`), Alumni (`AlumniPortalLayout`) |
| CAMPUS OPERATIONS | Hostel/Warden (`HostelLayout`), Maintenance/Facilities/IT (`MaintenanceLayout`), Office Administration (`OfficeLayout`) — Procurement/Stores currently lives inside the shared `AppLayout`, not its own shell |
| FINANCIAL | Accountant/Finance (`AccountantLayout`) |
| RESEARCH & QUALITY | (served inside Faculty Workspace / Admin — no separate portal) |
| GOVERNANCE | Platform Governance (`PlatformLayout`), College Administration (`AdminLayout`) |

Total distinct shells: **13** (see gap audit §2 for the full list and counting rule).

**Architecture observation:** Procurement/Stores, despite being a large, freeze-evidenced module with its own responsive QA suite, currently renders as a single page inside the shared `AppLayout` rather than a dedicated shell like Office/Maintenance/Hostel got. This is a UI-consistency gap worth closing when the module's remaining freeze gates are closed — not a new-portal recommendation, just aligning its shell treatment with its actual operational weight.

---

## 3. Proposed New Portals

Only **one** new dedicated portal is justified by evidence:

### Security / Gate / Visitor Management (CAMPUS OPERATIONS)
- **Why a portal, not an engine:** distinct operational team (security/gate staff), substantial standalone workflow (visitor approval, material gate pass, vendor/contractor entry, vehicle entry/exit, security incident log), and it is the master closure matrix's own explicitly named next module.
- **Must reuse, not duplicate:** Identity (existing person tables), Vendor Master (once consolidated), Workflow/Approval engine (once built), Document/Evidence engine (once built), the shared `rooms`/location data.
- **Must absorb by reference, not rebuild:** Hostel's `gate.ts`/`visitors.ts` and Transport's `passes.ts` should become *consumers* of the new campus-wide gate log (or at minimum cross-reference it), not be duplicated a third time. Hostel and Transport are frozen — this is a forward integration point, not a reopening.

No other domain in the audit clears the bar for a **new dedicated portal** (distinct team + substantial workflow + no existing home). Canteen, Research Office, Health Centre, Governance/Committees, Incubation/IIC, and Legal/MoU are all Class G (optional/institution-dependent) — real operational teams exist for some of these at some institutions, but this repository shows **zero evidence of current demand** (no stray tables, no TODOs, no half-built UI), so building them now would be speculative, not audit-driven.

---

## 4. Portals That Should Not Exist

| Candidate | Why not |
| --- | --- |
| Stationery Portal | Already correctly a category inside Stores/Procurement/Inventory. A separate portal would duplicate item master, stock ledger, and approval logic that already exists. |
| Canteen Portal (standalone) | No current implementation to justify urgency; if built, must be a thin layer over Finance + Inventory + Identity, not a fourth financial/inventory silo. Hold per §9 of the gap audit. |
| A second IT ticketing system | IT Service Management is already inside the Maintenance/Facilities/IT Helpdesk engine (`IT_SUPPORT` role, same `service_tickets` table). |
| A second Grievance/Helpdesk-style system for Security incidents | Security incidents should be tracked as their own entity inside the new Security/Gate portal, but should reuse the *pattern* (status/assignment/escalation) from a future shared Workflow engine rather than re-inventing a third case-management shape. |
| A dedicated Research Office portal (at this time) | Faculty Profile already captures research CV data; no evidence of proposal/grant-administration volume that would justify a dedicated team+portal today. Revisit only on explicit institutional request. |
| A dedicated IQAC data-entry portal | Would violate the audit's own core principle — IQAC should **project** evidence from Attainment/CO-PO/Gap-Analysis/HR/Finance/Library/Alumni, never duplicate it. |

---

## 5. Shared Engines (current + proposed)

| Engine | Status today | Proposed |
| --- | --- | --- |
| Finance / Payments | MATURE, canonical | No change — keep as sole ledger owner |
| Inventory / Stores | MATURE (new) | Finish closing freeze gates; bridge Lab's local stock into it |
| Identity / Auth (per-audience) | MATURE, intentionally split | No change — do not unify |
| RBAC capability pattern | MATURE convention, per-module | No change — keep the `*/access.ts` convention; do not force a shared library onto frozen modules |
| Tenant isolation | MATURE | No change |
| **Asset Management** | MISSING (Lab-only) | **New shared engine** — generic register (tag/custodian/department/location/transfer/warranty/AMC/disposal) consumed by IT, Library, Hostel, Facilities, and eventually bridged from Lab's asset register |
| **Vendor Master** | Duplicated (real only in Procurement) | **Consolidate** — extend `procurement_vendors` FK reuse into Transport/Lab/Maintenance instead of free-text fields |
| **Workflow / Approval** | Duplicated, no shared library | **New shared engine**, adopted by *new* work only (Security/Gate, Scholarship enhancement, any future portal) — never retrofitted into frozen modules |
| **Document / Evidence Storage** | Duplicated, no object-storage abstraction | **New shared engine**, adopted by new work only, same non-retrofit rule |
| **Communication / Notification Centre** | Fragmented (4 tables), email centralized, SMS/WhatsApp unavailable | **Consolidate** the 4 notification tables under one schema/service; decide on an SMS/WhatsApp provider only if the institution asks (Class F integration) |
| **No-Due / Clearance** | Aggregator exists, missing Examination + Stores + Lab | **Extend** existing `finance/clearance.ts` aggregator — cheap, all source modules already exist |
| **Events / Venue / Resource Booking** | Missing (generic) | **New shared engine** reusing the existing `rooms` master; consumed by Academic, Alumni, Placement, Management |
| **IQAC / Accreditation Evidence Aggregator** | Missing (generic) | **New shared engine** — projects from Attainment/CO-PO/Gap-Analysis/HR/Finance/Library/Alumni; never a second data-entry surface |
| Location / Space Master | Partial (rooms shared for 4 consumers; Hostel/Transport separate) | Low-priority consolidation — extend only when a real new consumer (e.g. Security/Gate) needs it |

---

## 6. Integrations (Class F)

| Integration | Status | Note |
| --- | --- | --- |
| Email (SMTP) | IMPLEMENTED (`mail/mailer.ts`) | Already centralized — the one notification channel that IS shared |
| SMS / WhatsApp | NOT INTEGRATED | Explicitly `UNAVAILABLE` in code (`alumni/channels.ts`); config placeholder only in `platform/service.ts` |
| Payment gateway | Mock/e2e provider only per Finance freeze docs | Real gateway is a future integration, not a new finding |
| RFID / biometric / ANPR (gate hardware) | NOT INTEGRATED | Would matter only once Security/Gate portal is built; classify as hardware integration then, not before |
| QR | NOT FOUND anywhere | No current use; only relevant as a future integration for Security/Gate passes or Library/Stores if ever needed |

---

## 7. Optional / Institution-Dependent Modules

Canteen/POS, Research/Grants administration (beyond current CV logging), Health Centre, Sports/Clubs/Student Activities, Incubation/IIC/IPR, Legal/MoU register, Governance/Meetings/Committees. All Class G — build only on explicit institutional request, and only after the P0 shared engines exist so they don't each spawn a new vendor/asset/document/notification silo.

---

## 8. Dependency Graph (derived from actual repository evidence, not the template)

```
Vendor Master (consolidate)
        |
        v
Asset Management (new engine) <----- Lab's local asset register (bridge)
        |
        v
Security / Gate / Visitor Management (new portal)
        ^                                   ^
        |                                   |
Workflow/Approval (new engine)     Document/Evidence (new engine)
        |                                   |
        +------------------+----------------+
                            |
                            v
              (reused by all NEW work only —
               frozen modules keep their own
               approval/attachment code)

Procurement / Stores (existing, COMPLETE_NOT_FROZEN)
        |
        +--> Lab stock bridge (closes a named freeze gap)
        |
        +--> No-Due aggregator (extend: add STORES + EXAMINATION + LAB keys)
                    ^
                    |
        Finance clearance.ts (existing) <--- Library / Hostel / Transport (already wired)

Finance (canonical ledger)
        |
        +--> Scholarship/Financial Aid enhancement (application + eligibility + docs + approval)
        |         (reuses Document/Evidence + Workflow engines once built)
        |
        +--> integrates throughout: Examination fees, HR payroll/F&F,
              Hostel/Transport/Library fee heads, Procurement handoff,
              Admissions applicant payment

Attainment / CO-PO / Gap Analysis / Faculty Profile / HR / Finance / Library / Alumni
        |
        v
IQAC / Accreditation Evidence Aggregator (new engine — projects, never duplicates)

rooms (existing shared location master)
        |
        v
Events / Venue / Resource Booking (new engine)

Canteen / POS (optional, deferred)
        depends on: Finance (payment/wallet) + Inventory (consumption) +
                     Identity + Vendor Master + Asset Management
        must NOT duplicate: Hostel Mess (reference it, do not reopen Hostel)
```

**Reading order this implies:** Vendor Master and Asset Management are the true P0 prerequisites (Security/Gate and the Stores freeze-closure both need them). Workflow/Approval and Document/Evidence are P0 for any *new* portal but deliberately never touch frozen code. Everything else (No-Due completion, Scholarship, Events/Venue, IQAC aggregator, Facilities enhancement) is P1/P2 and has no hard blocking dependency on the new portal — they can proceed in parallel once Finance/Attainment/rooms (all already mature) are the only inputs needed.

---

## 9. What "Campus OS" Means Here (not a slogan)

Given the evidence, SkillonX today is **not** a collection of disconnected portals — it is one platform with 13 role-scoped shells sharing one identity-per-audience model, one Finance ledger, one Inventory engine, one Maintenance ticket engine, and one Student Services/Registrar engine, plus a small number of genuine, tracked exceptions (Lab's local stock, two ticket-shaped engines, fragmented notifications). The remaining work to be a **complete** Campus OS is narrow: one new portal (Security/Gate), four shared engines (Asset, Vendor consolidation, Workflow, Document — the last two adopted only by new work), and finishing two modules already mid-freeze (Stores, No-Due wiring). See `docs/SKILLONX_IMPLEMENTATION_ROADMAP.md` for sequencing.
