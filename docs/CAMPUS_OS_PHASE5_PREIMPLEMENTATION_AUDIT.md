# Campus OS Phase 5 — Pre-Implementation Audit
## Admissions, Enquiry CRM & Student Onboarding

Status: AUDIT COMPLETE — implementation not yet started.

---

## 0. Headline finding

**The capability described as "Phase 5" already exists, is fully implemented, and was
frozen on 2026-09-14.** `apps/api/src/modules/admissions/` implements the complete
lead→application→verification→eligibility→selection→offer→Finance→confirmation→
Student-conversion lifecycle, with a full Web workspace and an applicant portal. This
is independently confirmed by two prior, dated audit passes:

- `docs/ADMISSIONS_MANAGEMENT_FREEZE_VALIDATION.md` (2026-09-14) — final closure
  record, 41-gate table, all PASS/N/A, FROZEN.
- `docs/CAMPUS_DIGITISATION_GAP_AUDIT.md:117-118` (2026-09-23) — *"Admissions /
  Enquiry / CRM — IMPLEMENTED, FROZEN … Class A."*
- `docs/SKILLONX_IMPLEMENTATION_ROADMAP.md:24` — already lists Admissions among
  frozen, untouched modules; has no "Phase 5" entry for it at all.

Per governing mode (AUDIT FIRST → REUSE BEFORE BUILD → IMPLEMENT ONLY PROVEN GAPS),
this changes Phase 5's actual scope: it is **not** a greenfield build. It is, at most,
closing a small number of genuinely open gaps in the existing frozen module, or
declaring closure with none. Rebuilding or duplicating the existing Admissions core
would itself violate the frozen-module-protection rule (§86 of the authorization) —
Admissions is now a frozen prior-phase module, on the same footing as Phase 0–4.

---

## 1. Regression baseline

`find src -name '*.test.ts' | wc -l` → 133 test files. A fresh full run was executed
(not assumed from the historical Phase 4 closure number) and confirmed:

**246 suites / 1,441 tests / 1,441 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED**, normal
exit — identical to the Phase 4 closure figure (no drift since then). This is the
Phase 5 starting baseline.

---

## 2. Capability Classification Table

