# LIVE DEFECT REGISTER - BLOCKER CLOSURE

Target: https://campus.skillonx.com  
Retest date: 2026-09-29

## Summary

| Severity | Open in production | Source fixed, awaiting deployment |
|---|---:|---:|
| P0 | 0 | 0 |
| P1 | 1 | 1 |
| P2 | 4 | 1 |
| P3 | 2 | 2 |

No defect is resolved until its fix is deployed and passes live retest.

## DEF-001

| Field | Detail |
|---|---|
| DEFECT ID | DEF-001 |
| TITLE | Historical student Courses URL renders the SPA not-found page |
| MODULE | Student LMS |
| URL | `/lms/courses` |
| ROLE | STUDENT |
| REPRODUCTION STEPS | Log in as the QA student and directly open `/lms/courses`. |
| EXPECTED | Render Subjects or redirect to `/lms/subjects`. |
| ACTUAL | Deployed bundle renders Page not found. |
| ROOT CAUSE | The canonical route is `/lms/subjects`; no compatibility route exists in the deployed bundle. This is not an nginx fallback failure. |
| SECURITY IMPACT | None observed. |
| TENANT IMPACT | None. |
| DATA INTEGRITY IMPACT | None. |
| CURRENT SEVERITY | P2 |
| CORRECT SEVERITY | P3: compatibility/deep-link defect; the canonical menu route works. |
| FIX | Added an authenticated compatibility redirect to `/lms/subjects`. |
| DEPLOYMENT STATUS | SOURCE FIXED; NOT DEPLOYED. Live asset bundle differs from the local build. |
| LIVE RETEST | FAIL pending deployment. |
| REGRESSION RESULT | Local authenticated browser simulation PASS; web production build PASS. |

## DEF-002

| Field | Detail |
|---|---|
| DEFECT ID | DEF-002 |
| TITLE | Historical parent Finance URL renders the SPA not-found page |
| MODULE | Parent Portal |
| URL | `/parent/finance` |
| ROLE | PARENT |
| REPRODUCTION STEPS | Log in as the QA parent and directly open `/parent/finance`. |
| EXPECTED | Render Fees or redirect to `/parent/fees`. |
| ACTUAL | Deployed bundle renders Page not found. |
| ROOT CAUSE | The canonical route is `/parent/fees`; no compatibility route exists in the deployed bundle. This is not an nginx fallback failure. |
| SECURITY IMPACT | None observed. |
| TENANT IMPACT | None. |
| DATA INTEGRITY IMPACT | None. |
| CURRENT SEVERITY | P2 |
| CORRECT SEVERITY | P3: compatibility/deep-link defect; the canonical menu route works. |
| FIX | Added `/parent/finance` as an authenticated alias for `ParentFeesPage`. |
| DEPLOYMENT STATUS | SOURCE FIXED; NOT DEPLOYED. |
| LIVE RETEST | FAIL pending deployment. |
| REGRESSION RESULT | Local authenticated browser simulation PASS; web production build PASS. |

## DEF-003

| Field | Detail |
|---|---|
| DEFECT ID | DEF-003 |
| TITLE | SPA HTML response lacks browser security headers |
| MODULE | Production nginx/Plesk configuration |
| URL | `/` and SPA HTML routes |
| ROLE | Anonymous/all browser users |
| REPRODUCTION STEPS | Inspect response headers for `GET /`; compare with `GET /api/health`. |
| EXPECTED | HSTS, CSP with frame protection, X-Content-Type-Options, Referrer-Policy, suitable Permissions-Policy, and no unnecessary platform disclosure. |
| ACTUAL | SPA HTML omits these headers, exposes `x-powered-by: PleskLin`, and sends wildcard ACAO. The Express API is separately hardened by Helmet and correctly withholds ACAO from untrusted origins. |
| ROOT CAUSE | The SPA is served by nginx/Plesk outside Express middleware; no deployable web-server configuration exists in this repository. |
| SECURITY IMPACT | Missing document CSP/frame protections and HSTS on the HTML response increase browser-side attack impact. Wildcard CORS is limited to public HTML, not the authenticated API. |
| TENANT IMPACT | No direct tenant bypass demonstrated. |
| DATA INTEGRITY IMPACT | No direct corruption demonstrated. |
| CURRENT SEVERITY | P2 |
| CORRECT SEVERITY | P2. |
| FIX | Requires Plesk/nginx configuration; do not copy the API CSP blindly because the SPA currently loads Google Fonts. |
| DEPLOYMENT STATUS | NOT FIXED; hosting access/configuration unavailable. |
| LIVE RETEST | FAIL. |
| REGRESSION RESULT | API headers/CORS PASS; SPA header gate FAIL. |

## DEF-004

