# Mentoring & Student Advisory — Web ERP Closure & Freeze Validation

**Status: FROZEN**
**Date:** 2026-09-13
**Priority:** P1 functional closure
**Source of truth:** `docs/ERP_WEB_MASTER_CLOSURE_MATRIX.md`

---

## 1. Executive summary

Mentoring moved from *"mentoring primitives exist"* (mentor assignment, meeting request/schedule/complete, private notes, attendance/backlog alerts) to a complete institutional **student-support workflow**:

> **Student → Mentor/Faculty → HOD → Principal**, with de-identified Management oversight.

The system now proactively answers the three questions mentoring must answer:

1. **Who needs attention?** — a batched, rule-based attention engine ranks every mentee.
2. **Why?** — every flag is explainable (attendance %, backlogs, overdue assignments, CIE, overdue follow-ups) and tied to the underlying ERP data.
3. **What are we doing about it?** — sessions, action plans, follow-ups, escalations, referrals, and parent interactions, all audited and confidentiality-governed.

It reuses existing Student, Faculty, Attendance, Assessment/CIE, Examination/backlog and LMS data rather than duplicating it, and preserves the Faculty-as-mentor identity model (no duplicate employee identity; HOD keeps Faculty + department leadership overlays).

## 2. Final decision

**MENTORING & STUDENT ADVISORY — FROZEN.** All applicable freeze gates pass (see §34). Backend build, web build, TypeScript, mentoring backend E2E (11), directly-affected regression (80), and mentoring responsive/RBAC Playwright QA (48 cases across 8 viewports) all pass. Known non-mentoring failures in unrelated domains are documented in §31 and are pre-existing.

## 3. Architecture

- **New backend module** `apps/api/src/modules/mentoring/` mounted at `/api/mentoring` (faculty/leadership) and `/api/student` (student-facing `/mentoring/*`), alongside the existing `studentServices` module (not replacing it).
- **Reuse-first:** the existing `mentor_assignments`, `mentor_meetings`, `student_academic_alerts`, and `student_services_audit_log` tables are reused. `mentor_meetings` was *extended* into full mentoring sessions (categories, confidentiality, observations, outcome, follow-up status) rather than creating a parallel session table.
- **Additive schema** for genuinely new concepts only: actions, escalations, referrals, parent interactions, risk config.
- **Scoping reuse:** HOD/Principal/Management scope resolves through the frozen `academicLeadership` `resolveLeadershipContext` / `assertDepartmentScope` helpers, so mentoring inherits the same, already-validated leadership overlay model.

## 4. Existing primitives reused

| Primitive | Source | Reused for |
|---|---|---|
| `mentor_assignments` | studentServices migration | Allocation, workload, coverage, history |
| `mentor_meetings` | studentServices migration | Mentoring sessions (extended) |
| `student_academic_alerts` | studentServices | Student-facing alerts (unchanged) |
| `student_services_audit_log` + `recordServicesAudit` | studentServices/audit | All mentoring audit events |
| `notifyStudent` | academicClasses/studentNotifications | Mentor-assigned / session / action notifications |
| `studentAcademicRecord` | examination/result | CGPA + backlogs in Student 360 & risk |
| attendance_records / attendance_sessions | attendance | Attendance % (overall + subject-wise) |
| assessment_mark_sheets / assessment_student_rows | assessment | CIE performance |
| assignment_submissions / assignments | LMS | Overdue-assignment engagement signal |
| quiz_attempts | quizzes | Quiz activity in Student 360 |
| `resolveLeadershipContext`, `assertDepartmentScope` | academicLeadership | HOD/Principal/Management scoping |

## 5. Schema / migrations

**Migration:** `apps/api/migrations/20260923100000_mentoring_advisory.cjs` (deterministic, college-scoped, idempotent `hasTable`/`hasColumn` guards, reversible `down`).

