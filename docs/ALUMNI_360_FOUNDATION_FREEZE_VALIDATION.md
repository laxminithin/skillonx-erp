# Alumni 360 Foundation (Phase C1) — Freeze Validation

Audit / implementation date: 2026-09-18

## Decision

**FROZEN** for C1 Alumni 360 foundation (subject to known limitations below).

C2 CRM, C3 scoring/intelligence, C4 campaigns were **not** implemented.

---

## 1. Repository audit (C1.0)

| Area | Finding |
| --- | --- |
| Schema | Single Knex/MySQL DB. 13 alumni tables from `20261003100000_alumni_management.cjs`. **No second alumni database.** |
| APIs | `/api/alumni-auth`, `/api/alumni`, `/api/alumni-admin` — Express REST only |
| Web | `apps/web/src/pages/alumni/AlumniPages.tsx` (+ new `Alumni360Pages.tsx`) |
| Mobile | **NOT IMPLEMENTED** (pre-existing; freeze docs already N/A) |
| Integrations | Student FK spine; Finance receipt FK unused; T&P/Mentoring/Calendar not live-read before C1 |

## 2. Source-of-truth matrix

| Domain | Authoritative source | Alumni 360 behaviour |
| --- | --- | --- |
| Identity / USN / dept / programme | `students` + masters | Link via `student_id`; historical snapshot on profile |
| Graduation / academic history | Academic / Exam (when present) | Snapshot fields; marked AUTHORITATIVE / ERP |
| Campus placements | T&P `placement_offers` | Read-projected into 360; not copied |
| Pre-grad experience | `student_experiences` | Read-projected |
| Post-grad employment | `alumni_employment` | Alumni-owned career timeline |
| Higher studies / entrepreneurship / achievements | Alumni tables | Alumni-owned |
| Finance contributions | `fee_receipts` | Intent in Alumni; receipt projected when linked |
| Mentoring history | `mentor_assignments` / meetings | Counted via `student_id` |
| Alumni events | `alumni_event_registrations` | Own attendance plane |
| Willingness / capabilities | New Alumni columns/tables | Explicit only — never inferred |
| Provenance / freshness / suggestions / merge | New C1 tables | New storage (no prior SoT) |

## 3. Schema changes

Migration: `apps/api/migrations/20261006100000_alumni_360_foundation.cjs`

- Altered `alumni_profiles` (willingness, comm prefs, privacy layers, expertise JSON, completeness cache, freshness anchors)
- Altered `alumni_employment` (functional_area, seniority, provenance columns)
- Altered `alumni_higher_studies` (provenance columns)
- New: `alumni_field_provenance`, `alumni_freshness_config`, `alumni_interest_capabilities`, `alumni_profile_suggestions`, `alumni_identity_candidates`, `alumni_merge_audit`, `alumni_contact_history`

## 4. Migration / backfill

- Migration applied successfully (batch 68).
- Backfill CLI: `npm run backfill:alumni-360` → `src/scripts/backfillAlumni360.ts`
- Seeds ERP provenance for academic fields; migrates legacy mentorship flag → `open_to_mentoring` when set; detects ambiguous name+year candidates (**never auto-merges**).

Sample backfill (local DB, includes prior test fixtures):

| Metric | Value |
| --- | --- |
| Total alumni | 109 |
| Academic linkage | 91.7% |
| Career information | 12.8% |
| Contact coverage | 100% |
| Verified profiles | 89.9% |
| Profiles requiring update | 100% (section-based — many missing engagement prefs) |
| Duplicates detected (name+year candidates) | 80 |
| Unresolved identity candidates | 353 |

## 5. Domains delivered

Identity, Academic (projected), Career timeline, Higher education, Skills/expertise, Achievements, Interests/willingness, Institutional relationship summary, Completeness, Freshness, Provenance, Privacy extensions.

## 6–8. Provenance / freshness / verification

- Provenance model: `source_type`, `source_reference`, timestamps, `verification_status`, `verified_by`, `confidence`, `evidence_reference`
- Statuses: AUTHORITATIVE | SELF_DECLARED | INSTITUTION_VERIFIED | EXTERNALLY_VERIFIED | INFERRED | UNVERIFIED | STALE
- Inferred never `displayAsFact`
- Freshness domains: EMPLOYMENT, CONTACT, WILLINGNESS, SKILLS, ACADEMIC (non-expiring)
- States: VERIFIED_RECENTLY | NEEDS_CONFIRMATION | STALE | UNVERIFIED
- Employment verification + staff suggestion accept/reject workflows

## 9–11. Identity / privacy / self-service

- Candidate detection + controlled merge with audit; ambiguous requires `confirmAmbiguous`
- Privacy layers: institutional / directory / connection / communication / optional professional
- Directory respects `directory_visible`; private email/phone stripped for network viewers
- Self endpoints: willingness, capabilities, expertise, privacy, contact confirm, employment 360

## 12–13. Views & APIs

- Admin: `GET /api/alumni-admin/profiles/:id/360` + web `/alumni-admin/profiles/:id/360`
- Self: `GET /api/alumni/360` + web `/alumni/360`
- Scoped: provenance, suggestions, identity detect/merge, employment verify, backfill

## 14. Security / RBAC evidence (focused tests)

`alumni360.e2e.test.ts` — **10/10 PASS**:

- Aggregation without fabricated counters
- Faculty department scope 403
- Authoritative USN mass-assignment protection
- Suggestion pending → accept with provenance (no silent overwrite)
- Ambiguous merge blocked without confirmation
- Directory privacy + `directory_visible`
- Completeness / freshness
- Backfill stats
- Cross-college 404
- Merge privilege 403 for FACULTY

## 15–16. Focused + broad regression

- Alumni 360 focused: **PASS (10/10)**
- Legacy `alumni.e2e.test.ts`: **PASS (8/8)** after directory query specificity fix
- Full backend suite: **NOT TESTED** in this session (narrow alumni focus)

## 17–18. Web / Mobile QA

- Web responsive QA: **NOT TESTED** (Playwright suite not executed this session)
- Mobile regression: **N/A — Alumni mobile not implemented**

## 19. Performance

CLI: `npm run perf:alumni-360` — local p50/p95 samples (ms):

| Endpoint | p50 | p95 | max |
| --- | --- | --- | --- |
| GET Alumni 360 | 60.08 | 87.14 | 111.8 |
| Directory | 4.55 | 6.13 | 8.2 |
| Career history | 1.18 | 1.94 | 2.53 |

## 20. Known limitations

| Item | Status |
| --- | --- |
| WhatsApp / email tracking / social enrichment / external verification | **NOT IMPLEMENTED** |
| Finance contribution → receipt handoff | Schema-ready; operational wire **NOT CONFIGURED** |
| Calendar event FK population | **NOT IMPLEMENTED** |
| Alumni-as-mentor assignment engine | Preference/capability only — full CRM is C2 |
| Wealth / financial capacity scoring | **Intentionally excluded** |
| Mobile alumni app | **NOT IMPLEMENTED** |
| SUPER_ADMIN cross-tenant college switcher | Uses JWT collegeId (pre-existing) |

## 21. Final decision

**FROZEN** — C1 Alumni 360 foundation established on existing Alumni module without a second database, with provenance, freshness, career timeline, willingness, relationship projection, completeness, staff suggestions, identity resolution, privacy extensions, aggregate APIs, admin/self views, focused security tests, and backfill tooling.
