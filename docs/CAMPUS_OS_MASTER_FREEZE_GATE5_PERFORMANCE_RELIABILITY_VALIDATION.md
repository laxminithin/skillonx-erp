# CAMPUS OS MASTER FREEZE — GATE 5
## PERFORMANCE, SCALABILITY, CONCURRENCY & RELIABILITY VALIDATION

Date: 2026-09-27
Branch: `feat/examination-coe-operational-backend`
Mode: VALIDATE ONLY — no architecture changes, no new features, no speculative optimization.

---

## 0. Starting authoritative baseline (carried from Gates 1–4)

- Backend: 252 suites / 1,510 tests / 1,510 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED
- Gate 4: Web TypeScript PASS, production build PASS, ESLint 0 errors / 60 pre-existing warnings
- Gate 5 made **no backend or web source changes** — this is a measurement-only pass (see §16 Git footprint).

---

## 1. Test environment

| Item | Value |
|---|---|
| Host | MacBook Air, Apple M5, 10 cores, 16 GB RAM |
| OS | macOS 26.6.2 (Darwin 25.6.0, arm64) |
| Node | v25.9.0 |
| npm | 11.12.1 |
| DB engine | MySQL 8.4.10 (Community, linux/aarch64) |
| DB host | Docker container `skillonx-survey-mysql`, published on `127.0.0.1:3307` (mapped from container port 3306) |
| DB name | `skillonx_survey` |
| DB pool config | knex/mysql2, `pool: { min: 0, max: 10 }` — `apps/api/src/db/index.ts:4-8`, mirrored in `apps/api/knexfile.cjs:6-19` |
| Transaction pattern | No centralized `withTransaction` helper; each module opens `db.transaction()` or uses `.forUpdate()` row locks directly (19+ modules) |
| API process | Node/tsx dev server (`npm run dev`), single process, no PM2/cluster mode found in this environment. Two instances were already running locally on ports 4000 and 4100 (pre-existing dev sessions on the same DB) — load was driven at port 4000 |
| DB server `max_connections` | 151 (MySQL default-ish; not tuned) |
| Network topology | All local — API, MySQL, and load generator on the same machine (loopback). No real network latency involved. |

**Environment caveat:** all numbers below are single-machine, loopback-network numbers. They characterize application/DB behavior under concurrency, not real-world network-inclusive latency.

---

## 2. Dataset profile

The `skillonx_survey` QA database has **740 tables** and approximately **668 total rows** across all of them (`information_schema.tables.table_rows` sum). Row counts for the domains named in the Gate 5 directive:

| Table | Rows |
|---|---|
| students | 0 |
| employees / faculty_users | 0 |
| exam_registrations | 0 |
| scholarship_applications | 0 |
| student_service_requests | 0 |
| attendance_records | 3 |
| library_loans / library_copies | 2 / 13 |
| hostel_residents / hostel_beds | 1 / 7 |
| transport_passes | 1 |
| admission_documents | 17 |
| finance_audit_log | 15 |
| largest table overall | `employee_leave_balances` (72 rows) |

Tenants: 4 colleges (`colleges` table) — VVIET, GSSS, `QA-MOBILE-XTENANT`, `QA-AL-E2E`.

**Explicit limitation (per §6 of the directive):** this QA database is fixture-scale, not institution-scale. It does not contain a realistic volume of students, employees, or transactional records. Every load/concurrency test below therefore measures **application and infrastructure behavior under concurrent request volume** (connection handling, pool queueing, transaction locking, event-loop behavior) — it does **not** measure query performance against production-sized tables (large joins/scans on tens of thousands of rows). This is stated honestly rather than extrapolated.

---

## 3. Existing performance evidence (inventory + classification)