- **ALTER `mentor_meetings`** (+`visibility`, `session_category`, `observations`, `outcome`, `created_by_faculty_id`, `follow_up_status`, `follow_up_completed_at`).
- **`mentoring_actions`** — action-plan items (title, owner STUDENT/MENTOR, status, priority, due/complete, outcome, `student_visible`).
- **`mentoring_escalations`** — Mentor→HOD→Principal (reason code+text, target level, status OPEN/ACKNOWLEDGED/RETURNED/RESOLVED, resolution).
- **`mentoring_referrals`** — to ACADEMIC_SERVICES/TP/FINANCE/GRIEVANCE/HOD/PRINCIPAL/OTHER (minimum-necessary context only).
- **`mentoring_parent_interactions`** — date, mode, initiator, purpose, summary, agreed follow-up, visibility.
- **`mentoring_risk_config`** — per-college thresholds (unique per college).

## 6. Mentor assignment model

`FACULTY + mentoring assignment` — a Faculty member teaches **and** mentors; no duplicate employee identity. Allocation (`allocation.ts`): individual + bulk assign, reassign (prior active primary is closed, never deleted — history preserved), single active primary enforced, department-scoped for HOD (college-wide for Principal/admin), workload rollup with transparent OVERLOADED/LIGHT/BALANCED indicator, unassigned-student list, full assignment history.

## 7. Role / RBAC model

| Role | Access |
|---|---|
| STUDENT | Own student-visible mentoring only (`/api/student/mentoring/*`) |
| FACULTY (mentor) | Assigned mentees only — enforced by `assertMentorOf` |
| HOD | Department-scoped oversight + allocation (leadership overlay) |
| PRINCIPAL | Institution oversight; not a routine mentor |
| MANAGEMENT/CHAIRMAN | De-identified aggregate analytics only |
| SUPER_ADMIN/COLLEGE_ADMIN | Configuration/administration; not routine operator |

Only SUPER_ADMIN/COLLEGE_ADMIN may mutate institution-wide risk configuration.

## 8. Mentor workspace

`/mentoring` (`MentorDashboardPage`) — "Who needs my attention today?": summary strip (active mentees, need attention, high attention, sessions this month, overdue follow-ups, resolved actions); **Action required** feed (high-risk, overdue follow-ups, returned escalations); **My mentees** table (attention badge, attendance, backlogs, last session, next follow-up, open actions); **Follow-ups** bucketed overdue/due-today/upcoming; **Recent interventions**. Reached from the Faculty nav ("Mentoring") — inside the Faculty experience, not a separate portal.

## 9. Student 360

`/mentoring/students/:id` (`MentorStudent360Page`, mentor-guarded). Sections: **Identity** (contact shown to assigned mentor only), **explainable risk panel** ("Why this attention level?" + per-dimension grid), tabs for **Attendance** (overall + subject-wise shortage), **Academic** (CGPA, CIE, backlogs), **Learning** (assignments, quizzes), **Mentoring history** (sessions with confidentiality badges, actions, escalations, referrals, parent interactions). All sources aggregated in parallel (`Promise.all`).

## 10. Risk engine

`riskEngine.ts` — transparent, rule-based, **batched** (`computeRiskForStudents`) to avoid N+1. Dimensions: **ATTENDANCE, ACADEMIC (CIE), ENGAGEMENT (assignments), BACKLOG, FOLLOW_UP**. Derives overall level **NORMAL / WATCH / ATTENTION / HIGH**. No opaque AI/ML; every non-normal dimension carries a human-readable reason string. Cannot mutate attendance, marks, or results.

## 11. Risk configuration

`config.ts` + `mentoring_risk_config` — per-college thresholds (attendance attention/high, CIE attention, assignment-miss attention/high, backlog watch/attention/high, follow-up overdue days). Read visible to HOD/Principal/Management/Admin; writes restricted to admins; audited. Falls back to college attendance policy + safe defaults.

## 12. Session workflow

`sessions.ts` — create/list/get/update sessions (extends `mentor_meetings`); types IN_PERSON/PHONE/ONLINE/PARENT_INTERACTION/OTHER; 12 structured categories (mentoring topics, **not** clinical diagnoses); student-visible vs private notes; SHARED/MENTORING_TEAM/CONFIDENTIAL visibility.

## 13. Actions / follow-ups

Actions: title, description, owner, priority, status OPEN/IN_PROGRESS/COMPLETED/CANCELLED, due/completion, outcome, student-visibility; student-owned visible actions notify the student. Follow-ups derived from session `follow_up_date`+`follow_up_status`; completing a follow-up marks it DONE and records an outcome **without overwriting** the originating session (longitudinal history preserved).

