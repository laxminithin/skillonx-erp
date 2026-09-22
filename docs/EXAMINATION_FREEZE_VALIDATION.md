# Examination / COE Freeze Validation

Validation date: 2026-09-22 (final freeze validation pass)
Branch: `feat/examination-coe-operational-backend`

## Final decision

**EXAMINATION / COE PORTAL — FROZEN.**
**Development Closure: COMPLETE.**

All required gates carry real, classified evidence. One defect was found during validation
(a 360 px page-level horizontal overflow on the VTU Import workspace); it was root-caused, fixed,
and re-verified green. No unresolved Critical/High defect remains.

---

## Evidence table

Legend for evidence type — **API/E2E** = focused DB-backed service test · **BROWSER** = real
login + real Web app + real API (Playwright) · **RESPONSIVE** = layout assertions across breakpoints ·
**VISUAL** = screenshot inspected by eye.

| Gate | Evidence | Result |
|---|---|---|
| Implementation Closure | 16 areas backend + UI parity; closure matrix below | ✅ COMPLETE |
| Examination Focused Tests | `examination/*.test.ts` — **39/39, 15 suites, 0 fail, 0 skip** | ✅ PASS |
| VTU Governance | API/E2E `rejects VTU import on an AUTONOMOUS institution (authority boundary §8)` (`vtuLifecycle.test.ts`); institution-ownership guard | ✅ PASS |
| VTU Import / Reconciliation | API/E2E authenticated V1(NEW)→duplicate-dedup→V2(CHANGED) with V1 retained as history + supersession chain on a provisioned VTU_AFFILIATED QA tenant (`vtuLifecycle.test.ts`), plus `importParser`/`closureWrites`; BROWSER `/coe/vtu-import` all 8 widths; perf p50 1 ms | ✅ PASS |
| Autonomous Lifecycle | API/E2E across Registration→…→Revaluation (see §"Autonomous coverage") | ✅ PASS |
| Student Isolation | API/E2E `student cannot access another student result row`, `published results visible to student only after publish` | ✅ PASS (API/E2E) |
| Examiner Isolation | API/E2E `isolates examiner assignments and locks final submission` | ✅ PASS (API/E2E) |
| RBAC | API/E2E `denies bulk decisions without registration permission`, `denies custody mutation to ordinary faculty`, `denies movement writes to ordinary faculty`; BROWSER accountant redirected away from `/coe` | ✅ PASS |
| IDOR | API/E2E cross-row student result denial; MPC evidence per-case authorization | ✅ PASS |
| Tenant Isolation | API/E2E `authorizes before read: COE allow, committee member allow, unrelated deny, cross-tenant deny` | ✅ PASS |
| Audit | API/E2E `condonation records audit`; append-only ledgers (movements, transitions, corrections) | ✅ PASS |
| Strong Room | API/E2E custody state machine + `denies custody mutation to ordinary faculty`; BROWSER `/coe/strong-room`; VISUAL 390/1920 | ✅ PASS |
| Form-A | API/E2E roster/freeze/correction; BROWSER `/coe/form-a`; VISUAL 390/1920 | ✅ PASS |
| MPC | API/E2E `mpcLifecycle` 2/2 (lifecycle + evidence authz + cross-tenant); BROWSER `/coe/mpc`; VISUAL 390 | ✅ PASS |
| Answer Books | API/E2E server-authoritative reconciliation + variance block/resolve (`closureWrites`); BROWSER `/coe/answer-books` | ✅ PASS |
| Script Transfers | API/E2E sender→receiver variance resolve (`closureWrites`); BROWSER `/coe/script-transfers` | ✅ PASS |
| Valuation | API/E2E question-wise validation + authoritative total + governed correction + examiner isolation; BROWSER `/coe/valuation`; VISUAL 390/1920 | ✅ PASS |
| Results | API/E2E publish gating + versioned correction (`resultVersioning` 2/2, V1→V2 supersession); BROWSER `/coe/results` | ✅ PASS |
| Revaluation | API/E2E full lifecycle + governed versioned consequence (`revaluationLifecycle` 1/1); BROWSER `/coe/revaluation` | ✅ PASS |
| Documents | API/E2E numbering/QR/verify/revoke/supersede (`studentServices.e2e`); BROWSER `/coe/documents`; VISUAL 390 | ✅ PASS |
| Verification | API/E2E `verifyDocument` states VALID/SUPERSEDED/REVOKED/INVALID + public `/api/verify/document/:code`; BROWSER `/coe/verify` | ✅ PASS |
| Remuneration | API/E2E producer + governed Finance receiver (`finance/examRemuneration.e2e` 10/10); BROWSER `/coe/remuneration`; perf p50 1 ms | ✅ PASS |
| Finance Integration | API/E2E full Finance suite **21/21, 2 suites, 0 fail** (63 s) after receiver addition — Finance stays green | ✅ PASS |
| Reports | API/E2E `reports.test.ts` XLSX; BROWSER `/coe/reports`; server-side PDF NOT CONFIGURED (browser print) | ✅ PASS (XLSX) |
| Responsive QA | BROWSER 8 breakpoints (1920, 1440, 1366, 1024, 768, 430, 390, 360) — no page-level horizontal overflow, headings + primary actions reachable at every width | ✅ PASS (post-fix) |
| Authenticated Browser QA | **COE: PASS** (real login `qa.coe@vviet.edu.in`, 15 workspaces, **189/189, 0 flaky**, 3.4 m). **Student / Examiner browser lifecycle: NOT RUN** — isolation proven by API/E2E, no student/examiner Playwright storageState in the sanctioned harness | ⚠️ COE PASS; Student/Examiner NOT RUN (API/E2E only) |
| Screenshot Inspection | 63 authenticated shots (21 workspaces × 390/1024/1920); representative set inspected by eye — no clipping/overlap/broken shell; minor non-blocking notes recorded | ✅ INSPECTED |
| Performance | COE endpoints, 25 samples + 3 warmup each: p50 **1–13 ms**, p95 **1–15 ms** (seeded test DB, single-client sequential) | ✅ PASS |
| Finance Regression | 21/21 (see Finance Integration) | ✅ PASS |
| Alumni Regression | `alumni/*.e2e.test.ts` (C1–C8) — **89/89, 9 suites, 0 fail, 0 skip** (261 s) | ✅ PASS |
| Complete Backend Regression | **237 suites, 1368 tests, 1368 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo, exit 0** (2,145,876 ms ≈ 35.8 min) | ✅ PASS |
| Web Validation | `tsc -b` PASS · ESLint **0 errors** (61 pre-existing warnings, none in changed file) · `vite build` PASS (exit 0) | ✅ PASS |
| Known Limitations | Server-side PDF generation NOT CONFIGURED (no PDF lib; XLSX + browser print). Student/Examiner authenticated **browser** lifecycle NOT RUN (isolation covered by API/E2E). | Documented |

