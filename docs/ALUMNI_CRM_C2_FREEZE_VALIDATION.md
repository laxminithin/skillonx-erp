# Alumni Relationship CRM & Interaction Timeline (Phase C2) — Freeze Validation

Audit / implementation date: 2026-09-18

## Decision

**FROZEN** for C2 Alumni Relationship CRM & Interaction Timeline (subject to known limitations below).

C3 scoring/intelligence, C4 campaign orchestration, C5 matching, C6 recognition, C7 executive impact, and C8 AI were **not** started.

---

## 1. Repository audit (C2.0)

| Area | Finding |
| --- | --- |
| Alumni module | C1 frozen: 360 aggregate, provenance, freshness, willingness, suggestions, identity merge. Tables from `20261003100000` + `20261006100000`. |
| Events | `alumni_events` + `alumni_event_registrations` — authoritative attendance |
| Mentoring | `mentor_assignments` / `mentor_meetings` (+ advisory extensions) — student-spine mentoring |
| T&P | `placement_offers`, drives, applications — campus placement SoT |
| Job-board opportunities | Existing `alumni_opportunities` = alumni-submitted jobs/internships (**NOT** CRM opportunities) |
| Contributions | `alumni_contributions` intent + optional `fee_receipts` FK |
| Engagement log | `alumni_engagement` lightweight activity markers |
| Notifications / mail | `employee_notifications`; `mail/mailer.ts` SMTP/outbox abstraction — **not** alumni CRM delivery tracking |
| WhatsApp / SMS / telephony | **NOT IMPLEMENTED** as integrations |
| Appointments | No general alumni appointment module found |
| Audit | `alumni_audit_log` retained for CRM actions |
| Web | Alumni 360 pages + CRM workspace at `/alumni-admin/crm` |
| Mobile | **NOT IMPLEMENTED** |

## 2. Source-of-truth matrix

| Record | Authoritative source | C2 behaviour |
| --- | --- | --- |
| Event attendance | `alumni_event_registrations` | Timeline projection only |
| Mentoring session / assignment | Mentoring engine (`mentor_*`) | Timeline projection via `student_id` |
| Placement / recruitment | T&P `placement_offers` | Timeline projection |
| Financial contribution (receipt) | Finance `fee_receipts` | Projected when linked; intent remains Alumni |
| Contribution intent | `alumni_contributions` | Projected |
| Recognition / award | `alumni_achievements` | Projected |
| Job-board posting | `alumni_opportunities` | Projected (distinct from CRM opp) |
| Lightweight engagement marker | `alumni_engagement` | Projected |
| Contact field change | `alumni_contact_history` | Projected (admin timeline) |
| CRM contact attempt / call / email / WhatsApp log | **C2** `alumni_crm_interactions` | Authoritative for manual/integrated CRM logs |
| Follow-up task | **C2** `alumni_crm_followups` | Authoritative |
| Relationship opportunity | **C2** `alumni_crm_opportunities` | Authoritative (not job board) |
| Verified institutional outcome | **C2** `alumni_crm_outcomes` | Authoritative after verification |
| CRM notes | **C2** `alumni_crm_notes` | Authoritative; INTERNAL never alumni-visible |
| Relationship stage / owner | **C2** `alumni_relationships` + histories | Authoritative workflow state |

## 3. Schema / migration

Migration: `apps/api/migrations/20261007100000_alumni_relationship_crm.cjs` (**batch 69**)

New tables: `alumni_relationships`, `alumni_relationship_stage_history`, `alumni_relationship_ownership_history`, `alumni_crm_collaborators`, `alumni_crm_interactions`, `alumni_crm_followups`, `alumni_crm_opportunities`, `alumni_crm_outcomes`, `alumni_crm_notes`, `alumni_crm_config`.

## 4. Relationship lifecycle

Stages: IDENTIFIED → REACHABLE → CONTACTED → RESPONDED → ENGAGED → OPPORTUNITY_IDENTIFIED → ACTION_IN_PROGRESS → OUTCOME_ACHIEVED → REPEAT_ENGAGEMENT.