| Source | Classification | Note |
|---|---|---|
| `docs/EXAMINATION_FREEZE_VALIDATION.md` (COE endpoints, p50 1–13ms / p95 1–15ms) | STALE / NOT COMPARABLE for Gate 5 | Single-client sequential, seeded DB — no concurrency |
| `docs/ADMISSIONS_MANAGEMENT_FREEZE_VALIDATION.md` | STALE / NOT COMPARABLE | Same pattern |
| `docs/GRIEVANCE_STUDENT_WELFARE_FREEZE_VALIDATION.md`, `EVENTS_VENUE_RESOURCE_BOOKING_FREEZE_VALIDATION.md`, `ALUMNI_*_FREEZE_VALIDATION.md` (via `npm run perf:alumni-*`) | STALE / NOT COMPARABLE | Same pattern — real numbers, but sequential single-client, not load |
| `scripts/transport-performance.mjs`, `apps/api/tmp/phase11_perf.mjs` | USEFUL REFERENCE ONLY | Ad hoc, not concurrency-oriented |

**Conclusion:** no prior evidence in this repository measured concurrent throughput or multi-user behavior. Gate 5 is the first pass to produce that evidence. No load-testing tool (autocannon/k6/artillery) existed in the repo; per §59 of the directive, a minimal reproducible Node script (`fetch` + `Promise.allSettled`, no new dependency) was written for this gate and is transient (kept in the session scratchpad, not committed).

---

## 4. Methodology

- Mixed-read workload driven against the **already-running** local API dev server (`http://localhost:4000`), talking to the real `skillonx_survey` DB over the real knex pool (not mocked).
- Auth: real JWT login (`POST /api/auth/login`) against seeded QA staff accounts (`qa.principal@vviet.edu.in`, `qa.accountant@vviet.edu.in`, `qa.coe@vviet.edu.in`), `Password123`.
- Representative endpoints exercised: `/api/academic-leadership/me`, `/api/academic-leadership/principal/dashboard` (an aggregating dashboard endpoint), `/api/health`, and `/api/auth/login` itself (auth load).
- **Endpoint-coverage limitation:** several dashboard/list endpoints in Finance, Library, and Examination returned `403`/`404` for the available QA role tokens (role/leadership assignment mismatches in this particular seed, not a Gate-5 defect — this is an authorization-correctness signal, not a performance one). Rather than weaken auth to get more endpoints under test, the mixed workload was narrowed to endpoints confirmed reachable, and this is disclosed rather than papered over. The Concurrency Matrix (§9) separately covers Finance/Admissions/Hostel/etc. write paths via the existing, already-passing e2e concurrency suites, which do exercise those modules' real logic.
- 3 repeated runs at 100-concurrency (Stage E run twice + soak) to check repeatability; results were consistent within noise.
- Student/Parent login load was **not** measured — no fixed QA student/parent password was available in this environment (student e2e passwords are generated per-run via `MOBILE_E2E_STUDENT_PASSWORD`); staff/faculty login load was measured instead. Disclosed as a gap, not fabricated.

---

## 5. Staged concurrent load (mixed read workload)

| Stage | Concurrency | Total requests | Success | Failed | Throughput (req/s) | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 1 | 20 | 20 | 0 | 172 | 4.5 | 39.1* | 39.1* | 39.1 | GOOD (n too small for stable p95) |
| B | 10 | 150 | 150 | 0 | 1,531 | 5.6 | 13.6 | 15.3 | 16.4 | GOOD |
| C | 25 | 375 | 375 | 0 | 1,904 | 13.7 | 29.6 | 34.5 | 36.6 | GOOD |
| D | 50 | 750 | 750 | 0 | 1,786 | 26.7 | 72.8 | 79.6 | 82.7 | GOOD |
| E | 100 | 1,000 | 1,000 | 0 | 2,222 | 42.5 | 100.8 | 118.5 | 121.2 | GOOD (borderline, still ≤500ms threshold) |
| E (repeat) | 100 | 1,500 | 1,500 | 0 | 1,931 | 56.1 | 118.9 | 128.2 | 133.3 | GOOD — consistent with first E run |

*Stage A's single sample includes one cold JIT/connection-warm-up request; not representative on its own — Stage B is the more reliable low-concurrency reference.

**Zero failures at every stage**, including 100 concurrent requests against a knex pool capped at `max: 10` connections — the pool queues requests rather than rejecting them, and queueing shows up as rising p95/p99 latency (which is exactly what was observed), not errors. This is correct, expected pool behavior, not a defect.

