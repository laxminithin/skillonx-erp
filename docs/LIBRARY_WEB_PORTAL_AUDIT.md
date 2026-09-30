# Library / Librarian Web Portal — Closure Audit

Date: 2026-09-23
Scope: `apps/api/src/modules/library/**`, `apps/web/src/pages/library/**`, cross-module
integration points (Finance, Auth/RBAC, Student Services no-due), and routing/navigation
that determines the Librarian's actual experience.

This audit inspects the **existing** implementation only. No rebuild was performed to
produce this document. Every finding below cites the file(s) and line(s) it is based on.

---

## 1. Executive summary

The Library **domain/service layer** (catalogue, copies, members, circulation, reservations,
fines, clearance, reports, inventory, policies) is substantially built and is architecturally
sound: correct title/copy separation, DB-enforced accession/barcode/membership uniqueness,
`SELECT ... FOR UPDATE` row locking on issue/return/renew/lost, tenant scoping on every
query, and a real Finance fee-head (`LIBRARY_FINE`) already wired for ad-hoc demands.

However, formal closure is **blocked** by one critical, systemic defect and several
high-severity gaps, all concentrated in the areas the checklist calls out as freeze
blockers:

1. **The `LIBRARIAN` role — the actual persona this module exists for — has no Library
   permissions and no dedicated navigation.** A librarian who logs in lands on the generic
   Faculty Dashboard and cannot perform a single Library mutation. This is a functional
   closure blocker, not a security bug per se, but it means the portal as shipped is
   unusable by its intended operator. (§48/§49/§4/§5)
2. **Three mutating routes have no permission check at all** — any authenticated
   faculty-shelled user (regardless of role) can change a library member's status, renew
   any loan, or mark any loan lost (which creates a financial fine). (§48/§74)
3. **Overdue fines are never handed off to Finance.** Only `LOST` fines call
   `createLibraryFineDemand`; the overdue-fine job path never does, so overdue fines sit as
   Library-only records forever with `finance_demand_id = null`. (§22/§23/§63)
4. **The one Finance handoff that does exist is fire-and-forget with silent failure**
   (`setImmediate(...).catch(() => {})`), with no retry job and no visibility into failed
   handoffs. (§25/§55)
5. Two service functions (`updateCatalogItem`, `updateCopyStatus`) are fully implemented
   but have **no route**, so a librarian cannot edit a catalogue record or mark a copy
   damaged/withdrawn outside the lost-loan flow. (§7/§8/§28)

None of these are large rebuilds — all are minimal, targeted closures. Section 4 below is
the full classification; Section 5 is the gap list with severity; Section 6 is the
remediation plan actually executed in this pass.

---

## 2. Source-of-truth boundaries — VERIFIED CLEAN

- Library does **not** duplicate student/faculty identity, programme, department, or
  academic status — `library_members` stores only `student_id`/`faculty_id` FKs and reads
  name/USN/programme live from `students`/`faculty_users` (`members.ts:113-166`).
- Library does **not** run its own financial ledger — `library_fines` is Library-owned
  (reason/amount/source), and `finance_demand_id` links out to
  `student_fee_demands`, which Finance alone owns (`integration.ts`, `fines.ts:145-181`).
- No LMS concepts (subjects, courses, assignments, quizzes, CO/PO, question banks,
  attendance) exist anywhere in `modules/library/**`. Clean separation confirmed by
  `grep` across the module — zero hits.
- `library_catalog_items.course_textbook_id` is a nullable FK for a genuine cross-portal
  link (Course Textbook Master), not a duplicated record — acceptable.

**Verdict: IMPLEMENTED**, no violations found.

---

## 3. Title vs. copy model — VERIFIED CLEAN

- `library_catalog_items` (bibliographic title) and `library_copies` (physical
  accession) are two tables with a proper 1-to-many FK
  (`library_circulation_module.cjs:30-73`). Each copy carries its own `status`
  (`AVAILABLE|ISSUED|RESERVED|LOST|DAMAGED|REPAIR|WITHDRAWN`, `types.ts:23`).
