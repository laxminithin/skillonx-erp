# Alumni Segmentation, Capability & Opportunity Intelligence (Phase C3) — Freeze Validation

Audit / implementation date: 2026-09-18

## Decision

**FROZEN** for C3 Alumni Segmentation, Capability & Opportunity Intelligence (subject to known limitations below).

C4 campaign orchestration, C5 matching, C6 recognition, C7 executive impact, and C8 AI were **not** started.

---

## 1. Repository audit (C3.0)

| Area | Finding |
| --- | --- |
| C1 Alumni 360 | Frozen: willingness columns, `alumni_interest_capabilities`, employment career timeline, freshness, provenance, completeness, projections |
| C2 CRM | Frozen: relationships, interactions, follow-ups, CRM opportunities, verified outcomes, ownership, stage lifecycle |
| Legacy Alumni | Profiles, employment, events, job-board `alumni_opportunities` (distinct from CRM), contributions |
| Scoring / AI / campaigns | **Not present** before C3; C3 adds explainable derived intelligence only |
| WhatsApp / email / SMS / social | **NOT INTEGRATED** |
| Web | Alumni 360 + CRM workspace + new `/alumni-admin/intelligence` |
| Mobile | **NOT IMPLEMENTED** |

## 2. Source-of-truth matrix

| Intelligence aspect | Authoritative source | C3 behaviour |
| --- | --- | --- |
| Explicit willingness | C1 `alumni_profiles.open_to_*` | DERIVED read — never inferred from title |
| Declared capability | C1 `alumni_interest_capabilities` | DERIVED |
| Career evidence (role/seniority/industry/org) | C1 `alumni_employment` | DERIVED (with freshness warnings) |
| Entrepreneurship | C1 `alumni_entrepreneurship` | DERIVED |
| Higher studies / research quals | C1 `alumni_higher_studies` + research expertise | DERIVED |
| Mentoring history | Mentoring engine (+ CRM outcomes) | DERIVED projection |
| Recruitment / internship outcomes | C2 `alumni_crm_outcomes` (+ T&P projected elsewhere) | DERIVED |
| Active / completed opportunities | C2 `alumni_crm_opportunities` | DERIVED |
| Relationship stage / contact / owner | C2 `alumni_relationships` | DERIVED |
| Recent decline / no-response | C2 `alumni_crm_interactions` | DERIVED |
| Open follow-ups | C2 `alumni_crm_followups` | DERIVED |
| Freshness / provenance / completeness | C1 engines | DERIVED |
| Finance contributions | Finance / alumni contributions | **Not used as wealth / donor score** |
| Saved segment RULES | **C3** `alumni_intelligence_segments` | STORED (rules only — never alumni lists) |
| Intelligence thresholds | **C3** `alumni_intelligence_config` | STORED |

Prefer derived intelligence. C3 does **not** copy career, placement, mentoring, Finance, or CRM rows.

## 3. Schema / migrations

Migration: `apps/api/migrations/20261008100000_alumni_intelligence_c3.cjs` (**batch 70**)

- `alumni_intelligence_config` — recent contact / reactivation / heavy engagement thresholds
- `alumni_intelligence_segments` — name, description, `rule_definition` JSON, owner, scope, institutional flag

## 4–5. Intelligence dimensions & signal model

Fifteen independent dimensions: MENTORSHIP, RECRUITMENT, INTERNSHIP, EXPERT_SESSION, PROJECT_MENTORING, INDUSTRY_PROJECT, RESEARCH_COLLABORATION, BOS_ADVISORY, CURRICULUM_SUPPORT, STARTUP_SUPPORT, INDUSTRIAL_VISIT, MOU_COLLABORATION, INSTITUTIONAL_NETWORKING, CONTRIBUTION, OTHER.

Signals: EXPLICIT WILLINGNESS, DECLARED CAPABILITY, CAREER EVIDENCE, INSTITUTIONAL HISTORY (outcomes/opportunities/mentoring), RELATIONSHIP EVIDENCE, DATA QUALITY, NEGATIVE/CAUTION (decline, stale contact, active opp, recent contact, heavy load, no-response streak).

**Capability ≠ willingness.** Job title never invents willingness.

## 6–8. Evidence, willingness, relationship readiness

Separate categorical axes (no opaque score):

- Evidence: STRONG / MODERATE / LIMITED / INSUFFICIENT_DATA
- Willingness: WILLING / MAYBE / NOT_WILLING / NOT_ASKED / TEMPORARILY_UNAVAILABLE
- Readiness: READY_FOR_REVIEW / FOLLOW_UP_DUE / RECENTLY_CONTACTED / ACTIVE_ENGAGEMENT / NEEDS_REACTIVATION / DO_NOT_CONTACT

Capability×intent matrix cells: HIGH_EVIDENCE_WILLING, HIGH_EVIDENCE_NOT_ASKED, HIGH_EVIDENCE_NOT_WILLING, LIMITED_EVIDENCE_WILLING, INSUFFICIENT_DATA, OTHER.