- Deterministic rule codes + explicit authorised transitions
- Stage history stored
- **No silent downgrade** (focused test PASS)

## 5–6. Interaction timeline & source projections

Unified chronological timeline merges MANUAL / INTEGRATED CRM rows with SYSTEM_PROJECTED adapters. Each item exposes `source_type`, `source_reference`, `timestamp`, `interaction_type`, `summary`, `visibility`, `evidence`, optional `drillPath`.

## 7. Follow-up engine

Statuses OPEN / IN_PROGRESS / COMPLETED / CANCELLED / OVERDUE with My / Department / Due Today / Overdue workspace views; RBAC department scope for HOD/FACULTY.

## 8. Relationship ownership

Primary owner + collaborators + ownership history; auto-claim on first interaction if unowned; controlled reassignment privilege.

## 9–10. Opportunity & outcome workflows

CRM opportunities separate from job-board `alumni_opportunities`. Outcomes require evidence/quantity/description (intention rejected with 400). Verification privilege advances stage to OUTCOME_ACHIEVED.

## 11–13. Alumni 360 / CRM workspace / self-service

- Admin 360 extended with CRM sections (status, timeline, follow-ups, opportunities, outcomes, next actions, duplicate-contact warnings)
- Workspace at `/alumni-admin/crm` with operational views + baseline metrics
- Alumni self 360 shows only alumni-appropriate engagement; **never** internal notes

## 14. Privacy / security (evidence)

Focused C2 tests cover: internal note isolation from alumni self CRM/360, department-scoped faculty 403, cross-college 404, accountant CRM 403, contact non-leak in workspace JSON, outcome verification privilege, ownership reassignment, no silent stage downgrade.

## 15. Focused C2 tests

`alumniCrm.e2e.test.ts` — **6/6 PASS**

## 16. C1 Alumni 360 regression

`alumni360.e2e.test.ts` — **10/10 PASS**

## 17. Legacy Alumni regression

`alumni.e2e.test.ts` — **8/8 PASS**

Combined alumni suite (`npm run test:alumni-crm`): **24/24 PASS**

## 18. Full backend regression

`npm test` (apps/api) — **1265/1265 PASS**, 0 fail (duration ~40 min)

## 19. Responsive QA

`apps/web/e2e/alumni-crm.responsive.spec.ts` — **8/8 PASS** (1920×1080 + 390×844):

- Alumni admin shell
- CRM workspace
- Alumni 360 admin with CRM sections
- Accountant denied CRM workspace API

Mobile alumni app: **N/A — NOT IMPLEMENTED** (no fabricated mobile validation).

## 20. Performance

`npm run perf:alumni-crm` — local p50/p95 samples (ms):

| Endpoint / path | p50 | p95 | max |
| --- | --- | --- | --- |
| Alumni 360 with CRM sections | 127.74 | 256.02 | 256.02 |
| Timeline | 11.54 | 17.76 | 17.76 |
| CRM workspace | 34.93 | 86.5 | 86.5 |
| Follow-up list | 33.51 | 45.94 | 45.94 |
| Opportunity list | 32.34 | 41.84 | 41.84 |

Local samples only — not production SLOs.

## 21. Known limitations

| Item | Status |
| --- | --- |
| WhatsApp / email / SMS / telephony delivery or read receipts | **NOT INTEGRATED** — manual logging only (`capture_mode=MANUAL`) |
| External platform sync | **NOT IMPLEMENTED** |
| AI next-best-action / scoring | **Intentionally excluded (C3+)** |
| Campaign orchestration | **Excluded (C4)** |
| Alumni mobile | **NOT IMPLEMENTED** |
| Finance receipt operational wire | Schema-ready; same C1 limitation |
| Calendar event FK population | **NOT IMPLEMENTED** (pre-existing) |

## 22. Final decision

**FROZEN** — C2 institutional relationship CRM established around Alumni 360 without duplicating authoritative Event / Mentoring / T&P / Finance records; manual interaction logging, follow-ups, ownership, stage engine, CRM opportunities, verified outcomes, notes privacy, workspace, self-service filtering, focused + C1 + legacy + full backend regression, responsive QA, and performance baselines all evidenced.