- Availability is computed by grouping copies per catalogue item
  (`availability.ts`), never modeled as separate titles.

**Verdict: IMPLEMENTED.**

---

## 4. Capability classification

| Area | Status | Evidence |
|---|---|---|
| Catalogue create/search/detail | IMPLEMENTED | `catalog.ts`, routes `POST /catalog`, `GET /catalog/search`, `GET /catalog/:id` |
| Catalogue update | **PARTIAL** | `catalog.ts:129 updateCatalogItem` exists, **no route** wired in `controller.ts` |
| Copy/accession create, uniqueness | IMPLEMENTED | `copies.ts:37-85`; DB unique index `lc_college_accession_unique`, `lc_college_barcode_unique` (`migration:68-69`) |
| Copy status change (damage/withdraw outside a loan) | **PARTIAL** | `copies.ts:111 updateCopyStatus` exists, **no route** wired |
| Copy lookup by barcode/accession | IMPLEMENTED | `copies.ts:23-35`, route `GET /copies/lookup/:barcode` |
| Member model (student/faculty projection, no duplication) | IMPLEMENTED | `members.ts` |
| Member status change (suspend/close) | **PARTIAL (security gap)** | Route exists but **no permission check** (`controller.ts:114-117`, `members.ts:202-224`) |
| Issue book | IMPLEMENTED, concurrency-safe | `circulation.ts:41-137`, row-locks member + copy via `forUpdate()` |
| Return book | IMPLEMENTED, idempotent | `circulation.ts:139-185` — duplicate return safely rejected (`404 No active loan`) |
| Renew | **PARTIAL (security gap)** | Server rules enforced (limit, reservation conflict) but **no permission check** on staff route (`controller.ts:131-133`, `circulation.ts:187-236`) |
| Lost book | **PARTIAL (security gap)** | Creates fine + damage event correctly but **no permission check** (`controller.ts:135-138`, `circulation.ts:238-278`) |
| Damaged book (standalone, no loan) | MISSING | `library_damage_events` schema supports it; no service/route creates a damage event without an associated lost loan |
| Replacement workflow | N/A / OUT OF SCOPE | `library_damage_events` has `replacement_isbn`/`replacement_accession`/`accepted_by` columns but no service or route populates them — schema is ahead of implementation; not fabricated for freeze |
| Reservations (create/cancel/queue/fulfil) | IMPLEMENTED | `reservations.ts` — deterministic FIFO queue, promoted on return, expiry job (`expireReadyReservations`) |
| Reservation priority enforced on issue | IMPLEMENTED | `circulation.ts:86-91` denies issue of a RESERVED copy to a non-holder |
| Staff-side reservation cancel | MISSING | Only student/faculty self-service routers expose cancel; no staff override route |
| Overdue detection | IMPLEMENTED, server-authoritative | `circulation.ts:18-39`, uses college timezone + server clock, not client |
| Fine calculation (overdue, per-day, cap, grace) | IMPLEMENTED | `fines.ts:29-72`, policy-driven |
| Fine idempotency (same loan) | IMPLEMENTED | `fines.ts:34-38` — existing non-cancelled/non-waived fine blocks a duplicate insert |
| **Overdue fine → Finance handoff** | **MISSING** | `generateOverdueFine` never calls `createLibraryFineDemand`; only `createLostFine` does (`fines.ts:74-108` vs `29-72`) |
| Lost fine → Finance handoff | IMPLEMENTED but fire-and-forget | `fines.ts:102-105` — `setImmediate` + swallowed error, no retry |
| Fine waive (governed adjustment, not deletion) | IMPLEMENTED | `fines.ts:117-143`, audited |
| Finance fee head for library | IMPLEMENTED | `LIBRARY_FINE`, `LIBRARY_FEE` seeded in `finance/defaults.ts:8-9` |
| Library clearance / no-due contribution | IMPLEMENTED | `clearance.ts`, wired into central no-due (`e2e test: central no-due includes library domain`) |
| Student self-service | IMPLEMENTED (8 pages) | `StudentLibraryPages.tsx` — search, availability, my loans, renew, reservations, history, fines, card |
| Faculty self-service | **PARTIAL** | `FacultyLibraryPage.tsx` only shows search + active loans; backend routes for faculty reservations (`GET/POST /faculty/library/reservations`) and history (`GET /faculty/library/history`) exist but are **not surfaced in the UI** |
| Search (server-side) | IMPLEMENTED | `catalog.ts:29-58`, SQL `LIKE` filtering, not client-side | 
| Pagination | **PARTIAL** | `listInventory`/`listMembers`/`searchCatalog` take `limit`/`offset` server-side (good), but the UI never passes `offset` or exposes "next page" — effectively fixed-window lists in practice (functional gap, not a data-integrity one) |
| Librarian dashboard | IMPLEMENTED | `reports.ts:5-45`, 6 actionable metrics, not a text report |
| Reports (overdue, most-borrowed, daily circulation) | IMPLEMENTED | `reports.ts:47-132` |
| Exports (CSV/XLSX/PDF) | **NOT CONFIGURED** | No export endpoint or library exists anywhere in `modules/library` — correctly not fabricated |
| Barcode | IMPLEMENTED as scannable identifier only (no hardware) | `barcode` column + lookup-by-barcode; text-input based, no scanner SDK — consistent with §40 |
| RFID | NOT CONFIGURED / N/A | No references found |
| E-books / digital library | NOT CONFIGURED | Only a free-text `digital_link` field on a catalogue item — no provider integration |
| OPAC (public) | N/A — catalogue search is authenticated-only by design | Consistent with current scope |
| ISBN external lookup | NOT CONFIGURED | `isbn` is a free-text field only |
| Periodicals/journals | N/A | Not modeled; correctly out of scope |
| Acquisition/procurement | N/A | Not modeled inside Library; institution has a separate `procurement` module |
| Notifications (due/overdue/reservation-ready) | IMPLEMENTED | `notifications.ts`, routed through existing `notifyStudent` in-app channel — no external SMS/email/WhatsApp claimed |
| Audit log generation | IMPLEMENTED | `audit.ts` + calls at every mutation site (issue, return, renew, lost, catalog/copy create, member status, fine waive, inventory close) |
| Audit log **review** (route/UI) | MISSING | No `GET` route exposes `library_audit_log` to a librarian/admin |
| RBAC — LIBRARIAN role | **MISSING (critical)** | See §5.1 |
| Tenant isolation | IMPLEMENTED | Every service function filters by `college_id`; e2e test `tenant isolation denies cross-college access` |
| Concurrent-issue protection | IMPLEMENTED at DB layer, **untested** | `circulation.ts:73-79` `forUpdate()` on the copy row inside a transaction — correct pattern, but no test proves it (see §5.4) |
| Finance-mutation boundary (librarian cannot post receipts/refunds) | IMPLEMENTED | Library only ever calls `createAdHocDemand`; no code path touches `student_fee_demands` payment/receipt state directly |

