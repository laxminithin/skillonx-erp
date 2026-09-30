# Examination Security Model

## Principles

- One examination engine serves all colleges.
- Institution governance determines capability ownership.
- University-owned workflows cannot be executed as institutional workflows.
- Frontend visibility is advisory; service/API checks are authoritative.

## Enforcement

- RBAC: COE owns operational exam-office permissions. Admin, Principal, HOD, and Faculty do not inherit COE mutation rights.
- Tenant isolation: exam queries are scoped by `college_id`.
- Object checks: exams, exam subjects, marks, seats, and results verify college ownership.
- Capability checks: `assertInstitutionOwnsCapability` blocks university-owned workflows for VTU-affiliated colleges.
- QP confidentiality: COE receives question-paper readiness metadata only; confidential content remains guarded by question-paper ownership checks.
- Audit: core mutations use `examination_audit_log`.

## Known Security Gaps

- Strong room and script custody evidence storage is not implemented.
- MPC evidence access control is not implemented because the MPC case engine is missing.
- Maker-checker approval for high-risk unfreeze/result correction is incomplete.
- Full statutory document authorization and QR verification are missing.

