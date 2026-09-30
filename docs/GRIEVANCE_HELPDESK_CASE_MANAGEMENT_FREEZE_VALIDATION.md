# Grievance, Helpdesk & Institutional Case Management (Campus OS Phase 8) — Freeze Validation

Status: **FROZEN — no new implementation** (audit-only closure). Date:
2026-09-25. Branch: `feat/examination-coe-operational-backend`.

## Decision

Per `docs/CAMPUS_OS_PHASE8_PREIMPLEMENTATION_AUDIT.md`, a complete,
general-purpose institutional case-management engine already exists,
frozen, and in production shape: `apps/api/src/modules/studentServices/
grievances.ts` on table `student_grievances` + 10 satellite tables
(`docs/GRIEVANCE_STUDENT_WELFARE_FREEZE_VALIDATION.md`, frozen
2026-09-14). It already implements every structural element the Phase 8
prompt describes:

```
Case → Category/Routing → Assignee/Queue → Communication → Escalation →
Resolution → Closure/Feedback
```

— including case numbering (locked sequence table), category-based
routing, department/role queues, assignment with history, a state machine
with terminal-state protection, SLA policy per category, manual
escalation, tiered confidentiality (NORMAL/CONFIDENTIAL/RESTRICTED) with
tested RBAC boundaries, appeal/reopen, post-closure feedback, and
safe polymorphic cross-domain references (no FK coupling) to exam,
hostel, maintenance, finance, and every other operational module named in
the prompt.

**Architecture Decision: Option D — no substantial implementation
required.** Building a second, parallel case engine would have directly
violated the prompt's own §3 ("ONE SHARED CASE ENGINE") and §100 hard
freeze gate ("duplicate grievance engines"). The user confirmed this scope
after reviewing the audit's findings (see conversation) — this pass adds
**zero new code, zero new migrations, zero new modules**.

## Real gaps found, explicitly deferred (not proven institutional demand)

1. **SLA-breach auto-escalation.** `escalateGrievance(...,isAutomatic)`
   accepts and stores the flag, but nothing in the codebase triggers it —
   escalation is manual-only today. `DEFERRED` — no scheduler was added.
2. **Non-student case originators.** Faculty and Alumni cannot raise a
   case; Parents can raise a leave-style *request* (`requestEngine.ts`)
   but not a grievance. `DEFERRED`.
3. **Unifying Helpdesk web workspace.** Maintenance tickets and Student
   Services grievances remain two separate portals by existing design/
   boundary (Maintenance freeze doc: "Maintenance roles do not receive raw
   grievance narrative"). `DEFERRED`.
4. **True anonymous reporting.** Explicitly deferred by the prior freeze
   pending real identity separation (Survey's `IDENTITY_MODES` is the
   proven, unused-here pattern). `DEFERRED` (unchanged from prior freeze).
5. **HR disciplinary case workflow / Finance dispute case workflow.**
   Neither exists as a dedicated workflow; a grievance can already
   reference Finance/HR-adjacent concerns via the existing safe-reference
   pattern without a raw-narrative leak. `NOT_CONFIGURED` — no evidence of
   a distinct institutional requirement beyond what grievance categories
   already cover.

None of these were implemented. Per prompt §101, `DEFERRED`/
`NOT_CONFIGURED` is an accurate, non-fabricated status, not a shortfall —
the user explicitly chose this scope over closing any of them.

## Authoritative ownership (confirmed unchanged)

| Workflow | Owner |
|---|---|
| Exam revaluation/grievance | `examination/revaluation.ts` |
| Hostel leave/outpass, complaints | `hostel` module |
| HR leave | `hr/leave.ts` |
| Maintenance work orders | `maintenance/tickets.ts` |
| Finance refunds/receipts | `finance` module |
| Student grievances/welfare (the canonical case engine) | `studentServices/grievances.ts` |

Phase 8 changed none of these. No frozen module was touched.

## Evidence

- **Pre-implementation audit**: `docs/CAMPUS_OS_PHASE8_PREIMPLEMENTATION_AUDIT.md`
  — independently confirmed the Phase 7 baseline (249 suites / 1,473 tests
  / 1,473 PASS) against `docs/CAMPUS_OS_PHASE7_FREEZE_VALIDATION.md`
  before concluding no implementation was warranted.
- **Code changes**: none. `git status --porcelain docs/` shows only this
  document and the pre-implementation audit as new files; no `apps/api`
  or `apps/web` source file was modified or added.
- **Full backend regression**: not re-run. Because zero backend code was
  touched in this pass, the previously-verified Phase 7 regression result
  (`docs/CAMPUS_OS_PHASE7_FREEZE_VALIDATION.md`: 249 suites / 1,473 tests
  / 1,473 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED, exit 0) remains the
  current, valid, unaffected baseline. Re-running an unchanged ~45-minute
  suite to reproduce an identical result was judged wasted effort given
  the user's explicitly chosen minimal-footprint scope; this is a
  disclosed decision, not an omitted gate.
- **TypeScript / migrations / Web build**: not applicable — no source
  files changed.

## Commit / Push / PR

Commit: NO. Push: NO. PR: NO.