| Field | Detail |
|---|---|
| DEFECT ID | DEF-004 |
| TITLE | Cross-tenant finance fee-structure metadata disclosure on archive endpoint |
| MODULE | Finance / tenant isolation |
| URL | `POST /api/finance/fee-structures/:id/archive` |
| ROLE | Tenant B COLLEGE_ADMIN targeting a Tenant A fee structure |
| REPRODUCTION STEPS | Create dedicated Tenant B; authenticate its admin; call archive for Tenant A QA fee-structure ID 1. |
| EXPECTED | 404 safe denial with no data returned and no mutation. |
| ACTUAL | HTTP 200 returned Tenant A fee-structure metadata. Tenant A record remained ACTIVE because the UPDATE itself was tenant-scoped. |
| ROOT CAUSE | The UPDATE used `{id, college_id}` but the post-update readback used only `{id}` and no precondition rejected a missing tenant-owned row. |
| SECURITY IMPACT | Confirmed unauthorized cross-tenant record read and API-level IDOR. |
| TENANT IMPACT | Category C/G/H: cross-tenant record read, API tenant bypass, IDOR. No cross-tenant mutation was observed. |
| DATA INTEGRITY IMPACT | Tenant A record remained unchanged. An audit row was created under the QA tenant for the denied-in-principle operation. |
| CURRENT SEVERITY | New finding. |
| CORRECT SEVERITY | P1. Unresolved production cross-tenant access blocks freeze. |
| FIX | Added tenant-owned precheck, safe AppError 404, and tenant-scoped readback; added regression proving neither read nor mutation. Hardened fee-head update scoping in the same review. |
| DEPLOYMENT STATUS | SOURCE FIXED; NOT DEPLOYED. |
| LIVE RETEST | FAIL on deployed production; retest required after deployment. |
| REGRESSION RESULT | API build PASS; focused finance suite PASS before the final full-suite run. |

## DEF-005

| Field | Detail |
|---|---|
| DEFECT ID | DEF-005 |
| TITLE | Valid Lab Assets deep link returns nginx 500 |
| MODULE | Lab / production routing |
| URL | `/lab/assets` |
| ROLE | Anonymous direct load and LAB_ASSISTANT after refresh |
| REPRODUCTION STEPS | Directly request `/lab/assets`, with or without trailing slash/query. |
| EXPECTED | SPA shell 200 followed by authentication/authorized rendering. |
| ACTUAL | nginx HTTP 500 with no SPA body; `/lab`, `/lab/labs`, and `/lab/stock` return 200. |
| ROOT CAUSE | Hosting-layer path collision or rewrite failure is suspected; nginx/Plesk logs/config were unavailable. |
| SECURITY IMPACT | Availability/configuration failure, no data exposure observed. |
| TENANT IMPACT | All tenants using the route. |
| DATA INTEGRITY IMPACT | None observed. |
| CURRENT SEVERITY | New finding. |
| CORRECT SEVERITY | P2. |
| FIX | Correct the hosting rewrite/location rule so valid SPA paths fall back to `index.html`. |
| DEPLOYMENT STATUS | NOT FIXED. |
| LIVE RETEST | FAIL in all three URL variants. |
| REGRESSION RESULT | 23/24 representative server deep links PASS; this route alone fails. |

## DEF-006

| Field | Detail |
|---|---|
| DEFECT ID | DEF-006 |
| TITLE | Cross-tenant fee-structure detail denial returns 500 instead of 404 |
| MODULE | Finance / error handling |
| URL | `GET /api/finance/fee-structures/:id` |
| ROLE | Tenant B COLLEGE_ADMIN targeting Tenant A |
| REPRODUCTION STEPS | Request Tenant A fee-structure ID 1 using Tenant B token. |
| EXPECTED | 404 safe denial. |
| ACTUAL | 500 generic error; no record data returned. |
| ROOT CAUSE | A plain `Error` was thrown after the tenant-scoped query returned no row. |
| SECURITY IMPACT | No data leak in this path; distinguishable error/availability weakness. |
| TENANT IMPACT | Cross-tenant request is not handled according to the safe-denial contract. |
| DATA INTEGRITY IMPACT | None. |
| CURRENT SEVERITY | New finding. |
| CORRECT SEVERITY | P2. |
| FIX | Throw AppError 404 and retain tenant-scoped lookup; regression added. |
| DEPLOYMENT STATUS | SOURCE FIXED; NOT DEPLOYED. |
| LIVE RETEST | FAIL pending deployment. |
| REGRESSION RESULT | Focused finance suite PASS. |

## DEF-007

| Field | Detail |
|---|---|
| DEFECT ID | DEF-007 |
| TITLE | Logout does not invalidate the issued bearer token |
| MODULE | Authentication/session security |
| URL | Client logout and `/api/auth/me` |
| ROLE | Authenticated staff |
| REPRODUCTION STEPS | Log in, capture QA token, perform client logout, then reuse the token against `/api/auth/me`. |
| EXPECTED | Token rejected after logout when logout invalidation is a certification requirement. |
| ACTUAL | UI returns to `/login`, but the old token remains valid and `/api/auth/me` returns 200. |
| ROOT CAUSE | Logout is client-side localStorage deletion; no server logout endpoint, token revocation list, or session version is implemented. |
| SECURITY IMPACT | A copied/stolen token remains usable until expiry. |
| TENANT IMPACT | Token remains scoped to its original tenant; no cross-tenant effect observed. |
| DATA INTEGRITY IMPACT | Depends on token role if compromised. |
| CURRENT SEVERITY | New finding. |
| CORRECT SEVERITY | P2. |
| FIX | Implement short-lived access tokens plus server-revocable session/refresh-token state or a user/session version checked by auth middleware. |
| DEPLOYMENT STATUS | NOT FIXED. |
| LIVE RETEST | FAIL. |
| REGRESSION RESULT | Client logout PASS; server invalidation FAIL. |
