# Campus OS Phase 13 — Final Remaining Campus Operations Gap Audit

Date: 2026-09-26. Branch: `feat/examination-coe-operational-backend`.

**PHASE 13 — FINAL REMAINING CAMPUS OPERATIONS GAP AUDIT: FROZEN**

**Update (same date, following blocker closure): the sole Class A finding
(A1) has been CLOSED.** See
`docs/ADMISSIONS_CONCURRENCY_MASTER_FREEZE_CLOSURE.md` for full evidence.
With zero remaining Class A items, this audit is reclassified from NOT
FROZEN to FROZEN. This reclassification covers the audit itself
("functional gap audit complete, no open Class-A blocker") — it does
**not** constitute a Campus OS Master Freeze, which remains a separate,
unauthorized action (§123/§124 of the governing brief).

Audit Status: **COMPLETE**

Starting baseline: 252 suites / 1,508 tests / 1,508 PASS / 0 FAIL /
0 CANCELLED / 0 SKIPPED (per `docs/CAMPUS_OS_PHASE11_FREEZE_VALIDATION.md`,
not re-run — see §7, no source changed by this audit).

## 0. Method and companion evidence

This is a repository-wide reconciliation, not a from-scratch audit. The
repository already contains extremely detailed, recently-dated audit
material that this document builds on rather than repeats:

- `docs/CAMPUS_DIGITISATION_GAP_AUDIT.md` (2026-09-23) — full A–Z domain
  audit, shared-engine inventory, master-data duplication audit, financial/
  approval/document/help-desk duplication audits, mobile-impact planning.
- `docs/SKILLONX_PORTAL_AND_ENGINE_MATRIX.md` (2026-09-23, updated
  2026-09-24) — Domain × Class × Owner × Dependency × Priority matrix.
- `docs/ERP_WEB_MASTER_CLOSURE_MATRIX.md` (2026-09-15) — role inventory,
  panel closure matrix, integration audit, orphan-functionality list.
- `docs/CAMPUS_OS_PHASE{0..12}_FREEZE_VALIDATION.md` — the 13 Campus OS
  phases run since that gap audit (Vendor Master/Asset Management/Workflow
  Engine/Document Engine closed in Phase 0; Procurement closure in Phase 1;
  Canteen backend in Phase 2; Facilities preventive maintenance in Phase 3;
  Security/Gate partial in Phase 4; Admissions/Onboarding in Phase 5;
  Research in Phase 6; IQAC in Phase 7; Helpdesk/Grievance expansion in
  Phase 8; Alumni in Phase 9; Scholarships in Phase 10; Events/Venue
  booking in Phase 11; Innovation/Incubation held at audit-only in Phase
  12), each with its own carried-forward limitations list.

Where this audit disagrees with or adds to that material, it is because of
direct, fresh repository evidence gathered in this session (cited by file
path), not because the prior material was wrong. Two Explore sub-agents
were used for read-only research in this session; every finding below was
independently re-verified against the actual source in this turn before
being written down (see §3.1 and §5 for the two findings that required
direct verification).

## 1. Primary answer

**After Phases 0–12, is SkillonX honestly a Campus OS?** Substantially yes.
13 primary Web portals exist, the great majority frozen; 6 shared engines
(Vendor Master, Asset Management, Workflow Engine, Document Engine,
Events/Venue Booking, plus Finance as the pre-existing canonical ledger)
have been built and are frozen; every module that creates a financial
obligation hands off to Finance rather than posting its own ledger; tenant
isolation is enforced pervasively and tested in nearly every freeze doc.

What remains uncovered falls into two buckets:

1. **One genuine correctness defect** in a frozen, high-traffic module
   (Admissions) — see §2, Class A.
2. **A long tail of Class G/H "no evidence of institutional demand"
   domains** (Health Centre, Sports/Clubs, Institutional Fleet, Parking,
   Governance-beyond-IQAC's-committee-model, Legal/MoU, Guest House,
   Lost & Found, etc.) that prior audits already correctly held, and that
   this audit reconfirms should stay held.

No essential campus operation is completely missing in the sense of "the
institution cannot function." The one Class A item is a reliability defect
in an existing, frozen flow, not a missing domain.

## 2. Class A — Master Freeze Blockers

### A1. Admissions `nextAdmissionNumber` concurrency race — **CLOSED**

