# SkillonX Implementation Roadmap (Planning Only)

Audit date: 2026-09-23. Companion to [`docs/CAMPUS_DIGITISATION_GAP_AUDIT.md`](./CAMPUS_DIGITISATION_GAP_AUDIT.md) and [`docs/SKILLONX_PORTAL_AND_ENGINE_MATRIX.md`](./SKILLONX_PORTAL_AND_ENGINE_MATRIX.md).

> **Status update (2026-09-24):** Phase 0 items 1–4 below are **DONE** (FROZEN — see `CAMPUS_OS_PHASE0_FREEZE_VALIDATION.md`). Item 6 below (Stores/Procurement closure) is **DONE for its §66-scoped gaps** (GRN idempotency, Asset handoff — see `CAMPUS_OS_PHASE1_FREEZE_VALIDATION.md`); RFQ-forms/PO-amendment/stock-verification sub-items remain open. Item 5 (Security/Gate) is explicitly **NOT authorized/NOT built**. Canteen/Food Services (previously item 16, "hold indefinitely") is **DONE, backend only** (FROZEN — see `CAMPUS_OS_PHASE2_FREEZE_VALIDATION.md`): no wallet, no Web/POS UI, not merged with Hostel Mess. Everything else below remains proposed only.

**Nothing beyond what is marked DONE above is authorized for implementation.** This is the proposed sequencing to review before any further development begins, per the audit's stop rule.

Priority legend: **P0** architectural prerequisite · **P1** essential for complete campus digitisation · **P2** important institutional capability · **P3** useful enhancement · **P4** optional/institution-specific.

---

## Phase 0 — Shared-Engine Prerequisites (P0)

Build these *before* the Security/Gate portal or any further Stores/Canteen work, so the new portal doesn't spawn its own vendor/asset/approval/document silo — the exact mistake the audit brief is trying to prevent.

| # | Item | Why P0 now | Reuses | Touches frozen code? |
| --- | --- | --- | --- | --- |
| 1 | Vendor Master consolidation | Security/Gate needs contractor/vendor identity; Stores freeze gate needs it too | Extends existing `procurement_vendors` | No — additive FK migration only |
| 2 | Asset Management shared engine | Explicitly named as a gap in the Stores freeze doc itself ("Asset Handoff: PARTIAL"); Security/Gate material passes will reference assets | New engine; Lab's asset register is the closest existing pattern to follow, not to touch | No |
| 3 | Workflow / Approval engine | 25+ modules hand-roll approval logic today; every new portal from here on should not add a 26th | New engine, adopted by **new work only** | No — frozen modules keep their existing approval code |
| 4 | Document / Evidence storage engine | No object-storage abstraction exists anywhere; Security/Gate will need visitor photos/ID scans, Scholarship will need documents | New engine, adopted by **new work only** | No |

None of these require touching Examination, Library, Hostel, Transport, Finance, HR, Alumni, Admissions, Office, Grievance, Maintenance, Lab, Mentoring, or Parent — all frozen and untouched.

---

## Phase 1 — The One New Portal (P1)

| # | Item | Depends on | Notes |
| --- | --- | --- | --- |
| 5 | Security / Gate / Visitor Management portal | Phase 0 items 1–4 | Reuses Vendor Master, Asset Management, Workflow, Document engines. Hostel's `gate.ts`/`visitors.ts` and Transport's `passes.ts` should reference the new campus-wide log going forward rather than staying permanently siloed — but this is a forward integration point, not a reopening of frozen Hostel/Transport code. |

---

## Phase 2 — Close What's Already In Flight, Then Extend (P1–P2)

