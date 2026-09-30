# Campus OS Phase 10 — Pre-Implementation Audit

**Scope:** Scholarships, Financial Aid & Student Benefits
**Branch:** `feat/examination-coe-operational-backend`
**Date:** 2026-09-25

## 0. Starting baseline

Per `docs/CAMPUS_OS_PHASE9_FREEZE_VALIDATION.md`, the claimed Phase 9 baseline is:

```
250 suites / 1,480 tests / 1,480 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED / 0 TODO
```

Independent re-verification via a fresh `npm test` run in `apps/api` (full
single-concurrency run, ~46 min, exit code 0) **confirms this baseline exactly**:

```
tests 1480 / suites 250 / pass 1480 / fail 0 / cancelled 0 / skipped 0 / todo 0
```

This is the verified Phase 10 starting point.

Recent commits on this branch (`8601898b`, `996bb2aa`, `0d97f6db`, and others) are
Examination/COE work postdating the Phase 9 freeze commit referenced by the freeze
doc — this is expected: the branch has continued forward after Phase 9 froze, and
those commits are additive to the frozen module, not a reopening of it. Phase 10
work in this document is scoped only to Finance/scholarship code, independent of
that Examination work.

## 1. Repository-wide audit method

A read-only Explore agent searched the full monorepo (`apps/api/src/modules/**`,
`apps/web/src/**`, `apps/api/migrations/**`, `docs/**`) for the business concepts
listed in the Phase 10 directive: scholarship, financial aid, fee concession,
waiver, discount, government scheme codes, sanction, disbursement, bank details,
government identifiers, Document/Workflow engine contracts, RBAC patterns,
Examination/Attendance read sources, and prior architecture/roadmap scoping.
Findings below are evidence-backed with exact file paths, table names, and
function names; nothing here is inferred without a citation.

## 2. Findings by capability

