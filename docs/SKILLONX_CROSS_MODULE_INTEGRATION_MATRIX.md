# SkillonX Campus OS — Cross-Module Integration Matrix

Date: 2026-09-26. Companion to `docs/CAMPUS_OS_PHASE13_FINAL_GAP_AUDIT.md`.
Classification: REAL (proven end-to-end handoff), PARTIAL (linkage exists,
not fully posted/proven), HANDOFF_CONTRACT (producer-side write is real
and idempotency-proven, but no consumer-side code reads it yet), REFERRAL
(deliberately minimum-necessary-context only), BOUNDARY_VERIFIED
(integration deliberately does not cross a confidentiality/ownership
boundary), NOT_WIRED (no linkage exists).

**Gate 2 update (2026-09-26):** `docs/CAMPUS_OS_MASTER_FREEZE_GATE2_INTEGRATION_VALIDATION.md`
re-verified every row below against real-database E2E execution or direct
code evidence. Two rows are corrected below (Procurement → Finance,
Canteen → Finance, both from an overstated classification to
HANDOFF_CONTRACT — a full-repository grep of `finance/*.ts` found no
consumer for either handoff table); every other row's existing
classification was confirmed accurate and is left as originally written.
A `GATE 2 STATUS` note is appended per row for the rows in Gate 2's
minimum G2-A set.