| # | Item | Depends on | Notes |
| --- | --- | --- | --- |
| 6 | Close remaining Stores/Procurement freeze gates | Phase 0 item 1 (Vendor Master), item 2 (Asset Management, for the asset-handoff gate) | RFQ/quotation web forms, PO amendment/version workflow, inventory valuation policy decision, Lab stock bridge |
| 7 | Wire Examination + Stores + Lab into No-Due/Clearance aggregator | Item 6 (Stores freeze closer) | Cheap — `finance/clearance.ts` already has the pattern (Library/Hostel/Transport); just add the missing keys. Real control-risk fix, not cosmetic. |
| 8 | Scholarship / Financial Aid enhancement | Phase 0 items 3–4 (Workflow, Document engines) | Add student application intake, eligibility rules, document upload/verification, multi-step approval inside the existing Finance/Accountant workspace — not a new portal |
| 9 | Events / Venue / Resource Booking shared engine | none (reuses existing `rooms` master) | Generic booking + conflict prevention + approval, consumed by Academic/Alumni/Placement/Management |
| 10 | Communication / Notification Centre consolidation | none | Unify the 4 fragmented notification tables under one schema; decide SMS/WhatsApp provider only if institution requests it (Class F) |
| 11 | IQAC / Accreditation Evidence Aggregator | none (reads from existing Attainment/CO-PO/Gap-Analysis/HR/Finance/Library/Alumni) | Must be a **projection layer only** — zero new data entry, per the audit's zero-duplication principle for accreditation |
| 12 | Facilities preventive-maintenance + vendor-contract enhancement | Phase 0 item 1 (Vendor Master) | **DONE (2026-09-24)** — see `docs/CAMPUS_OS_PHASE3_PREIMPLEMENTATION_AUDIT.md` and `docs/FACILITIES_MAINTENANCE_FREEZE_VALIDATION.md`. Built as `maintenance_preventive_plans`/`maintenance_preventive_occurrences` + a real `service_tickets.asset_id` FK; AMC/warranty was already on `campus_assets` (P0.2) and is now surfaced, not duplicated. Frozen ticket-lifecycle logic untouched. |

---

## Phase 3 — Institution-Dependent, Build Only On Request (P3)

| # | Item | Trigger to build |
| --- | --- | --- |
| 13 | Location/Space Master consolidation (bridge `hostel_rooms`/`transport_stops` into shared location model) | Only when a real new consumer (e.g. a future analytics or Events feature) needs cross-domain location queries |
| 14 | Research/Grants administration enhancement (proposal, budget, milestone, utilization, closure) | Only if the institution has sponsored-research volume beyond current CV-style logging |
| 15 | Sports/Clubs/Student Activities tracking | Only on explicit institutional request |

---

## Phase 4 — Deferred / Optional (P4, hold unless explicitly requested)

| # | Item | Why deferred |
| --- | --- | --- |
| 16 | ~~Canteen / POS ("Food Services")~~ | **DONE, backend only (2026-09-24, FROZEN — Phase 2).** Built after Phase 0 engines existed, per this row's own sequencing; reused Vendor Master/inventory patterns, did not touch frozen Hostel. Web/POS-terminal UI remains a deliberate, explicit gap for a future pass. |
| 17 | Health Centre / Infirmary | No evidence of institutional need; sensitive medical data — do not over-collect if ever built |
| 18 | Incubation / IIC / Startup / IPR | No current footprint beyond CV tags |
| 19 | Legal / MoU / Contracts register | No current footprint beyond CV tags |
| 20 | Governance / Meetings / Committees | No current footprint; `platform_*` tables are SaaS governance, not institutional governance |
| 21 | Guest house, staff quarters, parking, laundry, printing, courier, uniform, ID card, lost & found | Zero footprint across all 9; no evidence of demand |

---

## Dependency-Respecting Rules Applied To This Sequencing

- **Vendor Master before Procurement/Security/Facilities consumers** — do not let Security/Gate or Facilities-contract work create a second/third/fourth vendor table.
- **Asset Management before closing Stores' own "Asset Handoff" gate** — the Stores freeze doc names this as its own blocker; building the engine also unblocks the frozen-module's freeze, not just the new portal.
- **Workflow/Approval and Document/Evidence engines before Security/Gate and Scholarship** — both new efforts need approval chains and evidence storage; build once.
- **No-Due completion only after Stores freeze-closes** — wiring an unfrozen module's data into a control-critical aggregator before it's stable would be premature.
- **IQAC aggregator has no hard dependency** — it only reads existing mature modules (Attainment, Finance, HR, Library, Alumni), so it can run in parallel with Phase 0/1 if resourcing allows.
- **Frozen modules (Examination, Library, Hostel, Transport, Finance, HR, Alumni, Admissions, Office, Grievance, Maintenance, Lab, Mentoring, Parent) are never reopened** anywhere in this roadmap except for pure additive/bridging work explicitly called out (Stores↔Lab stock bridge, No-Due aggregator extension, Hostel/Transport gate cross-reference) — all additive, none rewrite frozen logic.

