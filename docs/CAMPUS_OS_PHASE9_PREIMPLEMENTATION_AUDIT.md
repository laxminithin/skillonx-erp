# Campus OS Phase 9 — Student Services, Registrar Services &
## Academic Record Requests — Pre-Implementation Audit

Date: 2026-09-25. Branch: `feat/examination-coe-operational-backend`.

## Verified starting baseline

Read directly from `docs/CAMPUS_OS_PHASE8_FREEZE_VALIDATION.md`: Phase 8
made zero source-code changes (Option D). The baseline it carried forward
from `docs/CAMPUS_OS_PHASE7_FREEZE_VALIDATION.md` is:

> Full backend regression: **249 suites / 1,473 tests / 1,473 PASS /
> 0 FAIL / 0 CANCELLED / 0 SKIPPED**, exit code 0.

This matches the prompt's claimed baseline exactly. No discrepancy found.

## Headline finding

A substantial, config-driven Student Services engine already exists at
`apps/api/src/modules/studentServices/` — **not leave/permission-only, as
a shallower read might suggest.** `requestEngine.ts` +
`defaults.ts:DEFAULT_REQUEST_TYPES` already ship a working, per-college,
configuration-seeded catalog covering:

`BONAFIDE_CERTIFICATE`, `STUDY_CERTIFICATE`, `CONDUCT_CERTIFICATE`,
`GRADE_CARD`, `TRANSCRIPT` (fee-gated), `PROVISIONAL_RESULT`,
`ATTENDANCE_CERTIFICATE`, `NO_DUE_CERTIFICATE`, `PROFILE_CORRECTION`,
`USN_CORRECTION`, `STUDENT_LEAVE_REQUEST`, `STUDENT_PERMISSION_REQUEST`,
`OTHER`.

Adding a new *simple* type (leave/permission/correction-shaped) is pure
configuration — a `DEFAULT_REQUEST_TYPES` entry, zero controller code.
`certificates.ts` (locked sequence numbering, QR verification-code lookup,
revoke/reissue/supersession) already generates the certificate PDF data
for every type with `generatesCertificate: true`, sourcing transcript/
grade-card content from authoritative `examination/result.ts`
(`studentResults`, `studentAcademicRecord`) — never recomputing marks
itself. A student-facing catalogue+tracking UI (`/lms/services/*`) and a
staff processing workspace (`/student-services`, `/admin/student-services`)
already exist and are live.

Finance already has a generic ad-hoc service-fee demand mechanism
(`finance/integration.ts:createServiceRequestFeeDemand`) already wired
into every fee-required request type. A real cross-domain no-due
aggregator already exists (`finance/clearance.ts:getFinancialClearance`,
composing Finance+Library+Hostel+Transport) — it is just not yet
auto-invoked by the `NO_DUE_CERTIFICATE` workflow step (currently manual).

## Audit by business concept (30 questions)

