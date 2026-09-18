# LECTURER PORTAL ENHANCEMENT — FREEZE VALIDATION

Status: **IN PROGRESS** — Phase A FROZEN, Phase B FROZEN (pending review). Phase C (Reports + Mobile parity) pending.

**Decision:** PHASE A: FROZEN · PHASE B: FROZEN · PHASE C: PENDING · LECTURER PORTAL ENHANCEMENT: NOT FROZEN.

Delivery is phased with a freeze gate per phase (agreed). This document accumulates evidence per phase; the final FROZEN / NOT FROZEN decision is recorded only when all phases are validated.

---

## Data-architecture audit (spec §12 — one source of truth)

Reused authoritative modules (no parallel copies created):

| Domain | Authoritative source | Reused for |
| --- | --- | --- |
| Faculty/staff accounts & roles | `faculty_users` (+ `middleware/permissions`, `utils/permissions`) | RBAC everywhere |
| Faculty basic info | HRMS `employees` (`employees.faculty_user_id`) | Profile Basic Info (Phase B) |
| Mentee data + timeline | `mentoring/*`, `mentor_assignments`, `mentor_meetings`, `mentoring_actions/escalations/referrals` | §1 Mentee Snapshot |
| Student requests | `studentServices` request engine (`student_service_requests`, workflows/steps, actions, audit) | §2 Leave/Permission |
| Class coordinator | `academic_classes.coordinator_id`, `academic_class_coordinators` | §3 Coordinator |
| Cohort risk analytics | `mentoring/riskEngine` (attendance/CIE/backlog thresholds) | §1, §3 |
| Portfolio | Placement (`student_certifications`, `student_experiences`, `student_achievements`, `placement_offers`, `training_enrollments`) | §1 |
| Attendance | `attendance_sessions`, `attendance_records`, `attendance_record_audits` | §2 integration |

New tables added in Phase A: **none** (Phase A is entirely a reuse/projection layer). Faculty-profile tables are introduced in Phase B.

---

## PHASE A — Mentee Snapshot + Student Requests + Class Coordinator

### §1 Mentee Snapshot
- Enriched mentee snapshot projection `mentoring/menteeSnapshot.ts` composes attendance shortage, CIE, academic trend (SGPA series), backlogs, certifications, internships, placement/training status, achievements, mentor-visible academic alerts, and pending student requests — all from authoritative modules, respecting `student_academic_alerts.visible_to_mentor`.
- `mentoring/dashboard.listMentees` extended with these indicators + server-side filters: semester, section, risk level, attendance shortage, academic performance, pending action.
- `mentoring/student360` extended with `portfolio`, `alerts`, `requests`, and SGPA `trend` (additive — existing keys unchanged).
- Web: dedicated **My Mentees** page (`/mentoring/my-mentees`) with filters + enriched table; Student 360 gains a **Portfolio** tab and an Alerts/Requests band. Existing mentoring session timeline already renders date/mode/category/observation/action/follow-up/status.

### §2 Student Permission/Leave Requests
- New request types (`defaults.ts`): `STUDENT_LEAVE_REQUEST` (routes to `MENTOR`), `STUDENT_PERMISSION_REQUEST` (routes to `CLASS_COORDINATOR`). Installed idempotently via `ensureCollegeServicesDefaults`.
- **Security fix:** `canActAsRole` now relationship-checks `MENTOR` (previously only `CLASS_COORDINATOR`), closing a cross-mentor IDOR on mentor-routed steps.
- Relationship-scoped lecturer inbox `requestEngine.mentorInboxRequests` / `mentorGetRequest` / `mentorActionOnRequest` (NOT the college-wide office list) with tabs Pending / Approved / Rejected / Returned / History; approve / reject / return-for-clarification, timestamps + audit.
- **Attendance integration** `leaveAttendance.ts`: on approval, existing ABSENT marks within the leave window are reclassified ABSENT→EXCUSED with an audit row and a request marker. Idempotent (re-apply reclassifies nothing); creates **no** parallel leave/attendance rows.
- Web: lecturer inbox (`/mentoring/requests`, `/mentoring/requests/:id`).

