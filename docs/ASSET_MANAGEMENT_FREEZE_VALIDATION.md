# Shared Asset Management Engine (P0.2) — Freeze Validation

Date: 2026-09-23. Scope: Campus OS Phase 0, P0.2 only. See `docs/CAMPUS_OS_PHASE0_PREIMPLEMENTATION_AUDIT.md`.

## Decision

**FROZEN**

## What was built

A new, generic, cross-department asset register — `apps/api/src/modules/assetManagement` — for IT, Administration, Furniture, Library, Hostel, Facilities, Academic, and Security equipment. **The frozen Lab module (`lab_assets`/`lab_asset_history`) was not touched, imported, or modified** — it was used only as a design reference, per the Phase-0 brief's explicit instruction.

- Migration `20261019100000_campus_os_asset_management.cjs`: `campus_assets` (asset tag, name, category, manufacturer/model/serial, nullable `vendor_id` FK to `procurement_vendors`, department/custodian/location, acquisition/warranty/AMC dates, `status`, `condition`, notes) and `campus_asset_history` (append-only: action, previous/new value JSON, actor, reason, timestamp).
- `types.ts`: 8-state status enum (`IN_STOCK/ACTIVE/ASSIGNED/UNDER_MAINTENANCE/LOST/DAMAGED/RETIRED/DISPOSED`) with an explicit transition table; `RETIRED`/`DISPOSED` are terminal.
- `access.ts`: capabilities `asset.view`/`asset.manage`/`asset.assign`/`asset.retire`, granted least-privilege to admin-tier plus the operational roles with a genuine reason to touch campus assets (`MAINTENANCE_MANAGER`, `FACILITIES_OFFICER`, `PROCUREMENT_OFFICER`, `STORE_KEEPER`); `FACULTY`/`HOD`/`PRINCIPAL`/`MANAGEMENT`/`LAB_ASSISTANT`/`IT_SUPPORT` get view-only.
- `service.ts`: `registerAsset`, `listAssets` (filterable), `getAsset` (with full history), `assignAsset`, `transferAsset`, `updateCondition`, `changeStatus` (validated state machine). Every mutation runs inside `db.transaction()` with `.forUpdate()` on the asset row (the same concurrency pattern as Procurement's `nextNo`/`balanceForUpdate`), and every mutation writes a `campus_asset_history` row — historical ownership is never silently overwritten.
- `controller.ts`: mounted at `/api/assets`.

## Freeze criteria

- [x] Generic asset register works — registration, cross-department filtering, vendor/department/room references validated.
- [x] Lifecycle works — assign/transfer/return/condition/status, all state-machine-guarded.
- [x] History works — every mutation recorded, queryable via `getAsset`, immutable (no update/delete endpoint exists).
- [x] Vendor reference works — nullable `vendor_id` resolves through P0.1's `findVendorRef`, degrades to `null` for a missing/foreign vendor rather than erroring.
- [x] Tenant isolation passes — cross-college `getAsset`/`assignAsset` return 404; cross-college `listAssets` returns an empty set.
- [x] RBAC passes — view-only role denied `registerAsset`/`changeStatus('RETIRED')`.
- [x] Tests pass — see below.

## Tests

`node --import tsx --test --test-concurrency=1 src/modules/assetManagement/assetManagement.e2e.test.ts`

Result: **7/7 PASS**:
1. registration + vendor/duplicate-tag validation + RBAC denial
2. cross-college IDOR denial
3. assign/transfer/return lifecycle history integrity
4. terminal-state protection (retire/dispose reject further mutation)
5. invalid non-adjacent status transition rejected
6. concurrent status changes serialize correctly via row lock (no lost/corrupted history)
7. list filtering + tenant scoping

## Migrations

`20261019100000_campus_os_asset_management.cjs` — 2 new tables, zero existing tables touched. Applied via `npm run migrate`; `down()` provided.

## Frozen-module impact

None. Lab's asset tables are untouched.

## Remaining issues

None blocking. Barcode/QR generation was deliberately not built (Phase-0 brief §5.5: design for it, don't build it) — `asset_tag` is a plain unique string today, ready for a QR value to be layered on later without a schema change.
