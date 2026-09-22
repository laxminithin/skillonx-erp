# Examination / COE Freeze Validation

Validation date: 2026-09-22 (backend closure pass)

## Scope of this pass

Closed a batch of genuinely-missing Examination backend blockers with focused, DB-backed tests,
and reconciled the closure record against what is already implemented. UI workspaces and the full
authenticated/responsive/performance/regression validation matrix are **not** yet complete, so the
portal is **NOT FROZEN**. No fabricated PASS evidence is recorded below.

## Backend blockers closed this pass (with tests)

Migrations: batches 80–83 (`20261018100000`–`20261018130000`).

1. **COE bulk registration decisions** (§6) — `closure.bulkDecideRegistrations` validates every record
   independently and returns a per-record result (`{total, succeeded, failed, results[]}`); never silently
   partially succeeds. Route `POST /api/examinations/registrations/bulk-decision`.
2. **Answer-book movement writes + server-authoritative reconciliation + variance investigation/resolution**
   (§18–20) — append-only `exam_answer_book_movements` ledger; batch aggregates recomputed **server-side**
   from the ledger; `answerBookReconciliation` computes expected/actual/variance; closure is blocked while an
   unresolved variance remains and requires reason + investigation note + resolution.
3. **Script transfer acknowledgement + variance resolution** (§21–22) — `exam_script_transfers`: sender
   expected count → receiver actual count → server variance; unresolved variance must be resolved with
   reason + resolution; original expected/received history is preserved.
4. **Question-wise valuation validation + authoritative total + governed correction** (§24–26) —
   `scoreValuationPayload` rejects awarded<0 and awarded>max and computes the authoritative total server-side;
   post-lock correction (`exam_valuation_corrections`) preserves question/old/new/reason/actor and recomputes
   the total; examiner isolation and post-lock immutability retained.
5. **MPC lifecycle + evidence authorization + governed result linkage** (§14–17) — state machine
   REPORTED→UNDER_REVIEW→COMMITTEE→DECIDED→CLOSED with an append-only `exam_mpc_transitions` timeline;
   decision gated at COMMITTEE; evidence access is **authorized before any read** (COE malpractice authority
   or a committee member of that case; unrelated faculty/student and cross-tenant denied) and returns an
   opaque storage key, never a public URL; `exam_mpc_result_actions` records the result consequence
   **without overwriting** a published result.
6. **Versioned result correction** (§28) — `result.correctResult` creates a corrected V2 that supersedes V1
   (`superseded_at`/`superseded_by_id`), recomputes grade + SGPA authoritatively, preserves V1 as history,
   and records `exam_result_corrections` (version/changes/reason/requested_by/approved_by/timestamp). Read
   paths (`studentResults`, transcript subject query) return only the current, non-superseded version.
7. **Autonomous revaluation lifecycle** (§29) — `revaluation.ts`: REQUESTED→ACCEPTED→ASSIGNED→REVALUATED→
   COMPLETED; assigned-examiner isolation on submission; a REVISED decision produces a **governed versioned
   result consequence** via `correctResult`; institution-ownership guard (`assertInstitutionOwnsCapability`)
   enforces the VTU-vs-autonomous boundary (§30); student outcome readback added.

### Tests (all PASS, DB-backed, concurrency 1)

- `examination/closureWrites.test.ts` — 9/9 (answer-book, script transfer, question-wise valuation, bulk decisions)
- `examination/mpcLifecycle.test.ts` — 2/2 (lifecycle + evidence authorization/IDOR/cross-tenant)
- `examination/resultVersioning.test.ts` — 2/2 (V1→V2 supersession, grade/SGPA recompute, no destructive overwrite)
- `examination/revaluationLifecycle.test.ts` — 1/1 (full lifecycle + versioned consequence)
- Full examination suite: **35/35 across 13 suites** (`examination/*.test.ts`).
- Regression on shared read-path consumers: `studentServices/studentServices.e2e.test.ts` 7/7,
  `office/office.freeze-evidence.e2e.test.ts` 4/4.
- API build (`tsc -p tsconfig.json`): PASS. Migrations `npm run migrate`: PASS (through batch 83).

## Already implemented (verified, not rebuilt — §0)