---

## 5. Gaps, ranked by severity

### 5.1 CRITICAL — Librarian role has no Library permissions and no home
- `ROLE_LIBRARY_PERMISSIONS` (`access.ts:6-35`) has entries for `SUPER_ADMIN`,
  `COLLEGE_ADMIN`, `PRINCIPAL`, `HOD`, `MANAGEMENT`, `FACULTY` — **no `LIBRARIAN` key**.
  `libraryPermissionsForRole('LIBRARIAN')` returns `[]`; `isAdminRole('LIBRARIAN')` is
  `false`. Result: a user with `role = 'LIBRARIAN'` gets `403` on every Library action,
  including `library.view`.
- The `LIBRARIAN` role is real and seeded (`scripts/seedOfficeQa.ts:20`,
  `qa.librarian.office@vviet.edu.in`), and is a recognized HR designation
  (`hr/defaults.ts:22-23`).
- `HomeRedirect` (`ProtectedRoute.tsx:184-210`) has no case for `LIBRARIAN` — it falls
  through to `/dashboard`, the generic Faculty Dashboard.
- `AppLayout` (`AppLayout.tsx`) has no `role === 'LIBRARIAN'` branch — Library is one nav
  item among 13 inside the generic "Outcomes & Quality" faculty group, alongside
  CO-PO, Attainment, Mentoring, Hostel, Transport, Procurement, HR, Placements
  (`AppLayout.tsx:70-154`). This is the exact anti-pattern §3/§4 warn against.
