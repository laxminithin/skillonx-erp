# Shared Document / Evidence Storage Engine (P0.4) — Freeze Validation

Date: 2026-09-23. Scope: Campus OS Phase 0, P0.4 only. See `docs/CAMPUS_OS_PHASE0_PREIMPLEMENTATION_AUDIT.md`.

## Decision

**FROZEN**

## What was built

`apps/api/src/modules/documentEngine` — the **first real, working upload+download implementation in this repository**. The pre-implementation audit confirmed no multer/S3/MinIO/`@aws-sdk` package exists anywhere in `apps/api`, and that the existing `attachmentAccess.ts` convention is read-only (tests write files directly via `node:fs`; no upload endpoint exists). This engine follows that same on-disk storage convention rather than introducing a new architectural dependency, and is the first module to actually close the loop with a real upload endpoint.

- Migration `20261019120000_campus_os_document_engine.cjs`: `campus_documents` metadata table — `entity_type`/`entity_id`, `category`, `original_filename` (metadata only, never used to build a path), `storage_key` (server-generated, globally unique), `mime_type`, `size_bytes`, `checksum_sha256`, `status` (`ACTIVE`/`SUPERSEDED`/`ARCHIVED`), `version`, `document_group_id` (links versions together), `superseded_by_id`.
- Storage: local filesystem under `apps/api/uploads/campus-os-documents/<collegeId>/<entityType>/<uuid><ext>`, following the one pattern that already exists in this repo. **The client-supplied filename is stored only as metadata and never used to build a filesystem path — the storage key is always a server-generated UUID.** This removes the path-traversal attack class by construction, which is a stronger guarantee than the existing `attachmentAccess.ts` convention it otherwise follows.
- Upload transport: base64-encoded JSON body (no multipart infrastructure exists in this API; every other endpoint is JSON, and the global `express.json({ limit: '12mb' })` ceiling in `app.ts` was already in place). Capped at 8MB raw/decoded bytes per file (`MAX_DOCUMENT_BYTES`), safely under the JSON limit after base64 inflation.
- MIME validation is an explicit allow-list (`pdf`, `png`, `jpg`, `doc`/`docx`, `xlsx`, `txt`) checked against the **declared** MIME type in the request, never inferred from the client filename.
- SHA-256 checksum computed server-side over the decoded bytes at upload time and re-verified on every download.
- Versioning: `uploadNewVersion` marks the previous row `SUPERSEDED` and links `superseded_by_id`; old content remains fully retrievable.
- Deletion: `archiveDocument` is soft-delete only (`status = ARCHIVED`) — evidence used in an approval/audit trail is never destroyed by this engine.
- `access.ts`: `document.upload` (any authenticated staff role with an operational reason to attach evidence), `document.manage` (admin-tier — read/archive **any** document in the tenant). Ownership is the default read/version/archive gate for everyone else — deliberately narrow, since Phase 0 has no real consumer yet; a future consumer module extends this when actually built, rather than this phase guessing.
- `controller.ts`: mounted at `/api/documents` (`POST /`, `GET /:id`, `GET /:id/content`, `POST /:id/versions`, `POST /:id/archive`, `GET /?entityType=&entityId=`).

## Freeze criteria

- [x] Storage abstraction works — service layer hides the on-disk path entirely; `storage_key` is never returned in any API response (asserted in tests).
- [x] Metadata works — full field set persisted and returned.
- [x] Authorization works — non-owner, non-admin denied download (403); permission-less role denied upload.
- [x] Tenant isolation works — cross-college metadata/download/list all return not-found or empty.
- [x] Upload/download works — round-trip content proven byte-for-byte.
- [x] Checksum works — computed at upload, re-verified at download, matches an independently computed SHA-256 in the test.
- [x] Versioning/retention behaviour works — supersede chain, old version still downloadable, archive retains the file and record.
- [x] Security tests pass — disallowed MIME rejected, oversized file rejected, empty file rejected, path-traversal eliminated by construction (server-generated storage key).
- [x] No frozen attachment system was forcibly migrated — Grievance/Maintenance/Student-Services/Faculty-Profile/HR attachment tables are completely untouched.

## Tests

`node --import tsx --test --test-concurrency=1 src/modules/documentEngine/documentEngine.e2e.test.ts`

Result: **9/9 PASS**:
1. allowed upload, checksum computed correctly, content round-trips exactly, `storageKey` never exposed
2. disallowed MIME type rejected
3. oversized file rejected
4. empty file rejected
5. tenant isolation on metadata/download/list
6. non-owner, non-admin denied download; owner and admin both succeed
7. versioning: supersede chain, permission check on who may version, old content still retrievable
8. archival: soft-delete semantics, still readable/downloadable after archive, cannot be further versioned once archived
9. RBAC denial for a role with no `document.upload` capability

## Migrations

`20261019120000_campus_os_document_engine.cjs` — 1 new table, zero existing attachment tables touched. Applied via `npm run migrate`; `down()` provided.

## Storage backend

Local filesystem (`apps/api/uploads/campus-os-documents/`), matching the repository's only existing storage convention. No S3/MinIO/object-storage dependency was introduced, per the pre-implementation audit's explicit reuse decision — introducing one speculatively was judged out of scope for a "new-work-first" engine with no real consumer yet.

## Frozen-module impact

None. No existing attachment table or module was modified.

## Remaining issues

None blocking. If a future consumer needs cloud object storage (e.g. for durability across deployments), the `storageRoot()`/`writeToDisk`/`readFromDisk` functions are the only three functions that would need to change — the rest of the module (metadata, versioning, checksum, RBAC) is storage-backend-agnostic by construction.