| # | Question | Status | Evidence |
|---|---|---|---|
| 1 | What does `student_service_requests` already support? | EXISTING BUT PARTIAL | Certificates (Bonafide/Study/Conduct/GradeCard/Transcript/Provisional/Attendance/NoDue), corrections (Profile/USN), leave/permission — but no TC/Migration/Duplicate-marks/Course-completion. `defaults.ts:22-282` |
| 2 | Generic, or leave/permission-only? | EXISTING & SUFFICIENT (config-driven for simple types) | `ensureCollegeServicesDefaults` seeds an arbitrary type array per college; adding a simple type needs no controller change. |
| 3 | Student Services UI exists? | EXISTING & SUFFICIENT | `/lms/services*` — catalogue, request, certificate pages (`App.tsx:695-705`) |
| 4 | Registrar/Admin processing workspace exists? | EXISTING BUT PARTIAL | `/student-services`, `/admin/student-services` staff workspace exists, framed as "Office/Student Services" — no route or role literally named "Registrar" |
| 5 | Service types configurable? | EXISTING & SUFFICIENT | `defaults.ts` per-college seed, DB-backed catalog |
| 6 | Request tracking implemented? | EXISTING & SUFFICIENT | `request_number`, `status`, `current_stage`, `student_request_actions` timeline |
| 7 | Approval routing implemented? | EXISTING & SUFFICIENT | Hand-rolled multi-step workflow, role-gated `staffActionOnRequest`, dynamic leave-policy routing |
| 8 | Payments/service charges supported? | EXISTING & SUFFICIENT | `fee_required`/`fee_amount`/`fee_head_code` per type, auto ad-hoc Finance demand, payment gate before processing |
| 9 | No-due integration present? | SHARED FOUNDATION AVAILABLE, not auto-wired | `finance/clearance.ts:getFinancialClearance` aggregates 4 domains; `NO_DUE_CERTIFICATE`'s workflow step is a manual `COLLEGE_ADMIN` action, doesn't call it programmatically |
| 10 | Document generation present? | EXISTING & SUFFICIENT (for covered types) | `certificates.ts:generateCertificateForRequest` + templates |
| 11 | Document delivery/download present? | EXISTING BUT PARTIAL | Student can fetch certificate/document detail via API; a dedicated PDF render/download pipeline needs confirming at implementation time |
| 12 | Examination already owns transcripts? | EXISTING & SUFFICIENT | `certificates.ts` sources from `examination/result.ts`; generation/numbering lives in Student Services (orchestration), not Examination — correct boundary |
| 13 | Examination already owns marks-card requests? | DOMAIN-SPECIFIC BY DESIGN | `GRADE_CARD` type generates from `examination/result.ts:studentResults`; no separate duplicate-marks-card flow |
| 14 | Examination owns exam-result corrections? | N/A to Phase 9 | Revaluation (`examination/revaluation.ts`) is result correction, a separate frozen COE concern, not identity/document correction |
| 15 | Who owns student identity corrections? | EXISTING BUT PARTIAL | `studentServices/profileCorrection.ts` writes directly to `students` table on approval; the Student Master module itself (`modules/students`) has no correction endpoints of its own — Student Services is the controlled front door, which is correct, but DOB is not among the correctable fields |
| 16 | Who owns USN/registration-number corrections? | EXISTING BUT PARTIAL | Same file, `USN_CORRECTION` type, uniqueness check, gated behind existing-academic-record check (blocks if the student has approved enrollments/results — "requires administrative migration") |
| 17 | TC processing exists? | MISSING | No type, route, or generation code anywhere in the repo |
| 18 | Migration-certificate processing exists? | MISSING | Same — confirmed by repo-wide grep, zero hits |
| 19 | Bonafide/study-certificate generation exists? | EXISTING & SUFFICIENT | Fully wired end-to-end |
| 20 | Duplicate-document processing exists? | MISSING | `reissueDocument` only handles revoked→reissue; no "duplicate of a still-valid original" request path |
| 21 | Course-completion processing exists? | MISSING | No `COURSE_COMPLETION_CERTIFICATE` type |
| 22 | Certificate verification exists? | EXISTING & SUFFICIENT | `verifyDocument` by `verification_code`, public unauthenticated route, masks USN |
| 23 | Digital verification/QR exists? | EXISTING BUT PARTIAL | Verification-code lookup + public route exist; QR *image* rendering not confirmed in the audited backend files (may be front-end only) |
| 24 | No-due clearance exists? | SHARED FOUNDATION AVAILABLE | Real aggregator, policy-driven BLOCK/WARN/ALLOW — see #9 |
| 25 | Alumni conversion interacts with TC/completion? | MISSING | No alumni↔document-request code found anywhere |
| 26 | Notifications reusable? | EXISTING & SUFFICIENT (shared helper) | `notifyStudent` (academicClasses/studentNotifications.ts) already used by `requestEngine.ts`/`certificates.ts` |
| 27 | Document Engine reusable? | SHARED FOUNDATION AVAILABLE, currently unused here | `documentEngine` exists generically; `studentServices` uses its own `student_service_documents` table instead — an existing, working, parallel design, not a defect to "fix" opportunistically |
| 28 | Workflow Engine reusable? | SHARED FOUNDATION AVAILABLE, currently unused here | `workflowEngine` exists generically; `requestEngine.ts` hand-rolls its own step/action tables instead — same as above, working as-is |
| 29 | Finance already capable of collecting service charges? | EXISTING & SUFFICIENT | Generic ad-hoc demand + `MISCELLANEOUS` fallback fee head, already proven by reuse in exam revaluation fee demand too |
| 30 | Genuinely missing functionality | See "Gaps" below. |