| Integration | Classification | Evidence | Gate 2 Status |
|---|---|---|---|
| Admissions → Student | REAL | `admission_student_conversions` → `students`, canonical conversion on confirmation | PASS — `admissions.closure.e2e.test.ts` (34 tests) |
| Admissions → Parent | REAL | `parent_student_links` created/available post-conversion; Parent portal reads canonical `students` | PASS — `guardianProvisioning.e2e.test.ts` (9 tests) |
| Admissions → Finance | REAL | Applicant payment is Finance-owned pre-student; canonical demand/receipt handoff | PASS — `admissions.closure.e2e.test.ts` test 3 |
| Student → Alumni | REAL | `alumni_profiles` links to canonical `students`; Student→Alumni transition frozen (Phase 9) | PASS — `alumni.e2e.test.ts` |
| Hostel → Finance | REAL | Hostel fee heads + Finance demand linkage, tested in Hostel freeze evidence | PASS — `hostel.e2e.test.ts` |
| Transport → Finance | REAL | Transport pass/fee → Finance demand, idempotency tested in Transport freeze evidence | PASS — `transport.e2e.test.ts` / closure suite |
| Library → Finance | PARTIAL | Library fine heads exist in Finance; end-to-end posting not freeze-proven beyond existing evidence | PASS — `library.e2e.test.ts` ("overdue fine reaches Finance via handoff, and replay stays idempotent") |
| Examination → Finance | REAL | `exam_policies.exam_fee_paid_required`, `exam_revaluation_requests.finance_demand_id` | PASS — `examRemuneration.e2e.test.ts` (10 tests) |
| HR → Finance | REAL | Payroll/Full & Final settlement posting modules exist in `finance` | PASS — `hrPayroll.e2e.test.ts` (23), `hrFinalSettlement.e2e.test.ts` (7) |
| Procurement → Finance | **HANDOFF_CONTRACT** (was REAL) | `procurement_finance_handoffs` write is idempotent and concurrency-tested (`procurement.e2e.test.ts`), but a full grep of `apps/api/src/modules/finance/*.ts` found zero references to this table — no Finance-side consumer exists yet | Reclassified, not broken — no journey depends on Finance consuming it |
| Canteen → Finance | **HANDOFF_CONTRACT** (was PARTIAL) | `canteen_finance_handoffs` write is idempotent per counter+date and concurrency-tested (`canteen.e2e.test.ts`), but same grep found zero Finance-side consumer | Reclassified, not broken |
| Scholarship → Finance | REAL | Finance owns `scholarship_schemes`/`student_scholarships`; Finance remains money owner | PASS — `scholarshipApplications.e2e.test.ts` (row-locked idempotent sanction) |
| Student Services → Finance | REAL | Certificate/request fee fields + Finance demand linkage | PASS — `studentRegistrarServices.e2e.test.ts` (Finance-clearance-gated issuance) |
| Research → Finance | PARTIAL | `SEED_GRANT` project type exists in Research; no proven Finance disbursement handoff built (correctly, per Phase 6's own deferral of grants administration) | Not in Gate 2 minimum set; not re-investigated |
| Procurement → Stores | REAL | Same module (`procurement`); GRN posts directly to stock ledger | PASS — `procurement.e2e.test.ts` (GRN idempotency, concurrency-safe) |
| Procurement → Asset | REAL | GRN asset handoff wired to `assetManagement` (Phase 0/1) | PASS — `procurement.e2e.test.ts` (Phase 1 asset handoff, concurrency-safe) |
| Assets → Maintenance | REAL | Preventive-maintenance plans read from `campus_assets` (Phase 3) |
| Lab → Stores | NOT_WIRED (acknowledged) | Lab's local `lab_stock_items`/`lab_stock_movements` remain unbridged to canonical `procurement_*` — B4, carried forward |
| Lab → Maintenance | REAL | `lab_faults.maintenance_ref`/`lab_repairs.maintenance_ref`, idempotent, no duplicate fault |
| Hostel → Maintenance | REAL | `source_module=HOSTEL` infrastructure requests enter central Maintenance |
| Library → Maintenance | REAL | `source_module=LIBRARY` facility/equipment requests |
| Transport → Maintenance | BOUNDARY_VERIFIED | Only facility/workshop/IT requests enter central Maintenance; vehicle operational maintenance stays in Transport |
| Events → Venue/Resources | REAL | Events (Phase 11) reuses the shared `rooms` master for booking/conflict checking | PASS — `events.e2e.test.ts` |
| Timetable/Room → Events | REAL (Gate 2 addition — not previously its own row) | `events/booking.ts` imports `roomAcademicOccupancy` from `../timetable/service.js` and checks it as one of three conflict layers before confirming a booking — Events cannot double-book a live timetabled room | PASS — `events.e2e.test.ts` ("blocks a room occupied by the live academic timetable without writing timetable data") |
| Events → Finance | PARTIAL | Event-expense tracking listed NOT_CONFIGURED in Phase 11's own limitations | Not in Gate 2 minimum set |
| Events → Document Engine | REAL (Gate 2 addition — not previously its own row) | `events/service.ts:9-10,1068,1085,1094,1096` calls `documentEngine.uploadDocument`/`listDocumentsForEntity`/`getDocumentMetadata`/`downloadDocument` for event evidence | PASS — code-confirmed |
| Events → Workflow Engine | REAL (Gate 2 addition — not previously its own row) | `events/service.ts:6-8` calls `workflowEngine`'s `createDefinition`/`publishDefinition`/`startInstance`/`performAction` for event approval | PASS — `events.e2e.test.ts` (self-approval blocked, exactly-one-instance under concurrent duplicate submission) |
| Research → Workflow Engine | **REAL** (was "NOT_WIRED (by design)" — Gate 2 factual correction) | `research/service.ts:6-7,156,162,333` actually calls `workflowEngine`'s `createDefinition`/`publishDefinition`/`startInstance`/`performAction` for proposal review/award; this row was stale — Research adopted Workflow Engine as new work, exactly as the engine's own "new work only" design intends | PASS — `research.e2e.test.ts` + `workflowEngine.e2e.test.ts` (self-approval blocked, row-locked) |
| IQAC → evidence sources | REAL (projection) | `attainment`/`copo`/`coEvaluation`/`gapAnalysis` feed IQAC evidence; IQAC does not duplicate source data | Not in Gate 2 minimum set; no contrary evidence found |
| IQAC committees → Document Engine | REAL | `iqac_meetings.minutes_document_id` FK reuses `documentEngine` | PASS — `iqac.e2e.test.ts` + `documentEngine.e2e.test.ts` |
| Student Leave → Attendance | REAL | HR/academic leave types (including `OD`) feed attendance status derivation (`attendanceEngine.ts`) | PASS — `lecturerPortal.e2e.test.ts` (ABSENT→EXCUSED, idempotent) |
| Student Leave → Parent | REAL | Parent portal reads leave/attendance through canonical source | PASS — `lecturerPortal.e2e.test.ts` + `parent.e2e.test.ts` |
| Student Leave → Hostel | PARTIAL | Hostel's own gate/outpass system is separate from the academic leave engine (deliberate, different concern) |
| Examination → Student academic record | REAL | Results/backlogs feed Mentoring's risk engine and Student 360 view |
| T&P → Student/Alumni | REAL (T&P→Student); BOUNDARY_VERIFIED (Alumni) | `student_projects`/`student_achievements` are Placement-owned and student-linked; Alumni opportunities are moderated, no confidential T&P workflow crosses into Alumni APIs |
| Mentoring → Attendance/CIE/Assignments | REAL | Risk engine consumes attendance policy, CIE/backlogs, assignment overdue counts |
| Mentoring → T&P | REFERRAL | Minimum-necessary-context referral only, by design |
| No-Due aggregator → Library/Hostel/Transport | REAL | `finance/clearance.ts` calls each module's `getXNoDueStatus` live |
| No-Due aggregator → Lab | PARTIAL (hardcoded) | `LAB` key is hardcoded `'PENDING_INTEGRATION'` |
| No-Due aggregator → Examination, Stores | NOT_WIRED | Neither module has a key in the aggregator at all — C3, carried forward |
