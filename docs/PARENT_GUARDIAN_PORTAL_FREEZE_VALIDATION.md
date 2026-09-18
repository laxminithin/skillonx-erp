# Parent / Guardian Web Portal Freeze Validation

Audit date: 2026-09-15  
Repository: `/Users/nithinkswamy/Documents/GitHub/Survey`

## Executive Summary

Final decision: **FROZEN**

The Parent / Guardian Web Portal is implemented as a web-only, separately authenticated, relationship-authorized portal over existing ERP source-of-truth modules. Parent access is never based on student identifiers alone; every parent endpoint enforces:

`authenticated parent -> active verified parent_student_link -> same-college active student -> domain source rules`

No mobile Parent Portal work was started.

## Implementation Summary

- Added parent identity and verified relationship schema:
  - `parent_users`
  - `parent_student_links`
  - `parent_audit_log`
- Added parent JWT kind and `requireParentAuth`.
- Added parent authentication API:
  - `/api/parent-auth/login`
  - `/api/parent-auth/forgot-password`
  - `/api/parent-auth/me`
  - `/api/parent-auth/profile`
  - `/api/parent-auth/change-password`
- Added parent portal APIs under `/api/parent`.
- Added parent web routes:
  - `/parent/login`
  - `/parent`
  - `/parent/academics`
  - `/parent/attendance`
  - `/parent/results`
  - `/parent/fees`
  - `/parent/campus`
  - `/parent/notices`
  - `/parent/profile`
- Added responsive parent Playwright QA and screenshot evidence.

## Architecture

Parent identity reuses the existing password/JWT/session approach, but parent accounts are stored separately from faculty and student accounts. A parent JWT cannot pass faculty, student, or applicant route guards.

All child data goes through `assertParentCanAccessStudent(actor, studentId)`, which verifies:

- parent account id
- college id
- active parent account
- verified parent identity
- active `parent_student_links` row
- `verification_state = VERIFIED`
- active student
- same college

The portal is a read-mostly experience layer. It reuses canonical modules rather than implementing duplicate engines:

- Attendance: `studentAttendanceSummary`, `studentSubjectAttendance`
- Results: `studentResults`, `studentAcademicRecord`
- Finance: demands, payments, receipts, scholarships, refunds, no-due status
- Hostel: student hostel access, room, dues
- Transport: student transport access, assignment, pass, dues
- Mentoring: only `PARENT_VISIBLE` parent interactions

## Implementation / Audit Map

| Parent requirement | Existing source | Reuse / extend / new | Security boundary |
| --- | --- | --- | --- |
| Parent login/session | Existing JWT/password pattern | Extend with `kind: parent` | `requireParentAuth`, verified active account |
| Parent profile | New `parent_users` | New identity table using existing password policy | Parent self-profile only; relationship edits not exposed |
| Parent-student relationship | No canonical parent link found | New `parent_student_links` | Active + verified + same college required |
| Multi-child support | Student master + child context | New child selector over verified links | Every API independently checks selected student |
| Attendance | Attendance module | Reuse | Parent cannot mutate; linked student only |
| CIE/academics | Student performance / academic record | Reuse | Parent-visible DTO only |
| Results | Examination result service | Reuse | Existing published-result filter retained |
| Finance | Finance module | Reuse | Receipt and fee reads require linked child ownership |
| Receipts | Finance receipt service | Reuse | Receipt IDOR hidden/denied by student ownership |
| Hostel | Frozen Hostel module | Reuse | Read-only student access surfaces only |
| Transport | Frozen Transport module | Reuse | Read-only student access surfaces only |
| Notices | Student notifications when present | Reuse defensively | Student + parent audience only; same child gate |
| Mentoring | Mentoring parent interactions | Reuse/extend by visibility convention | Only `PARENT_VISIBLE`; confidential rows filtered |
| Grievance/welfare/counselling | Student Services / Grievance engine | Protected by absence from parent APIs | Not exposed |
| HR/faculty/admin/T&P restricted | Existing protected staff routes | Protected by auth kind separation | Parent JWT cannot satisfy staff guards |

## Feature Matrix

| Capability | Result |
| --- | --- |
| Parent identity/authentication | PASS |
| Verified parent-student link | PASS |
| Multi-child support | PASS |
| Tenant isolation | PASS |
| Dashboard | PASS |
| Attendance | PASS |
| Academics/CIE snapshot | PASS |
| Published results | PASS |
| Finance/fees | PASS |
| Receipt ownership | PASS |
| Hostel visibility | PASS |
| Transport visibility | PASS |
| Notices | PASS |
| Parent profile | PASS |
| Controlled mentoring exposure | PASS |
| Confidential mentoring/grievance/welfare/HR/T&P protection | PASS |
| Concurrency/idempotency | N/A: portal exposes no mutable relationship verification or payment initiation surface |

## Security Matrix

Actual targeted backend suite: `parent guardian portal E2E` -> **14/14 PASS**

