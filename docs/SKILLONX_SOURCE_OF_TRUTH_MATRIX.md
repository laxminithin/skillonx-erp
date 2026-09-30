# SkillonX Campus OS — Source-of-Truth Matrix

Date: 2026-09-26. Companion to `docs/CAMPUS_OS_PHASE13_FINAL_GAP_AUDIT.md`.
For every major entity, states the single authoritative owner and, where
relevant, who is explicitly NOT authoritative (to prevent future
duplication).

| Entity | Authoritative Module/Table | Not Authoritative (explicitly) | Note |
|---|---|---|---|
| Student identity | `students` (canonical, `apps/api/src/modules/students`) | — | Auth kind `student` in `academicClasses` |
| Employee / Faculty identity | `faculty_users` (auth/role) + `employees` (HRMS profile) | — | Two tables for one person — documented architectural debt, not urgent |
| Parent identity | `parent_users` + `parent_student_links` | Student/Faculty tables | Relationship-authorized, deliberately separate auth kind |
| Alumni identity | `alumni_profiles` (links to `students`) | — | — |
| Applicant identity | `admission_applicants` | `students` | Converts to `students` only on confirmed admission |
| Vendor | `procurement_vendors` | Transport/Lab/Maintenance free-text vendor fields | Those remain unlinked, documented, low-priority gap |
| Course / Programme / Semester / Section | Academic master (`academicClasses`/`academicMaster`) | — | — |
| Attendance | Academic attendance engine (`attendance`) + HR `attendanceEngine.ts` for staff | Mentoring (consumes, doesn't own) | Two distinct engines: student academic attendance vs. staff attendance/leave-derived status |
| Exam Result | `examination` (results, backlogs, revaluation) | Mentoring, Parent (consume only) | — |
| Fee / Payment / Receipt / Refund / Ledger | `finance` | Every domain module (they own the *reason*, not the ledger) | Confirmed clean — no shadow ledger found (§14 of gap audit, reconfirmed §8 of Phase 13 audit) |
| Hostel Allocation | `hostel` | — | — |
| Transport Pass | `transport` | — | Student/staff bus fleet only |
| Library Loan | `library` | — | — |
| Asset (institutional) | `assetManagement` (`campus_assets`) | Lab's local `lab_assets`/`lab_asset_history` (deliberately separate, Lab-scoped) | Lab register predates and remains outside the generic register by design |
| Stock / Inventory | `procurement` (`inventory_*`, stock ledger) | Lab's local `lab_stock_items`/`lab_stock_movements` | Acknowledged unbridged exception (B4) |
| Document / Evidence (new work) | `documentEngine` | Every module's own pre-existing attachment table (Grievance, Maintenance, Student Services, Faculty Profile, HR Recruitment, Admissions) | Existing tables intentionally untouched; Document Engine is for new consumers only |
| Case / Ticket | Two engines by design: `studentServices/grievances.ts` (grievance/welfare) and `maintenance` (`service_tickets`, facilities/IT) | — | Architectural debt (similar shape), not merged — confidentiality/appeal requirements differ |
| Scholarship | `finance/scholarships.ts` | — | Money owner is Finance; no separate scholarship ledger |
| Certificate (Student Services) | `office`/`studentServices` (certificate/verification workflow) | — | — |
| Research Project / Proposal / Seed Grant | `research` | Faculty Profile (CV reference only), Innovation (N/A — not built) | — |
| Patent / IPR | Faculty Profile (`facultyProfile`, CV self-report only) | — | Institutional IPR lifecycle explicitly deferred (Phase 6) |
| Committee / Meeting / Minutes (incl. Academic Council, BoS, Governing Council) | `iqac` (`iqac_committees`, `iqac_meetings`) | — | Generic `committee_type` enum covers all governance bodies, not just IQAC itself |
| Correspondence / File Movement (inward/outward) | `office` (`office_file_records`, `office_file_movements`) | — | Covers e-office/dak/dispatch needs under the "Office" name |
| Academic student project (mini/major/capstone) | `placement` (`student_projects`) | Research, Innovation (N/A) | Portfolio/resume-scoped, not an academic-evaluation entity |
| Student achievement / experience | `placement` (`student_achievements`, `student_experiences`) | Faculty Profile pattern (not mirrored for students) | Placement/resume-scoped, free-text categories |
| Visitor / Gate entry | `security` + `hostel/gate.ts` (siloed) | — | No unified campus-wide register yet (Class E, deferred) |
| Notification | Per-module tables (`student_notifications`, `employee_notifications`, `hr_candidate_notifications`, `admission_applicant_notifications`) + centralized email (`mail/mailer.ts`) | — | SMS/WhatsApp explicitly UNAVAILABLE; consolidation remains Class D |
| Audit / History | Per-module audit tables (`lab_audit_log`, `office_register_events`, Procurement audit, Student Services audit, `platform` audit log) | — | Functionally sufficient per-domain; no shared audit engine, not currently a problem |
| Workflow / Approval state | Per-module state machines (25+) for existing work; `workflowEngine` for new work only | — | Deliberate — retrofitting frozen modules is out of scope |
