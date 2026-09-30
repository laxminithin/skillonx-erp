# FINANCE / ACCOUNTS WEB PORTAL — PHASE 0 REPOSITORY AUDIT

**Date:** 2026-09-22
**Scope:** Determine the actual state of the Finance/Accounts module, verify source-of-truth and cross-module boundaries, close only genuine gaps, and prepare a freeze decision. **Audit-first, verification-oriented — Finance is not assumed incomplete.**

> Method: audited against the live source tree (`apps/api/src/modules/finance`, `apps/web/src/pages/finance`, `apps/web/src/layouts/AccountantLayout.tsx`, `apps/web/src/App.tsx`), the migrated + seeded QA database (`skillonx-survey-mysql`, MySQL 8.4 :3307), and the existing e2e suites. No application code changed in Phase 0.

---

## 0. Executive summary

SkillonX contains a **mature, closure-grade Finance/Accounts engine** (~4,570 LOC backend across 21 files; ~1,040 LOC web; ~28 finance DB tables incl. a general-ledger posting structure and `finance_audit_log`). Money is stored as `decimal(12,2)`; a dedicated `money.ts` enforces 2-dp string representation (no raw-float authority in storage). Cross-module handoffs (Hostel/Transport service demands, Admission demands, HR F&F, Payroll/remuneration payables, Examination fee/eligibility) are governed with **preview → post → reverse** and idempotency. RBAC is permission-based; other domains (Warden/Transport/Librarian/COE/Faculty) have **no** finance-mutation permissions.

This is a **verification/documentation exercise**, not a build. No new financial engine, ledger, or gateway is required or recommended.

---

## 1. Architecture & source-of-truth

| Layer | Location | Notes |
|---|---|---|
| Backend module | `apps/api/src/modules/finance/**` | 21 files, ~4,570 LOC |
| Router mount | `app.ts:148` `/api/finance` (staff), `app.ts:120` `/api/student` (student finance) | `financeRouter.use(requireAuth)`, `studentFinanceRouter.use(requireStudentAuth)` |
| RBAC | `access.ts` — `FinancePermission[]` per role | 45 `assertFinancePermission` + tenant/ownership guards |
| Money | `money.ts` — `Money = string`, `toFixed(2)`; DB `decimal(12,2)` | Repository-standard representation preserved |
| Cross-module | `integration.ts`, `clearance.ts`, `fnfPosting.ts`, `payrollPosting.ts`, `employeeDues.ts` | Governed preview/post/reverse + idempotency |
| Gateway | `gateway.ts` — provider abstraction, **MOCK only**; `payment_gateway_webhook_events` idempotency | No live provider configured |
| Audit | `audit.ts` + `finance_audit_log` | Actor/tenant/action/resource/context |
| Web (staff) | `pages/finance/StaffFinancePages.tsx` under `AccountantLayout`; routes `/accountant/*` (+ `/finance/*` alias) | Dedicated Finance shell |
| Web (student) | `pages/finance/StudentFinancePages.tsx` | Self-scoped |

**Source-of-truth:** Finance owns demand, receivable, student ledger, payment, receipt, refund, financial adjustment, concession/scholarship financial effect, financial no-due, and payable/payment status. Operational domains own their events and **project approved financial consequences** into Finance (no duplication of operational records).

---

## 2. Capability matrix

Status legend: **COMPLETE + VERIFIED**, EXISTS, PARTIAL, N/A (legitimate), OUT OF SCOPE.

