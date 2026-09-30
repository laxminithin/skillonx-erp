# Campus OS Phase 0 — Pre-Implementation Audit

Date: 2026-09-23. Scope: confirm what already exists before writing any Phase-0 migration/service code, per the Phase-0 brief's own stop-until-audited rule.

---

## Repository conventions confirmed (read directly, not assumed)

- **Migrations**: knex, `.cjs`, `directory: ./migrations`, idempotent `hasTable` guards, `t.increments('id').primary()`, `t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE')` tenant column on every table, `t.timestamps(true, true)`, named unique/index constraints. Latest existing migration: `20261018140000_examination_remuneration.cjs`.
- **Module shape**: `types.ts` (Actor type + Permission union), `access.ts` (`ROLE_PERMISSIONS` map + `assertXPermission`/`hasXPermission`, `isAdminRole`/`isSuperAdmin` bypass), `service.ts` (zod schemas + `db` queries + `assertCollegeRow`/tenant checks + row-locked (`forUpdate()`) concurrency + `audit()` helper writing to a module-local `*_audit_log` table if present), `controller.ts` (Express `Router`, `requireAuth`, `asyncHandler`, `validate(schema, body)`).
- **Errors**: `AppError(status, message)`; the central `errorHandler` already translates `ER_DUP_ENTRY` → 409 and `ER_LOCK_WAIT_TIMEOUT` → 503 — modules do not need to hand-roll duplicate-detection responses.
- **Concurrency pattern**: pessimistic row locks inside `db.transaction()` (`.forUpdate()`), e.g. `procurement/service.ts: nextNo()`, `balanceForUpdate()`. No optimistic-version-column pattern exists anywhere — Phase-0 engines should follow the same row-lock convention for consistency, not invent a second concurrency style.
- **Test convention**: `node --import tsx --test --test-concurrency=1`, `node:test` `describe`/`it`, direct service-function calls (not HTTP), fixtures built via raw `db(...).insert()`, concurrency proven with `Promise.allSettled`.
- **Attachment/storage convention (the only one that exists)**: `apps/api/src/modules/studentServices/attachmentAccess.ts` — local filesystem under `apps/api/uploads/<module>/`, metadata row has a `storage_key`; reads resolve `path.resolve(root, storage_key)` and reject anything that escapes the root (path-traversal guard). **No multer, no S3/MinIO, no `@aws-sdk`, no object-storage package anywhere in `apps/api/package.json` or `apps/api/src`.** Confirmed by direct grep. Critically, there is **no actual upload endpoint** in the repository — `attachmentAccess.ts` only *reads* files that tests write directly via `node:fs`. This means Phase 0's Document/Evidence engine is the **first real upload+download implementation** in this codebase, not a consolidation of existing ones.

---

## P0.1 — Vendor Master