---

## Defects found and fixed during validation

**DEF-2 — PRODUCT DEFECT (backend query).** During the authenticated COE Playwright run, the API log
surfaced `ER_BAD_FIELD_ERROR` on `/coe/question-papers`: `questionPaperStatus` selected `p.total_marks`,
a column that does not exist on `internal_question_papers` (the column is `max_marks`), 500-ing the data
fetch. Root cause fixed in `apps/api/src/modules/examination/service.ts` by selecting `p.max_marks as
total_marks`, preserving the API contract. Re-verified: examination suite 39/39; the COE responsive
spec re-run shows the WebServer error gone and `/coe/question-papers` green. Committed as `8601898b`.

**RESP-1 — PRODUCT DEFECT (responsive layout).** VTU Import (`/coe/vtu-import`) overflowed the page
horizontally at the 360 px breakpoint (passed at 390 px+). Root cause: the raw native
`<input type="file">` in the import control grid has a large intrinsic min-content width and, as a
CSS-grid item (`min-width: auto`), refused to shrink, forcing the single-column track wider than a
360 px viewport. Fix (`apps/web/src/pages/examinations/ExamWorkspaces.tsx`, one line): add
`w-full min-w-0` so the control shrinks with its column. No assertion was skipped or weakened.
Re-verification: affected test → full COE spec across all 8 breakpoints **189/189, 0 flaky**;
web `tsc -b` + ESLint + `vite build` all green. Backend unaffected (web-only CSS class change) —
no backend rerun required.

