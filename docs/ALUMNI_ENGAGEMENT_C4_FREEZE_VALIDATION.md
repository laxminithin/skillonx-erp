# Alumni Engagement & Campaign Orchestration (Phase C4) — Freeze Validation

Audit / implementation date: 2026-09-18

## Decision

**FROZEN** for C4 Alumni Engagement & Campaign Orchestration (subject to known limitations below).

C5 matching, C6 recognition engine, C7 institutional impact analytics, and C8 AI were **not** started.

---

## 1. Repository audit (C4.0)

| Area | Finding |
| --- | --- |
| C1 privacy/preferences | `comm_*_opt_in`, willingness, freshness — **REUSED** + extended preference-centre columns |
| C2 interactions/follow-ups/opportunities | Manual outreach + responses write via `crmService` — **REUSED** (no parallel CRM) |
| C3 segments/intelligence | Audience via `evaluateRules` / saved segments / filters — **REUSED** (rules only; snapshot min identity) |
| Notifications | Student/faculty in-app only; **no alumni push table** |
| Mail | `mail/mailer.ts` outbox/console stub — **not** a verified provider |
| Templates | No prior messaging templates — **new** engagement templates |
| Scheduler/cron | HR interval pattern only — campaigns do **not** auto-send |
| SMS / WhatsApp / telephony | **NOT INTEGRATED** |
| Events | `alumni_events` / registrations reusable for reunion / calendar |

## 2. Source-of-truth matrix

| Domain | Owner | C4 behaviour |
| --- | --- | --- |
| Profile / academic history | C0/C1 `alumni_profiles` | Read only |
| Willingness / capability | C1 | Updated from responses with `source=ENGAGEMENT_RESPONSE` provenance |
| Communication + topic preferences | C1 (+ C4 preference centre columns) | Enforced at eligibility |
| Interactions / follow-ups / CRM opps / outcomes | C2 | Written by orchestration; never duplicated |
| Segment **rules** | C3 | Evaluated at snapshot time |
| Programs / campaigns / recipients / tokens / responses | **C4** | New authoritative orchestration store |
| Delivery / open / read | — | **Never stored** (no provider telemetry) |
| Recognition nominations | C4 handoff only | Full engine deferred to C6 |
| Event attendance | Event module | Authoritative when integrated |

## 3. Schema / migrations

Migration: `apps/api/migrations/20261009100000_alumni_engagement_c4.cjs` (**batch 71**)

- Preference extensions on `alumni_profiles`
- `alumni_engagement_categories`, `alumni_engagement_fatigue_rules`
- `alumni_engagement_programs`, `alumni_engagement_templates`, `alumni_engagement_campaigns`
- `alumni_engagement_approvals`, `alumni_engagement_recipients` (min snapshot)
- `alumni_engagement_response_tokens`, `alumni_engagement_responses`
- `alumni_engagement_recognition_noms`, `alumni_engagement_pref_evidence`

## 4–5. Programs & categories

Programs support DRAFT→…→COMPLETED/CANCELLED with value exchange (`VALUE_TO_ALUMNI` / `VALUE_TO_INSTITUTION` / `MUTUAL_VALUE`). Categories seeded from taxonomy (NETWORKING…OTHER), college-configurable.

## 6–8. Audience, eligibility, fatigue

Audience sources: saved segment, dynamic rules, explicit IDs, filters, event participants, relationship/opportunity context. Recipient snapshot stores profile id + eligibility decision only.

Eligibility: ELIGIBLE / SUPPRESSED / REQUIRES_REVIEW with reasons (opt-out, channel, willingness NOT_WILLING, fatigue, active opp, open follow-up, staleness, etc.). Fatigue rules configurable per category; authorised override audited.

## 9–11. Calendar, campaigns, approvals

Calendar views: Month / Quarter / Academic Year (programs, campaigns, events). Campaigns never auto-send. Approval steps reuse existing RBAC (HOD / Alumni-T&P / institutional).

## 12–14. Channels, templates, login-less responses

| Channel | Capability |
| --- | --- |
| EMAIL | **MANUAL_ONLY** (SMTP env ≠ verified provider) |
| WHATSAPP / SMS | **UNAVAILABLE** |
| PHONE / IN_PERSON / MANUAL / PORTAL_NOTIFICATION / OTHER | **MANUAL_ONLY** |

