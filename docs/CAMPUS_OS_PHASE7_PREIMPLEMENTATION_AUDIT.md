# Campus OS Phase 7 — IQAC, Accreditation, Compliance & Institutional Quality
## Pre-Implementation Audit

Date: 2026-09-25. Branch: `feat/examination-coe-operational-backend`.

## Verified starting baseline

Read directly from `docs/CAMPUS_OS_PHASE6_FREEZE_VALIDATION.md` and
`docs/RESEARCH_GRANTS_INNOVATION_FREEZE_VALIDATION.md`:

> Full backend regression (`npm test` in `apps/api`, single-concurrency):
> **248 suites / 1,460 tests / 1,460 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED
> / 0 TODO**, exit code 0, ~44.4 min. Migration up→down→up PASS. TypeScript
> PASS.

This matches the prompt's claimed baseline exactly (248 / 1,460 / 1,460 /
0 / 0 / 0). No discrepancy found — baseline confirmed by repository
evidence, not just trusted from the prompt.

## Full-repo audit by business concept (28 questions)

| # | Question | Status | Evidence |
|---|---|---|---|
| 1 | IQAC domain exists? | PARTIAL | `IQAC_COORDINATOR` role exists (`apps/api/src/utils/permissions.ts:41`, `apps/api/src/types/domain.ts:56`), referenced in UI copy (`CopoReviewPage.tsx:83`, `FacultyProfilePage.tsx:217`). No IQAC module, tables, or workflow. |
| 2 | Accreditation domain exists? | PARTIAL | `apps/api/src/modules/alumni/impactService.ts` + `typesImpact.ts` implement a generic, institution-configured framework/criterion registry (`alumni_impact_accred_frameworks`, `alumni_impact_accred_criteria`) — explicitly "zero fabrication: no hard-coded NBA/NAAC criterion numbers." Scoped to alumni evidence only. |
| 3 | NBA functionality exists? | PARTIAL | No module named NBA. Substance exists distributed: CO/PO/PSO mapping (`copo`), attainment (`attainment`), curriculum gap analysis (`gapAnalysis`). |
| 4 | NAAC functionality exists? | MISSING | No SSR/AQAR/IIQA/DVV/criterion/extended-profile/best-practice concept found beyond item 2's generic framework table and UI label mentions. |
| 5 | NIRF functionality exists? | MISSING | No NIRF references anywhere. |
| 6 | AISHE/statutory reporting exists? | MISSING | No AISHE/AICTE module. VTU exists only as exam-data exchange (`examination/closure.ts`, `VTU_AFFILIATED` flag) — not statutory compliance reporting. |
| 7 | CO/PO/PSO mapping exists? | EXISTS | `apps/api/src/modules/copo` — full engine (`mappingService.ts`, `combinedMatrix.ts`, `masters.ts`, `quality.ts`, `reconcile.ts`); web at `/copo/*`, `/admin/copo/*`. |
| 8 | CO attainment exists? | EXISTS | `apps/api/src/modules/attainment/calculate.ts` — direct (CIE+SEE) and indirect, policy-weighted. |
| 9 | PO/PSO attainment exists? | EXISTS | `attainment/types.ts:60` `CYCLE_KINDS = ['CO','PO','PSO']`; `bootstrap.ts`, `service.ts`, `workflow.ts`. |
| 10 | Direct/indirect attainment exists? | EXISTS | Same engine; `category: 'CIE'|'SEE'|'INDIRECT'|'OTHER'` (`attainment/types.ts:170`), indirect sourced from survey data. |
| 11 | Survey/Feedback exists? | EXISTS | `apps/api/src/modules/surveys`; `SURVEY_TYPES` includes COURSE_END, SEMESTER_END, SUBJECT_FEEDBACK, FACULTY_FEEDBACK, etc. (`types/domain.ts:1-11`); public capture route `/s/:code`. |
| 12 | Academic/internal audit exists? | MISSING (module); PATTERN EXISTS | `gapAnalysis` has status/coverage/action-type shape (`OPEN, ACTION_PLANNED, IN_PROGRESS, COMPLETED, CLOSED, NOT_APPLICABLE`) but scoped to curriculum gap analysis, not generic audit. |
| 13 | Continuous improvement/action-plan tracking exists? | PARTIAL | `gapAnalysis` action items (`ACTION_STATUSES`) and `attainment` "Improvement Cycle" (`ImprovementCyclePage.tsx`) are reusable patterns, each scoped narrowly — no generic cross-source action-plan engine. |
| 14 | Evidence management exists? | EXISTS (generic engine) | `apps/api/src/modules/documentEngine` (frozen) — `campus_documents`, generic `entity_type/entity_id` linkage, SHA-256 checksum, version-supersede chain, soft-delete, RBAC, mounted at `/api/documents`. No criterion/framework linkage built in. |
| 15 | Accreditation snapshot/versioning exists? | MISSING | No point-in-time SSR/AQAR-style submission freeze. Reusable pattern exists in `examination/closure.ts` (freeze + `*_snapshot` JSON columns). |
| 16 | Committee/minutes/ATR exists? | MISSING | No committee/meeting/minutes/agenda module or table anywhere. |
| 17 | Compliance/deadline tracking exists? | MISSING | No regulatory-deadline/compliance-calendar module. |
| 18 | Faculty accreditation evidence exists? | EXISTS | `apps/api/src/modules/facultyProfile` — explicitly "the institutional source for NBA / NAAC / IQAC" (`FacultyProfilePage.tsx:217`); structured, verification-tracked domains (qualifications, publications, patents, projects, FDP, awards, etc.). |
| 19 | Research accreditation evidence exists? | EXISTS | `apps/api/src/modules/research` (frozen Phase 6) — narrow grants-administration scope; publications/patents live in `facultyProfile`, not here. |
| 20 | Examination evidence exists? | EXISTS | `apps/api/src/modules/examination` — results/pass-rate data queryable, audited (`examination/audit.ts`), has its own freeze pattern. |
| 21 | T&P evidence exists? | PARTIAL | `apps/api/src/modules/placement` exists; raw data likely queryable, no accreditation-shaped aggregation confirmed. |
| 22 | Alumni evidence exists? | EXISTS | `apps/alumni` (frozen C1–C8) has an explicit accreditation-mapping sub-feature (`impactService.ts`, `AlumniImpactWorkspacePage.tsx` IQAC/ACCREDITATION tabs, `/api/alumni-admin/impact/accreditation/frameworks`). |
| 23 | Finance evidence exists? | PARTIAL | `finance` module exists (frozen); raw data queryable, no accreditation-shaped aggregate confirmed. |
| 24 | Library evidence exists? | PARTIAL | `library` module exists (frozen); same caveat as Finance. |
| 25 | IQAC Web workspace exists? | MISSING | No `/iqac` or `/accreditation` route in `apps/web/src/App.tsx`. `AdminMiscPages.tsx:460` contains an explicit placeholder comment ("Accreditation-specific templates can be added when data requirements are confirmed") — i.e. deliberately not implemented. |
| 26 | Exact gaps remaining | See "Gaps" below. |
| 27 | What Phase 7 should own | See "Architecture decision" below. |
| 28 | What must remain authoritative elsewhere | See "Authoritative ownership" below. |