| Capability | Classification | Evidence |
|---|---|---|
| Admissions module | **EXISTING & SUFFICIENT (frozen)** | `apps/api/src/modules/admissions/*`, frozen 2026-09-14 |
| Enquiry/CRM | **EXISTING & SUFFICIENT (frozen)** | `admission_enquiries`, `createEnquiry` (service.ts:249-265) |
| Applicant entity | **EXISTING & SUFFICIENT (frozen)** | `admission_applicants`, `admission_applicant_education` |
| Application entity | **EXISTING & SUFFICIENT (frozen)** | `admission_program_preferences`, 16-state status enum (service.ts:18-35) |
| Document verification | **EXISTING & SUFFICIENT (frozen)** | `admission_documents`, `admission_document_verification_history`, PENDING/VERIFIED/REJECTED/RESUBMISSION_REQUIRED (`verifyDocument`, service.ts:456-503) |
| Eligibility | **EXISTING & SUFFICIENT (frozen)** | Deterministic rule engine + manager override (`evaluateEligibility`/`overrideEligibility`, 524-636) |
| Intake/seat capacity | **EXISTING & SUFFICIENT (frozen)** | `admission_program_intakes.approved_intake/selected_count/admitted_count`, `FOR UPDATE` locked at confirmation (`assertConfirmationGate`, 774-777) |
| Admission selection | **EXISTING & SUFFICIENT (frozen)** | `admission_selections`, `selectApplicant` (638-710) |
| Application/admission fee | **EXISTING & SUFFICIENT (frozen)** | `createAdmissionApplicantDemand` (finance/demands.ts:337-421), idempotency-keyed |
| Finance admission-demand acceptance | **EXISTING & SUFFICIENT (frozen)** | `demand_type: 'ADMISSION_FEE'`, `subject_type: 'ADMISSION_APPLICANT'` (finance/demands.ts:390-407); payment allocation support in `payments.ts` |
| Applicant → Student conversion | **EXISTING & SUFFICIENT (frozen)** | `confirmAdmission` (admissions/service.ts:808-972); idempotent short-circuit on retry (815-819) |
| Duplicate student creation protection | **EXISTING & SUFFICIENT (frozen)** | `unique(college_id, usn)`, `unique(college_id, admission_number)`, explicit `POTENTIAL_DUPLICATE_STUDENT` email guard (820-828) |
| Academic year/program/branch masters | **EXISTING & SUFFICIENT (frozen, referenced not duplicated)** | Admissions FK-references `programs`/`departments`/`academic_years`, does not own them |
| Parent/guardian info capture | **EXISTING BUT PARTIAL** | `guardian_json` captured on applicant, but never converted into a `parent_users`/`parent_student_links` row anywhere in production code |
| Notifications | **EXISTING & SUFFICIENT (in-app), MISSING (SMS/OTP)** | `admission_applicant_notifications` table exists; SMS/OTP confirmed `NOT_CONFIGURED` platform-wide |
| Admissions Web workspace | **EXISTING & SUFFICIENT (frozen)** | `AdmissionsLayout.tsx`, `AdmissionsPages.tsx`, 9 routes in `App.tsx:961-971` |
| Applicant self-service portal | **EXISTING BUT PARTIAL** | Login/status/documents exist for an applicant staff already created; no public self-registration/application-start endpoint |
| Public admission-enquiry submission | **MISSING** | `createEnquiry`/`createApplicant` both require staff permission — no unauthenticated public endpoint |
| India-specific quota/counselling (COMEDK/KEA/KCET/PGCET, lateral entry, management quota) | **INSTITUTION-DEPENDENT / NOT MODELED** | `admission_category` is a free-text field only; per governance rule (§15/§16 of authorization) this must not be hardcoded speculatively |
| Migration/Transfer Certificate document type | **MISSING** | No TC/migration-certificate concept found; document requirements are configurable (`admission_document_requirements`) so this is addable as data, not schema |
| Workflow Engine integration | **NOT INTEGRATED (by sequencing, not neglect)** | Admissions predates Workflow Engine by ~1 month; its own inline transition checks are functionally equivalent for its existing states |
| Document Engine integration | **NOT INTEGRATED (justified — Document Engine itself has 2 real gaps)** | No verification-status concept, no applicant-actor type in Document Engine; Admissions' bespoke tables are not a duplication mistake but a genuine capability gap in the shared engine |
| OTP/SMS | **NOT CONFIGURED (platform-wide, acceptable non-blocking limitation)** | `alumni/channels.ts:25,42-50`, `platform/service.ts:509` |
| RBAC roles | **EXISTING & SUFFICIENT** | `ADMISSIONS_MANAGER`/`ADMISSIONS_OFFICER` already exist and are wired; `ADMISSION_VERIFIER`/`COUNSELLOR` do not exist and were never proven necessary by the audit |

---

## 3. Explicit Answers

**1. Does an Admissions module already exist?**
Yes — fully implemented and frozen since 2026-09-14.

**2. Does an Enquiry/CRM implementation exist?**
Yes — `admission_enquiries` + `createEnquiry`, staff-created (no public lead-capture form).

**3. Does an Applicant entity exist?**
Yes — `admission_applicants` + `admission_applicant_education`, distinct from `students`.

**4. Does an Application entity exist?**
Yes — modeled as applicant + `admission_program_preferences`, with a 16-state status field on the applicant row driving the lifecycle.

**5. Is there existing document verification?**
Yes — full PENDING/VERIFIED/REJECTED/RESUBMISSION_REQUIRED lifecycle with actor/timestamp/remarks and history.

**6. Is eligibility represented?**
Yes — deterministic, configurable rule engine (`MIN_PERCENTAGE`/`SUBJECTS`/`DOCUMENTS`) with explainable output and governed manager override.

**7. Is intake/seat capacity represented?**
Yes — `admission_program_intakes` with row-level locking at confirmation to prevent over-allocation.

**8. Is admission selection represented?**
Yes — `admission_selections`, selection/waitlist states, offer issuance.

**9. Is application/admission fee represented?**
Yes — via a dedicated idempotent Finance bridge (`createAdmissionApplicantDemand`).

**10. Does Finance already accept admission-related demands?**
Yes — `demand_type: 'ADMISSION_FEE'`, `subject_type: 'ADMISSION_APPLICANT'`, with manual payment allocation support.