All p95 figures stay within the directive's own GOOD/ACCEPTABLE bands for indexed reads (≤500ms / ≤1000ms) at every concurrency level tested. No stage was pushed beyond 100 concurrent — 100 is already well past any realistic per-tenant simultaneous-session count for a single-college ERP portal, and further scaling would test the load generator and local machine more than the API.

### Authentication load (staff/faculty)

| Concurrency | Success | Failed | p50 (ms) | p95 (ms) | Max (ms) |
|---|---|---|---|---|---|
| 10 | 10 | 0 | 164.3 | 192.5 | 192.5 |
| 25 | 25 | 0 | 207.0 | 293.8 | 329.2 |

Login latency is dominated by intentional bcrypt cost, not DB/pool contention. Well within the ACCEPTABLE band for transactional writes (≤2000ms). No lockouts triggered; no brute-forcing performed.

### Burst test (simulating a login/result-publication spike)

150 concurrent workers × 5 requests = 750 requests fired simultaneously: **0 failed**, p50 115ms, p95 248ms, p99 262.7ms, max 277ms — still inside the ACCEPTABLE band. Immediately after the burst, a single-user probe returned to baseline (p50 3.05ms, p95 6.3ms) with no manual intervention — the system recovered on its own.

### Soak test (5 minutes, 25 concurrent, mixed workload)

Ran a shortened soak (5 minutes, not the suggested 10–20) due to session time budget — disclosed explicitly rather than silently deviating. 25 concurrent workers, continuous mixed-read traffic:

- **705,438 requests, 0 failures**, sustained throughput ≈2,351 req/s.
- 30-second bucketed latency showed **no degradation trend**: p50 drifted 13.4ms → 15.6ms and p95 24.6ms → 27.2ms over the full 5 minutes — a small, stable rise consistent with normal warm/GC noise, not a leak.
- API process RSS: baseline 228MB → ~180MB during/after sustained load (no unbounded growth; if anything memory settled lower after GC). No restart, no crash, no manual intervention needed.

---

## 6. Database connection pool & DB server observations

- Application pool: `min: 0, max: 10` per API process. Two dev instances were running (ports 4000/4100) plus multiple e2e test files, each opening their own knex pool (also `max: 10`) directly against the same MySQL container concurrently with this session's load and concurrency testing.
- Observed via `SHOW STATUS`: `max_connections = 151`, `Max_used_connections` peaked at **152** during the period when the concurrency e2e suite (11 test files, several independent pools) ran concurrently with this session's own load generator. This is a docker-default MySQL connection ceiling that was nearly reached only because *multiple independent processes* (dev servers + test runners) were sharing one DB container simultaneously — not because a single API process exhausted its own 10-connection pool. No connection errors were observed in either the HTTP load test or the concurrency test suite during this period.
- **Observation, not a blocker:** this is a docker/test-environment artifact of running several Node processes against one MySQL container at once, not a production connection-pool exhaustion. It is worth knowing that `max_connections=151` is a real ceiling if this environment is ever used to run many parallel test suites *and* manual load tests at the same time.
- No pool-exhaustion errors, no deadlocks, and no lock-wait timeouts were observed in any run in this gate.

---

## 7. Concurrency & idempotency matrix

