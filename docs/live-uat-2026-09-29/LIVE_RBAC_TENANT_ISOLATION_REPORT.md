# LIVE RBAC AND TENANT ISOLATION REPORT

Evidence: `live-uat-evidence/json/live_probe_latest.json`, `tenant_isolation_retest.json`, and `finance_cross_tenant_archive_probe.json`.

## RBAC

- Original sampled role gates: PASS.
- Twelve additional staff roles: login, `/me`, forbidden Platform API, and landing render all PASS.
- Cumulative distinct role types smoke-tested: 22.

## Tenant Setup

Production initially had one active tenant. A dedicated second tenant, `LIVEQA_20260929_B`, was created under the campaign's authorized QA scope, used only for isolation tests, and archived afterward.

## Object Tests

| Domain | Direction | Action | Result |
|---|---|---|---|
| Faculty | A to B | Direct read | PASS: 404 |
| Faculty | A to B | Direct PATCH of QA record | PASS: 404; no mutation |
| Faculty | A to B | Neighbor-ID enumeration | PASS: own-tenant ID readable, B/nonexistent IDs 404 |
| Student | B to A | Query-parameter tenant tampering | PASS: 200 with empty B-scoped list |
| Admissions | B to A | Direct application read | PASS: 404 |
| Examination | B to A | Direct examination read | PASS: 404 |
| Transport | B to A | Direct route read | PASS: 404 |
| Alumni | B to A | Direct profile 360 read | PASS: 404 |
| Platform admin | B to A | Tenant administration read | PASS: 403 |
| Finance detail | B to A | Direct fee-structure read | FAIL: 500 instead of safe 404; no data returned |
| Finance archive | B to A | Tenant-scoped archive request | **FAIL/P1: 200 returned Tenant A metadata**; Tenant A row remained ACTIVE |
| Hostel resident | A/B | Direct resident ID | BLOCKED: no live resident existed in either safe QA scope, and mutations stopped after P1 confirmation |

## Classification

The confirmed finance behavior is an unauthorized cross-tenant record read, API-level tenant bypass, and IDOR (categories C, G, and H). It is not cosmetic and it is not merely incomplete testing.

Result: **FAIL (P1)**. Tenant isolation cannot pass until DEF-004 is deployed and live-retested, DEF-006 returns 404, and the remaining safe object domains are completed.
