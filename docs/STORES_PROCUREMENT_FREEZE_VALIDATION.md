# Stores & Purchase / Procurement Freeze Validation

Audit date: 2026-09-15  
Scope: Web ERP Stores, Purchase, Procurement, and canonical Inventory.

## Executive Summary

`NOT FROZEN`

The canonical Stores/Procurement backend and a first-class web workspace are implemented. The module now has item master, units, categories, stores, vendors, indents, approvals, RFQ/quotation APIs, quotation selection, purchase orders, GRNs, accepted-stock posting, stock ledger, balances, issues, returns, transfers, adjustments, reconciliation, and Finance payable handoff records.

The freeze standard is not fully met yet because the RFQ/quotation web workspace and full issued-PO amendment/version workflow are not complete enough to satisfy the module's own critical freeze gates, and the frozen Lab module still retains its legacy local stock tables pending a dedicated migration path to the canonical Stores engine.

## Architecture

`Consumer -> Indent -> Procurement -> PO -> GRN -> Inventory -> Finance`

Consumer modules identify demand through `consumer_module`, `source_entity_type`, and `source_entity_id`. They do not own duplicate purchasing or inventory engines in this module. Finance remains canonical for settlement; Procurement records an idempotent `procurement_finance_handoffs` request and does not mark payment complete.

## Audit Before Implementation

| Requirement | Existing Source | Reuse / Extend / New | Integration Boundary |
| --- | --- | --- | --- |
| Lab stock | `apps/api/src/modules/lab/stock.ts`, `lab_stock_items`, `lab_stock_movements` | Existing frozen Lab stock retained; new canonical engine added | Lab must consume Stores via indents/issues in future migration; no frozen Lab rewrite in this task |
| Maintenance materials | `apps/api/src/modules/maintenance/integrations.ts`, `store_ref`, `purchase_ref` docs | Reuse references | Maintenance work orders can link to canonical stock issue/indent by source reference |
| Finance payments | `apps/api/src/modules/finance/*` | Reuse Finance as canonical owner | Procurement creates handoff context only, not payment status |
| Notifications | `employee_notifications`, HR notification helper | Reuse-ready | No separate notification engine introduced |
| RBAC | Module-local access patterns in `*/access.ts` | New `procurement/access.ts` follows same style | Backend checks enforce capability/role, tenant, department/store scope |
| Audit | Module-local audit tables exist in prior modules | New procurement audit table | Sensitive procurement and inventory actions are auditable |

## Domain Ownership

| Domain | Owner |
| --- | --- |
| Procurement | Indents, approvals, vendors, RFQs, quotations, comparison, purchase orders, PO lifecycle, delivery/GRN procurement linkage |
| Inventory / Stores | Item master, UOM, categories, stores, stock ledger, balances, receipt into stock, issue, return, transfer, adjustment, reorder indicators |
| Finance | Payable/accounting/payment/settlement and canonical financial ledger |
| Consumers | Business reason and source record only: Lab, Hostel, Transport, Maintenance, Departments, Administration, IT |

## Feature Matrix

| Area | Status | Evidence |
| --- | --- | --- |
| Item Master | PASS | `inventory_items`, `inventory_units`, `inventory_item_categories`; focused backend |
| Stores | PASS | `inventory_stores`; store scope checks |
| Indents | PASS | Multi-item `procurement_indents` + `procurement_indent_items`; focused backend |
| Approval | PASS | approve/reject/return API; self-approval and cross-department denial tested |
| Vendor | PASS | canonical vendor table with code/tax duplicate protection |
| RFQ / Quotation | PARTIAL | Secure API implemented; web workspace shows API-backed placeholder pending policy-specific form completion |
| Comparison | PASS | quotation comparison + selected vendor justification API |
| Purchase Orders | PASS | deterministic PO numbering, lifecycle, item accumulation |
| PO Revision Control | PARTIAL | revision field and immutable transition guard exist; full amendment workflow not exposed |
| Partial Receipt | PASS | partial GRN test passed |
| Over-receipt Protection | PASS | row-locked PO item accumulation; concurrent GRN test passed |
| GRN / Inspection | PASS | accepted/rejected quantities, inspection status, rejected reason |
| Stock Posting | PASS | only accepted GRN quantity posts `PURCHASE_RECEIPT` ledger rows |
| Stock Ledger | PASS | append-only ledger table with source references and balance after |
| Stock Reconciliation | PASS | service reconciliation and focused backend proof |
| Issue / Return | PASS | negative stock and over-return prevention tested |
| Transfer | PASS | balanced `TRANSFER_OUT`/`TRANSFER_IN` in one transaction |
| Adjustment | PASS | authorized adjustment API; no unrestricted set-quantity endpoint |
| Reorder | PASS | reorder level and low-stock dashboard signal |
| Inventory Valuation | MISSING | No institutional valuation method defined; no FIFO/LIFO/weighted-average assumption made |
| Asset Handoff | PARTIAL | `ASSET_TRACKABLE` item type exists; no canonical Asset module integration found |

## Security Matrix

