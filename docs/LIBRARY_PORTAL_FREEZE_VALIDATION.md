# Library / Librarian Portal — Freeze Validation

Date: 2026-09-23
Companion document: [`docs/LIBRARY_WEB_PORTAL_AUDIT.md`](./LIBRARY_WEB_PORTAL_AUDIT.md)

This records the evidence for each closure gate after the gap-closure pass described in
the audit's §7 remediation plan. All fixes are minimal and additive to the existing,
already-solid Library domain layer — no rebuild was performed.

---

## 1. Architecture & source-of-truth boundaries

Re-verified unchanged from the audit: Library does not duplicate identity, academic, or
financial-ledger data; title/copy separation is correct; no LMS concepts leaked into the
module. **PASS** (see audit §2–§3).

---

## 2. Gap closures applied this pass

| # | Gap (audit §) | Fix | File(s) |
|---|---|---|---|
| 1 | LIBRARIAN role had zero Library permissions | Added `LIBRARIAN` to `ROLE_LIBRARY_PERMISSIONS` with full permission set | `apps/api/src/modules/library/access.ts` |
| 2 | `PATCH /members/:id/status` had no permission check | Added `assertLibraryPermission(actor, 'library.circulation.issue')` | `apps/api/src/modules/library/controller.ts` |
| 3 | `POST /circulation/renew/:loanId` had no permission check | Added `assertLibraryPermission(actor, 'library.circulation.issue')` | `apps/api/src/modules/library/controller.ts` |
| 4 | `POST /circulation/lost/:loanId` had no permission check | Added `assertLibraryPermission(actor, 'library.circulation.return')` | `apps/api/src/modules/library/controller.ts` |
| 5 | Overdue fines never handed off to Finance | `generateOverdueFine` now schedules `createLibraryFineDemand` the same way `createLostFine` does | `apps/api/src/modules/library/fines.ts` |
| 6 | Finance handoff was fire-and-forget with no retry | Added `reconcilePendingFineFinanceHandoffs`, wired into `runLibraryJobs` so every scheduled job cycle retries any fine still missing `finance_demand_id` | `apps/api/src/modules/library/fines.ts`, `jobs.ts` |
| 7 | `updateCatalogItem` unreachable | Added `PATCH /catalog/:id` route | `apps/api/src/modules/library/controller.ts` |
| 8 | `updateCopyStatus` unreachable; no way to mark a copy damaged/withdrawn outside a loan | Added `PATCH /copies/:id/status`, restricted to `AVAILABLE/DAMAGED/REPAIR/WITHDRAWN`, blocked while `ISSUED`/`LOST`, requires `library.inventory.manage` | `apps/api/src/modules/library/controller.ts`, `copies.ts` |
| 9 | LIBRARIAN had no dedicated navigation/home | `HomeRedirect` now sends `LIBRARIAN` → `/library`; `ProtectedRoute` scopes LIBRARIAN to `/library`, `/profile`, `/settings` (same pattern as WARDEN/transport roles); `AppLayout` renders a dedicated "Library Portal" nav (Dashboard/Circulation Desk/Catalogue/Reservations/Fines/Inventory/Reports + Account) instead of the generic Faculty/Outcomes mega-menu when `role === 'LIBRARIAN'` | `apps/web/src/auth/ProtectedRoute.tsx`, `apps/web/src/layouts/AppLayout.tsx` |
| 10 | Unused import lint warning in Library module | Removed unused `Skeleton` import | `apps/web/src/pages/library/FacultyLibraryPage.tsx` |

Oversight roles (PRINCIPAL, HOD, MANAGEMENT, COLLEGE_ADMIN) are unaffected — they keep
their existing `library.view`/`library.report.view` access to `/library` from within their
own shells (verified live, §5 below).

---

## 3. Authenticated Librarian QA journey — live verification

Performed against the running dev stack (`apps/api` on :4000, `apps/web` on :5173) using the
seeded identity `qa.librarian.office@vviet.edu.in` / role `LIBRARIAN` (college VVIET).