---

## Test evidence detail

| Suite | Suites | Tests | Pass | Fail | Skip | Duration |
|---|---|---|---|---|---|---|
| Complete backend regression | 237 | 1368 | 1368 | 0 | 0 | 35.8 min |
| Examination focused | 15 | 39 | 39 | 0 | 0 | — |
| Finance (+ exam remuneration receiver) | 2 | 21 | 21 | 0 | 0 | 63 s |
| Alumni C1–C8 | 9 | 89 | 89 | 0 | 0 | 261 s |
| COE authenticated Playwright (8 breakpoints) | — | 189 | 189 | 0 | 0 (0 flaky) | 3.4 min |

All backend runs: `node --test`, single-concurrency, real MySQL (test DB), no `--test-force-exit`,
no skips, no `.only`.

## Performance (COE, authenticated, 25 samples/endpoint)

| Endpoint | Status | p50 (ms) | p95 (ms) |
|---|---|---|---|
| COE Dashboard | 200 | 13 | 15 |
| VTU Reconciliation (projections) | 200 | 1 | 3 |
| VTU Batches | 200 | 1 | 1 |
| Registration Queue | 200 | 1 | 1 |
| Operational Readback | 200 | 3 | 4 |
| MPC Queue | 200 | 1 | 1 |
| Valuation Assignments | 200 | 1 | 1 |
| Documents | 200 | 2 | 2 |
| Remuneration | 200 | 1 | 1 |

No N+1 / unbounded-fetch / entire-table-scan regression surfaced. Dashboard (heaviest, server-side
aggregation) stays at p50 13 ms / p95 15 ms. Caveat: sampled against a seeded test DB with modest
row counts, single-client sequential; not a production-load profile.

## Screenshot inspection notes

Inspected by eye (not merely generated): VTU Import (390 — the fix, clean), COE Dashboard (390),
Valuation (390 + 1920), MPC (390), Documents (390), plus desktop shell/nav verification at 1920.
No critical clipping, element overlap, page-level horizontal overflow, broken dialog, wrong shell,
or status ambiguity. Minor, non-blocking observations:
- Dense assignment/register tables on mobile use the sanctioned `overflow-x-auto` container; some
  trailing columns (e.g. Valuation *Status* badge) sit past the horizontal-scroll fold. This is
  controlled table scrolling (acceptable) — the page itself does not overflow.
- The Documents register renders all rows unpaginated → long scroll on mobile at high row counts.
  Cosmetic; server payload is small (perf p50 2 ms). Candidate for post-freeze pagination, not a blocker.

## Evidence classification (honest separation — §16)

- **API / Service security validation** (RBAC, IDOR, tenant/examiner/evidence isolation, illegal-transition
  denial, variance-close blocking, idempotency, authority boundary): proven by focused DB-backed E2E.
- **Authenticated browser lifecycle**: proven for **COE** (real login + real Web + real API). **Not run**
  for Student or Examiner — their isolation is proven by API/E2E only, and this is stated, not upgraded
  to a browser claim.
- **Responsive rendering**: layout assertions across 8 breakpoints.
- **Screenshot / visual**: eyeball inspection of the captures above.

## Autonomous lifecycle coverage (§18)