---

## Final Decision Summary

**SKILLONX LAST-MILE CAMPUS DIGITISATION AUDIT — COMPLETE**

Current primary Web portals: **13**

Existing sufficient domains: **8**

Existing partial domains (needs closure): **2**

New dedicated portals recommended: **1**

Shared engines recommended: **8**

Integration-only capabilities: **3**

Optional/institution-dependent: **7**

**P0 architectural prerequisites:** Vendor Master consolidation; Asset Management shared engine; Workflow/Approval engine (new work only); Document/Evidence storage engine (new work only)

**P1 new portals:** Security / Gate / Visitor Management

**P2 capabilities:** Close remaining Stores/Procurement freeze gates; wire Examination+Stores+Lab into No-Due aggregator; Scholarship/Financial Aid enhancement; Events/Venue/Resource Booking engine; Communication/Notification Centre consolidation; IQAC/Accreditation Evidence Aggregator; Facilities preventive-maintenance/vendor-contract enhancement

**Recommended final primary Web portal count: 14**

### TOP 10 GAPS

1. No canonical Asset Management engine — only Lab has one; explicitly flagged as a gap by the Stores freeze doc itself.
2. No campus-wide Security/Gate/Visitor Management — Hostel and Transport each have siloed, non-reusable logic; no material gate pass, contractor entry, or security-incident tracking exists anywhere.
3. Vendor Master isn't shared — only Procurement has a real FK'd `vendors` table; Transport/Lab/Maintenance store unlinked free text.
4. No-Due/Clearance omits Examination and Stores entirely, and Lab is hardcoded `PENDING_INTEGRATION` — a real control gap, not cosmetic.
5. Lab still runs its own local stock tables instead of the canonical Stores engine — an acknowledged, unresolved duplication.
6. No shared Workflow/Approval engine — 25+ modules each reimplement approval/status logic independently.
7. No shared Document/Evidence storage service — every module reinvents attachment tables; no object-storage abstraction anywhere.
8. Notifications are fragmented across 4 per-domain tables with no unified engine; SMS/WhatsApp channels are explicitly unavailable.
9. Scholarship/Financial Aid is only a staff-entered fee-concession + bare scheme registry — no student application, eligibility engine, or document/approval workflow.
10. Stores' own freeze gates remain open (RFQ web forms, PO amendment workflow, inventory valuation policy) — the platform's newest major module isn't itself frozen yet.

### RECOMMENDED IMPLEMENTATION ORDER

1. ~~Vendor Master consolidation~~ — **DONE, FROZEN (2026-09-23)**
2. ~~Asset Management shared engine~~ — **DONE, FROZEN (2026-09-23)**
3. ~~Workflow/Approval engine (new work only)~~ — **DONE, FROZEN (2026-09-23)**
4. ~~Document/Evidence storage engine (new work only)~~ — **DONE, FROZEN (2026-09-23)**
5. Security / Gate / Visitor Management portal — **NOT authorized, not built**
6. ~~Close remaining Stores/Procurement freeze gates~~ — **PARTIALLY DONE (2026-09-24):** GRN idempotency and Asset handoff closed and frozen; RFQ web forms, PO amendment workflow, physical stock verification, and the Lab stock bridge remain open, documented, non-blocking known limitations
7. Wire Examination + Stores + Lab into the No-Due/Clearance aggregator
8. Scholarship/Financial Aid enhancement inside Finance
9. Events/Venue/Resource Booking shared engine
10. Communication/Notification Centre consolidation
11. IQAC/Accreditation Evidence Aggregator
12. Facilities preventive-maintenance + vendor-contract enhancement
13. (On request only) Location/Space Master consolidation, Research/Grants enhancement, Sports/Clubs
14. (Hold indefinitely, no current evidence of need) Canteen/POS, Health Centre, Incubation/IIC, Legal/MoU register, Governance/Meetings, and the 9 zero-footprint micro-domains

---

**STOP.** This audit and its three companion documents are the deliverable. No implementation, migration, schema change, or new portal has been built. Review and explicit approval of this roadmap is required before any development begins.