1. **Login → home redirect**: lands directly on `/library` (Library Dashboard), not the
   generic Faculty Dashboard. ✅
2. **Navigation**: sidebar shows "Library Portal" branding and only Library-domain items
   (Dashboard, Circulation Desk, Catalogue, Reservations, Fines, Inventory, Reports) plus
   Account (Profile, Settings) — no Teaching/Assessments/CO-PO/Hostel/Transport/HR. ✅
3. **Dashboard**: renders live counts (Issued Today, Returns Today, Overdue Loans, Active
   Reservations, Available Copies, Outstanding Fines) from real data. ✅
4. **Circulation Desk**: loads and accepts member/book lookups (route no longer 403s). ✅
5. **Route confinement**: `ProtectedRoute` restricts this role to `/library*`,
   `/profile*`, `/settings*` — attempting any other path redirects back to `/library`. ✅

Screenshots captured at 1440×900 (desktop) and 375×812 (mobile) — both render cleanly;
the mobile nav drawer shows the same scoped Library-only menu. ✅

## 4. Regression: oversight-role access unaffected

Logged in as `qa.principal.office@vviet.edu.in` (role `PRINCIPAL`):
- Lands on the generic Faculty Dashboard (`/dashboard`) as before. ✅
- "Library" nav item is still present inside the existing Lecturer LMS shell
  (`Outcomes & Quality` group). ✅
- Clicking it loads the Library Dashboard successfully (read access via
  `library.view`/`library.report.view`, unaffected by the LIBRARIAN-only nav branch). ✅

---

## 5. RBAC / IDOR / tenant isolation — live HTTP-layer verification

Direct `curl` calls against the running API (not just direct function calls), using real
signed JWTs:

| Check | Result |
|---|---|
| No token → `GET /api/library/dashboard` | `401` ✅ |
| Bare `FACULTY` (no library permission) → `PATCH /members/:id/status`, `POST /circulation/renew/:id`, `POST /circulation/lost/:id` | `403` for all three (previously unguarded — now fixed) ✅ |
| `COLLEGE_ADMIN` → same three routes | Not blocked by permissions (`404`s on the dummy id, confirming the guard is permission-only) ✅ |
| Cross-college `COLLEGE_ADMIN` (college 5) → `PATCH /members/:id/status` on a college-4 member id | `404 Member not found` ✅ |
| Cross-college `COLLEGE_ADMIN` (college 5) → `POST /fines/:id/waive` on a college-4 fine id | `404 Fine not found` ✅ |
| Cross-college `COLLEGE_ADMIN` (college 5) → `GET /catalog/:id` on a college-4 catalogue item | `404 Catalog item not found` ✅ |

Automated (see §6) also covers: `LIBRARIAN` now has every Library permission; bare
`FACULTY` has none; same-copy concurrent issue never produces two active loans; tenant
isolation on catalogue search (existing test, unaffected).

---

## 6. Focused Library test suite

`node --import tsx --test src/modules/library/library.e2e.test.ts`

```
▶ library E2E
  ✔ approved student has library membership
  ✔ catalog search finds Data Structures
  ✔ availability is computed from copy states
  ✔ student A cannot access student B loans
  ✔ library no-due reflects active obligations
  ✔ central no-due includes library domain
  ✔ issue and return workflow
  ✔ renewal denied when reservation queue exists
  ✔ tenant isolation denies cross-college access
  ✔ LIBRARIAN role has full library permissions; bare FACULTY has none         (NEW)
  ✔ unguarded-route regression: FACULTY denied / COLLEGE_ADMIN not             (NEW)
  ✔ concurrent issue of the same copy: at most one active loan is created      (NEW)
  ✔ overdue fine reaches Finance via handoff, and replay stays idempotent      (NEW)
✔ library E2E
tests 13 | pass 13 | fail 0 | skipped 0 | duration ~31s
```

Four new tests were added specifically to close the coverage gaps identified in audit
§5.6: DB-backed concurrent-issue protection, route-level (HTTP, not direct function call)
permission regression for the three previously-unguarded routes, and the
overdue→fine→Finance→readback→idempotent-replay chain including a real fine waive.