| Item | Finding |
| --- | --- |
| Existing capability | `procurement_vendors` (migration `20261004100000_stores_procurement.cjs:118-140`): `vendor_code` (unique per college), `name`, `normalized_name`, `address`, `contact_person`, `phone`, `email`, `tax_identifier` (unique per college — serves the GSTIN/PAN role generically), `bank_details`, `categories` (JSON array of free-text strings — already an **extensible** classification mechanism, not a rigid enum), `verification_status`, `rating`, `is_active`, `notes`, timestamps. |
| Existing owner | Procurement module (`apps/api/src/modules/procurement`) — **not frozen** (`COMPLETE_NOT_FROZEN` per `docs/STORES_PROCUREMENT_FREEZE_VALIDATION.md`), so it may be directly extended. |
| Existing service/access | `createVendor()` (`service.ts:319`) requires `procurement.vendor.manage`; read access via `listMasters()` requires `inventory.view`; broad `procurement.view` is already granted to `FACULTY`, `LAB_ASSISTANT`, `MAINTENANCE_MANAGER`, `FACILITIES_OFFICER` (`access.ts`), meaning several future consumer roles already have some visibility today. |
| Duplication | Confirmed (per the prior campus-OS audit): Transport (`vendor_reference` free text), Lab (`vendor`/`vendor_ref` free text), Maintenance (`vendorName`/`vendorRef`/`vendorStatus` free text, explicitly commented "NOT PROCUREMENT" in `20260925100000_maintenance_helpdesk.cjs`) each store unlinked vendor identity. |
| Reuse decision | **`procurement_vendors` is the canonical base, unchanged schema.** No new table. The existing columns already cover every field the Phase-0 brief asks to "evaluate" (vendor code, legal name, contact, GSTIN/PAN via `tax_identifier`, status, notes, audit timestamps) — adding a parallel `vendor_type` enum column would duplicate the existing flexible `categories` JSON field, which the brief explicitly says to prefer when it already exists. |
| Migration impact | **None required.** This is itself evidence the module was already built correctly the first time. |
| Frozen-module impact | **None.** Transport/Lab/Maintenance's free-text vendor fields are deliberately left untouched — mapping them to `procurement_vendors` would require guessing vendor identity across free-text strings, which §4.3 of the brief explicitly forbids ("If mapping is ambiguous: leave it unmapped. Never guess vendor identity."). |
| Security | Already proven: tenant-scoped (`college_id` on every query), RBAC-gated, duplicate-protected (`vendor_code`/`tax_identifier` unique per college, translated to a clean 409 by the shared error handler), cross-college IDOR blocked (`assertCollegeRow`). |
| Chosen approach | Add a small, additive, read-oriented **directory accessor** inside the existing `procurement` module — a dedicated `GET /procurement/vendors` endpoint plus an internal `findVendorRef()` service function that Phase-0's new Asset Management engine (and any future consumer) can import directly, without duplicating vendor data or exposing the heavier `/masters` bundle. No new module, no new table, no new migration. |

---

## P0.2 — Asset Management

| Item | Finding |
| --- | --- |
| Existing capability | `apps/api/src/modules/lab/assets.ts` + `lab_assets`/`lab_asset_history` (migration `20260924100000_lab_management.cjs`) — a real, tested asset register with lifecycle and history, but **Lab-scoped only** and **frozen**. |
| Existing owner | Lab Assistant / In-charge, inside the frozen Lab module. |
| Duplication | Confirmed: no other module has any asset register. IT, Library (only `barcode` on book copies, unrelated), Hostel, Administration, Facilities have zero asset tracking. Stores/Procurement's own freeze doc names this exact gap ("Asset Handoff: PARTIAL... no canonical Asset Management module was found"). |
| Reuse decision | **Do not touch Lab.** Build a new, generic, cross-department module. Lab's `lab_assets` schema is used only as a *design reference* (asset tag, custodian, history-table shape), never imported or modified. |
| Migration impact | New tables only: `campus_assets`, `campus_asset_history`. Fully additive; no existing table touched. |
| Frozen-module impact | **None.** Lab is not modified. |
| Security | New tables carry `college_id` on every row, capability-gated via a new `access.ts`, and every state change is captured in `campus_asset_history` (append-only, actor + timestamp + reason) instead of overwriting the asset row silently. |
| Chosen approach | New module `apps/api/src/modules/assetManagement`. Nullable `vendor_id` FK to `procurement_vendors` (reuses P0.1, does not duplicate it). Client-supplied, per-college-unique `asset_tag` (same convention as `vendor_code`/`item_code` — no new auto-numbering sequence table needed). Status/condition are validated string enums following a state machine (`ACTIVE/IN_STOCK/ASSIGNED/UNDER_MAINTENANCE/LOST/DAMAGED/RETIRED/DISPOSED`; `RETIRED`/`DISPOSED` are terminal). |

---

## P0.3 — Workflow / Approval Engine

