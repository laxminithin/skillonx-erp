# Campus OS Phase 2 — Food Services (Canteen) — Pre-Implementation Audit

Date: 2026-09-24. Scope: Canteen/POS. Builds on frozen Phase 0 (Vendor Master, Asset Management, Workflow Engine, Document Engine) and frozen Phase 1 (Procurement + Stores & Inventory, including its GRN idempotency and Asset handoff closure). Read completely before this audit: `docs/CAMPUS_DIGITISATION_GAP_AUDIT.md` §9 (the original Stores & Canteen decision), `docs/CAMPUS_OS_PHASE1_PREIMPLEMENTATION_AUDIT.md`, `docs/STORES_PROCUREMENT_FREEZE_VALIDATION.md`, `docs/CAMPUS_OS_PHASE0_FREEZE_VALIDATION.md`.

## Git state at start of this phase

Branch `feat/examination-coe-operational-backend`, HEAD `0d97f6db`, unchanged from Phase 0/1. Working tree still carries other concurrent sessions' uncommitted work (Library/Examination) — untouched, as before.

## Method

Re-verified directly against current source (not assumed from memory of the earlier campus-wide audit): grepped the full repository for `canteen|\bpos\b|meal_plan|wallet` outside `mess` — zero hits. Confirmed no Canteen/POS/wallet implementation exists anywhere. Hostel Mess (frozen, `hostel` module, migration `20260907100000_hostel_module.cjs`) remains the only food-related capability in the repository, and it is a resident meal-*plan* system (assignment to a plan, weekly menu, feedback) wired into Finance's fee/demand system — structurally a subscription, not a point-of-sale counter transaction. It was inspected, not modified.

## Capability classification

