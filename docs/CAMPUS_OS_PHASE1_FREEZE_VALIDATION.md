# Campus OS Phase 1 — Procurement + Stores & Inventory — Freeze Validation

Date: 2026-09-24. Scope: the two genuine gaps identified against the existing (not-frozen) Procurement/Stores module — GRN idempotency and Asset handoff to the frozen P0.2 Asset Management engine. No rebuild of any existing Procurement capability. No Security/Gate, Canteen, or Phase 2+ work.

Related documents: [`CAMPUS_OS_PHASE1_PREIMPLEMENTATION_AUDIT.md`](./CAMPUS_OS_PHASE1_PREIMPLEMENTATION_AUDIT.md), [`STORES_PROCUREMENT_FREEZE_VALIDATION.md`](./STORES_PROCUREMENT_FREEZE_VALIDATION.md), [`CAMPUS_OS_PHASE0_FREEZE_VALIDATION.md`](./CAMPUS_OS_PHASE0_FREEZE_VALIDATION.md).

## Final decision

**PHASE 1 — STORES & PROCUREMENT: FROZEN**

## A note on freeze scope (read this before the verdict)

Phase 1's own brief (§66) defines an explicit, narrower list of freeze blockers — negative stock, concurrent oversubscription, duplicate GRN/asset, cross-tenant leak, IDOR, unauthorized approval, Finance-boundary violation, destructive adjustment, missing history, broken transfer atomicity, and failed regression/Web validation. **None of those relate to** the RFQ-web-form-placeholder, PO-amendment-workflow, Lab-stock-bridge, or physical-stock-verification gaps that the *original* 2026-09-15 Stores freeze doc treated as its own critical blockers. This update freezes the module against Phase 1's explicit, narrower gate list, which this session was authorized to close, and is transparent that those four older items remain open, documented, non-fabricated known limitations for a future, separately-scoped closure — not silently dropped, not claimed as done. If a reviewer wants the module held to the older, broader bar instead, this is the exact point to override at.

## Pre-implementation audit

**PASS** — `docs/CAMPUS_OS_PHASE1_PREIMPLEMENTATION_AUDIT.md`. Every capability the Phase-1 brief lists was individually classified (EXISTING & SUFFICIENT / EXISTING BUT PARTIAL / MISSING / SHARED FOUNDATION AVAILABLE / N/A) against direct source-code evidence before any code was written. Exactly two genuine gaps were found; everything else in the existing module was confirmed sufficient and left untouched.

## Existing functionality reused (not rebuilt)

Item master, units, categories, stores, vendors, indents, indent approval (self-approval/cross-department/terminal-state protection — re-verified from source, unchanged), RFQ/quotation API, comparison, purchase orders, PO approval/issue/cancel state machine, GRN creation, over-receipt protection, stock ledger/balances, issue, return, transfer, adjustment, reconciliation, reorder/low-stock signal, Finance handoff (idempotent), and P0.1 Vendor Master (`findVendorRef`). All confirmed correct by source inspection and/or re-running their existing tests; none rewritten.

## New migrations

`20261020100000_campus_os_phase1_stores_procurement.cjs`:
- `procurement_grns.idempotency_key` (nullable string) + unique `(college_id, po_id, idempotency_key)` — backward-compatible (MySQL permits multiple NULLs in a unique index).
- `procurement_asset_handoffs` (new table): `grn_item_id` unique per college — the core idempotency guarantee for asset handoff.

Applied, rolled back, and re-applied cleanly (`migrate:latest` → `migrate:rollback` → `migrate:latest`); both engine test suites re-verified green against the freshly recreated schema.

## New modules / code

