# LIVE SECURITY VALIDATION REPORT - BLOCKER CLOSURE

Evidence: `security_retest.json`, `tenant_isolation_retest.json`, `finance_cross_tenant_archive_probe.json`, and `role_expansion_retest.json`.

| ID | Check | Result | Severity | Evidence |
|---|---|---|---|---|
| SEC-001 | HTTP to HTTPS | PASS |  | HTTP root returns 301 to HTTPS |
| SEC-002 | API security headers | PASS |  | Helmet headers include HSTS, CSP/frame-ancestors, X-Content-Type-Options, Referrer-Policy, and X-Frame-Options |
| SEC-003 | SPA HTML security headers | FAIL | P2 | Root HTML omits those controls and exposes Plesk; DEF-003 |
| SEC-004 | API CORS trusted origin | PASS |  | Trusted origin receives exact ACAO and credentials |
| SEC-005 | API CORS untrusted origin | PASS |  | Untrusted GET/preflight receives no ACAO |
| SEC-006 | Invalid/malformed login denial | PASS |  | 400/401 |
| SEC-007 | Protected direct routes before login | PASS |  | Redirect to login |
| SEC-008 | Sampled role API authorization | PASS |  | Original matrix plus 12 expanded roles |
| SEC-009 | Tenant/IDOR object substitution | FAIL | P1 | Confirmed cross-tenant Finance metadata read; DEF-004 |
| SEC-010 | Cross-tenant detail safe error | FAIL | P2 | Finance detail returned 500, not 404; DEF-006 |
| SEC-011 | Logout invalidation | FAIL | P2 | UI logout succeeds but old JWT remains accepted; DEF-007 |
| SEC-012 | Secure/HttpOnly/SameSite cookies | N/A |  | Authentication uses bearer JWT in localStorage; no auth cookie issued |
| SEC-013 | Upload authorization/content validation | BLOCKED |  | Production mutation stopped after confirmed P1 |
| SEC-014 | Sensitive authenticated cache policy | BLOCKED |  | Full endpoint matrix not completed before security stop |
| SEC-015 | Error leakage | PASS sampled |  | Finance failure returned generic error; no SQL/stack/token exposed |

Security result: **FAIL**. The live cross-tenant disclosure alone prevents approval. The missing document CSP is especially relevant because bearer tokens are stored in localStorage.

No bearer tokens, passwords, temporary tenant credentials, or returned finance content are stored in evidence.