**Status: CLOSED.** Fixed with a bounded retry scoped precisely to the two
admission-number unique-index violations; reproduced pre-fix (3/3 runs
failed), verified post-fix (all runs pass); full backend regression
252 suites / 1,510 tests / 1,510 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED.
Full evidence: `docs/ADMISSIONS_CONCURRENCY_MASTER_FREEZE_CLOSURE.md`. The
description below is preserved as the original defect record.

### A1 (original defect record) — confirmed by code, not just carried-forward claim

**Existing state:** `apps/api/src/modules/admissions/service.ts`,
`nextAdmissionNumber(trx, collegeId)` (~L207-215) generates the next
admission number by `COUNT(*)` over `admission_student_conversions`
filtered by `college_id` and an `admission_number LIKE` pattern, then
returns `CODE/ADN/YEAR/<count+1>`. This is a read-then-write sequence
generation, not a DB sequence and not `SELECT ... FOR UPDATE` on a shared
counter row. It runs inside `confirmAdmission` (~L913) inside a
`db.transaction`, and that transaction does take `.forUpdate()` on the
**applicant row being confirmed** (~L898) — which locks only that one
applicant, not any resource governing the shared admission-number
sequence.

**Why essential:** Admission confirmation is a routine, often bursty,
staff operation (multiple officers confirming applicants in the same
college/year in parallel, e.g. during counselling days).

**Existing engine to reuse:** the module already has a `UNIQUE (college_id,
admission_number)` constraint on both `students` and
`admission_student_conversions` (migration
`20260926100000_admissions_management.cjs`), so no duplicate admission
number can ever be *persisted* — data corruption is not possible.

**What actually happens today:** two concurrent `confirmAdmission` calls
for two *different* applicants in the same college/year can both compute
the same next number before either commits. The loser's `INSERT` then hits
the unique-constraint violation. There is **no catch/retry logic** around
this specific insert (the only catch/retry code in `confirmAdmission` is
for guardian-email collisions, unrelated). The result: the losing
request fails with a raw/opaque DB constraint error instead of
transparently succeeding with the next available number.

**Verdict on severity:** *not* a data-corruption risk (the unique
constraint holds), but *is* a request-reliability defect: real concurrent
confirmations will unpredictably fail for one of the two officers, who
must simply retry the same click. `admissions.closure.e2e.test.ts`'s only
similarly-named test (`COLLISION-${run}`, ~L530) covers duplicate-guardian-
email prevention, not this race — **there is no test in the repository
that exercises two truly parallel `confirmAdmission` calls**, so this has
never been proven safe or unsafe by the test suite itself; this audit's
code-reading is the first direct evidence either way.

**Minimum required closure:** wrap the admission-number allocation in a
retry-on-unique-violation loop (catch the specific constraint error,
recompute, retry a bounded number of times) inside the existing
transaction — no schema change, no new table, no UI change.

**Frozen-domain impact:** Admissions is frozen
(`docs/ADMISSIONS_MANAGEMENT_FREEZE_VALIDATION.md`). Per the governing
rule for this audit, a frozen module is not reopened without proof of a
material defect and even a "trivial" fix requires explicit authorization
before being made — this audit does not implement it.

**Recommended action:** authorize a narrowly-scoped fix limited to
`nextAdmissionNumber`/`confirmAdmission`'s retry behavior, plus one new
concurrency test that actually exercises two parallel confirmations (the
gap the existing suite has). Do not touch any other Admissions logic.

No other Class A item was found. All other findings below are Class B
through J.

## 3. Class B — Existing, needs closure (non-blocking)

- **B1. `students.listStudents` is unbounded** — `apps/api/src/modules/students/service.ts`
  (~L4-36) issues no `.limit()`/`.offset()`, unlike every comparable list
  endpoint (employees, alumni, events, library members all paginate).
  Real performance risk as the student table grows; not currently a
  functional defect. Recommended: add limit/offset consistent with the
  other list endpoints, when this module is next touched.
- **B2. `assetManagement.listAssets` caps at a fixed 500 rows with no
  offset** (`apps/api/src/modules/assetManagement/service.ts` ~L198-212) —
  a college with more than 500 assets would see a silently truncated,
  non-navigable list. Recommended: convert the fixed cap to real
  limit/offset pagination.