- **Grade card, transcript, document numbering, QR/verification, revocation, supersession** (§31–36, §27) live
  in `studentServices/certificates.ts`: tenant+series+year server numbering via `certificate_number_sequences`
  + MySQL `get_lock` (concurrency-safe, unique, doc-type-aware, auditable); opaque `verification_code` +
  `document_uuid`; `verifyDocument` exposes minimal masked info with states VALID/SUPERSEDED/REVOKED/INVALID;
  `revokeDocument` retains history; `reissueDocument` links supersession chain. Covered by
  `studentServices.e2e.test.ts`. Grade card/transcript read authoritative `examination/result.ts`.
- VTU import/reconciliation/versioning, registration windows/eligibility, timetable/rooms/seating,
  invigilation, marks lifecycle, strong-room custody state machine, Form-A freeze/correction — backend present
  (per prior passes) and covered by the existing examination suite.

## APPROVED CROSS-MODULE CHANGE: Examination remuneration → Finance receiver

Finance / Accounts remains **FROZEN**; this is **not** a Finance reopen. Only the minimum governed receiver
was added, following the existing `preview → post → reverse` posting pattern (mirrors `payrollPosting`) and
keeping the authority split intact:

- **Examination owns** (COE, `exam.finance`): duty, beneficiary, quantity, rate, server-computed amount,
  COE approval — `examination/remuneration.ts`, table `exam_remuneration_items` (unique per duty).
- **Finance owns** (ACCOUNTANT, `finance.payroll.post` / `finance.refund.approve`): the payable posting,
  status, reversal, readback — `finance/examRemunerationPosting.ts`, tables
  `finance_exam_remuneration_postings` (+ lines), reusing `finance_gl_accounts`.
- **Amount is server-authoritative**: Finance reads the approved obligation, never a client-supplied amount (§6).
- **Idempotent** on the obligation (unique `remuneration_item_id`): same approved remuneration posted once,
  twice, or concurrently → exactly ONE posting (§7). Distinct duties stay distinct (§8). COE cannot post/reverse (§10).
- **Tests** (`finance/examRemuneration.e2e.test.ts`, 10/10): valid handoff, duplicate replay, concurrent replay,
  distinct duties, duplicate-duty rejection, invalid beneficiary, unapproved source, unauthorized actor,
  cross-tenant denial, governed reversal (history retained). **Full Finance suite 21/21 — Finance stays green.**

## Remaining blockers (NOT FROZEN)

- **Operational UI** for the closed backend (registration workspace + bulk, exceptions, strong-room packets,
  Form-A editor, MPC workspace, answer-book movement/reconciliation, script custody, valuation, result
  correction, revaluation, grade card/transcript views, document verification, remuneration, reports).
  Current web surface is ~8 COE page components; the operational workspaces are not built.
- **Validated PDF/XLSX report library** (§39–41).
- **Full validation matrix** (§44–61) not run: authenticated VTU / Autonomous / Student E2E lifecycles,
  RBAC/IDOR/tenant sweep on the new resources, responsive QA (8 breakpoints) + screenshot inspection,
  performance p50/p95, complete backend regression (~1,342 tests), Alumni C1–C8, Finance integration
  regression, and web TypeScript/ESLint/build.

## Functional Closure Matrix (current state)

| Workflow | Backend | Read | Write | UI | Security | Focused Tests | Auth QA | Status |
|---|---|---|---|---|---|---|---|---|
| VTU Import/Reconciliation | ✅ | ✅ | ✅ | partial | ✅ | ✅ | ❌ | Backend done; UI/auth QA pending |
| Registration (+bulk/exception) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Backend done; UI pending |
| Strong Room | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Backend done; UI pending |
| Form-A | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Backend done; UI pending |
| MPC (+evidence/result link) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Backend done; UI pending |
| Answer Books | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Backend done; UI pending |
| Script Custody | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Backend done; UI pending |
| Valuation (question-wise) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Backend done; UI pending |
| Result Correction (versioned) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Backend done; UI pending |
| Autonomous Revaluation | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Backend done; UI pending |
| Grade Card / Transcript | ✅ | ✅ | ✅ | partial | ✅ | ✅ | ❌ | Engine done (certificates) |
| Document Verification | ✅ | ✅ | ✅ | partial | ✅ | ✅ | ❌ | Engine done (certificates) |
| Remuneration → Finance | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Backend + receiver done (approved); UI pending |
| Reports (PDF/XLSX) | partial | — | — | ❌ | — | ❌ | ❌ | Pending |

## FINAL DECISION: EXAMINATION / COE PORTAL — NOT FROZEN
