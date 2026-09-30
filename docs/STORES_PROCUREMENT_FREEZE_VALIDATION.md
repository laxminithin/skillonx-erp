# Stores & Purchase / Procurement Freeze Validation

Audit date: 2026-09-15 (original implementation) · Updated 2026-09-24 (Campus OS Phase 1 closure).
Scope: Web ERP Stores, Purchase, Procurement, and canonical Inventory, plus the Campus OS Phase 1 integration work (GRN idempotency, Asset handoff to P0.2 Asset Management).

Companion documents: [`docs/CAMPUS_OS_PHASE1_PREIMPLEMENTATION_AUDIT.md`](./CAMPUS_OS_PHASE1_PREIMPLEMENTATION_AUDIT.md), [`docs/CAMPUS_OS_PHASE1_FREEZE_VALIDATION.md`](./CAMPUS_OS_PHASE1_FREEZE_VALIDATION.md).

## Executive Summary

`FROZEN` (updated 2026-09-24; was `NOT FROZEN` as of 2026-09-15)

The canonical Stores/Procurement backend and web workspace, first delivered 2026-09-15, remains unchanged in this update — item master, units, categories, stores, vendors, indents, approvals, RFQ/quotation APIs, quotation selection, purchase orders, GRNs, accepted-stock posting, stock ledger, balances, issues, returns, transfers, adjustments, reconciliation, and Finance payable handoff records. Campus OS Phase 1 closes the two genuine, load-bearing gaps identified against the current freeze bar: **GRN idempotency** (duplicate stock receipt from client replay) and **Asset handoff** (durable/serialized GRN lines now register into the frozen P0.2 Asset Management engine through a governed, idempotent action). Both are additive; no existing Procurement capability was rewritten.

## Architecture

`Consumer -> Indent -> Procurement -> PO -> GRN -> Inventory -> Finance`, now extended for durable goods:

`... -> GRN (ASSET_TRACKABLE line) -> governed Asset Handoff -> P0.2 Asset Management (campus_assets)`

Consumer modules identify demand through `consumer_module`, `source_entity_type`, and `source_entity_id`. Finance remains canonical for settlement; Procurement records an idempotent `procurement_finance_handoffs` request and does not mark payment complete (unchanged). P0.2 Asset Management remains canonical for registered-asset lifecycle; Procurement records a `procurement_asset_handoffs` linkage and calls P0.2's own `registerAsset()` unchanged — it does not duplicate asset records.

## Domain Ownership (unchanged, reaffirmed)

| Domain | Owner |
| --- | --- |
| Procurement | Indents, approvals, vendors, RFQs, quotations, comparison, purchase orders, PO lifecycle, delivery/GRN procurement linkage |
| Inventory / Stores | Item master, UOM, categories, stores, stock ledger, balances, receipt into stock, issue, return, transfer, adjustment, reorder indicators |
| Asset Management (P0.2, frozen) | Registered institutional asset lifecycle, once handed off from a GRN line |
| Finance | Payable/accounting/payment/settlement and canonical financial ledger |
| Consumers | Business reason and source record only: Lab, Hostel, Transport, Maintenance, Departments, Administration, IT |

## Stationery decision (Phase 1 §3, re-confirmed)

No standalone Stationery engine exists or was created. Stationery is, and remains, an `inventory_item_categories` row (e.g. `STATIONERY`) referenced by `inventory_items.category_id`. No repository evidence justified a different approach.

## Feature Matrix (2026-09-15 baseline, reaffirmed unless noted)

| Area | Status | Evidence |
| --- | --- | --- |
| Item Master | PASS | `inventory_items`, `inventory_units`, `inventory_item_categories` |
| Stores | PASS | `inventory_stores`; store scope checks |
| Indents | PASS | `procurement_indents` + `procurement_indent_items` |
| Approval (indent, PO) | PASS | Self-approval and cross-department denial re-verified from source this phase; terminal-state/double-approval protection confirmed already correct (no change needed) |
| Vendor | PASS | Canonical `procurement_vendors`; Phase 0 added `listVendorDirectory`/`findVendorRef` cross-module accessors, no schema change |
| RFQ / Quotation | PARTIAL (unchanged) | API implemented and tested; web workspace remains an API-backed placeholder. Not a Phase 1 blocker (not in the explicit freeze-gate list; backend capability is real) |
| Comparison | PASS | Unchanged |
| Purchase Orders | PASS | Unchanged |
| PO Revision Control | PARTIAL (unchanged) | Revision field + immutable transition guard exist; full amendment/version workflow remains a documented, non-blocking known limitation |
| Partial Receipt | PASS | Unchanged |
| Over-receipt Protection | PASS | Unchanged, re-verified |
| **GRN Idempotency** | **PASS — NEW this phase** | `procurement_grns.idempotency_key` (unique per college+PO), checked inside the same PO-row-locked transaction that already existed; replay returns the original GRN and does not re-post stock. Proven under real concurrency. |
| GRN / Inspection | PASS | Unchanged |
| Stock Posting | PASS | Unchanged |
| Stock Ledger | PASS | Unchanged |
| Stock Reconciliation | PASS | Unchanged |
| Issue / Return | PASS | Unchanged |
| Transfer | PASS | Unchanged |
| Adjustment | PASS | Unchanged |
| Reorder | PASS | Unchanged |
| Inventory Valuation | MISSING (unchanged) | No institutional valuation method defined; not invented speculatively, same as 2026-09-15 |
| **Asset Handoff** | **PASS — NEW this phase** | `ASSET_TRACKABLE` GRN lines can now be handed off, one unit at a time, into the frozen P0.2 Asset Management engine via `handoffGrnItemToAssets()`, gated by a new `procurement.asset.handoff` permission. Idempotent per GRN line (`procurement_asset_handoffs`, unique `(college_id, grn_item_id)`), with per-tag reuse for partial-failure recovery. P0.2's own schema/code untouched. |