- **B3. Grievance/student-service attachment *upload* was never built —
  only download.** Verified directly in this session: both
  `staffController.ts` and `studentController.ts` in
  `apps/api/src/modules/studentServices` expose only
  `GET /attachments/:id/download` and `GET /grievance-attachments/:id/download`
  routes; there is no `POST`/`PUT` route anywhere in production code that
  creates a row in `student_grievance_attachments` or
  `student_service_attachments`. The only place either table is written to
  is a test-only helper (`attachCase`, `grievanceStudentWelfare.e2e.test.ts`
  ~L175) that inserts directly into the DB, bypassing any real controller.
  **This is not a broken promise** — `docs/GRIEVANCE_STUDENT_WELFARE_FREEZE_VALIDATION.md:34`
  is honest about scope ("Added grievance-specific attachment metadata and
  secured download authorization; no generic attachment engine was
  introduced") and never claims upload was built. But it is a genuine,
  previously-uncited completeness gap: a student or officer today has no
  way to actually attach evidence to a grievance/service request through
  the real API. The grievance workflow is fully functional without
  attachments (narrative text, triage, resolution, appeal all work), so
  this is Class B, not Class A. Recommended: build the upload endpoint
  reusing the frozen Document Engine (`apps/api/src/modules/documentEngine`)
  rather than the grievance-local attachment table, if/when this is
  prioritized.
- **B4. Lab stock-to-Stores bridge** — carried forward unchanged from the
  prior audit (`docs/CAMPUS_DIGITISATION_GAP_AUDIT.md` §13, §V).

## 4. Class C — Existing portal enhancement (config/validation only)

- **C1. `hr/recruitmentDocuments.ts` (`uploadDocument`)** accepts
  `contentType`/`docType` with no MIME allowlist and stores
  `contentBase64` with no size-limit check. No path-traversal risk (DB-only
  storage, no filesystem key built from user input) and tenant scoping is
  intact (`college_id`/`candidate_id`-scoped rows), so this is a hardening
  gap, not a breach. Recommended: add the same MIME allowlist + size cap
  pattern already used by `documentEngine`/`facultyProfile/evidence.ts`.
- **C2. `maintenance/tickets.ts` (`addAttachment`)** accepts
  client-reported `mimeType`/`sizeBytes` with no server-side verification
  against the actual `dataUrl`. Same risk profile as C1 (no traversal, DB-
  scoped, tenant-safe) — a hardening gap, not a breach.
- **C3. No-Due/Clearance aggregator still omits Examination and Stores** —
  carried forward unchanged (`docs/CAMPUS_DIGITISATION_GAP_AUDIT.md` §18).
- **C4. Scholarship application/eligibility/approval enhancement** —
  carried forward unchanged (`docs/CAMPUS_DIGITISATION_GAP_AUDIT.md` §L).
- **C5. OD (On Duty) has no linked TA/DA reimbursement.** `hr/defaults.ts:42`
  defines an `OD` leave type wired into attendance status
  (`hr/attendanceEngine.ts:195`), but no conference/exam-duty
  sub-classification and no linked expense-claim entity in Finance (no
  "travel reimbursement" or "TA/DA" concept found in
  `apps/api/src/modules/finance`). Institution-dependent; hold unless
  requested.

## 5. Class D — Shared engine required (carried forward, unchanged priorities)

- Communication/Notification Centre consolidation (4 fragmented tables) —
  unchanged from prior audit.
- IQAC evidence-projection layer spanning all criteria — unchanged.
- Location/Space Master hierarchy (Campus→Building→Floor) — unchanged,
  low priority.
- Vendor Master reuse into Transport/Lab/Maintenance free-text fields —
  unchanged, low priority.

## 6. Class E/F/G/H/I/J — reconfirmed, largely unchanged from the 2026-09-23 audit

Two Explore passes in this session specifically re-checked every domain
the prior audit had not already exhaustively covered, plus a handful the
Phase 13 brief asked about explicitly. All reconfirm `NOT_FOUND`/Class G
or H, or surface a genuinely new (but non-blocking) finding:

| Domain | Status | Class | Note |
|---|---|---|---|
| Health Centre / Infirmary | NOT_FOUND, reconfirmed | G | No change across Phase 0-12 |
| Sports / Clubs / IEEE-CSI-ISTE / NSS / NCC | NOT_FOUND as an entity (scattered tags only) | G | `events` can tag an event `SPORTS_EVENT`/organizer `CLUB`, but no club/membership/achievement entity exists |
| Governance / Committees / Academic Council / BoS | **FOUND, generic, via IQAC** | A (already delivered) | `iqac_committees.committee_type` enum (`IQAC|ACADEMIC|RESEARCH|STATUTORY|OTHER`) + `iqac_meetings` (agenda/minutes/minutes_document_id) genuinely covers Academic Council/Governing Council/BoS as committee rows — `docs/IQAC_ACCREDITATION_FREEZE_VALIDATION.md:45-48` states this explicitly. No separate "resolutions"/"circulars" entity; modeled as minutes text or a linked document. |
| E-office / inward-outward / file movement | **FOUND, via Office module** | A (already delivered) | `office_file_records`/`office_file_movements`, inward/outward register pages, `docs/OFFICE_ADMINISTRATION_FREEZE_VALIDATION.md`. Fully covers dak/dispatch/correspondence concepts under the "Office" name. |
| Front office / reception / appointment scheduling | PARTIAL — gate-visitor only, no reception/calendar booking | G | `security/types.ts` visitor-request schema ties a visitor to a host faculty/student; not an appointment-slot system |
| Parking (student/staff vehicle permits) | NOT_FOUND, reconfirmed | H | Zero footprint |
| Institutional Fleet (official cars/drivers/fuel) vs Transport | NOT_FOUND as distinct from Transport | G | `transport.vehicleType` enum is `BUS/MINIBUS/VAN/OTHER` only — Transport is exclusively the student/staff bus fleet; no official-vehicle/fuel-log/official-travel entity exists anywhere |
| Academic student projects (mini/major/capstone) | PARTIAL | C | Canonical `student_projects` table lives in **Placement** (migration `20260906100000_placement_module.cjs`), used for resume/portfolio, `visibility` defaults `PLACEMENT`; classification (`UG/PG/CAPSTONE/MINI_PROJECT`) exists only as a Faculty-CV label deriving from it, not as an enum on the table itself. No project-submission/evaluation entity in academicClasses/attainment/examination. |
| Student achievement / Student-360 profile | PARTIAL | D | `student_projects`, `student_experiences`, `student_achievements`, `student_resume_versions` (all in Placement) are real but placement/resume-scoped, with unconstrained free-text `achievement_type`/`experience_type` — not a general Student-equivalent of Faculty Academic Record, and does not include sports/clubs (not found) or publications/patents |
| Campus ID card / unified QR-barcode identity | NOT_FOUND, reconfirmed | G | Library card, hostel identity, transport pass, exam hall-ticket remain four separate, unlinked identifiers |
| RFID / biometric / access-control hardware | NOT_CONFIGURED, reconfirmed | H | Zero hardware-integration code; "fingerprint" hits are unrelated content-dedup hashing |
| Lost & found | NOT_FOUND, reconfirmed | H | Zero footprint |
| Legal / MoU / Contracts | NOT_FOUND, reconfirmed | G | Unchanged |
| Incubation / IIC / Startup / IPR | NOT_FOUND, reconfirmed | G | See `docs/CAMPUS_OS_PHASE12_PREIMPLEMENTATION_AUDIT.md` (this session, prior turn) |

## 7. Code-quality / placeholder / dev-config sweep

No meaningful TODO/FIXME/stub markers exist in production (non-test)
source; the raw grep hits are legitimate HTML `placeholder` props and CSS
class names. Two honest, already-self-reported gaps found:
`hostel/dashboard.ts:224` explicitly declares
`limitations: ['Hostel attendance is not implemented in the authoritative
Hostel engine.']` in its own API payload (self-reported, not hidden).

Dev-config: `env.ts:39-40` defaults `CORS_ORIGIN`/`PUBLIC_APP_URL` to
`http://localhost:5173` when unset — an operational deployment-checklist
item (confirm prod `.env` sets these), not a code defect.
`academicLeadership/qaUsers.ts` seeds a literal QA password, but it is
gated behind `assertQaAllowed()` which 403s unless `ALLOW_TEST_SEED=true`
is explicitly set — confirm this is never set in production config. No
`sk-`/`Bearer ey`-style API keys were found hardcoded anywhere.

Orphan-UI spot-check (`/iqac`, `/management`, `/research` routes) found no
route pointing at a missing component and no top-level hardcoded-array
views on the routes sampled; this was a spot-check, not an exhaustive
pass over every route in `apps/web/src/App.tsx`.

## 8. Explicit answers to the audit questions (§122 of the request)

1. Any essential campus operational domain completely missing? **No** —
   the Class A item is a defect in an existing flow, not a missing domain.
2. Any backend engine unusable because no operational UI exists? Grievance
   attachment *upload* (§3, B3) is the clearest instance — metadata/download
   exist, the create path does not.
3. Any role unable to perform assigned work? None newly found this pass.
4. Shadow Finance ledgers? None — reconfirmed clean (`docs/CAMPUS_DIGITISATION_GAP_AUDIT.md` §14).
5. Duplicate person masters? None beyond the already-documented, deliberate
   per-audience separation (`docs/CAMPUS_DIGITISATION_GAP_AUDIT.md` §10).
6. Duplicate inventory/asset authorities? One acknowledged, tracked
   exception (Lab, carried forward) — no new ones found.
7. Duplicate approval engines? Reconfirmed: 25+ per-module state machines,
   Workflow Engine reused only for new work, unchanged position.
8. Unguarded sensitive mutations? None newly found; recruitment-document
   and maintenance-ticket attachment endpoints (C1/C2) lack input
   validation but remain tenant-scoped — hardening gaps, not unguarded
   mutations.
9. Known correctness/concurrency defects? **Yes — A1 (Admissions), now
   confirmed by direct code reading, not just carried-forward claim.**
10. External integrations falsely represented as live? None found —
    every external-system item (VTU, SSP/NSP, DPIIT, biometric, RFID) is
    consistently marked NOT_CONFIGURED/EXTERNAL in its owning phase's
    freeze doc.
11. Placeholders/mocks in production paths? None found (§7).
12. Every major campus operation mapped to an authoritative engine? Yes,
    per §112 coverage matrix — with the long-tail Class G/H exceptions
    explicitly held, not silently missing.
13. Can SkillonX honestly be called a Campus OS? Yes, with one open
    reliability defect (A1) and a documented, intentionally-held long tail.

## 9. Full backend

**RE-RUN after the A1 closure (source changed).** 252 suites / 1,510 tests
/ 1,510 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED — normal exit. Delta from
the 252/1,508 baseline: +2 tests (the two new concurrency-closure tests
added to the existing `admissions.closure.e2e.test.ts` suite file), +0
suites. See `docs/ADMISSIONS_CONCURRENCY_MASTER_FREEZE_CLOSURE.md` for
full detail. The audit itself (this document, prior to the A1 fix)
originally changed zero source lines; the current entry reflects state
after the authorized A1 closure.

## 10. Documents produced this phase

- `docs/CAMPUS_OS_PHASE13_FINAL_GAP_AUDIT.md` (this document)
- `docs/SKILLONX_CAMPUS_OS_FINAL_COVERAGE_MATRIX.md`
- `docs/SKILLONX_FINAL_PORTAL_MATRIX.md`
- `docs/SKILLONX_CROSS_MODULE_INTEGRATION_MATRIX.md`
- `docs/SKILLONX_SOURCE_OF_TRUTH_MATRIX.md`
- `docs/SKILLONX_MASTER_DATA_MATRIX.md`

## 11. Required next action

**A1 is now closed** (authorized and completed in a follow-up turn — see
`docs/ADMISSIONS_CONCURRENCY_MASTER_FREEZE_CLOSURE.md`). No other Phase 13
finding is authorized or has been touched.

Git footprint: six new `docs/` files from the audit itself, plus (from the
A1 closure) one modified product file
(`apps/api/src/modules/admissions/service.ts`), one modified test file
(`apps/api/src/modules/admissions/admissions.closure.e2e.test.ts`), and one
new closure-evidence doc. No other files created, modified, or deleted by
either turn. Pre-existing dirty-tree state (including the untracked
Parent-provisioning work already in `admissions/service.ts` and the new,
untracked `guardianProvisioning.e2e.test.ts`) was PRESERVED and not
otherwise modified.

Commit: NO. Push: NO. PR: NO.

**MASTER FREEZE AUTHORIZED: NO**

STOP.