No channel reports CONFIGURED. Templates use safe `{{variables}}` only — no code execution. Response tokens: HMAC-hashed random token, expiry, revoke, max uses, rate limit, tenant/alumni/action binding.

## 15–16. Response forms → C1/C2/C3

Forms for mentorship / recruitment / expert / research / data refresh. Responses update C1 where semantic (willingness, contact verify) with provenance; create C2 interactions/follow-ups/opportunities; C3 re-derives immediately (e.g. NO mentor → not WILLING / not qualifies).

## 17–19. Value exchange, manual execution, funnel

Programs capture alumni/institution value. Manual outreach queue is first-class (Call → NO_ANSWER / RESPONDED / INTERESTED / …). Funnel: TARGETED → ELIGIBLE → CONTACTED → RESPONDED → INTERESTED → OPPORTUNITY_CREATED → … — never claims verified outcome from engagement alone. NOT_CONTACTED ≠ NO_RESPONSE; INTEREST ≠ OUTCOME_VERIFIED.

## 20–22. Preference centre, workspace, Alumni 360

- `/alumni/preferences` + API preference centre (channels, topics, global opt-out, evidence)
- `/alumni-admin/engagement` — Overview, Calendar, Programs, Campaigns, Manual Outreach, Responses, Approvals, Templates
- Admin 360 **Engagement** section; alumni self-view gets preferences only (no internal suppressions)

## 23. Data-refresh workflow

First-class DATA_REFRESH programs; secure tokens; NO_CHANGE / UPDATE; updates `contact_verified_at` / employment `last_verified_at` with provenance.

## 24. Security / RBAC

Covered in focused tests: tenant isolation, department scope, accountant denial, approval permissions, token expiry/reuse/revoke, opt-out enforcement, suppression override audit, self-360 does not leak intelligence.

## 25. Focused C4 tests

`alumniEngagement.e2e.test.ts` — **6/6 PASS**

## 26–27. Regressions

| Suite | Result |
| --- | --- |
| C4 focused | **6/6 PASS** |
| Combined `test:alumni-engagement` (C3+C2+C1+Legacy+C4) | **36/36 PASS** (~3.2 min) |
| Full backend `npm test` | **1277/1277 PASS**, 0 fail (~38.2 min) |

C3 segment evaluate candidate window now prefers newest profiles (`orderBy id desc`) so large tenants do not starve recent alumni within the 500-cap.

## 28. Responsive QA

`apps/web/e2e/alumni-engagement.responsive.spec.ts` — **20/20 PASS** (1920×1080 + 390×844): Overview, Calendar, Programs, Campaigns, Manual Outreach, Responses, Approvals, Templates, admin hub Engagement link, login-less response page. Alumni Mobile: **N/A**.

Note: restart the API process after deploy so `/api/alumni-admin/engagement` is live (Vite HMR covers web; API is not hot-reloaded).
## 29. Performance (`perf:alumni-engagement`)

Audience size ~200 (college sample):

| Surface | p50 (ms) | p95 (ms) |
| --- | --- | --- |
| Engagement workspace | 22 | 30 |
| Calendar | 5 | 6 |
| Eligibility batch | 24 | 27 |
| Manual outreach queue | 8 | 11 |
| Campaign detail | 5 | 7 |

Eligibility is set-based (no N+1 Alumni 360 aggregates).

## 30. Known limitations

- No real WhatsApp / SMS / email / telephony delivery
- EMAIL remains MANUAL_ONLY even if SMTP_* env present (outbox-only mailer)
- No delivery/open/read/click telemetry (by design)
- C3 segment evaluate still page-bounded (~500 candidates) — large audiences should prefer FILTERS / EXPLICIT_IDS / set-based snapshot
- Recognition nominations are C6 handoff only
- Portal notifications remain pull-model (`alumni_notices`)
- No async job queue for drip campaigns

## 31. Final decision

**FROZEN** — consent/preferences enforced; suppression + fatigue work; responses update C1/C2/C3; login-less tokens secured; no fake channel telemetry; manual outreach usable; focused C4 tests pass; performance acceptable.

**STOP AFTER C4.** Do not begin C5–C8.
