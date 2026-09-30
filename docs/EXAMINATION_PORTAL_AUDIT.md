# Examination / COE Portal Audit

Audit date: 2026-09-21

## Existing Architecture

The repository already contains one examination engine under `apps/api/src/modules/examination`. It is not rebuilt or duplicated. The implemented surface includes policies, exam creation, exam subjects, scheduling, eligibility, room allocation, seating, invigilation duties, marks sheets, marks import, moderation, result processing, result publishing, student hall-ticket JSON, student results, academic record updates, revaluation requests, finance demand hooks, audit logging, and a dedicated COE web workspace.

Related modules reused:

- Academic master/classes: academic years, programmes, semesters, schemes, courses, classes, enrollments, subject faculty mappings.
- Attendance: attendance percentages feed eligibility.
- Finance: exam financial eligibility and revaluation fee demand hooks.
- Question papers: internal paper metadata/readiness; confidential content remains in `questionPapers` with its own access checks.
- Faculty/HR: faculty identities and roles are reused for duties.
- Student: student identity, USN, programme/semester data are reused.

## Governance Finding

Previous state: examination functionality was COE/RBAC-driven but not capability-driven by institution governance type.

Final audited state after this pass: `college_examination_governance` and `EXAMINATION_CAPABILITIES` classify capabilities for `VTU_AFFILIATED` and `AUTONOMOUS`. Server-side guards prevent institution-owned processing where a capability is university-owned, notably SEE timetable scheduling and result processing for VTU-affiliated colleges.

## Capability Audit

| Capability | Existing Status | Scope | Notes |
|---|---:|---|---|
| Academic year/scheme/programme/semester/course foundation | EXISTS_AND_COMPLETE | COMMON | Reused from academic modules. |
| Exam policy/rule engine | EXISTS_NEEDS_ENHANCEMENT | COMMON | Pass/grade bands exist; deeper regulation versioning and grace rules are incomplete. |
| Exam cycle | EXISTS_NEEDS_ENHANCEMENT | COMMON | First-class exams exist; lifecycle vocabulary expanded, but full maker-checker transition workflow is incomplete. |
| Capability registry | EXISTS_AND_COMPLETE | COMMON/VTU/AUTONOMOUS | Added machine-readable registry and governance config. |
| Readiness engine | PARTIAL | COMMON | Added centralized readiness scoring for core checks; drill-down is basic. |
| Eligibility | EXISTS_NEEDS_ENHANCEMENT | COMMON | Attendance/CIE/finance integrated; detention, special permission, disciplinary holds need deeper sources. |
| Registration | PARTIAL | VTU/AUTONOMOUS | Eligibility exists; formal application/fee/approval/freeze workflow is missing. VTU reference-only model documented. |
| Timetable | EXISTS_NEEDS_ENHANCEMENT | COMMON | Scheduling/conflict check exists. VTU university-owned scheduling is now blocked. |
| Hall tickets | EXISTS_NEEDS_ENHANCEMENT | COMMON | Student payload exists; VTU payload now marks university authority/reference status. Formal PDF/QR flow missing. |
| Centre management | PARTIAL | COMMON | Rooms and capacity exist; buildings/CCTV/strong room/infrastructure checklist missing. |
| Strong room management | MISSING | COMMON | No immutable register yet. |
| Exam staff roles | EXISTS_NEEDS_ENHANCEMENT | COMMON | Duty roles expanded; session-scoped eligibility/workload engine incomplete. |
| Staff eligibility rule engine | MISSING | COMMON | Conflict checks exist only for overlapping duty time. |
| Duty allocation | EXISTS_NEEDS_ENHANCEMENT | COMMON | Manual assignment/conflict/calendar exists; auto allocation, acknowledgement, replacement, check-in incomplete. |
| Seating | EXISTS_NEEDS_ENHANCEMENT | COMMON | Capacity, generation, locking, plans exist; mixing patterns/accommodation exports incomplete. |
| Question paper setting | PARTIAL | AUTONOMOUS | Internal QP module exists, but full setter-scrutiny-moderation-secure-release lifecycle is incomplete. VTU is university-owned. |
| VTU QP handling | PARTIAL | VTU_AFFILIATED | Readiness metadata only; official delivery/security integration absent. |
| Exam-day command centre | PARTIAL | COMMON | Dashboard KPIs/readiness exist; live session room/script incident board missing. |
| Exam attendance/Form-A | MISSING | COMMON | Marks statuses cover absence/MPC, but room attendance/Form-A freeze workflow is absent. |
| Malpractice/MPC | PARTIAL | COMMON | Mark status supports MPC/malpractice; case engine/evidence/committee lifecycle missing. |
| Answer book inventory | MISSING | COMMON | No stock ledger/reconciliation. |
| Script custody | MISSING | COMMON | No bundle/dispatch/acknowledgement chain. |
| Practical/lab/viva | PARTIAL | COMMON | Exam types and marks support exist; examiner workflow/remuneration missing. |
| CIE marks | EXISTS_NEEDS_ENHANCEMENT | COMMON | Internal marks are computed from existing sources; full approval-depth workflow incomplete. |
| Marks entry | EXISTS_NEEDS_ENHANCEMENT | COMMON | Manual/import/dry-run/validation/freeze/unfreeze/audit exist; XLSX upload UI remains incomplete. |
| Digital valuation | MISSING | AUTONOMOUS | No anonymous script registration/valuer allocation engine. VTU is reference-only. |
| Result processing | EXISTS_NEEDS_ENHANCEMENT | AUTONOMOUS | SGPA/grade/pass/fail processing exists and is now blocked for VTU. Grace/versioned recalculation incomplete. |
| VTU results | PARTIAL | VTU_AFFILIATED | Source-of-truth fields added; import/reconciliation workflow incomplete. |
| Revaluation/photocopy | PARTIAL | COMMON | Student request and finance demand hook exist; autonomous valuation/recalculation/version workflow missing. |
| Result versioning | PARTIAL | COMMON | `result_version` exists; immutable previous/new result versions for revaluation/correction incomplete. |
| Exam documents | MISSING | COMMON | No grade card/transcript/document-number/QR verification engine. |
| Examination finance | PARTIAL | COMMON | Eligibility/revaluation hooks reuse Finance; full exam fee heads/workflows incomplete. |
| Remuneration | MISSING | COMMON | No work statement/claim/payment status engine. |
| Reports | PARTIAL | COMMON | Dashboard/status/analytics exist; statutory PDF/XLSX report library incomplete. |
| Analytics | PARTIAL | COMMON | Subject analytics and dashboard counts exist; trend analytics incomplete. |
| Security/RBAC | EXISTS_NEEDS_ENHANCEMENT | COMMON | COE RBAC, college isolation, QP confidentiality tests pass. Object-level capability gating expanded. |
| Audit log | EXISTS_NEEDS_ENHANCEMENT | COMMON | Core mutations audited; new missing ledgers cannot yet emit full statutory audit events. |
| Freeze/unfreeze governance | PARTIAL | COMMON | Marks/seats lock exist; broader dataset freeze/maker-checker incomplete. |
| Responsive COE UX | EXISTS_NEEDS_ENHANCEMENT | COMMON | COE workspace exists and builds; latest responsive QA not rerun in this pass. |
| Seed data | PARTIAL | COMMON | Existing E2E seed supports COE; separate VTU and autonomous seeded institutions are not complete. |

## Duplicate/Deprecated Findings

No duplicate examination engine was found. Existing question-paper generation is a separate academic/question-paper module; COE only consumes readiness metadata and does not gain confidential paper content access by default.