| Item | Finding |
| --- | --- |
| Existing capability | **None generic.** `apps/api/src/utils` has only domain-specific status helpers (`quizStatus.ts`, `surveyStatus.ts`); there is no `lib/` directory. 25+ modules (Procurement indents/POs, Grievance case engine, Lab requirement chain, Admissions stages, Office register lifecycle, etc.) each hand-roll their own status enum/transition logic directly in their `service.ts`. |
| Existing owner | None — distributed across every module. |
| Duplication | Confirmed extensively by the prior campus-OS audit (§15 of the gap audit). |
| Reuse decision | **Do not retrofit any of the 25+ existing implementations.** Build one new, deliberately small engine (definitions → steps → transitions → instances → append-only history) for **future** consumers only (Security/Gate, Scholarship enhancement — neither built in this phase). This phase produces the engine and its own tests; it wires into nothing else yet, by design. |
| Migration impact | New tables only: `workflow_definitions`, `workflow_steps`, `workflow_transitions`, `workflow_instances`, `workflow_instance_history`. Zero existing tables touched. |
| Frozen-module impact | **None** — no frozen module references this engine in Phase 0. |
| Security | Every table tenant-scoped; step-level authorization is data-driven (`allowed_roles` JSON per step, resolved server-side, never trusted from the client); transitions are validated against the concrete `(from_step, action)` pair recorded for the definition; instance mutation happens inside a `db.transaction()` with `.forUpdate()` on the instance row, matching the repo's existing concurrency convention (Procurement's `nextNo`/`balanceForUpdate`), to block double-approval and stale-state transitions. |
| Chosen approach | New module `apps/api/src/modules/workflowEngine`. Deliberately no conditional-branching/expression engine (YAGNI — the brief explicitly warns against building "Camunda"). Deliberately no cross-college shared definitions — each definition belongs to one college, consistent with every other module's tenant model. |

---

## P0.4 — Document / Evidence Storage Engine

| Item | Finding |
| --- | --- |
| Existing capability | Metadata-only tables per module (`student_service_attachments`, `student_grievance_attachments`, `service_attachments` in Maintenance) plus the read-only `attachmentAccess.ts` local-disk convention described above. **No working upload endpoint exists anywhere in the repository today** — confirmed by grep for `multer`/`upload.single`/any multipart handling; the only place bytes get written to disk is inside test fixtures. |
| Existing owner | None (per-module, metadata-only, and incomplete). |
| Duplication | Confirmed: Grievance, Maintenance, Student Services, Faculty Profile, HR Recruitment, Admissions each have their own attachment table shape. |
| Reuse decision | **Do not migrate any existing attachment table.** Build one new engine for **future** consumers only. Since no object-storage package exists in this repo, and adding one (S3/MinIO) would be a new architectural dependency the brief does not authorize introducing speculatively, the new engine follows the **one storage pattern that already exists** (local filesystem under `apps/api/uploads/<module>/`, `storage_key` metadata column, path-traversal-guarded reads) rather than inventing a second storage stack. |
| Migration impact | New table only: `campus_documents`. Zero existing attachment tables touched or migrated. |
| Frozen-module impact | **None.** |
| Security | Because no multipart/multer infrastructure exists, uploads are accepted as base64 JSON (consistent with every other endpoint in this API, which is JSON-only; `express.json({ limit: '12mb' })` is already the global body-size ceiling in `app.ts`) and capped well below that limit. MIME type is validated against an explicit allow-list from the **decoded bytes' declared type** in the request, never inferred from the client-supplied filename. The on-disk filename (`storage_key`) is always a server-generated UUID — the client's original filename is stored only as metadata, never used to build a path, which removes the path-traversal attack class by construction (stronger than the existing `attachmentAccess.ts` pattern, which still accepts a client-influenced `storage_key`). SHA-256 checksum computed server-side over the decoded bytes. Tenant (`college_id`) + entity ownership checked on every read. |
| Chosen approach | New module `apps/api/src/modules/documentEngine`. Versioning via a `document_group_id` linking successive versions, `status` (`ACTIVE`/`SUPERSEDED`/`ARCHIVED`) for soft-delete — evidence is never hard-deleted. |

---

## Summary decision table

| Engine | New tables | New module | Frozen modules touched | Existing modules extended |
| --- | --- | --- | --- | --- |
| P0.1 Vendor Master | 0 | No (extends `procurement`) | None | `procurement` (not frozen) |
| P0.2 Asset Management | 2 (`campus_assets`, `campus_asset_history`) | Yes (`assetManagement`) | None | None |
| P0.3 Workflow Engine | 5 (`workflow_definitions`, `workflow_steps`, `workflow_transitions`, `workflow_instances`, `workflow_instance_history`) | Yes (`workflowEngine`) | None | None |
| P0.4 Document Engine | 1 (`campus_documents`) | Yes (`documentEngine`) | None | None |

**Pre-implementation audit: PASS.** Proceeding to implementation.