## Gaps (nothing else in the repo covers these)

- No NAAC (SSR/AQAR/IIQA/DVV/criterion/EP/best-practice), no NIRF, no
  AISHE/AICTE statutory reporting.
- No general-purpose, cross-module accreditation framework/criterion
  registry (only the alumni-scoped one exists).
- No committee/meeting/minutes/agenda/ATR module.
- No compliance/regulatory-deadline calendar.
- No layer that maps cross-module evidence (attainment, copo, facultyProfile,
  research, surveys, examination, alumni, finance, library) to specific
  accreditation criteria.
- No snapshot/freeze pattern for a point-in-time accreditation submission.
- No generic academic/internal audit → finding → action-plan → closure
  workflow (only the narrower curriculum `gapAnalysis` exists).
- No IQAC web workspace.

## Architecture decision

**Option C — thin evidence/snapshot/orchestration layer over existing ERP**,
per the prompt's own preference for the smallest correct architecture
(§6) and the audit's finding that CO/PO/PSO, attainment, survey, faculty
record, research, and document-evidence engines already exist and are
authoritative.

Phase 7 will build only:

1. A generic **accreditation framework/criterion/metric registry**
   (Framework → Version → Cycle → Criterion → Key Indicator → Metric →
   Evidence), configuration-driven, `NOT_CONFIGURED` for any real NAAC/NBA/
   NIRF content (no regulatory content invented — see prompt §9).
