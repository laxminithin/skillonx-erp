# Transport Management Freeze Validation

Date: 2026-09-15

## Executive decision

**TRANSPORT MANAGEMENT — FROZEN.**

The existing Transport architecture was audited and hardened in place. The closure gates are green: backend evidence, named concurrency, Finance security, privacy/isolation, actual RBAC, responsive QA, screenshots, authenticated performance, migrations, builds, and the serialized broad regression.

## Architecture reused

Transport remains on the existing `transport_*` tables and module under `apps/api/src/modules/transport`, with Student LMS integration under `apps/web/src/pages/transport`. The canonical concepts are routes, ordered route stops, vehicles, route-vehicle assignments, applications, members, student assignments, passes, trips, boarding, changes, cancellations, complaints, audit, and Finance references. No replacement schema was introduced.

## Hardening completed

- Removed the generic `SUPER_ADMIN` / `COLLEGE_ADMIN` mutation fallback from Transport authorization. Those roles retain view, report, and configuration access; routine operations remain with Transport operational roles.
- Transport Officer now owns route, stop, vehicle, application, allocation, trip, pass, and change operations through the existing permission map.
- Capacity checks now execute through the assignment transaction and serialize on the active route row; student rows are also locked to prevent duplicate active allocations through different applications.
- Assignment validates an active route and route-owned pickup/drop stops.
- Vehicle assignment validates tenant, active route, operational availability, compliance, and is idempotent for an existing active assignment.
- Pass activation is idempotent for the same active member/assignment and locks the member pass row before transition.
- Cancellation completion is retry-safe and locks the cancellation request/member, preventing duplicate logical completion.
- Finance demand creation uses the existing canonical Finance idempotency key and conflict-safe insert behavior. Transport does not mark payments, receipts, or refunds.

## Evidence

| Gate | Result |
|---|---|
| Transport RBAC ownership tests | 4/4 PASS |
| Existing Transport E2E | 11/11 PASS |
| Transport closure E2E | 60/60 PASS |
| Targeted Transport backend | 78/78 PASS: access/RBAC 4, closure 60, named concurrency 3, existing E2E 11 |
| Named concurrency A/B/C | 3/3 PASS |
| Finance security evidence | 8/8 PASS through explicit RBAC and Finance-boundary checks |
| Privacy/isolation evidence | 10/10 PASS through tenant, student, operational, Finance, Maintenance, Grievance, and HR boundary checks |
| Actual Transport RBAC matrix | PASS: Student, Faculty, Mentor, HOD, Transport Officer, Principal, Management, Accountant, COE, Admissions, Office, Lab, Maintenance, Warden, Librarian, T&P, HR, Grievance, SUPER_ADMIN, Driver |
| API build / TypeScript | PASS |
| Web build | PASS (chunk-size warning only) |
| Migrations | UP TO DATE |
| College/student isolation | PASS: dedicated closure isolation checks plus existing tenant-scoped queries and Student LMS guards |
| Responsive 64-case gate | 64/64 PASS: 8 experiences x 8 viewports |
| Required screenshots | 12 captured and verified; required four experiences have desktop/mobile pairs |
| Performance 10-sample endpoint set | PASS: 10 warm measured samples per endpoint, six authenticated areas |
| Broad backend | 1176/1176 PASS |
| Broad suites | 200/200 PASS; 0 failures |
| Isolated historic HR suite | 30/30 PASS |

Transport E2E covers active membership and assignment, application visibility, central no-dues integration, capacity metric consistency, pass verification/revocation, complaint presence, vehicle/driver conflict helpers, and boarding persistence.

## Closure evidence

The 60-case closure suite is `apps/api/src/modules/transport/transport.closure.e2e.test.ts`. It covers student ownership and isolation, route/stop/vehicle/capacity state, applications and assignments, passes, Finance boundaries, Maintenance and Grievance boundaries, notifications/audit persistence, operational dashboards, management read-only analytics, and the actual role matrix.

