# Research, Grants, Consultancy, Innovation & IPR (Campus OS Phase 6) — Freeze Validation

Status: **FROZEN** (development closure). Date: 2026-09-25.

## Scope actually built

Per `docs/CAMPUS_OS_PHASE6_PREIMPLEMENTATION_AUDIT.md` Architecture Decision
(Option C — thin, minimal orchestration layer), Phase 6 implements only the
proven administrative gap:

- Funding agency master (`research_funding_agencies`)
- Proposal entity with real PI/Co-PI/Co-Investigator/Team-Member faculty links
  (`research_proposals`, `research_proposal_team`)
- Proposal → HOD review (department-scoped) → Research Coordinator review →
  award → project conversion lifecycle, built on the existing Workflow Engine
  (department-less proposals route straight to Coordinator review)
- Project entity (`research_projects`, `research_project_team`), one per
  awarded proposal, generated project code `RP-<collegeId>-<year>-NNNNN`
- Record-only utilization/expenditure tracking (`research_project_utilization_entries`)
  — explicitly documented as non-authoritative-for-accounting
- Append-only audit log (`research_audit_log`)

Explicitly NOT built (deferred, matching the audit's un-evidenced-demand
finding): consultancy revenue distribution, institutional IPR
disclosure→filed→granted lifecycle, student research participation entity,
Procurement/Asset funding-source hooks, a dedicated Research Web workspace.

## Authoritative ownership (unchanged)

- Faculty achievement/CV data (publications, patents-as-achievement,
  project-as-achievement, consultancy-as-achievement, conferences, FDP,
  awards, research guidance): **Faculty Academic Record** (`facultyProfile`)
  — untouched. `apps/api/src/modules/research/**` contains zero references
  to `faculty_records` or any `facultyProfile` table.
- Money/ledger: **Finance** remains the only real ledger. Phase 6's
  utilization entries are record-only and never write to any Finance table.
  Finance's own source (`apps/api/src/modules/finance/*.ts`) has zero diff
  from Phase 6 work; the only Finance file touched in the working tree
  (`finance.e2e.test.ts`) is an unrelated fixture-isolation fix for Library's
  fine-to-Finance handoff tests, not Phase 6.
- Procurement/Stores/Assets: untouched by Phase 6. (Separate, pre-existing
  uncommitted "Campus OS Phase 0/1/2" work adds a GRN→Asset handoff and a
  vendor-directory accessor to `procurement/service.ts`, but this predates
  and is unrelated to Phase 6 Research; see git-footprint section of
  `docs/CAMPUS_OS_PHASE6_FREEZE_VALIDATION.md`.)

## Workflow / self-approval

`research/access.ts:assertNotProposalTeamMember` hard-blocks a PI/Co-PI/
Co-Investigator/Team-Member from acting on the HOD or Coordinator review step
of a proposal they are listed on, even if their role would otherwise permit
it. Tested in `research.e2e.test.ts` ("prevents self-approval...").

## Concurrency

- `convertToProject`: row-locks the proposal (`forUpdate`), checks for an
  existing project first (idempotent short-circuit), and on a unique-key
  race on `research_projects.proposal_id` re-selects and returns the
  winner's row instead of erroring. Wrapped in `withDeadlockRetry` (5
  attempts) for the documented first-row-insert deadlock case on
  `research_code_sequences`.
- `closeProject`: row-locks the project; a second call on an
  already-`CLOSED` project returns the same state instead of erroring.
- Project code generation: locked sequence table (`research_code_sequences`,
  `forUpdate`), distinct codes per proposal confirmed under concurrent
  conversions in a dedicated test.

All three scenarios above are **TESTED** (not just code-reviewed) —
see `research.e2e.test.ts` tests 4–6 (concurrent code generation, idempotent
convert, idempotent close).

## RBAC / IDOR / tenant isolation

Tested in `research.e2e.test.ts`: cross-college access on both proposals and
projects returns 404 (not found) for reads and mutations; FACULTY is blocked
from review/award/close/funding-agency-management actions; HOD is
department-scoped (cannot review outside their own department).

## Evidence

See `docs/CAMPUS_OS_PHASE6_FREEZE_VALIDATION.md` for the full backend
regression, migration up/down/up, and TypeScript evidence.
