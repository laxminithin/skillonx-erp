# Campus OS Phase 12 — Pre-Implementation Audit

Date: 2026-09-26. Branch: `feat/examination-coe-operational-backend`.
Scope under audit: Innovation, Incubation, Startups, Entrepreneurship & IIC.

## 0. Headline finding

**The repository's own prior governance documents have already investigated
this exact domain and classified it as Class G — "Optional/institution-
dependent, build only on explicit demand," with an explicit "hold
indefinitely" recommendation.** This is not a new conclusion reached by this
audit; it is independently confirmed by two documents that predate this
audit:

- `docs/CAMPUS_DIGITISATION_GAP_AUDIT.md:159-160` (Section P, "Incubation /
  IIC / Startup / IPR — NOT_FOUND"): "`alumni_entrepreneurship` is alumni
  self-reported venture data ... not a research/incubation module. Patent/IPR
  exists only as faculty CV entries ... No IIC cell, hackathon tracking,
  idea/prototype pipeline, or commercialization workflow. Class G —
  Optional/institution-dependent."
- `docs/SKILLONX_IMPLEMENTATION_ROADMAP.md:55,66,137-138` — "Hold
  indefinitely, no current evidence of need" for Incubation/IIC/Startup/IPR
  (grouped with Research/Grants administration, which received the same
  verdict and which Phase 6 treated as a signal to keep that phase minimal).

Phase 6's own pre-implementation audit (`docs/CAMPUS_OS_PHASE6_PREIMPLEMENTATION_AUDIT.md:8-31`)
already applied this same evidence to itself and concluded: "the repository
itself has already proven there is no evidenced institutional demand for a
full [domain] administration domain." The same logic applies here, one phase
later, to the same Class-G verdict for Incubation/IIC/Startup/IPR
specifically.

## 1. Independently verified starting baseline

`docs/CAMPUS_OS_PHASE11_FREEZE_VALIDATION.md` (dated 2026-09-26, same branch)
records: **252 suites / 1,508 tests / 1,508 PASS / 0 FAIL / 0 CANCELLED /
0 SKIPPED**, exit 0. This document exists in the repo and its content matches
the baseline claimed for this phase. It has not been re-run from scratch in
this session; re-verifying it is only worthwhile once an implementation
decision is made (see §4).

## 2. Repository-wide audit by business concept

Findings below come from a direct repository search (`apps/api/src`,
`apps/web/src`, `apps/api/migrations`, `docs/`), not from memory.

| # | Concept | Status | Evidence |
|---|---|---|---|
| 1 | Idea / ideation / idea bank | NOT FOUND | No tables, routes, or entities. `INNOVATION` appears only as a free-text CV-tag enum value in `apps/api/src/modules/facultyProfile/types.ts` (~L212, ~L224), not a workflow. |
| 2 | Incubation / incubator / startup / entrepreneurship | PARTIAL (self-report only) | `alumni_entrepreneurship` table (self-reported venture data, `apps/api/src/modules/alumni/backfill360.ts`, `mutations360.ts`); `ENTREPRENEURSHIP`/`PATENT_IP` alumni recognition tags (`typesRecognition.ts`); `STARTUP_MENTORING` need-type explicitly commented `authoritative: 'none (no incubation module)'` in `alumni/typesMatching.ts`. No incubator/cohort/application entity anywhere. |
| 3 | IIC / Institution's Innovation Council / E-Cell / IEDC | NOT FOUND | Zero real hits repo-wide. |
| 4 | Prototype / MVP / POC | NOT FOUND (as pipeline) | `PROTOTYPE` exists only as a CO-PO attainment evidence-label (`apps/api/src/modules/attainment/libraries.ts`), unrelated to a startup pipeline. |
| 5 | Mentor / mentoring | FOUND, but different domain | `apps/api/src/modules/mentoring/` is a full, frozen student-advisory/pastoral mentoring module (`docs/MENTORING_STUDENT_ADVISORY_FREEZE_VALIDATION.md`) — faculty↔student, not business/startup mentoring. No startup-mentor-session entity exists. |
| 6 | Hackathon / pitch / demo day / accelerator | PARTIAL (tag only) | `HACKATHON` is a fixed enum value in 3 unrelated modules (content-beyond-syllabus activity tag, faculty CV professional-development tag, alumni volunteer-need tag). No hackathon/pitch/demo-day entity. `apps/api/src/modules/events/` is a generic, frozen venue/resource-booking engine (`docs/EVENTS_VENUE_RESOURCE_BOOKING_FREEZE_VALIDATION.md`) usable for logistics but carries no innovation-domain concepts itself. |
| 7 | Patent / IPR | PARTIAL (CV field only) | `facultyProfile/types.ts` `PATENT` domain (`PATENT/COPYRIGHT/DESIGN/TRADEMARK/OTHER`) is a faculty self-report CV field, not a filing/prosecution workflow. Confirmed by Phase 6 as explicitly deferred ("institutional IPR lifecycle DEFERRED"). |
| 8 | Research project / grant | FOUND (frozen, adjacent) | `apps/api/src/modules/research/` (Phase 6). `PROJECT_TYPES` already includes `SEED_GRANT`. Migration `20261024100000_campus_os_phase6_research.cjs`. Frozen per `docs/RESEARCH_GRANTS_INNOVATION_FREEZE_VALIDATION.md`. |
| 9 | Seed funding | PARTIAL (covered generically) | `SEED_GRANT` already exists as a `research_projects` project type — any seed-funding tracking should extend this, not create a parallel ledger/table. |
| 10 | Innovation/incubation migrations | NOT FOUND | `apps/api/migrations` has no innovation/incubation/startup-named migration. |
| 11 | Shared engines available for reuse | FOUND | Workflow Engine (`apps/api/src/modules/workflowEngine`, frozen), Document Engine (`apps/api/src/modules/documentEngine`, frozen), Events/Booking (`apps/api/src/modules/events`, frozen). **No centralized Notifications engine exists** — every module (placement, hostel, hr, library, finance, transport, maintenance, lab, admissions, academicLeadership, academicClasses) implements its own per-module notify file; this is a pre-existing repo-wide pattern, not a Phase 12 gap. |
| 12 | Roles/permissions | FOUND (no central registry) | Roles are defined per-module (`EXAM_COORDINATOR`, `NBA_COORDINATOR`, `IQAC`, `PLACEMENT_COORD`, `COMMITTEE_MEMBER_ROLES`, mentoring's `MENTOR`). No `INNOVATION_COORDINATOR`/`IIC_COORDINATOR`/`INCUBATION_MANAGER` role exists anywhere. |

## 3. Explicit answers to the audit questions (§6 of the request)

1. Innovation module present? **No.**
2. Incubation module present? **No.**
3. Startup tracking present? **No** (only alumni self-reported `alumni_entrepreneurship`, not authoritative tracking).
4. Idea submission present? **No.**
5. Does Research already represent innovation projects? **Partially** — `research_projects.SEED_GRANT` is the closest existing concept; Research is authoritative for anything that is genuinely a funded research/seed-grant project.
6. Does Faculty Academic Record represent patents/projects? **Yes, as CV self-report only** — no lifecycle workflow.
7. Does student-project functionality exist elsewhere? Academic student-project concepts exist only as attainment evidence tags (`attainment/libraries.ts`), not a promotable "project" entity.
8. Does Events cover hackathons/IIC activities? **Only as a generic venue/resource-booking engine** — no hackathon/IIC-specific concept; would need to be a generic `Event` + linkage, per the request's own §43-44 guidance.
9. Does Alumni support mentors? Only a boolean flag (`openToStartupMentoring`) and heuristic matching — not a real mentor-assignment entity.
10. Does T&P contain industry mentors? Not found in this audit; T&P/placement freeze docs don't use that naming convention in this repo.
11. Mentor management present anywhere? Yes, for student-advisory mentoring only (`mentoring` module) — architecturally reusable as a pattern, not as data.
12. Team membership represented? Not for innovation teams.
13. Prototype/MVP tracking present? No.
14. Milestone tracking present? No (not found as a generic or incubation-specific concept).
15. Incubation-stage tracking present? No.
16. Startup incorporation tracking present? No.
17. Startup outcome tracking present? No.
18. Seed funding represented? Yes, generically, inside Research (`SEED_GRANT` project type).
19. IPR/patent workflow represented? No — CV field only, explicitly deferred by Phase 6.
20. IIC activities represented? No.
21. Workflow Engine reusable? Yes, frozen and general-purpose (`SUBMIT/APPROVE/REJECT/RETURN/CANCEL`).
22. Document Engine reusable? Yes, frozen and general-purpose.
23. Notifications reusable? No centralized engine exists; would follow the existing per-module notify-file convention.
24. Can Events be linked instead of duplicated? Yes, via `event_id` linkage for any hackathon/demo-day logistics.
25. Can Research be linked instead of duplicated? Yes, via `research_project_id` linkage for anything that is genuinely a funded research/seed-grant project.
26. **Exact proven gaps:** Idea capture/lifecycle, Innovation team model, Incubation-stage tracking, Mentor *assignment* (business mentoring, distinct from student-advisory mentoring), Milestone tracking, Prototype/MVP outcome record, Startup record + conversion, IIC activity classification layer over Events. All of these are **entirely greenfield** — none has any existing partial implementation to extend.

## 4. Architecture decision

Given §0 and §3, two of the five options in the request are defensible:

- **Option A** (dedicated orchestration domain) is the correct shape *if* this
  is built, because every needed entity (Idea, Team, Incubation, Mentor
  Assignment, Milestone, Prototype, Startup) is genuinely greenfield — there
  is nothing partial to extend (Option B doesn't fit; Research is a
  neighbor, not a base to generalize).
- **Option D** (no substantial implementation required) is what the
  repository's own governance record recommends: this exact domain was
  independently flagged twice ("Class G — Optional/institution-dependent",
  "Hold indefinitely, no current evidence of need") before this session
  started, with the same reasoning Phase 6 itself used to justify keeping
  its own scope minimal.

**This audit does not pick between A and D.** Recommending Option A means
building a full new domain (migrations, ~7-9 new tables, RBAC, tenant
isolation, IDOR tests, concurrency tests, workflow/document/event
integrations, Web workspace, responsive/accessibility/performance QA, full
backend regression) — comparable in size to Phase 11. Recommending Option D
means writing that decision down and stopping here, consistent with the
repo's own prior guidance.

The choice depends on whether there is now actual institutional demand for
this domain that didn't exist when the roadmap said "hold indefinitely" —
that is a product decision, not something derivable from the code.
