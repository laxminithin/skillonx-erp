# Shared Workflow / Approval Engine (P0.3) — Freeze Validation

Date: 2026-09-23. Scope: Campus OS Phase 0, P0.3 only. See `docs/CAMPUS_OS_PHASE0_PREIMPLEMENTATION_AUDIT.md`.

## Decision

**FROZEN**

## What was built

A deliberately small institutional approval engine — `apps/api/src/modules/workflowEngine` — for **future** consumers only (Security/Gate, Scholarship enhancement; neither built in this phase). **None of the 25+ existing module-local approval/status implementations (Procurement indents/POs, Grievance case engine, Lab requirement chain, Admissions stages, Office register lifecycle, etc.) were touched, retrofitted, or migrated onto this engine.**

- Migration `20261019110000_campus_os_workflow_engine.cjs`: `workflow_definitions` (versioned, per-college, per-entity-type), `workflow_steps` (ordered, each carrying its own `allowed_roles` JSON — data-driven step-level authorization), `workflow_transitions` (the concrete `(from_step, action) -> to_step` graph), `workflow_instances` (bound to `entity_type`/`entity_id`, tracks `current_step_id`/`status`), `workflow_instance_history` (append-only).
- `service.ts`: `createDefinition` (validates exactly one initial step, unique step keys, transitions reference real steps; auto-versions on repeat `code`), `publishDefinition`, `startInstance` (only against an active/published definition), `performAction` (the core engine — locks the instance row `FOR UPDATE`, checks the instance is still `IN_PROGRESS`, checks the actor's role against the **current step's** `allowed_roles`, resolves the transition for `(current_step, action)`, moves to the next step or a terminal status, writes history).
- Deliberately **not** built: a conditional/expression engine, cross-college shared definitions, a second concurrency mechanism — the brief explicitly warns against building "Camunda," and the existing repo convention (pessimistic row locks) was reused rather than inventing an optimistic-versioning scheme.
- `access.ts`: `workflow.definition.manage` (admin-tier only — defining workflows is configuration), `workflow.instance.start`/`view`/`act` (broader, but **real** authorization for who can act on any given instance comes from the step's own `allowed_roles`, checked in `service.ts` — a two-layer model, same pattern as Procurement's `assertDepartmentScope` layered on `assertProcurementPermission`).
- `controller.ts`: mounted at `/api/workflow`.

## Freeze criteria

- [x] Definition/versioning works — repeat `code` auto-increments version; exactly-one-initial-step validated.
- [x] Instance lifecycle works — cannot start against an unpublished definition; starts at the initial step.
- [x] Transitions work — authorized role + valid `(step, action)` pair progresses the instance; `RETURN` demonstrated moving an instance backward without leaving `IN_PROGRESS`.
- [x] Authorization works — role not in the current step's `allowed_roles` is rejected (403); admin-tier bypasses per repo convention.
- [x] History works — every transition recorded with actor, role-at-action, remarks, from/to step.
- [x] Stale/double transition protection works — proven under real concurrency (`Promise.allSettled`) at both a mid-flow step and the final terminal step; exactly one of two simultaneous identical actions succeeds in each case.
- [x] Tests pass — see below.
- [x] No frozen module was retrofitted — confirmed; zero existing files outside this new module were changed for P0.3.

## Tests

`node --import tsx --test --test-concurrency=1 src/modules/workflowEngine/workflowEngine.e2e.test.ts`

Result: **9/9 PASS**:
1. definitions version automatically; exactly-one-initial-step enforced; RBAC denial on definition creation
2. instance cannot start against an unpublished definition; starts at initial step once published
3. authorized transitions reach a terminal `APPROVED` state, full history recorded
4. unauthorized role denied at a step
5. invalid action for current step rejected
6. `RETURN` moves an instance backward, stays `IN_PROGRESS`
7. terminal-state protection — no action accepted after a terminal state is reached
8. double-approval / stale-state transition blocked under real concurrency at two different points in the flow
9. tenant isolation across definitions, instances, and actions

## Migrations

`20261019110000_campus_os_workflow_engine.cjs` — 5 new tables, zero existing tables touched. Applied via `npm run migrate`; `down()` provided.

## Frozen-module impact

None. No existing module calls into this engine yet — it exists for future consumers only, exactly as scoped.

## Remaining issues

None blocking within Phase-0 scope. This engine has no real consumer yet; when Security/Gate or Scholarship (both out of scope here) are eventually built, they will define their own `workflow_definitions` rows — no engine code changes should be required.