| # | Capability | Evidence | Classification |
|---|---|---|---|
| 1 | Scholarship/financial aid concept | `apps/api/src/modules/finance/scholarships.ts` (386 lines), `finance/controller.ts:205-298,413-417`, `finance/types.ts:118-143`, migration `20260904100000_finance_module.cjs` (`scholarship_schemes`, `student_scholarships`, `student_fee_concessions`, `student_refunds`) | EXISTING BUT PARTIAL |
| 2a | Fee concession/waiver (Finance) | `scholarships.ts:177` `createConcession()`, `:221` `applyConcessionToDemand()`, `:248` `listConcessions()`; demand-item columns `discount_amount`/`scholarship_amount`/`adjustment_amount`/`net_amount`/`outstanding_amount` | EXISTING BUT PARTIAL (single-step approve-only, no eligibility) |
| 2b | Fee concession/waiver (Admissions) | No matches in `apps/api/src/modules/admissions/**` non-test files | MISSING |
| 3 | Finance non-payment credit/adjustment mechanism | `applyScholarshipToDemands()` (`scholarships.ts:86`) → `recalculateDemandTotals()` (`finance/demands.ts:59`) — single source of truth for `net_amount`/`outstanding_amount`/`status`; policy-gated via `financePolicy.scholarshipTreatment === 'REDUCE_DEMAND'` | SHARED FOUNDATION AVAILABLE |
| 4a | Student master identity/academic fields | `students` table (`20260812100000_init_schema.cjs:37`) + extensions (`20260831120000_academic_classes.cjs:15-28`, `20260926100000_admissions_management.cjs:13-26`, `20261026100000_...:18-21`): `usn`, `admission_number`, `program_id`, `department_id`, `academic_year_id`, `semester_id`, `class_section_id`, `date_of_birth`, `is_active` | EXISTING BUT PARTIAL (no lifecycle `status` enum, only `is_active` boolean) |
| 4b | Student bank details / government ID | No `bank_account`/`bank_ifsc`/`account_number` columns anywhere on student tables; only Aadhaar-type hit is `id_type` enum on the unrelated Security/Gate visitor table (`20261023100000_campus_os_phase4_security_gate.cjs:39`) | MISSING |
| 5 | Admissions-stage concession/scholarship | No matches | MISSING |
| 6 | Document Engine (P0.4) | `apps/api/src/modules/documentEngine/` — generic `entityType`/`entityId` polymorphic association; routes: list/upload/get/download/version/archive; `MAX_DOCUMENT_BYTES=8MB`, `ALLOWED_MIME_TYPES`, statuses `ACTIVE/SUPERSEDED/ARCHIVED` | SHARED FOUNDATION AVAILABLE |
| 7 | Workflow Engine (P0.3) | `apps/api/src/modules/workflowEngine/` — definitions (create/publish), instances (`startInstance`/`performAction`), actions `SUBMIT/APPROVE/REJECT/RETURN/CANCEL`, instance statuses `IN_PROGRESS/APPROVED/REJECTED/CANCELLED`, keyed by `entityType`/`entityId` | SHARED FOUNDATION AVAILABLE |
| 8 | Notifications | No unified engine (roadmap gap #8, fragmented per-domain); shared primitive `notifyStudent()` in `academicClasses/studentNotifications.ts:25` with `dedupe_key`; Finance already wraps it: `finance/notifications.ts` (`notifyScholarshipSanctioned`, `notifyRefundProcessed`, etc.) | EXISTING BUT PARTIAL (reusable primitive) |
| 9 | RBAC pattern | Per-module `access.ts` (e.g. `finance/access.ts`, 92 lines): `Record<Role, Permission[]>` + `assert*Permission` + `assert*College` tenant guard. `ACCOUNTANT` already has `finance.scholarship.manage`, `finance.concession.approve`, `finance.refund.approve`. `PRINCIPAL/HOD/MANAGEMENT/COLLEGE_ADMIN` read-only | EXISTING & SUFFICIENT (pattern to extend, not replace) |
| 10 | Examination CGPA/merit read source | `examination/result.ts:478` `studentAcademicRecord(studentId, collegeId)` computes CGPA via `grading.ts` `computeCgpa`; `:433` `studentResults()`; read-only, over already-published results | EXISTING & SUFFICIENT |
| 11 | Attendance read source | `attendance/service.ts:624` `studentAttendanceSummary(studentId, classId?)`; `attendance/policy.ts:26` `computeAttendancePercentage()` | EXISTING & SUFFICIENT |
| 12 | studentServices generic request engine (Phase 9, frozen) | `studentServices/requestEngine.ts` — generic `student_service_request_types` catalog + `student_service_requests` + `student_service_request_actions` + module-local `student_service_documents` (predates Document Engine); designed for flat-form, stateless requests (certificates, corrections) | EXISTING BUT PARTIAL / poor fit for full reuse — no concept of financial linkage, multi-criteria eligibility, or academic-year disbursement tracking |
| 13 | Web admin workspace pattern | `apps/web/src/pages/finance/StaffFinancePages.tsx:399` `FinanceScholarshipsPage` already live; flat top-level routes per domain in `App.tsx`; `AccountantLayout.tsx` already has scholarship nav | EXISTING & SUFFICIENT (pattern to extend) |
| 14 | Web student portal | `apps/web/src/pages/finance/StudentFinancePages.tsx:383` `StudentScholarshipsPage`, route `/lms/fees/scholarships`, `GET /api/student/finance/scholarships` — **read-only list, no apply flow**. Phase 9's `StudentServicesPages.tsx` pattern (home/list/detail/new-request) is the closest UX analogue to copy | EXISTING BUT PARTIAL |
| 15 | Prior architecture/roadmap scoping | `SKILLONX_CAMPUS_OS_ARCHITECTURE.md:26,96,156,179`; `SKILLONX_IMPLEMENTATION_ROADMAP.md:22,42,77,106,120,132`; `SKILLONX_PORTAL_AND_ENGINE_MATRIX.md:49` — full row already exists: *"Scholarship / Financial Aid | PARTIAL (staff-entered scheme registry only) | ... | Extend Finance; do not spin out a new portal"*, graded **C**, priority **P2**, dependencies (Workflow + Document engines) already satisfied | EXISTING & SUFFICIENT (already scoped) |

## 3. Explicit answers (directive section 8)

1. **Does Scholarship functionality already exist?** Yes, partially — scheme registry, staff-assigned scholarships, concessions, refunds (`finance/scholarships.ts`). No student application intake.
2. **Does Finance already support concessions?** Yes — `createConcession`/`applyConcessionToDemand`, single-step accountant-approved.
3. **Does Finance already support fee waivers?** Yes, via the same concession mechanism (percentage or fixed amount against `student_fee_demand_items`).
4. **Does Finance support credits/adjustments?** Yes — `scholarship_amount`/`adjustment_amount`/`discount_amount` are first-class demand-item columns, unified through `recalculateDemandTotals`.
5. **Does Admissions already support admission concessions?** No.
6. **Is there a scholarship scheme master?** Yes — `scholarship_schemes` table + CRUD in `scholarships.ts`.
7. **Is there a scholarship application workflow?** No — schemes/scholarships are staff-entered only; no student-submitted application, no multi-step approval chain.
8. **Is eligibility represented?** No — no eligibility rules, criteria, or versioning exist anywhere in the scholarship tables/code.
9. **Are supporting documents represented?** No — no linkage from scholarship tables to the Document Engine.
10. **Is verification represented?** No.
11. **Is approval represented?** Partially — concession/scholarship creation requires a permission (`finance.concession.approve`, `finance.scholarship.manage`) but is a single insert-and-done action, not a tracked decision/verification/approval lifecycle.
12. **Is sanction represented?** Partially — `sanctionScholarship()` exists as a function name but is effectively the same single-step "create and apply" action, not a distinct post-approval sanction stage.
13. **Is renewal represented?** No.
14. **Is benefit/disbursement tracking represented?** No — `REDUCE_DEMAND` (fee reduction) is implemented; no `DIRECT_PAYMENT`/stipend/DBT disbursement tracking.
15. **Is government reimbursement represented?** No.
16. **Are student bank details stored anywhere?** No.
17. **Are category/income certificates stored?** No dedicated fields; would need Document Engine linkage.
18. **Does Document Engine support required evidence?** Yes, structurally (generic `entityType`/`entityId`), but nothing in scholarship code calls it yet.
19. **Can Workflow Engine be reused?** Yes — `entityType`/`entityId`-keyed instances with `SUBMIT/APPROVE/REJECT/RETURN/CANCEL` actions map directly onto an application lifecycle.
20. **Can Finance accept an idempotent scholarship/concession handoff?** Yes — `applyScholarshipToDemands` → `recalculateDemandTotals` is already idempotent-safe (recomputes totals from source columns rather than incrementing), and is the correct call site for a Phase 10 "sanction approved → apply to demand" handoff.
21. **Does Student Portal expose scholarships?** Yes, read-only list only (`StudentScholarshipsPage`).
22. **Is there an administrative scholarship workspace?** Yes, minimal (`FinanceScholarshipsPage` inside the existing Accountant Finance workspace).
23. **What external portals/integrations exist?** None. No SSP/NSP/DBT integration exists or is configured.
24. **What exact gaps are proven?**
    - Student-submitted scholarship application (currently staff-only entry)
    - Structured, versioned eligibility policy (currently none)
    - Document/evidence linkage to the Document Engine (currently none)
    - Verification stage with reviewer/timestamp/remarks (currently none)
    - Multi-step approval via Workflow Engine (currently a single permission-gated insert)
    - Distinct sanction stage separate from application decision (currently conflated)
    - Application lifecycle state machine with terminal-state protection (currently only scholarship-record CRUD, no state machine)
    - Renewal flow (currently none)
    - Admin queue for reviewing/verifying/approving applications (currently only a scheme/scholarship list-and-create page)
    - Student apply/track UI (currently only a read-only list)

## 4. Architecture decision

**OPTION B — Minimal extension of existing Finance/Student capabilities.**

Evidence: a scheme master, concession/scholarship-record tables, and an
idempotent demand-adjustment primitive (`applyScholarshipToDemands` →
`recalculateDemandTotals`) already exist inside Finance and are proven
sufficient as the financial-effect layer. The Workflow Engine and Document
Engine are both frozen, general-purpose, and explicitly pre-scoped in the
architecture/roadmap docs as Phase-10's intended dependencies. The only
genuine gaps are a thin application/eligibility/verification/approval layer
sitting on top of what exists — not a new financial engine, not a new
document store, not a new portal. This matches the roadmap's own
prior conclusion verbatim: *"Extend Finance; do not spin out a new portal."*

No new Scholarship domain service is required at the scale of Option A; this
is additive work inside `apps/api/src/modules/finance/` (new files:
`scholarshipApplications.ts`, `eligibility.ts`) plus new tables, reusing
Workflow Engine, Document Engine, `notifyStudent`, and the existing
`finance/access.ts` RBAC pattern.

## 5. Source-of-truth boundary (carried into implementation)

| Concern | Authority |
|---|---|
| Student identity, USN, programme/dept/batch/semester | `students` table (unchanged) |
| Academic performance (CGPA) | Examination (`studentAcademicRecord`), read-only |
| Attendance | Attendance (`studentAttendanceSummary`), read-only |
| Scholarship scheme, eligibility policy, application, evidence, verification, approval, sanction | New Phase 10 tables inside `finance/` |
| Fee demand, fee concession financial effect, payment, refund, ledger | Finance (`student_fee_demands`, `recalculateDemandTotals`) — **unchanged authority** |
| External government scheme status | Manual/self-reported field only — `NOT_CONFIGURED` for any live integration |
| Documents | Document Engine (P0.4), reused unchanged |
| Workflow | Workflow Engine (P0.3), reused unchanged |
| Notifications | `notifyStudent()`, reused unchanged |

No ambiguous financial ownership: Scholarship code will never write to
`student_payments`, `fee_receipts`, `student_refunds`, or ledger tables
directly — it only ever calls `applyScholarshipToDemands`/
`recalculateDemandTotals` inside `finance/`, in-process, same module.