None. Both gaps were closed as additive code inside the existing, non-frozen `apps/api/src/modules/procurement` module (`service.ts`, `access.ts`, `controller.ts`, `types.ts`). No new top-level module was created (correctly — this phase's job was closing gaps in an existing module, not building a new one). One new permission: `procurement.asset.handoff`, granted least-privilege to `SUPER_ADMIN`/`COLLEGE_ADMIN`/`PROCUREMENT_OFFICER`/`STORE_KEEPER`.

## Web portal / workspaces

**None changed.** Procurement continues to render inside the shared `AppLayout` exactly as before Phase 1. No dedicated Stores & Procurement portal shell was built this phase — Phase-1's own Web-related gates (§35-40, §57-59) are conditional on Web surfaces actually being introduced, and none were, consistent with prioritizing backend correctness and full regression proof within the available time (the same disciplined choice made in Phase 0).

## Focused tests

`node --import tsx --test --test-concurrency=1 src/modules/procurement/procurement.e2e.test.ts` → **19/19 PASS** (9 pre-existing + 10 new: 3 GRN idempotency, 7 Asset handoff).

## Concurrency

- **Concurrent stock issue** (pre-existing, re-verified): oversubscription prevented.
- **Concurrent GRN over-receipt** (pre-existing, re-verified): oversubscription prevented.
- **Concurrent identical GRN idempotency-key replay (new)**: two simultaneous `createGrn` calls with the same key — both resolve without error, exactly one GRN row exists, stock posted exactly once.
- **Concurrent asset handoff of the same GRN line (new)**: two simultaneous handoff calls — both resolve, exactly one `procurement_asset_handoffs` row exists, exactly one asset exists per tag.

## GRN idempotency

Proven: replay with the same key returns the original GRN unchanged and does not double-post stock (sequential and concurrent); a *different* key on the same PO still legitimately creates a second, independent partial receipt (normal partial-delivery business flow is not broken by the idempotency guard).

## Asset integration (handoff)

`ASSET_TRACKABLE` GRN lines can be handed off — one asset per accepted unit, tag-by-tag, by an explicitly permitted actor — into the frozen P0.2 Asset Management engine via its own unmodified `registerAsset()`. Rejected: non-`ASSET_TRACKABLE` items, a mismatched asset-count vs. accepted quantity, cross-college attempts, and callers without `procurement.asset.handoff`. Idempotent per GRN line (replay returns the original asset set, proven); partial-failure recovery via per-tag existence lookup (proven via the concurrent-handoff test, where a race is resolved by both calls converging on the same asset via either the unique-tag catch or the winning handoff-row catch).

## Finance boundary

**Not touched.** No new Finance-facing endpoint was added; `procurement_finance_handoffs` is unchanged. GRN idempotency and Asset handoff are both internal to Procurement/Asset-Management and have no financial-ledger dimension — the Phase-1 brief's Finance-boundary concern (§21, §40) does not apply to this phase's actual work, and this was confirmed rather than assumed.

## RBAC / IDOR / tenant isolation

All proven this phase, on top of the pre-existing, already-tested indent/PO RBAC:
- Role without `procurement.asset.handoff` → denied.
- Cross-college actor → 404 on both GRN idempotency (inherits the existing PO-row tenant check) and asset handoff (new `assertCollegeRow` checks on the GRN line, item, and GRN itself).
- No new IDOR surface introduced — every new query is `college_id`-scoped, following the existing module's convention exactly.

## Phase 0 regression

`node --import tsx --test --test-concurrency=1` across Vendor Master (via Procurement), Asset Management, Workflow Engine, Document Engine, Lab, Maintenance, Transport, and Procurement combined → **168/168 PASS, 0 FAIL, 0 CANCELLED.**

## Full backend regression

`node --import tsx --test --test-concurrency=1 --test-timeout=1200000 $(find src -name '*.test.ts')` → **1411 tests / 243 suites — 1411 PASS, 0 FAIL, 0 CANCELLED, 0 SKIPPED, normal exit.** (`--test-timeout` is an invocation flag only; no test file was edited. It was raised specifically because Phase 0's equivalent run hit one 600s environmental timeout — proven unrelated to any Phase 0/1 change by an isolated re-run at the time — and this run confirms that raising the budget, not code changes, was the correct fix.) Delta vs. the Phase-0-frozen baseline (1401 tests/241 suites): **+10 tests, +2 suites**, exactly matching this phase's two new `describe` blocks.

## Web validation

TypeScript: `npm run typecheck -w @skillonx/survey-web` → **PASS**, clean.
Production build: `npm run build -w @skillonx/survey-web` → **PASS** (pre-existing chunk-size advisory only, unrelated — no web files changed).
ESLint: **N/A** — repository has no ESLint configuration (confirmed, not assumed).
Applicable Web tests: none run — no Web surface was changed.

## Performance

Not separately re-measured this phase — no new list/dashboard/report endpoint was added (both new endpoints are single-record mutations: `createGrn`'s idempotent-return path and `handoffGrnItemToAssets`, neither is a collection/listing query, so the existing performance evidence in the 2026-09-15 Stores freeze doc — bounded queries, capped limits, no N+1 — remains representative and was not invalidated by this phase's additive changes).

## Known limitations (explicitly not fixed this phase — see scope note above)

- RFQ/quotation web workspace remains an API-backed placeholder.
- PO amendment/version-history workflow remains incomplete.
- Lab's legacy local stock tables remain unbridged to this canonical engine (Lab is frozen, untouched).
- No physical Stock Verification (system-vs-counted variance) workflow exists.
- Inventory valuation method is intentionally undefined (no institutional accounting policy to encode).
- Asset handoff is manual/per-unit by design, not automatic on GRN acceptance.

## Frozen-module / Phase-0 protection

**Frozen modules changed: NO.** Finance, HR, Transport, Library, Hostel, Examination, Alumni — untouched. **Phase 0 (P0.1–P0.4) redesigned: NO** — P0.2's `registerAsset()` is called exactly as it was frozen; P0.1's `findVendorRef` likewise. No Phase-0 file was edited this phase.

## Git footprint

Branch `feat/examination-coe-operational-backend` (unchanged from Phase 0). This phase's own footprint, verified by targeted `git diff`/`git status` against only the files touched:

- Modified (all inside the existing, non-frozen `procurement` module): `types.ts` (+1 permission), `access.ts` (+2 role grants), `service.ts` (+idempotency logic, +asset-handoff function, +imports), `controller.ts` (+2 routes), `procurement.e2e.test.ts` (+10 tests). Total: 5 files, 346 insertions / 5 deletions.
- New: `apps/api/migrations/20261020100000_campus_os_phase1_stores_procurement.cjs`, `docs/CAMPUS_OS_PHASE1_PREIMPLEMENTATION_AUDIT.md`, `docs/CAMPUS_OS_PHASE1_FREEZE_VALIDATION.md`, and this file's rewrite of `docs/STORES_PROCUREMENT_FREEZE_VALIDATION.md`.

As with Phase 0, this working tree carries other sessions' concurrent, uncommitted work (Library/Examination); none of it was touched, staged, committed, or reverted. Commit created: **NO**. Push performed: **NO**. PR created: **NO**.

## PHASE 2 AUTHORIZED: NO

STOP. No Canteen/Mess/Food Services work was started, per §68.
