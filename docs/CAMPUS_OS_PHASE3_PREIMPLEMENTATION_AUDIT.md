# Campus OS Phase 3 — Facilities, Maintenance & Work Order Management
## Pre-Implementation Audit

Date: 2026-09-24
Scope: audit only, performed before any Phase 3 schema/code change, per the
Phase 3 authorization brief (`AUDIT FIRST → REUSE BEFORE BUILD → IMPLEMENT
ONLY PROVEN GAPS → VALIDATE → FREEZE → STOP`).

Repo root: `/Users/nithinkswamy/Documents/GitHub/skillonx-erp/skillonx-erp`.
Backend: `apps/api` (Express + Knex + TypeScript, MySQL). Frontend: `apps/web`.

---

## Headline finding

**A full, frozen, production-grade Facilities/Maintenance/IT-Helpdesk
ticketing engine already exists** at `apps/api/src/modules/maintenance/`
(migration `20260925100000_maintenance_helpdesk.cjs`, frozen
2026-09-13, doc `docs/MAINTENANCE_FACILITIES_IT_HELPDESK_FREEZE_VALIDATION.md`).
It is the generic work-order model this Phase 3 brief describes — one
central `service_tickets` table shared by Facilities and IT, with routing,
SLA, technician assignment, parts requests, escalation, comments, work logs,
attachments and a full audit trail. **Phase 3 must not create a second
work-order/ticket engine.**

The only two genuinely proven, evidence-backed gaps are:

1. **No preventive-maintenance schedule exists anywhere in the repo.**
2. **`service_tickets` had no real FK to the canonical asset register**
   (`campus_assets`) — only a free-text `asset_ref` — so maintenance history
   was not reliably traceable from the asset side, and AMC/warranty data
   (which *already exists* on `campus_assets`) was never surfaced to the
   maintenance operator.

Everything else this brief asks about (complaint/repair/service/technician,
routing, SLA, spares request, vendor reference, location, escalation,
notifications, RBAC, audit, dashboards, reports) is **already built, tested
and frozen**. Building it again would be duplication, not a gap.

---

## Per-requirement classification