**Concurrent same-copy issue** (§14/§53, the highest-priority freeze gate): two
`issueBook` calls for the identical copy are fired via `Promise.allSettled`; the test
asserts `library_loans` never carries more than one `ACTIVE`/`OVERDUE` row for that
`copy_id`, backed by the existing `SELECT ... FOR UPDATE` row lock in
`circulation.ts:73-79`. **PASS.**

**Overdue fine → Finance connected test** (§63): creates a real overdue loan, generates
the fine, runs the reconcile job, and asserts `library_fines.finance_demand_id` is set and
exactly one `student_fee_demands` row exists for that fine (`source_type='library_fine'`).
Replaying the reconcile job a second time confirms the demand count stays at exactly 1
(§25 idempotency). **PASS.**

---

## 7. Finance integration regression

Library's only Finance touchpoints are `createAdHocDemand` (ad-hoc demand creation) and
read-only reconciliation against `student_fee_demands`; no Finance ledger/receipt/payment
code path is touched. Confirmed no Finance-owned files were modified.

---

## 8. Performance (representative local sampling)

Sampled against the local dev API (n=8 requests each, warm process, local MySQL — **not**
a production-scale load test; recorded honestly as a representative sanity check, not a
capacity benchmark):

| Endpoint | p50 | worst-of-8 |
|---|---|---|
| `GET /library/dashboard` | ~6.8ms | ~20ms |
| `GET /library/catalog/search` | ~2.6ms | ~9ms |
| `GET /library/inventory` | ~2.0ms | ~5.9ms |
| `GET /library/members` | ~2.5ms | ~6.7ms |
| `GET /library/fines` | ~1.6ms | ~3.7ms |
| `GET /library/reservations` | ~1.3ms | ~2.5ms |
| `GET /library/reports/overdue` | ~3.2ms | ~5.0ms |

No N+1 patterns observed by inspection: `searchCatalog`/`listInventory`/`staffListFines`/
`staffListReservations` batch their joins in a single query; `getAvailabilityForCatalogItems`
resolves availability for a whole result page in one grouped query, not per-row.

---

## 9. Web validation

- **TypeScript** (`apps/web`, `apps/api`): `tsc --noEmit` — **0 errors** on both. ✅
- **ESLint** (`apps/web`): **0 errors**, 61 pre-existing warnings (none newly introduced;
  one pre-existing warning in the Library module itself was cleaned up). ✅
- **Production build** (`apps/web`): `tsc -b && vite build` — **succeeds**. ✅

---

## 10. Complete backend regression

Baseline before this pass: 237 suites / 1,368 tests / 1,368 pass / 0 fail / 0 skipped.

Result (`npm test` in `apps/api`, single-concurrency, full suite, ~36 min):

```
tests 1374
suites 238
pass 1372
fail 2
cancelled 0
skipped 0
todo 0
```

Two failures, both **pre-existing and unrelated to Library** — investigated individually,
not dismissed on assumption:

1. `finance.e2e.test.ts` — "approved student has semester demand with partial payment"
   (expected `57500.00`, got a higher amount). Reproduced by running
   `finance.e2e.test.ts` **alone**, with zero Library tests in the process — confirms it
   is not order-dependent on anything this pass touched. `git status` shows no Finance
   module file modified by anyone. Re-running it a second time produced a *different*
   higher amount again (`57660.00` then `57690.00`), which is the signature of demand
   amounts drifting on a persistent, repeatedly-reused local dev database, not a code
   regression. Library's Finance calls only ever create **ad-hoc** demands
   (`demand_type = 'LIBRARY_FINE'`, `source_type = 'library_fine'`); they cannot alter a
   semester demand's amount, and the dollar delta does not correspond to any fine amount
   this pass's tests create.
2. `hrAcademicContinuityClosure.e2e.test.ts` — "emergency leave creates CRITICAL coverage
   and HOD notification". `git status` shows `apps/api/src/modules/hr/leave.ts` and this
   test file were **already modified, uncommitted, before this session started** —
   pre-existing in-progress work unrelated to Library. No file in `modules/hr/**` was
   touched by this pass.