- No route guard restricts `/library/*` to a librarian context the way `/coe`, `/office`,
  `/admissions`, `/accountant` are restricted in `ProtectedRoute.tsx:87-131`.

**Impact:** the portal is architecturally built but operationally inaccessible to its
named operator. Classified as the #1 freeze blocker.

### 5.2 HIGH — Three mutating routes have no permission check
- `PATCH /api/library/members/:id/status` (`controller.ts:114-117`) → `updateMemberStatus`
  (`members.ts:202-224`): no `assertLibraryPermission` anywhere on this path. Any
  `requireAuth`'d user (e.g. plain `FACULTY`, whose library permission list is `[]`) can
  suspend/close a library membership.
- `POST /api/library/circulation/renew/:loanId` (`controller.ts:131-133`) →
  `renewLoan` (`circulation.ts:187-236`): no permission check. Any authenticated user can
  renew any loan in the college.
- `POST /api/library/circulation/lost/:loanId` (`controller.ts:135-138`) →
  `markLoanLost` (`circulation.ts:238-278`): no permission check. Any authenticated user
  can mark any active loan lost, which **creates a financial fine** against the member.

Contrast: `waiveFine`, and every `inventory.ts` function, correctly call
`assertLibraryPermission` — this is an inconsistency, not a design choice.

### 5.3 HIGH — Overdue fines never reach Finance
- `generateOverdueFine` (`fines.ts:29-72`), called from both the return path
  (`circulation.ts:165-166`) and the scheduled job (`jobs.ts:12-17`), inserts a
  `library_fines` row but never calls `createLibraryFineDemand`.
- Only `createLostFine` (`fines.ts:74-108`) triggers the Finance handoff.
- Net effect: every overdue fine sits permanently with `finance_demand_id = null`. It shows
  up in the Librarian's own fines list and blocks Library no-due (`clearance.ts:46-51`),
  but the student's Finance ledger, statement, and payment flow never see it — violating
  §22/§23 ("Library Fine → Finance … preview → post → readback") and directly contradicting
  the §63 connected-test requirement.

### 5.4 MEDIUM — Finance handoff is fire-and-forget, not recoverable
- `createLostFine` posts the demand via `setImmediate(() => { createLibraryFineDemand(...).catch(() => {}) })`
  (`fines.ts:102-105`) — outside the DB transaction, with the error silently discarded. If
  it fails (Finance table missing, network blip, fee-head lookup miss), there is no log,
  no retry, and no way to know without directly querying for
  fines with `finance_demand_id IS NULL`.
- `runLibraryJobs` (`jobs.ts`) never retries missing handoffs.

### 5.5 MEDIUM — Two implemented service functions are unreachable
- `updateCatalogItem` (`catalog.ts:129`) — no `PATCH /catalog/:id` route.
- `updateCopyStatus` (`copies.ts:111`) — no `PATCH /copies/:id/status` route. This is also
  the only way to record a copy as `DAMAGED`/`WITHDRAWN` outside the lost-loan flow (e.g. a
  copy found damaged during inventory scanning has no path to change status).

