# Student LMS E2E seed

Deterministic development/test data for the class-based Student LMS.

## Guard

```bash
npm run seed:student-lms-e2e
```

Refuses to run when `NODE_ENV=production` unless `ALLOW_TEST_SEED=true`.

## Prerequisites

- Demo / academic master data already present (college id `4` / VVIET)
- Migrations applied (`npm run migrate`)

## What it creates

- Academic Class `SX-E2E-CSE-3A` — CSE Semester III Section A (2026–27)
- Historical class `SX-E2E-CSE-2A` (COMPLETED) for Academic History
- Subjects: Data Structures, OOP with Java, Mathematics, Digital Design
- Faculty mappings + coordinator (`anita@vviet.edu.in`)
- Modules/topics, assignment, quiz, IA result, PYQ, announcement, attendance session
- Student accounts with password hashes

## Credentials (local/dev only)

Password for all E2E students: `Student@123`

| Role | USN | Email |
|---|---|---|
| Approved | `4VV24CS001` | `e2e.approved@student.skillonx.test` |
| Pending | `4VV24CS002` | `e2e.pending@student.skillonx.test` |
| Rejected | `4VV24CS003` | `e2e.rejected@student.skillonx.test` |
| Wrong section (B) | `4VV24CS004` | `e2e.sectionb@student.skillonx.test` |
| Inactive | `4VV24CS005` | `e2e.inactive@student.skillonx.test` |
| Approved #2 (absent sample) | `4VV24CS006` | `e2e.absent@student.skillonx.test` |

Faculty: `anita@vviet.edu.in` / `Password123`

Join URL is printed by the seed (uses `academic_class_links.code`).

## Attendance

Class roll is always approved `academic_class_enrollments` for that Academic Class.

Policy defaults (college-configurable in `college_attendance_policies`):

- minimum attendance: **85%**
- LATE counts as present
- EXCUSED counts in the denominator

Student standing labels: Good standing / Below recommended level / Attendance shortage.

## Acceptance login
2. Sign in as approved student
3. Dashboard shows CSE Semester III Section A and four subjects
4. Open Data Structures → modules/topics/assignment/quiz/assessments/papers/attendance