## Security Matrix (2026-09-15 baseline + Phase 1 additions)

| Actor / Scenario | Expected | Evidence |
| --- | --- | --- |
| Requester creates indent | ALLOW | Unchanged |
| Requester approves own indent | DENY | Unchanged, re-verified from source |
| HOD Dept A approves Dept B indent | DENY | Unchanged, re-verified from source |
| College A reads College B record | DENY/404 | Unchanged |
| Procurement creates Finance handoff | ALLOW | Unchanged |
| Procurement marks Finance payment complete | DENY by absence | Unchanged — no such endpoint exists; not introduced this phase |
| Role without `procurement.asset.handoff` attempts handoff | DENY | New test, passes |
| College A hands off College B's GRN line | DENY/404 | New test, passes |
| Non-`ASSET_TRACKABLE` item handed off | DENY | New test, passes |
| Asset-registration count mismatched vs. accepted quantity | DENY | New test, passes |

## Concurrency

Focused backend (this module, this phase): **19/19 PASS** (9 original + 10 new). Combined with Phase 0 + Lab + Maintenance + Transport: **168/168 PASS**.

| Scenario | Result |
| --- | --- |
| Concurrent stock issue (unchanged from 2026-09-15) | PASS |
| Concurrent GRN over-receipt (unchanged) | PASS |
| Store transfer oversubscription (unchanged) | PASS |
| Concurrent return (unchanged) | PASS |
| Duplicate Finance handoff (unchanged) | PASS |
| **Concurrent identical GRN idempotency-key replay** | **PASS (new)** — two simultaneous `createGrn` calls with the same key: both resolve, exactly one GRN row exists, stock posted exactly once |
| **Concurrent asset handoff of the same GRN line** | **PASS (new)** — two simultaneous handoff calls: both resolve, exactly one `procurement_asset_handoffs` row exists, exactly one asset exists per tag (no duplicate) |

## Finance Integration (unchanged)

`procurement_finance_handoffs` remains the sole, idempotent Finance-facing contract. No new Finance-facing surface was added or needed for GRN idempotency or Asset handoff — both are internal Procurement/Asset-Management concerns with no financial-ledger dimension.

## Targeted Backend

`node --import tsx --test --test-concurrency=1 src/modules/procurement/procurement.e2e.test.ts` → **19/19 PASS** (verified twice: once immediately after migration, once again after `migrate:rollback` + `migrate:latest` re-apply, both clean).

## Full backend regression

`node --import tsx --test --test-concurrency=1 --test-timeout=1200000 $(find src -name '*.test.ts')` → **1411/1411 PASS across 243 suites, 0 FAIL, 0 CANCELLED, 0 SKIPPED, normal exit.** (The increased `--test-timeout` is an invocation-level flag only — no test file was modified — and eliminated an environmental 600s contention timeout unrelated to this module, seen once during Phase 0's equivalent run in an unrelated Placement/T&P file, and independently proven unrelated by an isolated re-run at that time.)

## Migrations

- `20261004100000_stores_procurement.cjs` (2026-09-15, unchanged).
- `20261020100000_campus_os_phase1_stores_procurement.cjs` (new): additive `procurement_grns.idempotency_key` column + unique constraint; new `procurement_asset_handoffs` table. Applied, rolled back, and re-applied cleanly; `down()` provided and tested.

## Known Limitations (carried forward + updated)

- RFQ/quotation APIs exist, but the web workspace has not yet exposed full policy-grade RFQ and comparison editing forms. (Unchanged; not a Phase-1 blocker.)
- PO revision number exists, but full amendment/version history workflow is not complete. (Unchanged; not a Phase-1 blocker.)
- Inventory valuation is intentionally not invented without institutional accounting policy. (Unchanged.)
- Lab's legacy local stock tables (`lab_stock_items`, `lab_stock_movements`) remain unbridged to this canonical engine — Lab is frozen and was not touched. (Unchanged; a future, separately-approved integration, not attempted this phase.)
- Physical Stock Verification (system count vs. counted-on-the-floor variance workflow) does not exist; `reconcile()` is an internal ledger-math consistency check only, not a physical count workflow. Documented as a genuine gap for a future phase, not built speculatively here.
- Asset handoff is a manual, per-unit governed action (an authorized actor supplies one asset tag per accepted unit); it is not automatic on GRN acceptance, by design (Phase 1 §5/§31: asset registration must be an explicit governed transition, never inferred).

## Final Freeze Gate

`STORES & PURCHASE / PROCUREMENT — FROZEN` (as of 2026-09-24, Campus OS Phase 1 closure)

Next module: none authorized. Per Phase 1's own stop rule, no Canteen/Mess/Food Services work begins without explicit separate authorization.