### 5.6 LOW/MEDIUM — Missing test coverage for the properties the checklist requires as gates
- No DB-backed concurrent-issue test (two simultaneous `issueBook` calls for the same
  copy) exists anywhere in the repo. The locking code is correct by inspection but the
  checklist explicitly requires this proven, not just implemented (§14/§53).
- No route-level (HTTP, not direct function call) IDOR/RBAC/tenant test exists for the
  Library router — the one e2e test file calls service functions directly, bypassing
  `assertLibraryPermission` and Express entirely, so it cannot catch gaps like §5.2.
- No test proves fine idempotency under concurrent duplicate posting, or the full
  overdue → fine → Finance → readback → replay-no-duplicate chain (§25/§63).
- No test proves the clearance state machine end-to-end (active loan → NOT CLEARED →
  return with unpaid fine → still NOT CLEARED → fine resolved → CLEARED) (§64).

### 5.7 LOW — UX/coverage gaps, not freeze blockers
- Faculty self-service page does not surface reservations or history, though the backend
  routes exist (`FacultyLibraryPage.tsx` vs `controller.ts:295-314`).
- No staff-side reservation cancel route/UI (only self-service cancel exists).
- No audit-log review route/UI for the librarian.
- Inventory/members/catalog UI lists don't paginate (`offset` never sent from the UI),
  though the backend supports it.
- `FacultyLibraryPage.tsx` links to `/library/circulation` for every faculty member
  regardless of whether they hold `library.circulation.issue` — dead link for non-librarian
  faculty (cosmetic, not a security issue since the backend still enforces the check).

---

## 6. Not gaps — legitimate, correctly-undeclared limitations

Per §73, the following are intentionally absent and are **not** freeze blockers:
- RFID hardware integration — not configured, no hardware present.
- Real barcode-scanner SDK — barcode is a stored/typed identifier only; acceptable for
  current scope.
- External ISBN metadata provider — not configured.
- Public OPAC — catalogue search is authenticated-only by design.
- E-book/digital-library provider — only a free-text link field exists; no provider.
- SMS/WhatsApp/email delivery for notifications — in-app notification channel only.
- Periodicals/journals subscription management — not modeled.
- Acquisition/procurement inside Library — correctly kept in the separate procurement
  module; no ledger duplicated.
- CSV/XLSX/PDF export — not implemented; not claimed.
- Replacement-book workflow — schema columns exist but workflow is unbuilt; flagged as a
  future enhancement, not fabricated.

---

## 7. Remediation plan (this pass)

Given "close gaps minimally," the following were fixed in this pass (see
`docs/LIBRARY_PORTAL_FREEZE_VALIDATION.md` for evidence they now pass):

1. Add `LIBRARIAN` to `ROLE_LIBRARY_PERMISSIONS` with full Library permissions
   (§5.1) — this is a data/config change, not new capability.
2. Add `LIBRARIAN` → `/library` in `HomeRedirect`, and scope a dedicated Librarian
   navigation context (not merged with the Faculty LMS/Outcomes menu) (§5.1).
3. Add `assertLibraryPermission` to the three unguarded routes (§5.2).
4. Make `generateOverdueFine` hand off to Finance the same way `createLostFine` does,
   and make the handoff idempotent/retryable via the existing job runner (§5.3, §5.4).
5. Wire `PATCH /catalog/:id` and `PATCH /copies/:id/status` routes to the existing,
   already-implemented service functions (§5.5).
6. Add the missing DB-backed concurrency test (concurrent same-copy issue), a route-level
   RBAC/IDOR/tenant regression, and an overdue→fine→Finance→readback connected test
   (§5.6).

Left out of this pass as genuinely out of current scope (§73, and consistent with "do not
invent features beyond design"): staff reservation cancel UI, audit-log review UI/route,
faculty self-service reservations/history UI, UI pagination controls. These are logged as
known limitations in the freeze document, not silently dropped.