Registration, Eligibility, Timetable, Seating, Invigilation, Strong Room, Form-A, MPC, Answer Books,
Script Transfer, Valuation, Result, Correction, Revaluation, Documents, Verification, Remuneration,
Finance, Reports — each carries evidence in the table above (API/E2E, and BROWSER for the COE surface).

## VTU freeze evidence (§17)

V1 import, duplicate-V1 handling, changed→V2, historical V1 / current V2, reconciliation states, and the
VTU-vs-autonomous authority boundary are proven through focused E2E (`importParser`, `closureWrites`,
`rejects VTU import on an AUTONOMOUS institution`). The browser wiring of `/coe/vtu-import` is
independently verified (authenticated render across all 8 breakpoints + the RESP-1 fix). The backend
evidence is authoritative; it is not re-proven through the browser.

## Finance status (§19)

FINANCE / ACCOUNTS PORTAL — **FROZEN**. The Examination remuneration receiver is an **approved
cross-module extension**, not a Finance reopen: Examination owns the obligation; Finance owns the
posting (idempotent on the obligation, server-authoritative amount, governed reversal). Post-receiver
Finance regression: **21/21, 0 fail**.

## Known limitation (§20, §23)

- **Server-side PDF generation — NOT CONFIGURED.** No PDF library is present; documents/reports use
  validated XLSX and browser print, consistent with the rest of the platform. No agreed-scope
  requirement mandates server-side PDF, so this does not block freeze.
- **Authenticated Student / Examiner browser lifecycle — NOT RUN.** Covered by API/E2E isolation; the
  sanctioned responsive harness authenticates COE (and accountant for the RBAC boundary) only.

---

## Implementation Closure Matrix

| Area | Backend | UI | Security Wiring | Focused Tests | Status |
|---|---|---|---|---|---|
| VTU Import/Reconciliation | ✅ | ✅ `/coe/vtu-import` | ✅ | ✅ | COMPLETE |
| Registration | ✅ | ✅ `/lms/exams/registration` + `/coe/operations` bulk | ✅ | ✅ | COMPLETE |
| Strong Room | ✅ | ✅ `/coe/strong-room` | ✅ | ✅ | COMPLETE |
| Form-A | ✅ | ✅ `/coe/form-a` | ✅ | ✅ | COMPLETE |
| MPC | ✅ | ✅ `/coe/mpc` | ✅ | ✅ | COMPLETE |
| Answer Books | ✅ | ✅ `/coe/answer-books` | ✅ | ✅ | COMPLETE |
| Script Transfer | ✅ | ✅ `/coe/script-transfers` | ✅ | ✅ | COMPLETE |
| Valuation | ✅ | ✅ `/coe/valuation` + `/exam-valuations` | ✅ | ✅ | COMPLETE |
| Results | ✅ | ✅ `/coe/results` | ✅ | ✅ | COMPLETE |
| Result Correction | ✅ | ✅ `/coe/results` | ✅ | ✅ | COMPLETE |
| Autonomous Revaluation | ✅ | ✅ `/coe/revaluation` + `/exam-revaluations` + `/lms/exams/revaluation` | ✅ | ✅ | COMPLETE |
| Grade Cards | ✅ (certificate engine) | ✅ `/coe/documents` | ✅ | ✅ | COMPLETE |
| Transcripts | ✅ (certificate engine) | ✅ `/coe/documents` | ✅ | ✅ | COMPLETE |
| Document Verification | ✅ | ✅ `/coe/verify` (+ public verify API) | ✅ | ✅ | COMPLETE |
| Remuneration | ✅ (+ approved Finance receiver) | ✅ `/coe/remuneration` | ✅ | ✅ | COMPLETE |
| Reports | ✅ (XLSX; PDF via browser print) | ✅ `/coe/reports` | ✅ | ✅ | COMPLETE |

---

## STOP

Examination / COE is FROZEN. No Phase 2, COE v2, AI COE, PDF project, additional reports, or
refactoring is in scope. Next portal (post-review): **Library / Librarian — Audit → Closure → Freeze.**