| Actor | Resource | Expected | Tested result |
| --- | --- | --- | --- |
| Parent A | Child A | ALLOW | PASS |
| Parent A | Child B | DENY | PASS |
| Parent A | Inactive linked student | DENY | PASS |
| Multi-child Parent | Child C | ALLOW | PASS |
| Multi-child Parent | Child D | ALLOW | PASS |
| Parent College A | Student College B | DENY | PASS |
| Parent A | Child A attendance | ALLOW | PASS |
| Parent A | Child B attendance | DENY | PASS |
| Parent A | Published results | ALLOW | PASS |
| Parent A | Child B results | DENY | PASS |
| Parent A | Child A finance | ALLOW | PASS |
| Parent B | Child A receipt ID | DENY / hidden | PASS |
| Parent A | Hostel/transport for Child A | ALLOW | PASS |
| Parent A | Hostel/transport for Child B | DENY | PASS |
| Parent A | Parent-visible mentoring item | ALLOW | PASS |
| Parent A | Confidential mentoring item | DENY | PASS |
| Parent A | Grievance/welfare/HR/faculty/T&P admin surfaces | DENY / absent | PASS |

## Test Evidence

### Targeted Parent Backend

Command:

`node --import tsx --test --test-concurrency=1 src/modules/parent/parent.e2e.test.ts`

Result:

- Suites: 1
- Tests: 14
- Passed: 14
- Failed: 0

### Broad Backend Regression

Command:

`npm test --workspace apps/api`

Result:

- Suites: 201
- Tests: 1190
- Passed: 1190
- Failed: 0
- Skipped: 0

### Responsive QA

Command:

`npx playwright test e2e/parent.responsive.spec.ts --project=1920x1080 --no-deps`

Result:

- Playwright tests: 1/1 PASS
- Experience-viewport checks: 72/72 PASS
- Viewports: 360x740, 390x844, 430x932, 768x1024, 1024x768, 1366x768, 1440x900, 1920x1080
- Experiences: dashboard, multi-child switching, attendance, academics/CIE, results, fees, campus services, notices, profile
- Checks: no horizontal overflow, visible navigation, route content, child switching, no fatal console/page/API errors, restricted admin controls absent

### Screenshots

Screenshot directory: `apps/web/e2e/screenshots/parent`

Count: 21

Captured states:

- dashboard
- multi-child switcher
- attendance
- academics/CIE
- results
- fees
- campus services

Each captured at:

- 1920x1080
- 1024x768
- 390x844

### Builds

- API build: PASS (`npm run build --workspace apps/api`)
- Web build: PASS (`npm run build --workspace apps/web`)

### Migration Status

Command:

`npm --workspace apps/api exec knex -- --knexfile knexfile.cjs migrate:status`

Result:

- Completed migrations: 73
- Pending migrations: 0
- Current migration includes `20261002100000_parent_guardian_portal.cjs`

## Performance

Local API sampling against seeded parent account, 10 samples per endpoint:

| Endpoint | min | p50 | p95 | max |
| --- | ---: | ---: | ---: | ---: |
| dashboard | 8.8ms | 10.0ms | 18.9ms | 18.9ms |
| attendance | 2.7ms | 4.0ms | 5.7ms | 5.7ms |
| results | 1.2ms | 1.4ms | 2.6ms | 2.6ms |
| fees | 5.8ms | 7.4ms | 9.2ms | 9.2ms |
| notices | 1.6ms | 1.8ms | 3.0ms | 3.0ms |
| campus services | 6.2ms | 8.1ms | 9.1ms | 9.1ms |

No pathological local N+1 behavior was observed in these parent wrapper endpoints.

## Known Limitations

- Parent relationship creation/verification admin workflow is not exposed as a web admin screen in this phase; QA links are seeded by the backend suite.
- Online payment initiation was not exposed to parents; Finance remains canonical and payment gateway work is intentionally not duplicated.
- Notices are read from `student_notifications` when available and filtered defensively; there is no new parent announcement engine.
- Mentoring parent visibility currently uses `mentoring_parent_interactions.visibility = PARENT_VISIBLE`; confidential meetings, welfare notes, and private mentor notes remain excluded.
- No mobile Parent Portal was implemented.

## Freeze Gate

| Gate | Result |
| --- | --- |
| Parent identity/authentication | PASS |
| Verified parent-student linking | PASS |
| Multi-child support | PASS |
| Tenant isolation | PASS |
| Attendance | PASS |
| Released academics/CIE | PASS |
| Released results | PASS |
| Finance | PASS |
| Receipts | PASS |
| Notices | PASS |
| Hostel integration | PASS |
| Transport integration | PASS |
| Controlled mentoring exposure | PASS |
| Confidential mentoring protection | PASS |
| Grievance/welfare/counselling protection | PASS |
| HR/faculty protection | PASS |
| T&P protection | PASS |
| IDOR protection | PASS |
| Direct-route/auth-kind protection | PASS |
| Targeted Parent E2E | PASS |
| Security matrix | PASS |
| Responsive QA | PASS |
| Screenshot evidence | PASS |
| Performance evidence | PASS |
| API build | PASS |
| Web build | PASS |
| Migrations current | PASS |
| Complete backend regression | PASS |

## Final Decision

**PARENT / GUARDIAN WEB PORTAL — FROZEN**

Next module: **Alumni Management — Web**