2. **Evidence linkage** reusing `documentEngine` for files and adding
   typed references (`SYSTEM_DERIVED` / `SYSTEM_DOCUMENT` / `MANUAL_UPLOAD`
   / `EXTERNAL_REFERENCE`) into existing modules — no data copied.
3. **Metric engine** with explicit missing-data semantics
   (`ZERO`/`NO_DATA`/`NOT_APPLICABLE`/`NOT_CONFIGURED`/`SOURCE_ERROR`/
   `PENDING_VERIFICATION`) and system-derived vs. manual metrics.
4. **Accreditation cycle + snapshot/freeze** (DRAFT → DATA_COLLECTION →
   REVIEW → APPROVED → FROZEN), modeled on `examination/closure.ts`'s
   freeze pattern.
5. **Continuous improvement / action plan** engine, generalized so NBA gaps,
   NAAC observations, academic-audit findings, and survey feedback all feed
   one engine (per prompt §53 — not three separate task systems).
6. **Committee / meeting / minutes / ATR** — genuinely missing everywhere;
   built as one generic governed-committee capability, not one module per
   committee.
7. A single **IQAC & Accreditation** web workspace (role-scoped navigation,
   not separate NBA/NAAC/NIRF coordinator portals).

Explicitly NOT built in Phase 7 (per audit finding "already exists,
authoritative elsewhere"):
- CO/PO/PSO mapping/attainment recalculation — `copo` + `attainment` remain
  authoritative; Phase 7 only reads/snapshots.
- Survey capture/aggregation — `surveys` remains authoritative.
- Faculty CV data — `facultyProfile` remains authoritative.
- Document storage — `documentEngine` remains authoritative; Phase 7 adds
  criterion linkage only.
- Alumni's existing accreditation-framework tables
  (`alumni_impact_accred_frameworks/criteria`) are left as-is (alumni-scoped,
  pre-existing, not reopened) — Phase 7's registry is a separate, general
  cross-module one; no migration of alumni's data is performed.

## Authoritative ownership (unchanged by Phase 7)

| Data | Authoritative module |
|---|---|
| Faculty identity/service | HR |
| Faculty academic achievements | `facultyProfile` |
| Research/grants | `research` (Phase 6, frozen) |
| Students | Student/Admissions |
| Examination/results | `examination` |
| CO/PO/PSO mapping & attainment | `copo`, `attainment` |
| Survey responses | `surveys` |
| Placements | `placement` (T&P) |
| Alumni | `alumni` |
| Finance | `finance` |
| Library | `library` |
| Documents/evidence files | `documentEngine` |

Phase 7 consumes, references, aggregates, and snapshots this data. It does
not become a parallel editable copy of any of it.

## Notable existing patterns Phase 7 will reuse (not reinvent)

- **Freeze/versioning**: `examination/closure.ts` (`freezeRegistration`,
  `freezeFormA`) + `*_snapshot` JSON columns (`examination/result.ts`).
- **Audit log**: per-module `audit.ts` (before/after state) — same shape
  reused for Phase 7's own audit trail.
- **Generic document/evidence storage**: `documentEngine`
  (`entity_type/entity_id`, checksum, version-supersede, soft-delete).
- **Framework/criterion registry shape**: `alumni/typesImpact.ts` +
  `impactService.ts` ("zero fabrication" pattern) — generalized, not copied.
- **Tenant isolation**: `college_id`-scoped queries throughout every module.
- **RBAC**: per-module `access.ts` + role constants in
  `apps/api/src/types/domain.ts` / `apps/api/src/utils/permissions.ts`
  (`IQAC_COORDINATOR` already defined there).

## Next step

Architecture decision above selected (Option C). Proceeding to scope
confirmation with the user before schema/migration design, since Phase 7's
size is materially decided by how much of items 1–7 above are built in this
pass vs. deferred (see chat).