## Gaps (real, config-shaped, low-risk to close)

1. **Transfer Certificate (TC)** — a near-universal registrar service for
   an Indian college, entirely absent. Would plausibly gate on the
   existing no-due aggregator (#9) once that's wired.
2. **Migration Certificate** — absent. Institution-issued vs.
   university-issued must be confirmed before building (prompt §26) —
   likely institution-issued only, with the actual university-side
   migration process out of scope (external, `NOT_CONFIGURED`).
3. **Duplicate certificate/marks card (of a still-valid original)** —
   absent; today only a revoked document can be reissued.
4. **Course Completion Certificate** — absent, same shape as Bonafide/
   Study (pure config + a `buildDocumentData` branch).
5. **DOB correction** — not in the `PROFILE_CORRECTION` field catalog at
   all (only NAME/EMAIL/PHONE/SECTION).
6. **`NO_DUE_CERTIFICATE` auto-clearance hookup** — the aggregator exists
   but the workflow step is manual; wiring it would remove a needless
   manual step and let TC/Migration (if built) share the same gate.
7. **Alumni document requests** — alumni share the same underlying
   `students` row (via `alumni_profile` overlay) but have no path into
   `studentServices`; a transcript/duplicate-certificate request from an
   alumni portal doesn't exist.

None of these were asked for by name in this conversation — they are
gaps *relative to the Phase 9 prompt's aspirational service list*, not
confirmed institutional demand. TC and Migration Certificate in particular
are common enough that most colleges need them eventually, but "common"
is not the same as "proven now."

## Explicitly NOT gaps (already sufficient, do not rebuild)

- Request lifecycle, tracking, multi-step approval routing.
- Bonafide/Study/Conduct/Grade Card/Transcript/Provisional Result/
  Attendance Certificate generation, numbering, verification, revoke/
  reissue.
- Service-fee demand creation and payment gating (Finance boundary
  correctly respected — Student Services never mutates ledger state
  directly).
- USN/Profile correction control flow and its restricted-field/
  existing-record guard.
- Student-facing and staff-facing web surfaces.
- A dedicated `REGISTRAR` role — per prompt §7, do not assume one is
  needed; current Office/COE/College-Admin role structure already owns
  processing via `student_services.process` permission + per-step actor
  roles, and the audit found no evidence this is insufficient.
- Reusing `documentEngine`/`workflowEngine` instead of `studentServices`'s
  own parallel tables — this is pre-existing architecture, not something
  Phase 9 should "fix" opportunistically (prompt §96: no gratuitous
  refactor of a frozen module).

## Architecture decision

**Option B — existing `student_service_requests` minimally generalized.**
Not Option A (no new orchestration layer needed — one already exists and
works), not Option D (real, concrete gaps exist, unlike Phase 8), not
Option C (the "thin front door" already exists; what's missing is a
handful of catalog entries within it, not a new layer above it).

If the user confirms scope, the additive work is: 4 new
`DEFAULT_REQUEST_TYPES` catalog entries (TC, Migration, Duplicate
Certificate, Course Completion) with matching `buildDocumentData`
branches and certificate templates, one new `DOB` correction field, and
wiring `NO_DUE_CERTIFICATE`/TC's workflow step to call
`getFinancialClearance` programmatically instead of manual sign-off. No
new module, no new engine, no new role.

This is a genuine scope decision — see chat for the question posed to the
user before any code is written.