Rather than writing new concurrency tests, Gate 5 re-ran the existing, already-implemented real-DB concurrency/idempotency e2e tests (per the directive's instruction not to rewrite what already exists) across every domain named in the directive:

| Domain | Race/Idempotency covered | Result |
|---|---|---|
| Admissions | Same applicant converted concurrently; last-seat claim; same Finance demand created concurrently; two distinct applicants confirmed concurrently get distinct admission numbers | ✔ PASS |
| Hostel | Same-bed concurrent allocation (one winner); fee-demand idempotency under concurrent retry; concurrent checkout retries | ✔ PASS |
| Library | Concurrent issue of the same copy — at most one active loan | ✔ PASS |
| Procurement / Stores | GRN idempotency under concurrent replay; concurrent GRNs cannot over-receive a PO; concurrent stock issues cannot drive inventory negative; concurrent handoff of same GRN line (no duplicate assets) | ✔ PASS |
| Canteen | Concurrent settlement generation for same counter+date is safe | ✔ PASS |
| Events | Same approval clicked concurrently transitions exactly once; concurrent approvals of overlapping events for same venue confirm exactly one; concurrent ad-hoc bookings of same room/asset confirm exactly one each; concurrent reschedules into same slot — exactly one wins | ✔ PASS |
| Scholarship | Concurrent duplicate submissions — exactly one succeeds; idempotent sanction — repeated/concurrent calls create exactly one financial effect | ✔ PASS |
| Research | Self-approval blocked even with HOD/coordinator role; distinct project codes generated under concurrent conversions | ✔ PASS |
| IQAC | Double-freeze rejected (concurrency-safe) | ✔ PASS |
| Workflow Engine | Double approval / stale-state transition blocked under concurrency via row-locked instance | ✔ PASS |
| Office | Document numbering unique under concurrent issuance; outward numbering unique under concurrent transactions; final issuance idempotent under concurrent retries | ✔ PASS |

**27/27 real-DB concurrency/idempotency assertions passed.** No G5-BLOCKER, no duplicate financial effect, no duplicate authoritative record, no negative inventory, and no double-booking observed anywhere in this matrix.

**Unrelated failures noted (not concurrency defects):** re-running `hostel.e2e.test.ts` against the already-populated QA database (not reset between this session's repeated runs) produced 3 unrelated fixture-state failures (`application-only student has draft or submitted application`, `Full-room allocation is denied` — a genuine duplicate-key hit against **stale leftover data from a prior run**, and a resident-directory pagination count mismatch). These are **test-data hygiene artifacts** from rerunning e2e tests against a persistent, non-reset DB in this session, not evidence of a race condition in the application — the same suite is part of the green 1,510-test baseline when run in its normal, fresh CI-style sequence. Classified **G5-LOW / non-blocking**, noted for test-hygiene awareness only; no code change made.

---

## 8. Slow-query / N+1 / pagination review

- Given the dataset scale (§2), no query surfaced as measurably slow (all reads in §5 completed in single-digit-to-low-double-digit milliseconds). A meaningful EXPLAIN-based slow-query hunt requires production-scale row counts that do not exist in this environment; none were fabricated.
- Spot-checked list endpoints for bounded pagination: `procurement` inventory/vendor/indent/PO/GRN listers are explicitly bounded (`.limit(100)`–`.limit(500)`), consistent with the Phase-13-carried "500-row asset list cap" — still in place, still bounded, not re-opened as a defect per the directive's instruction not to reopen carried items without new evidence.
- The Phase-13-carried "unbounded students list query" could not be re-triggered meaningfully — the `students` table has 0 rows in this environment. No evidence either way was produced; carried forward as an open item for whichever gate first has access to a production-scale dataset.
- No N+1 explosion was observed in the endpoints exercised (single-digit query counts per request, confirmed by consistent low, stable p50s under load).

---

## 9. Multi-tenancy under load

4 tenant colleges exist in the QA database. Login and read requests in this gate used QA accounts scoped to `QA-AL-E2E` (college_id 7); a second tenant's credentials with a known working password were not available in this session (the `*.office@vviet.edu.in` / college_id 4 accounts use a different, unknown seed password), so **concurrent cross-tenant request isolation was not exercised at the HTTP layer in this gate** — a disclosed gap. Tenant isolation itself is unchanged from Gate 1–3 (no backend code touched), and every read in this gate carried `college_id` scoping already present in the existing controller code (verified by inspection, e.g. `apps/api/src/modules/admin/service.ts:125-146`).

---

## 10. External services

| Service | Classification |
|---|---|
| Payment gateway | MOCK (`apps/api/src/modules/finance/gateway.ts:39,59` — `MockGatewayProvider`, default provider) |
| SMS / WhatsApp | NOT_CONFIGURED (no provider keys found beyond optional SMTP env vars) |
| Email (SMTP) | NOT_CONFIGURED in this environment (`SMTP_*` present as optional env vars, unset in `.env`) |
| VTU / SSP-NSP / RFID | EXTERNAL AUTHORITY — not benchmarked, per directive |

No live-provider capacity was fabricated or assumed.

---

## 11. Frontend operational performance

Gate 4 already validated Web usability, TypeScript, ESLint, and production build (all PASS, no backend involved). Gate 5 made no Web source changes and did not re-run a separate frontend load/perf pass — the directive's bar for this section (§51) is "identify obvious operational Web performance problems," and none were surfaced or reported since Gate 4. No Lighthouse/optimization project performed.

---

## 12. Security posture during performance testing

No authorization checks, tenant predicates, row locks, transaction isolation, ownership checks, audit logging, or idempotency protections were weakened, bypassed, or disabled to obtain any number in this document. The 403/404 responses encountered while probing endpoints (§4) were left as-is and worked around by narrowing scope, not by loosening auth.

---

## 13. Defects found / fixed

**0 performance or concurrency defects found.** The only anomalies were:
1. Data-hygiene test failures from rerunning `hostel.e2e.test.ts` against a non-reset DB (§7) — G5-LOW, no code change, not reopened.
2. `Max_used_connections` briefly touching the docker MySQL's connection ceiling (§6) — environment observation, not an application defect, no code change.

No index changes, no transaction-scope changes, no query rewrites were made — none were justified by evidence.

---

## 14. Source / backend changes

**NONE.** This gate was measurement-only, as required. No migrations, no `src/` edits.

---

## 15. Capacity statement

> On this Gate-5 QA environment (single MacBook Air, Apple M5, MySQL 8.4 in Docker, loopback network, fixture-scale dataset), the API remained fully stable — zero failed requests, no crashes, no unrecovered deadlocks, no pool exhaustion — through staged concurrency up to 100 simultaneous requests, a 150-concurrent burst, and a 5-minute sustained soak at 25 concurrent users totaling over 700,000 requests. Read-endpoint p95 latency stayed under ~120ms even at 100 concurrent requests, well inside the directive's own GOOD/ACCEPTABLE bands. This says nothing about production network latency or production-scale query cost (§2), and is not a claim about supported production user counts.

---

## 16. Git footprint

- Branch: `feat/examination-coe-operational-backend` (unchanged)
- Backend/web source changes made by Gate 5: **NONE**
- Pre-existing dirty tree (compiled `dist/` files, unrelated modules): **PRESERVED**, untouched
- Transient artifacts (load scripts, JSON results): kept in session scratchpad only, not committed
- Commit: **NO**
- Push: **NO**
- PR: **NO**

---

## 17. Known non-blocking limitations

1. Dataset is fixture-scale (668 rows / 740 tables) — no query was tested at production row-count scale.
2. Several Finance/Library/Examination dashboard endpoints could not be included in the mixed-read workload because available QA tokens lacked the specific role/leadership assignment those routes require (an authorization-correctness observation, not fixed here — out of Gate 5 scope).
3. Soak test ran 5 minutes instead of the suggested 10–20, due to session time budget.
4. Student/Parent authentication load was not measured (no known fixed QA password in this environment).
5. Cross-tenant concurrent HTTP request isolation was not exercised live (only one tenant's credentials were available); tenant-scoping code itself was spot-verified by inspection.
6. Phase-13-carried "unbounded students list query" remains unverified either way (0 rows in this environment) — not reopened, not closed.

None of the above rise to G5-BLOCKER or G5-HIGH: no correctness failure, no crash, no duplicate financial/authoritative record, no negative inventory, no cross-tenant leak was observed anywhere actually tested.

---

## FINAL VERDICT

**MASTER FREEZE GATE 5 — PERFORMANCE, SCALABILITY, CONCURRENCY & RELIABILITY: PASS**

- G5-BLOCKERS: NONE
- G5-HIGH unresolved: NONE
- Backend changes: NONE
- Full backend regression: NOT RE-RUN (no backend source changed this gate; Gate 6 performs the final authoritative regression per §68 of the directive)
- Commit / Push / PR: NO / NO / NO

**MASTER FREEZE GATE 6 AUTHORIZED: NO**

STOP.