### §3 Class Coordinator
- `academicClasses/coordinator.ts`: `classCoordinatorInfo` (authoritative banner — name/department/contact, never hardcoded), `coordinatorClasses`, and `coordinatorWorkspace` (strength, attendance snapshot + below-threshold list, academic exceptions, backlog snapshot, mentor allocation + students-without-mentor, pending requests, alerts, assessment/assignment/quiz completion, escalation/grievance issues). Cohort analytics reuse `riskEngine`.
- Scope enforced: only the class's coordinator (or admin/principal, or HOD-of-department) may open a workspace.
- Web: reusable `ClassCoordinatorBanner` on class context, `CoordinatorWorkspacePage` (`/coordinator`), nav entry.

### RBAC matrix (Phase A)
| Actor | Mentee snapshot | Leave/permission inbox | Coordinator workspace |
| --- | --- | --- | --- |
| Faculty (mentor) | own mentees only | own mentees' requests | — unless coordinator |
| Faculty (coordinator) | — unless mentor | coordinated class requests | own class only |
| Faculty (neither) | denied (IDOR-guarded 360) | empty / denied | denied (403) |
| HOD | dept oversight (existing) | (office/HOD flows unchanged) | dept classes |
| Admin/Principal | support/oversight | — | allowed |

### Verification evidence (Phase A)
- API typecheck: clean. Web typecheck: clean. Web production build: clean (2416 modules).
- Targeted E2E `studentServices/lecturerPortal.e2e.test.ts` — **6/6 pass**:
  - leave/permission types installed & routed to MENTOR / CLASS_COORDINATOR
  - `canActAsRole` enforces mentor relationship (no cross-mentor act)
  - leave approval reconciles attendance idempotently (ABSENT→EXCUSED, no duplicate audit rows)
  - mentor inbox is relationship-scoped (no leakage to non-mentor)
  - enriched mentee snapshot exposes portfolio/academic indicators + filters narrow correctly
  - coordinator workspace scoped; non-coordinator faculty denied (403); banner authoritative
- Regression (affected suites): mentoring 11/11, studentServices 7/7, office (2 suites) + academicClasses studentLms + attendance = **73/73**. No regressions.

**Phase A: PASS (ready to freeze pending final consolidated run).**

---

## PHASE B — Faculty Academic & Professional Profile + Accreditation Evidence

Delivered as a **unified, historical, evidence-backed Faculty Academic Record** — the institutional source for NBA / NAAC / IQAC / appraisal / research reporting — while **HRMS remains authoritative** for employee/service information. Not "one large form": a generic record engine with logical sections, a generic accreditation-evidence layer, an explicit verification workflow, a meaningful completeness engine, and academic-year-preserving history.

### 1. Source-of-truth audit (§B1)

| Field domain | Authoritative module | Phase B action |
| --- | --- | --- |
| Employee identity (name, employee no., photo) | HRMS `employees` | Project read-only |
| Designation / Department / Employment type / DOJ | HRMS `employees` (+ `hr_designations`, `departments`, `employment_types`) | Project read-only |
| Institutional experience (from DOJ) | HRMS | Derive (computed) |
| Employment status / lifecycle | HRMS lifecycle | Project read-only |
| Teaching assignments (AY/course/program/sem/section/credits) | Academic/LMS `academic_class_subject_faculty` → `academic_classes`/`courses`/… | **Derive** (read-only) |
| Mentoring (mentee counts by AY) | `mentor_assignments` | **Derive** |
| Class coordination | `academic_classes.coordinator_id` | **Derive** |
| Academic leadership / HOD roles | `academic_leadership_assignments` | **Derive** |
| Student project guidance | Placement `student_projects` (`faculty_mentor_id`) | **Derive** |
| Qualifications / Ph.D. details | *no authoritative engine* (HRMS has only generic `employee_documents`) | **Faculty Academic Record** |
| Experience (teaching/industry/research/other) | *no authoritative engine* | **Faculty Academic Record** |
| Publications / Patents-IPR / Funded projects / Consultancy | *no authoritative engine* | **Faculty Academic Record** |
| FDP/STTP/training / Certifications / Conference roles | *no authoritative engine* (HR `ld_*` is L&D, distinct) | **Faculty Academic Record** |
| Memberships / Awards / Research guidance / Industry interaction / Institutional contribution / Responsibilities | *no authoritative engine* | **Faculty Academic Record** |
| Evidence documents | Existing local secure-file pattern (as `studentServices`/grievance attachments) | **Reuse pattern** (`uploads/faculty-profile`, storage_key, checksum, path-traversal guard, authorize-before-read) |
| RBAC / roles | `faculty_users` + `middleware/permissions` + `utils/permissions` | Reuse |

