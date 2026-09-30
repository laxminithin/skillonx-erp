# Campus OS Phase 4 — Pre-Implementation Audit
## Security, Gate & Visitor Management

Status: AUDIT COMPLETE — implementation not yet started.
Baseline preserved: 245 suites / 1,431 tests / 1,431 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED.

---

## 1. Method

Full repository search across `apps/api/src` (49 modules), `apps/web/src`, `apps/api/migrations` (99 files), and `docs/` (59 files) for every Phase 4 business concept (security, gate, gate pass, visitor, check-in/out, outpass, material pass, vehicle/vendor/contractor entry, security incident, blacklist/watchlist, QR pass, badge). Every claim below is backed by a concrete file:line citation gathered in this pass. No code was written before this document.

---

## 2. Capability Classification Table

| Capability | Classification | Evidence |
|---|---|---|
| Generic (non-hostel) Visitor Management | **MISSING** | No `visitor` module; only `hostel_visitors`/`hostel_visitor_visits` (hostel-scoped) exist — `apps/api/migrations/20260907100000_hostel_module.cjs:432-464` |
| Generic Gate Pass / Gate Entry-Exit | **MISSING** | Only `hostel_gate_movements`, joined through `hostel_residents`; `gate` column is free text, no master — `apps/api/src/modules/hostel/gate.ts` |
| Hostel resident gate entry/exit | **EXISTING & SUFFICIENT (frozen, domain-specific)** | `hostel/gate.ts:9-223` |
| Hostel visitor approve→check-in→check-out | **EXISTING & SUFFICIENT (frozen, domain-specific)** | `hostel/visitors.ts:11-142` |
| Hostel leave/outpass | **EXISTING & SUFFICIENT (frozen, domain-specific)** | `hostel/outpasses.ts`, `hostel_outpasses` table |
| Transport vehicle/driver/route/pass model | **DOMAIN-SPECIFIC BY DESIGN** | `apps/api/migrations/20260908100000_transport_module.cjs`; bus-boarding passes, not a campus-gate concept |
| Transport gate/perimeter entry-exit | **MISSING (out of Transport's scope)** | No gate concept found in `transport/*` |
| Stores/Procurement goods receipt (GRN) | **EXISTING & SUFFICIENT (frozen, domain-specific)** | `procurement_grns`/`procurement_grn_items`, `procurement/controller.ts:114-115` |
| Material Gate Pass (physical movement at perimeter) | **MISSING** | Zero hits for `material_pass`/`gate_pass` anywhere; GRN only covers store-side receipt, not gate crossing |
| Asset custody/department transfer | **EXISTING & SUFFICIENT (frozen, domain-specific)** | `assetManagement/service.ts:156-291` |
| Asset physical outward/return at gate | **MISSING** | No off-campus/gate-exit concept on `campus_assets`/`campus_asset_history` |
| HR employee attendance punches | **EXISTING & SUFFICIENT (frozen, domain-specific, HR-owned)** | `hr/attendancePunches.ts:9-40` — payroll purpose only, not access control |
| Vendor Master | **EXISTING & SUFFICIENT — reuse via API** | `procurement_vendors`, `listVendorDirectory`, `findVendorRef` (procurement module, per `VENDOR_MASTER_FREEZE_VALIDATION.md`) |
| Contract worker / contractor identity | **SHARED FOUNDATION AVAILABLE** | `procurement_vendors.categories` already includes `'CONTRACTOR'` (`procurement/service.ts:829`) |
| Approval Workflow engine | **SHARED FOUNDATION AVAILABLE — reuse directly** | `workflowEngine/service.ts:51-233`, generic `entityType`/`entityId` keyed instances |
| Document/Evidence engine | **SHARED FOUNDATION AVAILABLE — reuse directly** | `documentEngine/service.ts:83-180`; `access.ts:8` already anticipates a Security/Gate consumer |
| Security incident engine (general) | **MISSING** | `hostel_incidents` is resident-scoped only (`LATE_RETURN`, room/mess/pest categories); `transport_incidents` is fleet/road-incident only |
| QR/token pass system | **EXISTING, but scoped to Hostel** | `hostel_outpasses.qr_token`, `verifyOutpassByToken` — pattern reusable, table is not |
| Gate/Location master | **MISSING** | `hostel_gate_movements.gate` is free-text `string(64)`, no FK, no master table (migration line 421) |
| RBAC roles SECURITY_MANAGER / SECURITY_GUARD | **MISSING** | Zero hits repo-wide; only hostel-scoped `SECURITY` role exists (`hostel/access.ts:29`) with permissions limited to `hostel.*` |
| Security/Gate Web workspace | **MISSING** | No `pages/security`, `pages/gate`, or `pages/visitor` outside Hostel; `ProtectedRoute.tsx` routes `SECURITY` role into Hostel portal only |
| Vehicle entry (visitor/vendor/delivery) | **MISSING** | No concept anywhere outside Transport's own fleet-boarding model |
| Blacklist/watchlist | **NOT IMPLEMENTED / FUTURE GOVERNED REQUIREMENT** | Zero hits; not building speculatively per governance rule |
| Biometric/RFID/ANPR/CCTV | **N/A — INTEGRATION ONLY, out of scope** | HR's attendance-punch import (`DEVICE_IMPORT` source) is the only device-integration precedent; no hardware SDK in repo |

---

## 3. Explicit Answers

**1. Does a Visitor Management implementation already exist?**
Partially — only inside Hostel (`hostel_visitors` / `hostel_visitor_visits`), scoped to hostel residents. No general-purpose, any-person/any-purpose visitor system exists.

**2. Does a generic Gate Pass exist?**
No. `hostel_gate_movements` exists but is joined through `hostel_residents` and is not usable for staff, external visitors, vendors, or material movement.

**3. Does Hostel already own visitor entry?**
Yes, for hostel visitors specifically (`hostel/visitors.ts`). This remains authoritative and frozen.

**4. Does Hostel already own resident entry/exit?**
Yes (`hostel/gate.ts`). Frozen, authoritative, hostel-resident-scoped only.

**5. Does Hostel already own leave/outpass?**
Yes (`hostel/outpasses.ts`, `hostel_outpasses`). Frozen, authoritative.

**6. Does Transport own vehicle/personnel movement concepts?**
Yes for fleet operations (routes, stops, boarding events, bus passes) — but no campus-gate/perimeter entry-exit concept. Transport remains authoritative for vehicle/driver identity; Phase 4 must not duplicate it.

**7. Does Stores/Procurement have goods/material movement?**
Yes, internally (`inventory_stock_issues/returns/transfers`, GRN). No physical gate-crossing concept exists — this is the proven gap Phase 4's Material Gate Pass should fill, referencing Stores/Procurement records rather than re-implementing them.

**8. Does Asset Management have asset transfer/movement?**
Yes, for custody/department transfer only (`assetManagement/service.ts`). No physical off-campus/gate-exit tracking — a proven gap for an Asset Outward Pass that references (not duplicates) `campus_assets`.

**9. Does HR contain employee attendance/access concepts?**
Yes, `employee_attendance_punches` for payroll device-import. It is not an access-control or gate system and Phase 4 gate entry must not be conflated with HR attendance (per hard rule).

**10. Does Student contain campus movement concepts?**
No dedicated concept found beyond `studentServices` offering a free-text "Gate Pass" label in a generic leave/permission request form (`studentServices/defaults.ts:246,253`) — this is a paper-workflow label, not an engine, and is not wired to any gate/security verification.

**11. Does any security incident engine exist?**
No general one. `hostel_incidents` (resident-scoped) and `transport_incidents` (fleet-scoped) exist but neither is a general campus security-incident register.

**12. Does a QR/pass/token system exist?**
Yes, pattern-wise: `hostel_outpasses.qr_token` + `verifyOutpassByToken`. The pattern (opaque token, server-side verification, tenant + state + expiry checks) is reusable; the table itself is hostel-specific and frozen.

**13. Does an approval workflow exist for visitors/material?**
Yes — the generic Workflow Engine (`workflowEngine/service.ts`) supports arbitrary `entityType`/`entityId` approval chains and can be reused directly for visitor pre-approval and material/asset-outward approval without new schema.

**14. Does a gate/security Web workspace already exist?**
No, outside of the Hostel portal's `/hostel/gate` and `/hostel/visitors` pages, which are hostel-only and not a general campus workspace.

**15. What must remain domain-specific?**
Hostel resident gate/outpass/visitor logic; Transport vehicle/driver/route/pass identity; Stores/Procurement GRN and inventory ledgers; Asset custody/ownership; HR attendance/payroll; Vendor identity fields (`procurement_vendors` stays canonical).

**16. What should become shared?**
A campus-wide Visit/Visitor record, a Gate/Location master, a Security role set, a general Security Incident log, and (if required) a Material/Asset Outward Pass that references — not duplicates — Stores/Procurement and Asset records. Workflow Engine and Document Engine are reused as-is, not rebuilt.

**17. What exactly must Phase 4 add?**
- Gate/Location master (tenant-scoped).
- Generic Visitor + Visit lifecycle (REQUESTED → APPROVED → CHECKED_IN → CHECKED_OUT, with REJECTED/CANCELLED/EXPIRED), independent of Hostel.
- Host validation (resolve against existing Faculty/Employee/Student identity server-side).
- SECURITY_MANAGER / SECURITY_GUARD roles with least-privilege, gate-scoped permissions.
- Vendor/contractor gate entry referencing `procurement_vendors`.
- Optional Material Gate Pass (inward/outward, returnable/non-returnable) referencing Stores/Procurement and Asset records for identity, with Security recording only physical movement.
- Optional Asset Outward/Return pass referencing `campus_assets`, using Workflow Engine for approval.
- General Security Incident log (privacy-scoped, distinct from Hostel/Transport incident tables).
- A Security & Gate Web workspace (single portal, role/gate-scoped views), reusing Document Engine for evidence/attachments and Workflow Engine for approvals.

---

## 4. Architecture Decision (preliminary, pending implementation)

Evidence supports **Option A/B hybrid**: a new shared **Security & Gate** engine (Visitor, Gate Master, Security Incident, optional Material/Asset Outward Pass) that *integrates with* — rather than duplicates — existing authoritative modules (Hostel outpass/visitor stays hostel-owned; Transport stays fleet-owned; Stores/Procurement stays inventory-owned; Assets stays custody-owned; Vendor Master stays identity-owned). This matches `docs/SKILLONX_CAMPUS_OS_ARCHITECTURE.md:64`'s own stated rationale for treating Security/Gate as a standalone operational portal, not a generic Phase-0-style shared engine.

Domain boundaries confirmed to remain untouched: Hostel, Transport, Stores/Procurement, Assets, HR, Student/Admissions, Finance, Library, Examination/COE, Alumni.

---

## 5. Next Step

Per the governing mode (AUDIT FIRST → REUSE BEFORE BUILD → IMPLEMENT ONLY PROVEN GAPS → VALIDATE → FREEZE), the proven gaps above define the minimum Phase 4 scope. Implementation (migrations, APIs, RBAC, optional Web workspace, tests, freeze validation) has **not yet started** and requires confirmation of scope before proceeding, given the size of the proven gap list.