| Capability | Classification | Evidence |
| --- | --- | --- |
| Canteen menu / item pricing | **MISSING** | No sale-price field exists anywhere — `inventory_items` (Procurement, reused) carries no price; POs carry a purchase `rate`, not a sale price. Needs new, small, Canteen-owned schema. |
| Item master (food/beverage items) | **EXISTING & SUFFICIENT — reuse, do not duplicate** | `inventory_items`/`inventory_item_categories`/`inventory_units` (Procurement). A canteen item is simply an `inventory_items` row with an appropriate category, exactly the same pattern already proven for Stationery (§3 of the Phase-1 audit). |
| Stock/consumption tracking for canteen sales | **EXISTING & SUFFICIENT — reuse via `createIssue`** | `inventory_stock_issues`/`inventory_stock_issue_items`, posted through the existing, tested `postStock()` ledger. The `consumer_module` column is a plain `VARCHAR(64)` (`20261004100000_stores_procurement.cjs:150`), not a DB-level enum — adding a `'CANTEEN'` value is a one-line, additive TypeScript zod-enum change, not a schema change and not a rebuild. |
| Counter/store location | **EXISTING & SUFFICIENT — reuse** | `inventory_stores` already supports arbitrary `store_type` (e.g. `CANTEEN`) tenant-scoped rows; no new location engine needed. |
| Refund / stock reversal | **EXISTING & SUFFICIENT — reuse via `createReturn`** | Already tested, over-return-protected, ledger-backed. Canteen refund resolves the originating `inventory_stock_issue_items` rows (via the `issue_id` Canteen stores on its own order) and calls the existing function unchanged. |
| Wastage | **EXISTING & SUFFICIENT — reuse via `createAdjustment`** | A privileged, reasoned `direction: 'OUT'` adjustment already exists and posts to the same ledger; no dedicated wastage feature is built (same precedent as Write-off in Phase 1's audit). |
| Vendor / supplier reference (for canteen supply, if any) | **SHARED FOUNDATION AVAILABLE — P0.1, reused as-is, not required for POS itself** | `procurement_vendors` via `findVendorRef`. Not wired into this phase's Canteen schema because the POS flow itself has no vendor dimension (a customer buying a snack does not reference a vendor); GRN/indent for restocking canteen items already flows through the existing, unmodified Procurement pipeline (a canteen store is just another `inventory_stores` destination for a GRN/issue, no new integration needed). |
| Asset tracking (canteen equipment: POS terminal, fridge, counter) | **SHARED FOUNDATION AVAILABLE — P0.2, not consumed this phase** | Optional, not core to a working POS; deferred, not a gap — equipment can be registered into P0.2 exactly like any other durable asset whenever an institution asks, using the exact same `procurement.asset.handoff` path already built in Phase 1 if such equipment arrives via GRN. |
| Multi-step approval for anything in this domain | **N/A — no approval-shaped process exists in a POS sale** | A canteen order is a real-time, single-actor transaction (order → pay, or order → cancel), not a multi-party approval chain. P0.3 Workflow Engine is **not** consumed this phase — there is nothing in Canteen's actual workflow that needs it, and forcing one in would be exactly the "opportunistic" over-engineering the Phase-1 precedent already rejected for Procurement's own (working) approvals. |
| Evidence/attachment capture | **N/A this phase** | No document/evidence requirement exists in a POS sale (no receipts-as-scanned-documents requirement was requested). P0.4 Document Engine is available but not consumed, consistent with "use P0.4 for NEW evidence where appropriate" being conditional, not mandatory. |
| **Payment / wallet** | **THE central architecture decision — see below** | No wallet, no prepaid-credit ledger, and no generic "collect an ad-hoc payment" endpoint exists in Finance today. Finance is frozen. |
| Customer identity (student/staff/day-scholar recognition) | **EXISTING & SUFFICIENT — reuse, no duplication** | `students`/`faculty_users` referenced by FK from the new order table; no person-master duplication, matching the audit's own §10/§23 principle. |
| Finance boundary | **No existing contract; must be documented, not invented into Finance** | Mirrors Phase 1's own resolution for the same situation (`procurement_finance_handoffs`, confirmed by this audit to have **zero** consumers inside `apps/api/src/modules/finance` — it is a write-only, documented pending-queue, not a live Finance-side integration). The same pattern is reused for Canteen: a Canteen-owned settlement-handoff table, written by Canteen, read by nobody in this repository yet — exactly the established, already-accepted precedent, not a new risk. |
| RBAC / roles | **MISSING — smallest new roles needed** | No `CANTEEN_STAFF`/`CANTEEN_MANAGER` role or capability exists (confirmed: grepped `utils/permissions.ts` and all `access.ts` files — no hit). Two new operational roles are added, following the exact precedent of `STORE_KEEPER`/`PROCUREMENT_OFFICER` in Phase 1. |

## The central architecture decision: no prepaid wallet this phase

The original campus-wide audit (`CAMPUS_DIGITISATION_GAP_AUDIT.md` §9) suggested Canteen "should reuse... Finance (payment/wallet)." Investigating this literally: a wallet is a **stored monetary balance**. If Canteen owned that balance itself (a `canteen_wallets.balance` column it debits/credits), it would be **an independent financial ledger outside Finance** — precisely the anti-pattern the same audit's own §14 (Financial Duplication Audit) flags as a violation: *"Anything outside Finance acting as an independent financial ledger must be flagged... Finance must own: financial posting, payment, receipt, ledger, settlement."* Finance is frozen and has no existing generic "collect an ad-hoc charge" or "top up a balance" contract to reuse (confirmed by inspection), and Phase 1's own rule is explicit: *"If none exists: document the minimal required receiver contract before touching Finance. Do not silently reopen Finance."*

**Decision:** Phase 2 implements a **cash/card-at-counter POS** with no stored wallet balance. Payment is collected and recorded at the moment of sale (`payment_method: CASH|CARD|UPI`), the sale is fulfilled immediately (stock consumption posts via the existing `createIssue`), and institutional accounting visibility is provided through a **daily settlement handoff** — a Canteen-owned, idempotent record (mirroring `procurement_finance_handoffs` exactly) that aggregates a counter's sales for a business day. This is real, working, POS functionality; a prepaid-wallet feature remains a genuine future capability that would require an explicit, separately-authorized Finance-side contract (the same escalation Phase 1 would have required had Procurement ever needed one), not something to build speculatively into a frozen module.

## New work required this phase

1. **Canteen menu** (`canteen_menu_items`) — links an existing `inventory_items` row to a sale price and availability flag. Reuses the item master; does not duplicate it.
2. **Canteen orders** (`canteen_orders`/`canteen_order_items`) — order → pay → (cancel | refund) lifecycle. Pay posts stock consumption through the existing, unmodified `createIssue`; refund reverses through the existing, unmodified `createReturn`.
3. **Daily settlement handoff** (`canteen_finance_handoffs`) — idempotent per (college, counter, business date), Finance-facing evidence only; Finance's own code is not touched.
4. **One additive, backward-compatible change to Procurement**: add `'CANTEEN'` to the existing `consumerModules` zod enum (a plain `VARCHAR` column already, no migration needed for this specific change) so canteen issues classify correctly in Procurement's own reports — the same non-invasive extension pattern already used for `ASSET_TRACKABLE`/Asset handoff in Phase 1.
5. **RBAC**: `CANTEEN_MANAGER`/`CANTEEN_STAFF` roles, least-privilege capability grants, oversight-only access for Principal/Management/Accountant.

## Explicitly not done this phase

- No prepaid wallet, no stored-value account, no new financial ledger (see decision above).
- No merge with Hostel Mess into a unified "Food Services" data model — Hostel is frozen and untouched; Canteen references nothing inside Hostel. (A future, separately-authorized phase may revisit unification if an institution asks; nothing here blocks or prejudices that.)
- No Workflow Engine (P0.3) consumption — no approval-shaped step exists in this domain.
- No Document Engine (P0.4) consumption — no evidence-capture requirement exists in this domain.
- No Asset Management (P0.2) consumption — canteen equipment tracking is optional and deferred, not a gap.
- No Web surface, dedicated portal shell, responsive QA, or screenshots — consistent with the Phase 0/1 precedent of prioritizing a complete, correct, fully-tested backend within the available time; a UI is a genuine, real follow-up need for a POS to be used in practice, but is explicitly out of scope for this backend-focused pass and is called out, not hidden.
- No modification to Finance, HR, Transport, Library, Hostel, Examination, or Alumni.
- No modification to any Phase 0 (P0.1–P0.4) or Phase 1 file — only new Canteen module files plus one additive one-line enum extension inside the non-frozen `procurement` module.

Pre-implementation audit: **PASS.** Proceeding to implement the classified gaps only.