No duplicate authoritative records were created. Manually entered external metrics (Scopus/WoS/quartile/citation) are stored as **self-entered** and never auto-promoted to verified.

### 2. Schema / migrations introduced

Migration `20261005100000_faculty_academic_profile.cjs` (up + down validated: applied, rolled back, re-applied clean). Four additive, college-scoped tables:

- **`faculty_academic_profiles`** — one per employee: research identifiers (ORCID, Google Scholar, Scopus, WoS/ResearcherID, Vidwan, other), optional photo override, `not_applicable` map, completeness cache. Unique `(college_id, employee_id)`.
- **`faculty_records`** — generic record engine: `domain`, `record_type`, `title`, `academic_year_label` (frozen), dates, `is_current`, `category`, `level`, `status`, `role_label`, `unique_ref` (normalized dedupe key), `details` JSON, `source` (FACULTY/DERIVED), `verification_status`, verifier fields, `is_archived`. Unique `(employee_id, domain, unique_ref)` blocks self-duplication; indexes on `(college, employee, domain)`, `(college, domain, academic_year)`, `(college, domain, verification_status)`.
- **`faculty_record_evidence`** — evidence docs: file metadata, `storage_key`, `checksum` (sha256), category/subcategory, description, reference, uploader.
- **`faculty_record_verifications`** — append-only verification history (SUBMIT/VERIFY/RETURN/REJECT/REOPEN with from/to status, actor, role, remarks). History is preserved, never overwritten.

### 3. Reused modules (no parallel copies)
HRMS `employees`+lookups (core profile); Academic/LMS `academic_class_subject_faculty`/`academic_classes` (teaching); `mentor_assignments` (mentoring); `academic_classes.coordinator_id` (coordination); `academic_leadership_assignments` (leadership/HOD); Placement `student_projects` (project guidance); `academic_years` (AY context); secure-file storage pattern; `faculty_users`/permissions middleware for RBAC.

### 4. Profile domains implemented (§B2–B20)
Overview, Academic (identifiers + Qualifications incl. Ph.D. detail), Experience (overlap-aware), Teaching (derived assignments + faculty teaching contributions), Research (Publications, Patents/IPR, Funded/Sponsored projects), Professional Development (FDP/STTP/workshops attended & organized, Certifications, Conference/expert roles), Student Guidance (derived mentoring + student projects, research guidance), Industry & Consultancy, Institutional Contribution (+ administrative/academic responsibilities), Awards & Memberships, Evidence. 17 writable domains + 5 derived projections, all driven by one config (`WRITABLE_DOMAINS`) — extensible without new tables.

### 5. Evidence engine (§B21–B22)
Generic (not hardcoded to one NBA criterion/version): record → domain → AY → category/subcategory → description → document → reference → submitter/timestamp → verification status/actor/timestamp/remarks. Documents stored under `uploads/faculty-profile/<college>/<record>/<uuid>`, sha256 checksum, MIME allow-list (PDF/image/office), 25 MB cap, path-traversal guarded, **authorize-before-read** (owner / dept-HOD / institution roles). No storage paths or public URLs exposed.

### 6. Verification workflow (§B23)
States DRAFT → SUBMITTED → {VERIFIED | RETURNED | REJECTED}; NOT_REQUIRED for non-verifiable domains; editing a VERIFIED record auto-invalidates it back to DRAFT (REOPEN logged). **Faculty can never self-verify** (`canVerify` hard-excludes the owner). Verifiers: HOD (own department only), PRINCIPAL/MANAGEMENT/CHAIRMAN/IQAC/NBA/COLLEGE_ADMIN (institution). **SUPER_ADMIN excluded** from the academic workflow (platform governance only). Scoped verification inbox + faculty directory for reviewers. Every action audited in `faculty_record_verifications`.

### 7. Completeness engine (§B24)
Section-based (not naive non-null %): Basic HR, Academic identifiers, Qualifications, Experience, Teaching, Research, Professional development, Student guidance, Institutional contribution, Awards & memberships. Per-section status COMPLETE / INCOMPLETE / EVIDENCE_MISSING / VERIFICATION_PENDING / NOT_APPLICABLE with **actionable messages** (e.g. "publication record … has no supporting document", "N records awaiting verification"). NOT_APPLICABLE sections are excluded from scoring; teaching can be satisfied by derived assignments.

