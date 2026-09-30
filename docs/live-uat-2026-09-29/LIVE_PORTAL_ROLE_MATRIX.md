# LIVE PORTAL ROLE MATRIX - BLOCKER CLOSURE

Evidence: `live_probe_latest.json` and `role_expansion_retest.json`.

Production contains 24 distinct active staff role values. Student, parent, alumni, and applicant are separate authentication identities, giving 28 applicable identity roles. The earlier 22-role denominator was therefore incomplete; aliases were not manufactured or silently removed.

## Tested Roles

| Role | Login | Landing/navigation | Forbidden Platform API | Result |
|---|---|---|---|---|
| SUPER_ADMIN | PASS | `/platform` PASS | Allowed by design | PASS |
| COLLEGE_ADMIN | PASS | `/admin` PASS | Allowed by design | PASS |
| FACULTY | PASS | `/dashboard` PASS | 403 | PASS |
| MANAGEMENT | PASS | `/management` PASS | 403 | PASS |
| STUDENT | PASS | `/lms` PASS | 403 | PASS with DEF-001 legacy URL |
| PARENT | PASS | `/parent` PASS | Portal-isolated | PASS with DEF-002 legacy URL |
| ALUMNI | PASS | `/alumni` PASS | Portal-isolated | PASS |
| TRANSPORT_OFFICER | PASS | `/transport` PASS | 403 | PASS |
| WARDEN | PASS | `/hostel` PASS | 403 | PASS |
| HR_MANAGER | PASS | `/hr/admin` PASS | 403 | PASS |
| ACCOUNTANT | PASS | `/accountant` PASS | 403 | PASS |
| ADMISSIONS_OFFICER | PASS | `/admissions` PASS | 403 | PASS |
| COE | PASS | `/coe` PASS | 403 | PASS |
| GRIEVANCE_OFFICER | PASS | `/student-services/grievances` PASS | 403 | PASS |
| HOD | PASS | `/dashboard` PASS | 403 | PASS |
| LAB_ASSISTANT | PASS | `/lab` PASS | 403 | PASS with DEF-005 deep-route failure |
| LIBRARIAN | PASS | `/library` PASS | 403 | PASS |
| MAINTENANCE_MANAGER | PASS | `/maintenance/manager` PASS | 403 | PASS |
| OFFICE_ADMIN | PASS | `/office` PASS | 403 | PASS |
| PRINCIPAL | PASS | `/dashboard` PASS | 403 | PASS |
| PLACEMENT_OFFICER | PASS | `/dashboard` PASS | 403 | PASS |
| IQAC_COORDINATOR | PASS | `/iqac` PASS | 403 | PASS |

## Remaining Roles

| Role | Status |
|---|---|
| ADMISSIONS_MANAGER | NOT TESTED in live role expansion |
| MAINTENANCE_STAFF | NOT TESTED |
| IT_SUPPORT | NOT TESTED |
| STUDENT_WELFARE_OFFICER | NOT TESTED |
| OFFICE_SUPERINTENDENT | NOT TESTED |
| APPLICANT | NOT TESTED in this campaign |

Coverage result: **22 / 28 role types passed authentication/landing/RBAC smoke**. This is not 22/22 complete role certification because the production inventory is larger than the earlier denominator and representative CRUD/tenant-scope checks were halted after the P1 finding.

Logout result: client navigation PASS; server token invalidation FAIL (DEF-007).