| Actor / Scenario | Expected | Evidence |
| --- | --- | --- |
| Requester creates indent | ALLOW | focused backend |
| Requester approves own indent | DENY | focused backend |
| HOD approves own department indent | ALLOW | focused backend |
| HOD Dept A approves Dept B indent | DENY | focused backend |
| Store Keeper mutates assigned store | ALLOW | focused backend issue/GRN |
| Unauthorized faculty stock issue | DENY | backend capability model |
| College A reads College B record | DENY/404 | focused backend |
| Procurement creates Finance handoff | ALLOW | focused backend |
| Procurement marks Finance payment complete | DENY by absence | no payment-complete endpoint exists in Procurement |

## Concurrency

Focused backend: `8/8 PASS`.

Concurrency/integrity scenarios executed:

| Scenario | Result |
| --- | --- |
| Concurrent stock issue: stock 10, issue 8 + issue 8 | PASS; one succeeds, final stock 2 |
| Concurrent GRN over-receipt: PO 10, receive 8 + receive 8 | PASS; one succeeds, accepted total 8 |
| Store transfer oversubscription | PASS; source stock cannot go negative and transfer is atomic |
| Concurrent return: issued 5, return 4 + return 4 | PASS; one succeeds, returned total 4 |
| Duplicate Finance handoff | PASS; two calls converge to one handoff row |

## Inventory Reconciliation

`reconcile()` derives balances from stock ledger movements and compares against `inventory_stock_balances`.

Focused backend reconciliation after adjustment, issue, return, transfer, and receipt: `PASS`.

## Finance Integration

Procurement records `procurement_finance_handoffs` with `po_id`, `grn_id`, `vendor_id`, accepted amount, invoice reference, status `PENDING_FINANCE`, and a tenant-scoped idempotency key. Duplicate handoff test: `PASS`.

No Procurement endpoint records payments or marks payable settlement complete.

## Targeted Backend

Command:

`node --import tsx --test --test-concurrency=1 src/modules/procurement/procurement.e2e.test.ts`

Result:

`8/8 PASS across 1 suite`

## Responsive QA

Command:

`npx playwright test e2e/procurement.responsive.spec.ts --project=1920x1080 --no-deps`

Result:

`1/1 PASS`

Coverage:

`8 required viewports x 10 workflow tabs = 80 responsive checks`

Viewports:

- 360x740
- 390x844
- 430x932
- 768x1024
- 1024x768
- 1366x768
- 1440x900
- 1920x1080

Workflows:

- Dashboard
- Indents
- Approvals
- Vendors
- RFQ / Quotations
- Purchase Orders
- Goods Receipts
- Inventory
- Issues / Returns / Transfers
- Reports

## Screenshots

`30`

Location:

`apps/web/e2e/screenshots/procurement`

Screenshots cover 10 workflow tabs across 1920x1080, 1024x768, and 390x844.

## Performance

Executed service-layer samples against the real local database as a `COLLEGE_ADMIN` actor, 10 samples per path. These are not a replacement for authenticated HTTP/browser performance QA, but they prove bounded query behavior for the implemented service paths.

| Path | min ms | p50 ms | p95 ms | max ms |
| --- | ---: | ---: | ---: | ---: |
| Dashboard | 0.87 | 1.37 | 18.96 | 18.96 |
| Masters | 0.58 | 0.79 | 2.24 | 2.24 |
| Indent list | 0.29 | 0.33 | 0.45 | 0.45 |
| PO list | 0.34 | 0.37 | 0.54 | 0.54 |
| GRN list | 0.29 | 0.31 | 0.48 | 0.48 |
| Stock balance | 0.33 | 0.37 | 0.95 | 0.95 |
| Stock ledger | 0.32 | 0.34 | 0.42 | 0.42 |
| Reports | 0.47 | 0.50 | 1.31 | 1.31 |

Bounded query notes: dashboard aggregates are fixed-count; master/list tables use limits; stock ledger is explicitly capped by the requested limit with a maximum of 500.

## Builds

| Build | Result |
| --- | --- |
| API production build | PASS |
| Web production build | PASS |

## Migrations

Migration applied:

`apps/api/migrations/20261004100000_stores_procurement.cjs`

`Migrations: CURRENT` after `migrate:latest` applied one batch.

## Broad Regression

Serialized backend regression:

`npm test -w @skillonx/survey-api`

Result:

`1206/1206 PASS across 203 suites`

## Known Limitations

- Existing frozen Lab module still has its own stock tables. This task added the canonical Stores engine and documented the integration boundary; it did not rewrite frozen Lab business logic.
- RFQ/quotation APIs exist, but the web workspace has not yet exposed full policy-grade RFQ and comparison editing forms.
- PO revision number exists, but full amendment/version history workflow is not complete.
- Asset handoff is limited to source traceability and item typing because no canonical Asset Management module was found.
- Inventory valuation is intentionally not invented without institutional accounting policy.
- Existing frozen Lab local stock must be migrated or bridged to the canonical Stores issue/indent flow before the one-engine architecture can be declared fully closed.

## Final Freeze Gate

`STORES & PURCHASE / PROCUREMENT — NOT FROZEN`

Next module after closure remains:

`SECURITY / GATE / VISITOR MANAGEMENT — WEB`
