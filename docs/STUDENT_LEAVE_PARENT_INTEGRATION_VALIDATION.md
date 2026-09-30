# Student Leave Parent Integration Validation

## 1. Existing Architecture Discovered

| Capability | Backend | Student | Parent | Faculty | Warden | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Academic leave / permission source of truth | `student_service_requests` + `student_request_actions` | Student Services request APIs | Added linked-child leave APIs | Mentor/coordinator inbox | N/A | PARTIAL |
| Parent identity and child relationship | `parent_users`, `parent_student_links` | N/A | Existing parent portal | N/A | Reused where needed | COMPLETE |
| Mentor workflow | `mentor_assignments`, relationship-scoped request inbox | Timeline visible | Parent sees leave timeline | Existing mentor inbox/action | N/A | COMPLETE |
| Class coordinator workflow | Academic class coordinator mapping | Timeline visible | Parent sees leave timeline | Existing coordinator action path | N/A | COMPLETE |
| HOD / Principal escalation | Workflow role support exists | Timeline visible | Parent sees timeline | Role-gated staff action | N/A | PARTIAL |
| Attendance reconciliation | `attendance_sessions`, `attendance_records`, `attendance_record_audits` | Reflected in attendance views | Parent attendance read-only | Faculty remains factual recorder | N/A | PARTIAL |
| Short permission session narrowing | Attendance reconciliation now honors date + period/time filters | Request form supports fields | Parent can view/submit fields | Faculty approval path | N/A | PARTIAL |
| Hostel leave / outing | `hostel_leave_requests`, `hostel_outpasses` | Existing hostel student APIs | Parent campus-services read-only | N/A | Existing warden workflow | PARTIAL |
| Linked academic + hostel status | Link table added | Not yet surfaced in web | Returned in parent detail when linked | N/A | Existing hostel state independent | PARTIAL |
| Evidence security | Existing service attachment access | Existing download authorization | Parent sees only `ALL` visibility | Existing staff/student gates | N/A | PARTIAL |
| Notifications | Student and hostel notification infra exists | Existing student notices | Parent notices existing read-only | Existing staff flows | Existing hostel notifications | PARTIAL |
| Web parity | Existing Student/Parent/Faculty pages | Not fully updated this pass | Not fully updated this pass | Existing lecturer page | Existing warden portal | PARTIAL |
| Mobile parity | No mobile app code found in this workspace | N/A | N/A | N/A | N/A | NOT WIRED |

## 2. Source Of Truth

Academic leave and permission remain owned by Student Academic Services:
`student_service_requests`, `student_service_request_types`, `student_request_workflows`, and `student_request_actions`.

Hostel movement remains owned by Hostel:
`hostel_leave_requests` and `hostel_outpasses`.

Attendance remains owned by Attendance:
`attendance_sessions`, `attendance_records`, and `attendance_record_audits`.

Approved leave still does not become `PRESENT`. Reconciliation only transitions existing `ABSENT` records to `EXCUSED`, with audit history.

## 3. Policy Model

Added `student_leave_policies` as tenant-scoped policy configuration. Default rows cover:

- `SHORT_PERMISSION`
- `NORMAL_LEAVE`
- `MULTI_DAY_LEAVE`
- `MEDICAL_LEAVE`
- `RETROSPECTIVE_LEAVE`
- `OFFICIAL_DUTY`

Runtime routing derives the chain from request type, leave kind, duration, and requester type. Parent action is skipped for parent-initiated requests and for official duty by default. Principal is supported by policy but not inserted into ordinary leave by default.

## 4. Parent Workflow

Parent leave APIs were added under the existing parent portal. They verify `parent_student_links` for every read, submit, and action.

Implemented:

- Parent lists linked child leave/permission requests.
- Parent views request details and timeline.
- Parent approves/declines only requests awaiting a `PARENT` workflow step.
- Parent can submit leave on behalf of a linked child where policy permits.
- Request provenance is preserved with `requester_type = PARENT` and `requester_parent_user_id`.
- Parent A cannot act on Parent B's child.

## 5. Mentor / Coordinator / HOD

Mentor and coordinator actions reuse the existing relationship-scoped staff engine. A faculty member cannot approve just because they teach somewhere else; `canActAsRole` still verifies mentor or coordinator relationship for the student.

HOD and Principal remain supported as workflow actors. HOD is policy-driven for medical, retrospective, and multi-day leave. Principal is policy-driven only and is not part of default ordinary leave.

## 6. Attendance Reconciliation

Reconciliation still acts only on existing attendance rows:

- `ABSENT` to `EXCUSED`
- never `ABSENT` to `PRESENT`
- no fake attendance rows
- audit row written to `attendance_record_audits`
- re-run is idempotent

Short permissions now narrow candidates by:

- `fromPeriod` / `toPeriod`, or
- `fromTime` / `toTime`

when those fields are present.

## 7. Hostel Linkage

Added `student_leave_linked_requests` and `hostel_correlation_id` support for linking records without merging ownership. Academic approval and hostel approval remain independent. This pass did not add automatic hostel request creation from the academic form; current linkage is available for integration by correlation/reference.

## 8. RBAC, IDOR, Evidence, Audit

Implemented and validated:

- Parent linked-child authorization.
- Parent unrelated child denial.
- Parent action denial when request is not awaiting parent action.
- Mentor/coordinator relationship-scoped approval.
- Attendance audit for reconciliation.
- Service audit now supports `PARENT` actor type.
- Parent evidence view is restricted to attachments visible to `ALL`.

## 9. Focused Tests

Command:

```bash
DATABASE_URL='mysql://survey:survey@127.0.0.1:3307/skillonx_survey' JWT_SECRET='test-secret-for-local-e2e' node --import tsx --test --test-concurrency=1 src/modules/parent/parent.e2e.test.ts src/modules/studentServices/studentServices.e2e.test.ts src/modules/studentServices/lecturerPortal.e2e.test.ts src/modules/attendance/attendance.e2e.test.ts src/modules/hostel/hostel.e2e.test.ts
```

Result:

```text
tests 93
suites 7
pass 93
fail 0
```

API TypeScript build:

```bash
npm run build -w @skillonx/survey-api
```

Result: PASS.

Migration:

```bash
npm run migrate -w @skillonx/survey-api
```

Result: PASS.

## 10. Regression

Focused backend regressions passed for:

- Parent portal
- Student Services
- Lecturer/Mentor/Coordinator portal
- Attendance
- Hostel/Warden

Complete backend regression, web validation, responsive QA, and mobile validation were not run in this pass.

## 11. Known Limitations

- Web UI parity for new parent leave actions is not fully implemented in this pass.
- Mobile parity is not implemented; no mobile app surface was found in this workspace scan.
- Automatic academic leave plus hostel leave creation is not wired yet; the schema supports correlation without merging records.
- Document evidence policy enforcement is limited to existing attachment visibility/authorization.
- Complete repository backend regression was not run.
- Full responsive QA was not run.

## 12. Final Decision

STUDENT LEAVE & PERMISSION INTEGRATION — NOT FROZEN

Remaining blockers:

- Parent/student/faculty web surfaces for the new parent leave actions need full parity validation.
- Mobile parity needs implementation or a confirmed product-scope exclusion.
- Automatic hostel linked-request creation from academic leave is not wired.
- Complete backend regression, web validation, mobile validation, and responsive QA remain pending.
