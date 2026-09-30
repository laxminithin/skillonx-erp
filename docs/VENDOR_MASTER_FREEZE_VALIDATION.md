# Vendor Master (P0.1) — Freeze Validation

Date: 2026-09-23. Scope: Campus OS Phase 0, P0.1 only. See `docs/CAMPUS_OS_PHASE0_PREIMPLEMENTATION_AUDIT.md` for the audit that preceded this work.

## Decision

**FROZEN**

## What was built

Nothing new was built at the schema level, by design. `procurement_vendors` (migration `20261004100000_stores_procurement.cjs`, part of the existing `procurement` module — **not frozen**) already had every field the Phase-0 brief asked to evaluate: `vendor_code` (unique per college), `name`, `contact_person`, `phone`, `email`, `tax_identifier` (serves the GSTIN/PAN role), `categories` (JSON array — already extensible, not a hard-coded enum), `verification_status`, `is_active`, `notes`, timestamps. Adding a parallel `vendor_type` column would have duplicated `categories`, which the brief explicitly says to prefer when it already exists.

What was added, additively, inside `apps/api/src/modules/procurement`:

- `listVendorDirectory(actor, opts)` — a lightweight, cross-module-friendly read accessor (id/code/name/contact/categories/status), separate from the heavier `/masters` bundle. Gated by the existing `procurement.view` permission (already broadly granted to `FACULTY`, `LAB_ASSISTANT`, `MAINTENANCE_MANAGER`, `FACILITIES_OFFICER`).
- `findVendorRef(collegeId, vendorId)` — an internal (non-HTTP) tenant-scoped lookup for other server-side modules to import directly. Returns `null` rather than throwing for a missing/foreign vendor, so a stale reference degrades gracefully instead of breaking a consumer.
- `GET /api/procurement/vendors` — a new route exposing the directory.
- Asset Management (P0.2) already consumes `findVendorRef` as its first real cross-module reference, proving the pattern works end-to-end.

## Explicitly not done

- No changes to `procurement_vendors` schema.
- No changes to Transport's `vendor_reference`, Lab's `vendor`/`vendor_ref`, or Maintenance's `vendorName`/`vendorRef` free-text fields. Per §4.3 of the Phase-0 brief, ambiguous free-text-to-vendor-identity mapping was **not** attempted or guessed. These three frozen modules are completely untouched by this work.

## Freeze criteria

- [x] Canonical vendor ownership established — `procurement_vendors`, unchanged, now formally documented as the cross-campus vendor master.
- [x] No duplicate vendor engine introduced — zero new tables.
- [x] Tenant isolation passes — every query scoped by `college_id`; proven by test.
- [x] RBAC passes — `listVendorDirectory` requires `procurement.view`; denial tested.
- [x] Duplicate protection passes — pre-existing `vendor_code`/`tax_identifier` unique constraints, translated to a clean 409 by the shared error handler (unchanged, still covered by `procurement.e2e.test.ts`).
- [x] Legacy compatibility preserved — no frozen module touched.
- [x] Tests pass — see below.

## Tests

`node --import tsx --test --test-concurrency=1 src/modules/procurement/procurement.e2e.test.ts`

Result: **9/9 PASS** (8 pre-existing + 1 new: `Campus OS Phase 0: vendor directory is tenant-scoped and findVendorRef degrades gracefully`, covering tenant isolation, RBAC denial, cross-tenant `findVendorRef` return of `null`, and missing/null-vendor-id graceful handling).

## Migrations

None. (This is itself the correct outcome — see the pre-implementation audit's reuse decision.)

## Remaining issues

None blocking. Transport/Lab/Maintenance vendor-field consolidation remains explicitly deferred (documented, not silently dropped) until a real consumer (e.g. a future Security/Gate portal, out of scope for Phase 0) needs it and can do the mapping non-ambiguously.
