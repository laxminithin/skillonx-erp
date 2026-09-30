# LIVE API NETWORK CONSOLE REPORT

Evidence: `live-uat-evidence/json/live_probe_latest.json`.

| Category | Result | Details |
|---|---|---|
| Public API health | PASS | `/api/health` returned 200 in 230 ms |
| Invalid auth API behavior | PASS | Empty/malformed credentials return 400 validation; wrong credentials return 401 |
| Staff/student/parent/alumni login APIs | PASS | 10 QA accounts authenticated successfully |
| Unauthenticated browser console | PASS | Chromium unauthenticated route sweep reported no console errors, failed requests, or 4xx/5xx API responses |
| Authenticated sampled routes | PASS with defects | 37/39 sampled authenticated routes rendered; `/lms/courses` and `/parent/finance` rendered SPA 404 |
| Direct API RBAC checks | PASS | Sampled cross-role calls returned expected 403/200 outcomes, except one management endpoint path in the probe returned 404 and is not counted as a defect because deployed UI uses other management API paths |
| Sensitive data leakage | BLOCKED | Network payload inspection was limited to status/content-type; full payload PII/secrets review not completed |