**11. Is applicant → student conversion implemented?**
Yes — `confirmAdmission`, transactional and idempotent, reassigns pre-student Finance records to the new student.

**12. Is duplicate student creation protected?**
Yes — DB unique constraints plus an application-level duplicate-verified-email guard.

**13. Are academic year/program/branch masters authoritative?**
Yes — Admissions references them by FK, does not own or duplicate them.

**14. Is Parent/guardian information already modeled?**
Partially — captured as JSON on the applicant record, but never provisioned into an actual `parent_users` account or linked via `parent_student_links` anywhere in production code. This is the one genuine "Student Onboarding" gap found.

**15. Are notifications available?**
In-app only (`admission_applicant_notifications`). SMS/OTP is not configured anywhere in the platform — not an Admissions-specific gap.

**16. Is there an Admissions Web workspace?**
Yes — full authenticated workspace plus a separate applicant portal, already built and routed.

**17. Are autonomous and affiliated-college admission needs different?**
Not modeled as a distinct configuration axis; `admission_category` is free text with no structured quota/counselling-channel model. Per governance rule, this should remain unmodeled speculative configuration unless a specific institution's requirement is proven — it is documented here as institution-dependent, not implemented as a guess.

**18. What exactly must Phase 5 add?**
Only two evidence-backed, non-speculative gaps were found:
- **Parent account provisioning at conversion**: `confirmAdmission` captures `guardian_json` but never creates/links a `parent_users`/`parent_student_links` row. This directly matches the authorization's own "Student Onboarding" framing (§44-45) and is the clearest proven gap.
- **Public applicant self-service submission**: no unauthenticated enquiry/application-start endpoint exists; every entry point requires a staff actor first. Whether this is in scope depends on whether the institution wants online public applications (an explicit non-blocking-limitation candidate per §89 of the authorization if declined).

Everything else audited (enquiry, application, documents, eligibility, selection, seats, fee/Finance integration, confirmation, Student conversion, RBAC, Web workspace) is **already built, frozen, and must not be reopened or duplicated.**

---

## 4. Architecture Decision (preliminary)

**Option C**: Phase 5 is not a domain build — the domain (Admissions) already exists
and is frozen. The only legitimate work is a **small, additive Student-Onboarding
integration** (Parent provisioning at conversion) plus an optional, explicitly-scoped
public self-service layer, both implemented as targeted extensions to the frozen
Admissions module (smallest necessary edit, per §86 of the authorization) rather than
a new module. No new domain, no new Web portal, no rebuild.

Authoritative ownership (unchanged, confirmed by audit):
- **Applicant**: Admissions (pre-conversion only).
- **Student**: Students module (post-conversion, unchanged).
- **Parent**: Parent module (identity/link ownership stays there even when Admissions
  triggers creation).
- **Program/Seat**: Academic masters / `admission_program_intakes` (unchanged).
- **Documents**: Admissions' own applicant-document tables (justified bespoke, not a
  Document Engine duplication mistake).
- **Finance**: Finance module (unchanged; Admissions only calls its demand API).
- **Hostel/Transport**: untouched; no hooks exist or are proposed.

---

## 5. Next Step

Given the two proven gaps are small and one (public self-service) is explicitly
optional/institution-dependent, scope confirmation is needed before any code changes,
consistent with how Phase 4's scope was narrowed by explicit selection. No
implementation has started.

---

## 6. Regression baseline (final)

246 suites / 1,441 tests / 1,441 PASS / 0 FAIL / 0 CANCELLED / 0 SKIPPED, normal exit
(see §1). This is the confirmed Phase 5 starting baseline; the full-suite result at
Phase 5 closure must be reported as a delta from this figure, not from the older
Phase-4-era "245/1,431" number.

## 7. Scope decision

Per explicit user selection: implement **Parent provisioning at conversion** only
(guardian data captured on the applicant, provisioned into a real `parent_users` +
`parent_student_links` record at `confirmAdmission` time), including the minimal Web
UI field needed to actually capture guardian data (since no existing UI writes to
`guardian_json` today). Public applicant self-service submission remains an explicit,
documented, non-blocking limitation/follow-up — not attempted in this pass.