## 9–11. Dynamic segments, builder, saved segments

Presets (evaluated dynamically): Potential Mentors/Recruiters, Internship Enablers, Experts, Project Mentors, Research Collaborators, BoS/Curriculum, Startup supporters, Industry Visit, Collaboration leads, Active Contributors, Repeat Engagers, Recently Reconnected, Dormant High-Capability, Needs Data Refresh.

Segment builder + saved segments store **rules only** (AND/OR filters). Evaluate via `POST /segments/:id/evaluate` and ad-hoc `POST /intelligence/evaluate`.

## 12–14. Explain-why, C2 awareness, data quality

Every dimension returns `why[]`, `sources[]` (C1/C2 references), and `cautions[]`. Relationship context (last contact, owner, open follow-up, active opps, declines) prevents blind targeting. Stale employment/contact surfaces as data-quality warnings via C1 freshness.

## 15–16. Alumni 360 + Intelligence workspace

- Admin 360 section **Intelligence** (not exposed on alumni self 360)
- Workspace: `/alumni-admin/intelligence` — Mentorship, Recruitment, Internships, Experts, Projects, Research, BoS, Startups, Industry Connect, Reactivation, Data Refresh
- No campaign initiation (C4)

## 17. Privacy / RBAC

- Department scope for HOD/FACULTY; cross-college isolation
- Accountant denied intelligence APIs
- Export RBAC + audit; contact fields only when permitted
- No religion/caste/ethnicity/politics/health/sexual orientation/wealth scoring
- Finance history not used as inferred wealth

## 18. Focused C3 tests

`alumniIntel.e2e.test.ts` — **6/6 PASS**

- Capability vs willingness separation + explain-why
- Relationship readiness (recent contact, active opp, decline)
- Stale data + dormant reactivation
- Saved segment rules + dynamic evaluate + export audit
- Department scope / tenant / self-360 privacy
- Workspace + matrix overview

## 19–21. Regressions

| Suite | Result |
| --- | --- |
| C3 focused | **6/6 PASS** |
| C2 CRM | **6/6 PASS** |
| C1 Alumni 360 | **10/10 PASS** |
| Legacy Alumni | **8/8 PASS** |
| Combined `test:alumni-intel` | **30/30 PASS** |
| Full backend `npm test` | **1271/1271 PASS**, 0 fail (~29.5 min) |

## 22. Responsive QA

`apps/web/e2e/alumni-intel.responsive.spec.ts` — **10/10 PASS** (1920×1080 + 390×844):

- Intelligence workspace
- Segment builder
- Alumni 360 intelligence section
- Explain-why view
- Accountant denied intelligence API

Alumni Mobile: **N/A — NOT IMPLEMENTED**

## 23. Performance

`npm run perf:alumni-intel` — local p50/p95 samples (ms):

| Path | p50 | p95 | max |
| --- | --- | --- | --- |
| Alumni 360 + intelligence | 55.24 | 94.42 | 94.42 |
| Single profile intelligence | 11.15 | 13.6 | 13.6 |
| Intelligence workspace | 913.08 | 1062.53 | 1062.53 |
| Single dimension query | 877.23 | 933.03 | 933.03 |
| Complex multi-filter segment | 870.93 | 1080.11 | 1080.11 |

Batch signal loading used for workspace/segments (no per-row subqueries for CRM entities). Local samples only — not production SLOs.

## 24. Known limitations

| Item | Status |
| --- | --- |
| AI enrichment / LinkedIn / social listening | **NOT IMPLEMENTED** |
| WhatsApp / email / SMS intelligence | **NOT INTEGRATED** |
| Automated outreach / campaigns | **Excluded (C4)** |
| Opaque scores / wealth / donor scoring | **Intentionally excluded** |
| Alumni mobile | **NOT IMPLEMENTED** |
| Mentoring count in batch workspace path | Skipped for perf (single-profile path still loads) |
| Candidate window for complex segments | Bounded (≤500) — truncated flag returned |

## 25. APIs delivered

- `GET /api/alumni-admin/intelligence`
- `GET /api/alumni-admin/intelligence/matrix`
- `GET /api/alumni-admin/intelligence/dimensions/:dimension`
- `GET /api/alumni-admin/profiles/:id/intelligence`
- `GET|POST|PATCH|DELETE /api/alumni-admin/segments`
- `POST /api/alumni-admin/segments/:id/evaluate`
- `POST /api/alumni-admin/intelligence/evaluate`
- `POST /api/alumni-admin/intelligence/export`

## 26. Final decision

**FROZEN** — C3 explainable intelligence layer established on C1+C2 without duplicating authoritative records; capability and willingness remain separate; stale evidence flagged; relationship context prevents blind targeting; no sensitive profiling or opaque wealth scoring; tenant/RBAC isolation passes; focused + C1 + C2 + legacy + full backend regression pass; responsive QA passes; performance baselines recorded.

**STOP AFTER C3.** Do not begin C4–C8.
