# LIVE UAT EXECUTION MATRIX

Target: https://campus.skillonx.com  
Test date: 2026-09-29  
Evidence: `live-uat-evidence/json/live_probe_latest.json`, `live-uat-evidence/screenshots/`

| TEST ID | MODULE | PORTAL | ROLE | PRECONDITION | ACTION | EXPECTED | ACTUAL | RESULT | SEVERITY | EVIDENCE | DEFECT ID | NOTES |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LIVE-001 | Production | Public | Anonymous | None | GET `/` | 200 SPA | 200 HTML | PASS |  | JSON headers.root |  | Reachability confirmed |
| LIVE-002 | API | Public | Anonymous | None | GET `/api/health` | 200 JSON | 200 `{"ok":true}` | PASS |  | JSON headers.apiHealth |  | API reachable |
| LIVE-003 | Auth | Staff | Anonymous | None | Empty login API | 400 validation | 400 validation | PASS |  | JSON invalidAuth[0] |  | No secret logged |
| LIVE-004 | Auth | Staff | Anonymous | None | Malformed email login API | 400 validation | 400 validation | PASS |  | JSON invalidAuth[1] |  |  |
| LIVE-005 | Auth | Staff | Anonymous | None | Wrong password login API | 401 denial | 401 denial | PASS |  | JSON invalidAuth[2] |  |  |
| LIVE-006 | Auth | Platform | SUPER_ADMIN | QA account | Login API | 200 + user role | 200 SUPER_ADMIN | PASS |  | JSON loginApi.superadmin |  | Read-only |
| LIVE-007 | Auth | College Admin | COLLEGE_ADMIN | QA account | Login API | 200 + user role | 200 COLLEGE_ADMIN | PASS |  | JSON loginApi.collegeAdmin |  | Read-only |
| LIVE-008 | Auth | Faculty | FACULTY | QA account | Login API | 200 + user role | 200 FACULTY | PASS |  | JSON loginApi.faculty |  | Read-only |
| LIVE-009 | Auth | Management | MANAGEMENT | QA account | Login API | 200 + user role | 200 MANAGEMENT | PASS |  | JSON loginApi.management |  | Read-only |
| LIVE-010 | Auth | Student | STUDENT | QA account | Login API | 200 + user role | 200 STUDENT | PASS |  | JSON loginApi.student |  | Read-only |
| LIVE-011 | Auth | Parent | PARENT | QA account | Login API | 200 + user role | 200 PARENT | PASS |  | JSON loginApi.parent |  | Read-only |
| LIVE-012 | Auth | Alumni | ALUMNI | QA account | Login API | 200 + user role | 200 ALUMNI | PASS |  | JSON loginApi.alumni |  | Read-only |
| LIVE-013 | Auth | Transport | TRANSPORT_OFFICER | QA account | Login API | 200 + user role | 200 TRANSPORT_OFFICER | PASS |  | JSON loginApi.transport |  | Read-only |
| LIVE-014 | Auth | Hostel | WARDEN | QA account | Login API | 200 + user role | 200 WARDEN | PASS |  | JSON loginApi.warden |  | Read-only |
| LIVE-015 | Auth | HR | HR_MANAGER | QA account | Login API | 200 + user role | 200 HR_MANAGER | PASS |  | JSON loginApi.hr |  | Read-only |
| LIVE-016 | Protected routes | Core portals | Anonymous | None | Direct protected route navigation | Redirect to login | `/platform`, `/admin`, `/dashboard`, `/management`, `/principal`, `/hod`, `/finance`, `/hostel`, `/transport`, `/examinations`, `/admissions`, `/hr`, `/placements` redirected to `/login` | PASS |  | JSON unauthRoutes |  |  |
| LIVE-017 | SPA fallback | Unknown route | Anonymous | None | Open `/this-route-should-not-exist` | SPA 404, not server 404 | SPA "Page not found" | PASS |  | JSON unauthRoutes |  |  |
| LIVE-018 | Platform | Platform | SUPER_ADMIN | Logged in | Visit dashboard/tenants/health/audit | Render pages | All rendered expected headings | PASS |  | JSON authRoutes, screenshots/auth-superadmin-last-1366.png |  | Read-only |
| LIVE-019 | Admin | Admin/Finance/Admissions | COLLEGE_ADMIN | Logged in | Visit sampled admin routes | Render pages | Admin, faculty, finance, admissions pages rendered | PASS |  | JSON authRoutes |  | Read-only |
| LIVE-020 | Faculty | LMS/mentoring/profile | FACULTY | Logged in | Visit sampled faculty routes | Render pages | Dashboard, courses, classes, mentoring, profile rendered | PASS |  | JSON authRoutes |  | Read-only |
| LIVE-021 | Management | Executive | MANAGEMENT | Logged in | Visit sampled management routes | Render pages | Command center, finance, placement, reports rendered | PASS |  | JSON authRoutes |  | Read-only |
| LIVE-022 | Student | Student LMS | STUDENT | Logged in | Visit `/lms/courses` | Valid route or redirect | SPA page not found | FAIL | P2 | JSON authProblems | DEF-001 | Deployed source route is `/lms/subjects`; route alias/menu expectation not verified |
| LIVE-023 | Student | Student LMS | STUDENT | Logged in | Visit dashboard/attendance/placements | Render pages | Rendered | PASS |  | JSON authRoutes |  | Read-only |
| LIVE-024 | Parent | Parent | PARENT | Logged in | Visit `/parent/finance` | Finance/fees page or redirect | SPA page not found | FAIL | P2 | JSON authProblems | DEF-002 | Deployed source route is `/parent/fees` |
| LIVE-025 | Alumni | Alumni | ALUMNI | Logged in | Visit dashboard/360/recognition | Render pages | Rendered | PASS |  | JSON authRoutes |  | Read-only |
| LIVE-026 | Transport | Transport | TRANSPORT_OFFICER | Logged in | Visit dashboard/routes/passengers/reports | Render pages | Rendered | PASS |  | JSON authRoutes |  | Read-only |
| LIVE-027 | Hostel | Hostel | WARDEN | Logged in | Visit dashboard/residents/rooms/reports | Render pages | Rendered | PASS |  | JSON authRoutes |  | Read-only |
| LIVE-028 | HR/Payroll | HR | HR_MANAGER | Logged in | Visit HR admin/employees/payroll/recruitment | Render pages | Rendered | PASS |  | JSON authRoutes |  | Read-only |
| LIVE-029 | RBAC | Platform API | FACULTY/MANAGEMENT/SUPER_ADMIN | Tokens | Call `/api/platform/dashboard` | Non-admin denied, superadmin allowed | 403, 403, 200 | PASS |  | JSON apiAuthz |  |  |
| LIVE-030 | RBAC | Hostel API | FACULTY/WARDEN/STUDENT | Tokens | Call `/api/hostel/dashboard` | Warden allowed, others denied | 403, 200, 403 | PASS |  | JSON apiAuthz |  |  |
| LIVE-031 | RBAC | Transport API | FACULTY/TRANSPORT/STUDENT | Tokens | Call `/api/transport/dashboard` | Transport allowed, others denied | 403, 200, 403 | PASS |  | JSON apiAuthz |  |  |
| LIVE-032 | RBAC | HR API | FACULTY/HR/STUDENT | Tokens | Call `/api/hr/admin/dashboard` | HR allowed, others denied | 403, 200, 403 | PASS |  | JSON apiAuthz |  |  |
| LIVE-033 | RBAC | Admin API | FACULTY/COLLEGE_ADMIN/STUDENT | Tokens | Call `/api/admin/overview` | Admin allowed, others denied | 403, 200, 403 | PASS |  | JSON apiAuthz |  |  |
| LIVE-034 | Responsive | Login | Anonymous | Chromium | Check widths 320, 360, 375, 390, 412, 768, 1024, 1280, 1366, 1440, 1920 | No horizontal overflow | No horizontal overflow detected | PASS |  | JSON responsive, screenshots/login-*.png |  | Login only |
| LIVE-035 | Browser | Login | Anonymous | Playwright Chromium | Open `/login` | Renders without console/API errors | No console/API/request failures | PASS |  | JSON browserSmoke[0] |  | Chromium only |
| LIVE-036 | Browser | Login | Anonymous | Playwright Firefox/WebKit | Open `/login` | Renders in multiple engines | Browser binaries missing locally | BLOCKED |  | JSON browserSmoke[1..2] | BLK-001 | Environment needs Playwright browser install |
| LIVE-037 | Security headers | Public | Anonymous | None | Inspect root headers | Hardened production headers | Missing CSP/HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy; `x-powered-by` exposed; wildcard ACAO | FAIL | P2 | JSON headers.root | DEF-003 | Safe observable check |
| LIVE-038 | CRUD/workflows | All mutation modules | QA accounts | Live production | Create/update/approve/delete/readback | Complete lifecycle evidence | Not executed | BLOCKED |  | Prompt safety rules | BLK-002 | Requires explicit authorization for live mutation and cleanup |
| LIVE-039 | External integrations | Finance/SMS/email/payroll/exam publication | QA accounts | Live production | Trigger real side effects | Authorized safe execution | Not executed | BLOCKED |  | Prompt safety rules | BLK-003 | Real external side effects not authorized |
| LIVE-040 | Tenant isolation | Faculty | Tenant A COLLEGE_ADMIN | Tenant B QA faculty exists | Read Tenant B faculty by ID | 404 | 404 | PASS |  | `tenant_isolation_retest.json` |  |  |
| LIVE-041 | Tenant isolation | Faculty | Tenant A COLLEGE_ADMIN | Tenant B QA faculty exists | PATCH Tenant B QA faculty by ID | 404/no mutation | 404 | PASS |  | `tenant_isolation_retest.json` |  |  |
| LIVE-042 | Tenant isolation | Students | Tenant B COLLEGE_ADMIN | Tenant A students exist | Tamper `collegeId=1` on list | Empty Tenant B result | 200, zero students | PASS |  | `tenant_isolation_retest.json` |  |  |
| LIVE-043 | Tenant isolation | Admissions | Tenant B COLLEGE_ADMIN | Tenant A QA application exists | Direct application ID read | 404 | 404 | PASS |  | `tenant_isolation_retest.json` |  |  |
| LIVE-044 | Tenant isolation | Examination | Tenant B COLLEGE_ADMIN | Tenant A QA exam exists | Direct exam ID read | 404 | 404 | PASS |  | `tenant_isolation_retest.json` |  |  |
| LIVE-045 | Tenant isolation | Transport | Tenant B COLLEGE_ADMIN | Tenant A QA route exists | Direct route ID read | 404 | 404 | PASS |  | `tenant_isolation_retest.json` |  |  |
| LIVE-046 | Tenant isolation | Alumni | Tenant B COLLEGE_ADMIN | Tenant A QA profile exists | Direct profile 360 ID read | 404 | 404 | PASS |  | `tenant_isolation_retest.json` |  |  |
| LIVE-047 | Tenant isolation | Platform | Tenant B COLLEGE_ADMIN | Tenant A exists | Direct tenant administration read | 403 | 403 | PASS |  | `tenant_isolation_retest.json` |  |  |
| LIVE-048 | Tenant isolation | Finance | Tenant B COLLEGE_ADMIN | Tenant A QA fee structure exists | Direct fee-structure read | 404 | 500, no data | FAIL | P2 | `tenant_isolation_retest.json` | DEF-006 | Source fixed, not deployed |
| LIVE-049 | Tenant isolation | Finance | Tenant B COLLEGE_ADMIN | Tenant A QA fee structure exists | Archive endpoint with Tenant A ID | 404/no data/no mutation | 200 with Tenant A metadata; Tenant A stayed ACTIVE | FAIL | P1 | `finance_cross_tenant_archive_probe.json` | DEF-004 | Confirmed cross-tenant read |
| LIVE-050 | Direct-load routing | 24 portal routes | Anonymous | HTTPS | Direct GET | SPA shell or intentional auth response | 23 SPA shells; `/lab/assets` nginx 500 | FAIL | P2 | `deep_link_server_retest.json` | DEF-005 |  |
| LIVE-051 | Security | API CORS | Anonymous | Trusted and untrusted origins | GET and OPTIONS matrix | Exact trusted ACAO; none for untrusted | Expected behavior | PASS |  | `security_retest.json` |  |  |
| LIVE-052 | Security | SPA headers | Anonymous | HTTPS | Inspect root | Browser hardening headers | Missing on SPA HTML | FAIL | P2 | `security_retest.json` | DEF-003 | API headers separately PASS |
| LIVE-053 | Role expansion | 12 staff portals | 12 QA roles | QA accounts | Login, `/me`, forbidden Platform API, landing render | All pass | 12/12 pass | PASS |  | `role_expansion_retest.json` |  |  |
| LIVE-054 | Logout | Staff | ACCOUNTANT | Authenticated browser | Clear client session then reuse old token | Token invalid | UI logout PASS; old token `/api/auth/me` 200 | FAIL | P2 | `role_expansion_retest.json` | DEF-007 | Stateless JWT remains valid |
| LOCAL-001 | Compatibility fixes | Student/Parent | Mocked authenticated users | Local Vite | Test legacy URLs | Valid workspace/redirect | 2/2 pass | PASS |  | `deep_link_alias_local_retest.json` | DEF-001, DEF-002 | Local evidence only; not live |