| Concept | Classification | Where | Notes |
|---|---|---|---|
| Generic work order / ticket / status machine | **EXISTING & SUFFICIENT** | `maintenance/{tickets,types}.ts`, `service_tickets` (13-state lifecycle) | Reused as-is |
| Routing / SLA / escalation | **EXISTING & SUFFICIENT** | `maintenance/{routing,sla}.ts` | Reused as-is |
| Technician / team assignment | **EXISTING & SUFFICIENT** | `service_teams`, `service_team_members` | Reused as-is |
| Parts / consumable request | **EXISTING & SUFFICIENT** (real Stores wiring is a separate, already-documented future step) | `service_part_requests` | Inert `store_ref`/`purchase_ref`, unchanged |
| Vendor master | **SHARED FOUNDATION AVAILABLE** | `procurement_vendors`, `findVendorRef` | Reused; Transport/Lab/Maintenance's own free-text vendor fields intentionally left alone |
| Generic asset register + state machine | **SHARED FOUNDATION AVAILABLE** | `assetManagement/*`, `campus_assets` | Reused; added a real FK from tickets (gap #2) |
| AMC / warranty data | **EXISTING BUT NOT SURFACED** | `campus_assets.warranty_end_date/amc_reference/amc_expiry_date` | Data already exists (P0.2, frozen) — Phase 3 gap was *surfacing* it, not storing it again |
| Workflow / approval engine | **SHARED FOUNDATION AVAILABLE, unused** | `workflowEngine/*` | Not adopted in Phase 3 — no new multi-step approval was proven necessary (see §5 below) |
| Document / evidence engine | **SHARED FOUNDATION AVAILABLE, unused** | `documentEngine/*` | Not adopted in Phase 3 — `service_attachments` already covers ticket evidence; no new evidence type was proven necessary |
| Preventive maintenance schedule | **MISSING** | — | Built (the one real gap) |
| Equipment calibration | **DOMAIN-SPECIFIC BY DESIGN / OPTIONAL** | — | Zero hits repo-wide; not requested by any existing module; out of scope |
| Hostel complaint/maintenance | **DOMAIN-SPECIFIC BY DESIGN (accepted debt)** | `hostel_complaints`, `hostel_assets` | Frozen, untouched; integrates via `source_module=HOSTEL` only |
| Lab equipment maintenance | **DOMAIN-SPECIFIC BY DESIGN** | `lab_faults`/`lab_repairs` + `maintenance_ref` | Frozen, untouched; already the reference integration pattern |
| Transport vehicle maintenance | **DOMAIN-SPECIFIC BY DESIGN** | `transport_vehicle_maintenance` | Frozen, untouched — vehicle ops maintenance stays in Transport |
| Library equipment | **N/A** | — | No domain table exists; ad hoc Maintenance tickets remain the only path |
| Canteen equipment | **N/A** | — | Confirmed absent, zero hits |
| Location / room model | **EXISTING BUT PARTIAL (accepted, P3 debt)** | `rooms` (flat, no Campus/Building hierarchy) | Reused as-is; no hierarchy work in scope |
| Notifications | **SHARED FOUNDATION AVAILABLE (fragmented, no live provider)** | `employee_notifications`, `mail/mailer.ts` | Not extended — preventive-generation notifications were not required by the brief's own §39 ("do not build a new notification engine"); operators see due plans via the dashboard/report instead |
| RBAC / roles | **EXISTING, module-local convention** | `maintenance/access.ts` | New `maint.preventive.manage` permission added the same way, granted to the same manager-tier roles already governing `maint.config` |
| Housekeeping / waste / energy | **OPTIONAL / OUT OF SCOPE** | — | No existing requirement found; not built |

---

## Explicit answers

1. **What Maintenance engine already exists?** A full central Facilities +
   IT service-ticket engine (`service_tickets` + 12 supporting tables),
   frozen 2026-09-13, with 24/24 focused tests passing and 840/844 full
   backend regression at freeze time (4 documented pre-existing unrelated
   failures).
2. **Which modules currently own maintenance-like workflows?** Central
   Maintenance (generic); Lab (`lab_faults`/`lab_repairs`, equipment-specific,
   linked via `maintenance_ref`); Hostel (`hostel_complaints`, general
   complaint, broader than repair); Transport (`transport_vehicle_maintenance`,
   `transport_complaints`, vehicle-specific).
3. **Does Hostel have its own maintenance/complaint flow?** Yes —
   `hostel_complaints`. Documented, accepted architectural debt (shape
   overlaps Maintenance); not authorized to merge in this phase.
4. **Does Lab have equipment maintenance?** Yes — `lab_faults`/`lab_repairs`,
   integrated with central Maintenance by reference (`maintenance_ref`),
   never duplicated.
5. **Does Transport have vehicle maintenance?** Yes —
   `transport_vehicle_maintenance`. Explicit ownership boundary preserved.
6. **Does Canteen have equipment references?** No — confirmed absent by
   grep.
7. **Does Library contain equipment/facility maintenance?** No domain table;
   only ad hoc Maintenance tickets (`source_module=LIBRARY`).
8. **Is there already a generic work-order model?** Yes — `service_tickets`.
9. **Is there already technician assignment?** Yes — `service_teams` /
   `service_team_members`.
10. **Is there already asset linkage?** Partial — only free-text `asset_ref`.
    A real FK (`service_tickets.asset_id → campus_assets`) was the proven gap,
    now added additively.
11. **Is there already vendor linkage?** Partial — `service_tickets` has
    lightweight, unlinked `vendor_name`/`vendor_ref` strings for tickets sent
    out for external repair. Left as-is (not a Phase 3 target); Vendor Master
    is reused directly by the new preventive-plan's optional `vendor_id`.
12. **Is there already spare-parts/Stores integration?** Partial —
    `service_part_requests` request/approve/fulfill only, with inert
    `store_ref`/`purchase_ref` for a documented future Stores handoff. Not
    touched.
13. **Is there already preventive maintenance?** No — confirmed missing.
    Built.
14. **Is there already maintenance history?** Yes, on the ticket
    (`service_ticket_events`). Traceability *from the asset* was missing —
    added via an additive `campus_asset_history` entry.
15. **Is there already cost tracking?** Only `estimatedCost` on part
    requests; no ledger. Not extended — Finance boundary preserved as-is.
16. **Is there already a Facilities Web workspace?** Yes — 10 pages under
    `apps/web/src/pages/maintenance/*` plus `MaintenanceLayout.tsx`. No new
    portal created (per §52 of the brief); Web changes for the two gaps are
    out of scope for this pass (see Known Limitations) since the API surface
    was the proven, testable gap.
17. **Which existing implementations should remain domain-specific?**
    Transport vehicle maintenance, Lab equipment fault/repair + calibration,
    Hostel resident-facing complaints — all frozen, all untouched.
18. **Which functionality should become institutional/shared?** Nothing new
    needed centralizing; the central ticket engine already is the shared
    layer. The two gaps (asset FK, preventive schedule) extend the *shared*
    Maintenance module, not a domain-specific one.
19. **What exactly must Phase 3 add?**
    - `service_tickets.asset_id` (additive FK to `campus_assets`).
    - `maintenance_preventive_plans` + `maintenance_preventive_occurrences`
      (new, idempotent preventive schedule, generating ordinary
      `service_tickets` rows).
    - Two minimal, additive read/history exports on the frozen Asset
      Management service (`findAssetRef`, `recordMaintenanceHistory`) —
      no status mutation, no new asset master.
    - One new permission (`maint.preventive.manage`) on the existing
      Maintenance RBAC convention.
    - Dashboard/report surfacing of preventive-due plans and asset
      warranty/AMC on a ticket.

---

## Why the Workflow Engine and Document Engine were not adopted here

The brief's §15/§16 say to reuse P0.3/P0.4 "where NEW Phase 3 approvals
genuinely need it" / "for applicable evidence" — not unconditionally. The
proven gap (preventive maintenance) does not, on its own, require a
multi-step approval chain: a plan is created/paused/ended by a single
manager-tier actor, matching how the existing ticket engine's own
priority/status changes work (also single-actor, permission-gated, fully
audited). Retrofitting the frozen ticket-status machine onto the Workflow
Engine is explicitly the *wrong* move — the Workflow Engine's own freeze
doc records "None of the 25+ existing module-local approval implementations
were retrofitted" as a hard freeze condition. Likewise, evidence for
preventive maintenance (a completed AC-service photo, say) already has a
home in `service_attachments`/`service_work_logs` on the generated ticket;
no new evidence type was identified that those don't cover. Both engines
remain available, unused-by-Maintenance shared foundations for a future,
separately-justified need (e.g. an AMC contract sign-off workflow) — adding
them now would be speculative, not evidence-backed.

---

## Final architecture decision

**(B) Closure/integration of an already-existing Maintenance engine**, with
one small, evidence-backed extension (preventive scheduling) and one
evidence-backed integration fix (asset FK + warranty surfacing) — not (A) a
new shared engine (one already existed) and not (C)/(D).

Domain-specific-by-design, explicitly preserved:
- **Transport vehicle maintenance** (`transport_vehicle_maintenance`) — stays
  in Transport.
- **Lab equipment fault/repair + calibration** — stays in Lab; no calibration
  concept exists anywhere and none was added.
- **Hostel resident-facing complaints** (`hostel_complaints`) — stays in
  Hostel; documented, accepted debt, not touched.
- **IT service requests** — already served by the same central ticket engine
  (Maintenance/IT Helpdesk is one engine, not two); no separate ITSM was
  built.