The three named concurrency checks are real concurrent operations: two transactions contend for the final route seat, two retries resolve the same canonical Finance demand, and two pass-activation transactions resolve to one active pass. Result: 3/3 PASS.

Finance security and privacy/isolation are explicit in the closure suite. Transport has no payment, receipt, or refund mutation permission; Finance remains authoritative. Student and college scope checks return only owned/tenant records, and management output is aggregate/read-only.

## Browser QA

Responsive spec: `apps/web/e2e/transport.responsive.spec.ts`.

Result: 64/64 PASS across `1920x1080`, `1440x900`, `1366x768`, `1024x768`, `768x1024`, `430x932`, `390x844`, and `360x800`. Each case authenticated, direct-loaded, reloaded, checked expected content and primary controls, checked visible control bounds and horizontal overflow, checked restricted controls, and collected console/page/API error evidence.

Screenshot evidence (12 verified files):

- `apps/web/e2e/screenshots/transport/student-overview-1920x1080.png`
- `apps/web/e2e/screenshots/transport/student-overview-390x844.png`
- `apps/web/e2e/screenshots/transport/officer-dashboard-1920x1080.png`
- `apps/web/e2e/screenshots/transport/officer-dashboard-390x844.png`
- `apps/web/e2e/screenshots/transport/routes-stops-1920x1080.png`
- `apps/web/e2e/screenshots/transport/routes-stops-390x844.png`
- `apps/web/e2e/screenshots/transport/vehicles-capacity-1920x1080.png`
- `apps/web/e2e/screenshots/transport/vehicles-capacity-390x844.png`

Additional student route/pass and request/change screenshot pairs are present in the same directory.

## Performance and N+1 audit

Harness: `scripts/transport-performance.mjs`. It warmed each endpoint, then measured ten authenticated requests. Values are milliseconds:

| Area | Endpoint | Average | p95 |
|---|---|---:|---:|
| Transport Officer dashboard | `/api/transport/dashboard` | 3.18 | 4.19 |
| Requests / allocations | `/api/transport/applications?status=SUBMITTED` | 0.71 | 0.86 |
| Routes / stops | `/api/transport/routes` | 0.69 | 0.91 |
| Vehicles / capacity | `/api/transport/vehicles` | 0.80 | 1.09 |
| Student Transport overview | `/api/student/transport` | 17.55 | 18.78 |
| Principal / Management aggregate | `/api/transport/management/dashboard` | 5.48 | 6.49 |

N+1 audit: PASS for the measured list and lookup endpoints. Queries are tenant-filtered; route demand uses grouped stop aggregation; dashboards use parallel bounded counts. The management aggregate retains one capacity lookup per active route, which is bounded to the college’s active route set and was not expanded as an unrelated refactor.

## Boundaries

- Finance remains authoritative for demand, payment, receipt, refund, and balance state.
- HR remains the identity source for employee/driver relationships; the current Transport personnel model is preserved pending a deeper HR-linked closure proof.
- Vehicle maintenance remains Transport-owned; central Maintenance receives only the existing boundary references.
- Grievance, Hostel, and Security remain separate/frozen/future boundaries.
- GPS/live tracking remains deferred (`gpsConfigured: false`); no fabricated tracking was added.
- Staff Transport is present only where the existing staff routes and identity support it; a dedicated staff closure proof was not run.

## Regression evidence

The canonical serialized backend command completed at 1176/1176 tests across 200/200 suites with 0 failures. The previously unstable `hrAcademicContinuityClosure.e2e.test.ts` passed both in the broad run and in its isolated rerun at 30/30. No Transport-caused regression was observed.

## Targeted validation

Transport, Finance, HR Academic Continuity, Hostel, Maintenance, Grievance, Admissions, Office/Student Services, Leadership, Management, Auth/RBAC, and the other affected frozen-domain suites were included in the canonical backend run. API/web builds passed and migrations reported `Already up to date`.

## Freeze decision

**TRANSPORT MANAGEMENT FROZEN**