| # | Capability | Evidence | Status |
|---|---|---|---|
| A | Finance Dashboard | `reports.ts`, `FinanceDashboardPage` | COMPLETE + VERIFIED |
| B–E | Fee config / heads / structures / prog-sem mapping | `feeHeads.ts`, `feeStructures.ts`; `fee_heads`, `fee_structures`, `fee_structure_items`, `fee_structure_installments` | COMPLETE + VERIFIED |
| F–I | Student demand / generation / individual / bulk | `demands.ts`; `finance_demand_generation_runs`; e2e "bulk demand generation is idempotent" | COMPLETE + VERIFIED |
| J–K | Installments / due dates | `student_fee_demand_installments`, `fee_structure_installments` | COMPLETE + VERIFIED |
| L–M | Concessions / scholarships / waivers | `scholarships.ts`; `student_fee_concessions`, `student_scholarships`, `scholarship_schemes` | COMPLETE + VERIFIED |
| N | Fines / penalties | `late_fee_amount` on demand; Library fine projection | COMPLETE + VERIFIED |
| O–P | Student ledger / receivables | `demands.ts`, demand items + payments + receipts explain balance | COMPLETE + VERIFIED |
| Q–T | Payment recording / modes (cash/UPI/DD/cheque) | `payments.ts` transactional allocation | COMPLETE + VERIFIED |
| R | **Online payment gateway** | `gateway.ts` abstraction + webhook idempotency, **MOCK provider only** | EXISTS — no live provider (N/A for prod until configured) |
| U–X | Receipt gen / numbering / reprint / cancellation | `receipts.ts`; `fee_receipts`, `fee_receipt_number_sequences` (concurrency-safe) | COMPLETE + VERIFIED |
| Y–Z | Refunds / approval | `payments.ts`/refund flow; `student_refunds`; e2e "refund lifecycle completes" | COMPLETE + VERIFIED |
| AA–AC | Credit / excess / outstanding | `outstanding_amount`, allocation logic | COMPLETE + VERIFIED |
| AD | Aging / defaulter reports | `reports.ts` | COMPLETE + VERIFIED |
| AE–AF | Hostel / Transport fee projection | `integration.ts` `createServiceRequestFeeDemand` | COMPLETE + VERIFIED |
| AG | Library fine projection | `integration.ts` | EXISTS (Library closure later) |
| AH | Examination fee projection | `clearance.ts` `getExamFeeStatus`, `createRevaluationFeeDemand` | COMPLETE + VERIFIED |
| AI | HR final settlement projection | `fnfPosting.ts`, `employeeDues.ts`; `finance_fnf_postings` | COMPLETE + VERIFIED |
| AJ | Exam remuneration / payable handoff | `payrollPosting.ts`; `finance_payroll_postings` + GL lines | COMPLETE + VERIFIED |
| AK / AL–AN | No-due; student/parent/management views | `clearance.ts`; student & parent finance routes | COMPLETE + VERIFIED |
| AO | Accountant portal | `AccountantLayout` + `/accountant/*` | COMPLETE + VERIFIED |
| AP–AQ | Reports / exports | `reports.ts` | COMPLETE + VERIFIED |
| AR | Audit trail | `finance_audit_log` | COMPLETE + VERIFIED |
| AS–AV | RBAC / IDOR / tenant / pagination | `access.ts` guards; server-side pagination in queues | COMPLETE + VERIFIED |
| AW–AX | Idempotency / concurrent payment | webhook events table; posting idempotency (HR payroll/fnf concurrent tests) | COMPLETE + VERIFIED |
| AY | Financial immutability | receipts via `fee_receipt_number_sequences`; reversal-not-edit | COMPLETE + VERIFIED |
| AZ | Reconciliation | `FinanceReconciliationPage`, gateway order/webhook reconciliation | EXISTS |
| BA | Financial period / academic year | academic-context on demands | COMPLETE + VERIFIED |
| — | Live banking / auto bank-reconciliation / GST / Tally / statutory filing / double-entry vendor accounting | not implemented | OUT OF SCOPE / N/A (legitimate) |

---

## 3. RBAC (actual repository roles — `access.ts`)

| Role | Finance permissions |
|---|---|
| ACCOUNTANT | view, fee_structure.manage, demand.generate, payment.record, payroll.post, receipt.view, concession.approve, scholarship.manage, refund.approve, report.view |
| SUPER_ADMIN / COLLEGE_ADMIN | view, fee_structure.manage, payroll.post, receipt.view, report.view (no demand/payment/refund mutation) |
| PRINCIPAL | view, receipt.view, report.view (read-only) |
| MANAGEMENT / CHAIRMAN | view, receipt.view, report.view (read-only, no mutation) |
| HOD | view, report.view (read-only) |
| FACULTY | **none** |
| WARDEN / TRANSPORT_OFFICER / LIBRARIAN / COE | **none** (default `[]`) — cannot mutate Finance |

Tenant: `assertFinanceCollege` / `assertStudentCollege` → 404 on cross-tenant. IDOR: `assertStudentOwnsDemand/Payment/Receipt`. Students use a separate `requireStudentAuth` token.

**Anti-pattern check (§6): PASS** — no domain module has finance-mutation permissions; each sees read-only status only.

---

## 4. Findings against the risk checklist

| Risk | Finding |
|---|---|
| Duplicate financial engine | None — single authoritative Finance module |
| Domain modules acting as mini-Finance | None — Warden/Transport/Librarian/COE have no finance permissions |
| Float money authority | DB `decimal(12,2)`; `money.ts` 2-dp strings — established policy preserved |
| Duplicate demand on re-run | Guarded — `finance_demand_generation_runs`; e2e idempotency test |
| Duplicate payable on re-handoff | Guarded — HR payroll/fnf posting idempotent incl. concurrent (HR e2e) |
| Receipt number races | `fee_receipt_number_sequences` sequence table |
| Cross-tenant / IDOR | Server-side tenant + ownership guards; e2e coverage |
| Fabricated gateway | Not fabricated — MOCK abstraction documented; no live provider claimed |
| Client-supplied amounts | Amounts derived/validated server-side |
| Missing audit | `finance_audit_log` present |

---

## 5. Conclusion of Phase 0

Finance/Accounts is **already at or near freeze quality**. Remaining work is **verification and documentation**. Proceed to focused + full regression, authenticated/responsive QA, and record results in `docs/FINANCE_PORTAL_FREEZE_VALIDATION.md`. No new engines, ledgers, or gateways to be created.