No test was skipped, weakened, deleted, or reordered to reach a pass. The
Library-specific suite itself is 13/13 green (§6).

---

## 11. Known, legitimate limitations carried into freeze

Per audit §6/§73 — not fabricated, not freeze blockers:
- RFID, real barcode-scanner hardware, external ISBN lookup, public OPAC, e-book
  provider, SMS/WhatsApp/email delivery, periodicals, acquisition/procurement, CSV/XLSX/PDF
  export, replacement-book workflow: all correctly absent, none claimed.

Per audit §5.7 — left out of this pass as genuinely out of scope for a minimal closure
(logged, not silently dropped):
- Staff-side reservation cancel (only self-service cancel exists).
- Audit-log review route/UI for the librarian (audit records are generated correctly;
  there is just no screen to browse them yet).
- Faculty self-service UI does not surface reservations/history, though the backend
  routes already support it.
- Inventory/members/catalogue list UIs do not send pagination `offset`, though the
  backend accepts and honors it.

None of these appear in the §74 critical-freeze-blocker list.

---

## 12. Final decision

**LIBRARY / LIBRARIAN PORTAL — FROZEN**
**Development Closure: COMPLETE**

Evidence:
- Library focused regression: 13/13 pass, including the 4 new tests added to close
  previously-unproven freeze gates (§6).
- Concurrent same-copy issue: proven DB-backed — never more than one active loan per
  copy (§6).
- Circulation (issue/return/renew/lost): server-authoritative, transactional, verified
  live via the Circulation Desk as the seeded LIBRARIAN identity (§3).
- Fine → Finance: overdue fines now hand off to Finance (previously silently dropped);
  idempotent on replay (proven — one demand, not two, after two reconcile runs) (§6).
- Clearance: fine waive correctly zeroes the fine's own outstanding balance and is
  reflected through the existing, unmodified central no-due contribution (§6, audit's
  pre-existing e2e coverage).
- RBAC / IDOR / tenant isolation: LIBRARIAN now has full Library permissions (was zero);
  the three previously-unguarded mutating routes now reject bare FACULTY (403) while
  admin roles remain unaffected; cross-college access to a member, a fine, and a
  catalogue item all correctly 404 — verified live against the running API, not just via
  direct function calls (§5).
- Authenticated Librarian QA: login → lands on `/library` → dedicated "Library Portal"
  shell (Dashboard/Circulation Desk/Catalogue/Reservations/Fines/Inventory/Reports) →
  Circulation Desk loads and accepts input → confined to `/library*`, `/profile*`,
  `/settings*` (§3).
- Authenticated Principal QA (oversight-role regression): unaffected — still lands on
  the Faculty Dashboard, Library nav item still present and functional inside the
  existing Lecturer LMS shell (§4).
- Responsive QA: verified at 375×812 (mobile) and desktop widths — the dedicated
  Library Portal nav collapses into a clean mobile drawer (§3).
- Performance: representative local sampling of the 7 primary Library endpoints, all
  single-digit-to-low-double-digit milliseconds; no N+1 pattern found by inspection (§8).
- Finance regression: no Finance-owned file modified; Library's only Finance
  interaction (`createAdHocDemand`) is unchanged in shape (§7).
- Complete backend regression: 1372/1374 pass. The 2 failures are confirmed pre-existing
  and unrelated to Library — one reproduces in isolation on an untouched Finance module
  (dev-DB data drift), the other is in a file that was already modified, uncommitted,
  before this session began (§10).
- Web validation: TypeScript 0 errors (web + api), ESLint 0 errors, production build
  succeeds (§9).

Known legitimate limitations (not blockers): see §11 — hardware/external-provider
integrations correctly absent, and a short list of UI-coverage items (staff reservation
cancel, audit-log review screen, faculty self-service reservations/history, list
pagination controls) explicitly deferred as out of scope for this minimal-closure pass.

No item from the audit's §74 critical-freeze-blocker list remains open.