## 14. Escalation / referral

Escalation Mentor→HOD (→Principal), with reason code, initiator, status lifecycle, assigned authority, resolution; leadership acknowledge/return/resolve/escalate, department-scope-guarded. Referral shares only minimum-necessary context (never confidential narrative notes).

## 15. Confidentiality model

Levels SHARED / MENTORING_TEAM / CONFIDENTIAL. `canSeePrivateNarrative`: mentor sees own mentee's private notes; MENTORING_TEAM visible to authorised leadership; **CONFIDENTIAL never surfaces to leadership by hierarchy**. Students never receive private/observation/confidential text (verified: student meetings expose only `student_visible_notes`). Management receives aggregates only — no identifiable narratives.

## 16. Student experience

`/lms/services/mentor` extended: **My Mentor** (name, department, institutional email), **My Follow-ups**, **My Action Items**, **My Progress** (completed actions), Meeting history/request. Backend `/api/student/mentoring/{mentor,meetings,actions,follow-ups}` returns only self, student-visible data.

## 17. HOD experience

`/hod/mentoring` — department pulse (coverage %, unassigned, mentors, need-attention, overdue follow-ups, open escalations), mentor workload with balance indicator, students requiring attention (with reasons), escalations with resolve, unassigned sample. Backend department-scoped.

## 18. Principal experience

`/principal/mentoring` — institution summary (coverage, high attention, follow-up compliance, intervention volume, escalations) + department comparison. Read-only; no routine mentoring mutation.

## 19. Management analytics

`/management/mentoring` — coverage %, students receiving mentoring, attention distribution, follow-up compliance, intervention volume, escalation counts, department coverage. **De-identified** (E2E asserts no USNs/names/narratives in payload).

## 20–24. Integrations

- **Attendance** — consumed (overall + subject-wise + shortage); never recomputed or mutated.
- **CIE/results** — assessment sheets + `studentAcademicRecord`; mentoring never edits marks.
- **Assignments/quizzes** — overdue submissions + quiz activity; grading untouched.
- **Backlogs** — `subject_results` FAIL feeds risk & Student 360; official results immutable from mentoring.
- **T&P** — referral target (`TP`) available; deeper analytics **N/A** (no confidential recruiter data exposed).
- **Notifications** — reuses `notifyStudent` (mentor-assigned, session, student-visible action); no second notification architecture; confidential notes never notified to students.

## 25. Audit trail

`recordServicesAudit` (existing `student_services_audit_log`): assign/reassign, session create/update/visibility-change, follow-up complete, action create/complete, escalation create/ack/return/resolve/to-principal, referral create/close, parent interaction, risk config change.

## 26–27. Security / isolation

Every endpoint enforces college tenant, role/capability, mentor-assignment, department scope, student ownership, and confidentiality in the **backend** (frontend hiding is not relied on). Verified over HTTP and in E2E.

## 28. Isolation tests (verified)

| Case | Result |
|---|---|
| Non-mentor faculty → assigned mentee 360 | 403 |
| Accountant → Student 360 / HOD mentoring | 403 |
| COE → Student 360 | 403 |
| Faculty → HOD / Principal oversight | 403 |
| HOD → Management analytics | 403 |
| Accountant → HOD (Playwright + curl) | 403 |
| No-auth → dashboard | 401 |
| Student → other student's data | Not exposed (self-only routes) |
| Student → private/confidential notes | Not exposed (0 leak fields over 109 meetings) |
| Management → identifiable narratives | De-identified (E2E asserts no USNs) |
| SUPER_ADMIN routine operator | Config/admin only, not routine mentor |

## 29. Performance

Dashboard and Student 360 use parallel (`Promise.all`) aggregation; risk computed via a single batched pass (grouped queries, no N+1 per mentee). Live measurements (dev, warm): mentor dashboard endpoint ~sub-second; Student 360 aggregate returns identity+risk+attendance+learning+CIE+history in one call; management aggregate over 351 students returns promptly. Playwright navigations for all leadership pages completed in ~0.7–0.9s each across viewports.

## 30. E2E evidence