### 8. Historical / academic-year behavior (§B25)
Every time-sensitive record carries a frozen `academic_year_label`; derived views key on stable `faculty_user`/`employee` ids, so promotion, department transfer, designation change, or HOD add/remove do not rewrite history. Academic-year boundary computation is deterministic (July-start) and unit-tested.

### 9. RBAC / security (§B29)
Owner-only create/edit; view = owner / same-dept HOD / institution roles / admin (tenant-checked); verify = never owner, dept-scoped HOD, institution roles, not SUPER_ADMIN. Tenant isolation via `college_id` on every query (foreign employee ids resolve to 404). Evidence + record IDOR guarded; returned/rejected mutation rules; edit-invalidates-verification.

### 10. E2E totals (Phase B)
**27 dedicated Phase B tests, 27 pass:**
- `facultyProfileIntegrity.test.ts` — **13/13** (overlap-aware experience, disjoint sums, open/current periods, per-category + overlap-aware overall, FDP inclusive duration, certification expiry incl. lifetime, AY boundary, DOI/ref normalization).
- `facultyProfile.e2e.test.ts` — **7/7** (HRMS core projection + identifiers non-verified; publication create + duplicate-DOI 409; full verify workflow with append-only history + owner self-verify blocked + edit-invalidates-verify; evidence checksum + authorized read; section completeness with actionable messages; derivation without duplication + overview; scoped verification inbox).
- `facultyProfileSecurity.e2e.test.ts` — **7/7** (cross-faculty view 403; cross-department HOD view+verify denied; self-verify blocked; record-id IDOR 404; evidence-id IDOR 403; cross-college tenant isolation 404; SUPER_ADMIN excluded from workflow).

### 11. Regression totals (affected suites) — **111/111 pass, no regressions**
- Phase A lecturer portal (`lecturerPortal.e2e`) 6/6
- Mentoring & Student Advisory 11/11
- Academic Leadership (HOD + Principal) — pass
- Student Services 7/7
- HRMS (`hrms.e2e`) — pass
- Attendance (`attendance.e2e` + `policy.test`) — pass
- Grievance & Student Welfare closure 60/60
(Batch 1: 67/67 including 27 Phase B; Batch 2: 71/71.)

### 12. Responsive QA (§B31) — **no horizontal overflow at any breakpoint**
Verified in-browser (Dr. Anita Sharma faculty session) at **360×740, 390×844, 412×915, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080** — `scrollWidth === clientWidth` at every width. Long content handled: derived teaching table scrolls inside its own `overflow-x-auto` container (page body never scrolls); long titles/DOI/institution/filenames use `break-words`; publication add-modal fields stack to one column at 390px with the provenance note intact. No critical data hidden to achieve fit.

### 13. Known limitations
- Formal NBA/NAAC report *rendering* is deliberately deferred to Phase C; Phase B ensures the data model can answer all §B28 questions (qualification/experience/retention/teaching/publications/patents/projects/FDP/memberships/consultancy/guidance/industry/institutional).
- Configurable award-level master-data is provided as a fixed enum (INSTITUTIONAL…INTERNATIONAL); promotion to ERP master-data can follow if required.
- Evidence virus-scanning is out of scope (MIME allow-list + size cap + checksum applied); relies on the existing platform upload posture.
- Web bundle remains a single large chunk (pre-existing; unchanged by this phase).

### 14. Phase B freeze gate — results
API typecheck ✅ · Web typecheck ✅ · API production build ✅ · Web production build ✅ (2417 modules) · Migration up/down validated ✅ · Phase B E2E 27/27 ✅ · Security/IDOR 7/7 ✅ · Phase A E2E ✅ · HRMS/Mentoring/Academic-LMS/Student-Services/Attendance/Academic-Leadership/Grievance regression 111/111 ✅ · Responsive QA 8/8 breakpoints ✅.

**PHASE B: PASS — FROZEN (pending review). STOP — do not begin Phase C until Phase B freeze evidence is reviewed.**

## PHASE C — Reports + Mobile parity (§8, §10)
Pending — not started.

## Final decision
**LECTURER PORTAL ENHANCEMENT: NOT FROZEN** — Phase A FROZEN, Phase B FROZEN (pending review), Phase C PENDING. No blockers.