- **Backend** `apps/api/src/modules/mentoring/mentoring.e2e.test.ts` — **11/11 pass** (risk explainability, dashboard, Student 360, non-mentor denial, session+follow-up+action lifecycle, student confidentiality, escalation→HOD oversight+resolve, HOD department scope, reassignment history preservation, management de-identification, risk config).
- **Web** `apps/web/e2e/mentoring.responsive.spec.ts` — **48/48 pass** (6 tests × 8 viewports): mentor dashboard, Student 360 (explainable risk), HOD, Principal, Management (de-identified), RBAC isolation (accountant denied).

## 31. Regression

- **Directly-affected backend suites** (attendance, examination, academicClasses/LMS, academicLeadership, studentServices, mentoring): **80/80 pass**.
- **Full backend suite:** 793/798 pass. The **5 failures are in unrelated, untouched domains** and pre-date this work:
  - Placement E2E (3): the standard student-LMS seed intentionally gives Aarav (`4VV24CS001`) an active backlog for alert/mentoring scenarios (seed block predating this module), conflicting with placement tests that assume 0 backlogs — a pre-existing seed-vs-test tension.
  - HR performance appraisal E2E (1): unrelated HR domain.
  - Platform governance "frozen domains unchanged" (1): counts only payroll/fees/placement/appraisal tables during a tenant-creation burst — mentoring touches none of these; impossible to be caused by this module.
- **Builds:** API `tsc` PASS, Web `tsc` + Vite build PASS.
- **ESLint:** not configured in this repository (no `eslint.config.*`, no lint script); TypeScript strict is the static-analysis gate and passes.

## 32. Known limitations

- Deeper T&P analytics integration is a referral hand-off only (**N/A** by design; no recruiter-confidential data exposed).
- A pre-existing bug in the finance block of `seedStudentLmsE2e.ts` (a finance actor lacking a finance permission) prevents a clean *full* seed run; it does not affect mentoring seeding, which completes before that block. Flagged for separate follow-up.
- Parent notifications are deliberately **not** auto-sent from risk output (institutional policy safeguard).

## 33. Files changed

**Backend (new):** `apps/api/src/modules/mentoring/{types,permissions,riskEngine,allocation,sessions,escalations,student360,dashboard,oversight,config,student,controller,mentoring.e2e.test}.ts`; `apps/api/migrations/20260923100000_mentoring_advisory.cjs`.
**Backend (edited):** `apps/api/src/app.ts` (mount routers); `apps/api/src/scripts/seedStudentLmsE2e.ts` (mentoring QA seed block).
**Web (new):** `apps/web/src/pages/mentoring/{MentoringPages,LeadershipMentoringPages}.tsx`; `apps/web/e2e/mentoring.responsive.spec.ts`; `apps/web/e2e/screenshots/mentoring/*` (10 shots).
**Web (edited):** `apps/web/src/App.tsx` (routes); `apps/web/src/layouts/AppLayout.tsx` (nav); `apps/web/src/pages/lms/StudentServicesPages.tsx` (student mentoring view).

## 34. Freeze gate table

| Gate | Result |
|---|---|
| Mentor assignment / Faculty integration / no duplicate identity | PASS |
| Mentor dashboard / mentee list / Student 360 | PASS |
| Risk engine / explainability / configuration | PASS |
| Sessions / actions / follow-ups | PASS |
| Escalations / referrals | PASS |
| Parent interaction | PASS |
| Student: My Mentor / meetings / actions / confidentiality | PASS |
| HOD: dept oversight / workload / risk / escalations / dept isolation | PASS |
| Principal: institution oversight / no routine mutation | PASS |
| Management: aggregate analytics / confidential narratives protected | PASS |
| Integration: attendance / CIE-results / assignments-quizzes / backlogs | PASS |
| Integration: T&P (referral) / notifications | PASS / N/A |
| Security: college / student / mentor-assignment / dept isolation / confidentiality / unauthorized-role / audit | PASS |
| Quality: backend build / web build / TypeScript / mentoring E2E / responsive QA / affected regression | PASS |
| ESLint | N/A (not configured; TS strict passes) |

## 35. Final decision

**MENTORING & STUDENT ADVISORY — FROZEN.**
