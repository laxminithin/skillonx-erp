# Campus OS Phase 6 — Pre-Implementation Audit
## Research, Grants, Consultancy, Innovation & IPR

Status: AUDIT COMPLETE — implementation not yet started.

---

## 0. Headline finding

**The repository's own prior governance documents have already investigated this
exact domain and classified it as Class G — "Optional/institution-dependent, build
only on explicit demand."** This is not a new conclusion reached by this audit; it is
independently confirmed by:

- `docs/CAMPUS_DIGITISATION_GAP_AUDIT.md:135-136` (Section H, "Research / R&D / Grants
  — PARTIAL"): describes exactly the CV-shaped Faculty Academic Record coverage found
  below and classifies the remaining gap as Class G.
- `docs/CAMPUS_DIGITISATION_GAP_AUDIT.md:159-160` (Section P, "Incubation / IIC /
  Startup / IPR — NOT_FOUND").
- `docs/SKILLONX_CAMPUS_OS_ARCHITECTURE.md:80,120` — explicitly rejects a dedicated
  Research Office portal "at this time," citing no evidence of proposal/grant-
  administration volume, and lists Research/Grants administration among domains to
  build "only on explicit institutional request."
- `docs/SKILLONX_IMPLEMENTATION_ROADMAP.md:55,66,137-138` — "Hold indefinitely, no
  current evidence of need" for both Research/Grants administration and Incubation/
  IIC/Startup/IPR.

Per governing mode (AUDIT FIRST → REUSE BEFORE BUILD → IMPLEMENT ONLY PROVEN GAPS),
this materially changes what "implement only proven gaps" means here: the repository
itself has already proven there is no evidenced institutional demand for a full
grants-administration domain. This audit therefore separates **what already exists**
(substantial) from **what would need building** (substantial, but explicitly
un-evidenced by the repo's own prior analysis) and defers the build-vs-hold decision
to explicit user scope selection, exactly as the governing docs recommend.

---

## 1. Regression baseline

A fresh full-suite run was launched (not assumed from the prior Phase 5 closure
figure) and confirmed: **247 suites / 1,450 tests / 1,450 PASS / 0 FAIL / 0 CANCELLED
/ 0 SKIPPED**, normal exit — identical to the reported Phase 5 closure figure, no
drift. This is the confirmed Phase 6 starting baseline.

---

## 2. Capability Classification Table

| Capability | Classification | Evidence |
|---|---|---|
| Research module (dedicated) | **MISSING** | No `research`/`grants` module directory anywhere |
| Research Project entity (funded/grants) | **MISSING (structured)** / **EXISTING BUT PARTIAL (as CV entry)** | `faculty_records` domain `PROJECT` exists but all financial/administrative fields live in unstructured `details` JSON (`facultyProfile/types.ts:116-123`) |
| Faculty Academic Record — publications | **EXISTING & SUFFICIENT (frozen)** | `faculty_records` domain `PUBLICATION` (JOURNAL/CONFERENCE/BOOK/BOOK_CHAPTER/EDITED_VOLUME), DOI dedupe |
| Faculty Academic Record — patents/IPR | **EXISTING & SUFFICIENT as CV record, MISSING as institutional case** | `faculty_records` domain `PATENT` (PATENT/COPYRIGHT/DESIGN/TRADEMARK), no institutional disclosure→filed→granted lifecycle |
| Faculty Academic Record — books/chapters/articles | **EXISTING & SUFFICIENT (frozen)** | Same `PUBLICATION` domain, `record_type` distinguishes them |
| Faculty Academic Record — conferences | **EXISTING & SUFFICIENT (frozen)** | `PUBLICATION.CONFERENCE` (output) + `CONFERENCE_ROLE` domain (participation roles) |
| Faculty Academic Record — FDP/consultancy/awards/research guidance | **EXISTING & SUFFICIENT (frozen)** | Domains `FDP`, `CONSULTANCY`, `AWARD`, `RESEARCH_GUIDANCE` |
| Faculty Academic Record verification workflow | **EXISTING & SUFFICIENT (frozen), single-hop only** | `verification.ts` — DRAFT→SUBMITTED→VERIFIED/RETURNED/REJECTED, hard self-verify guard, HOD department-scoped + institutional roles |
| Finance project/grant/cost-centre dimension | **MISSING — Finance has NO institutional ledger of any kind** | Zero hits for `project_id`/`grant_id`/`cost_centre` anywhere in Finance's 22 tables; Finance is 100% student-fee-scoped |
| Procurement/Asset funding-source hook | **MISSING** | Zero hits for `project_id`/`funding_source` in Procurement/Asset schema |
| Consultancy (structured, distinct from CV entry) | **MISSING** | Only exists as a `faculty_records` CV domain; no client/agreement/revenue-share/closure entity |
| IPR (institutional lifecycle) | **MISSING** | No DISCLOSURE→FILED→GRANTED→COMMERCIALIZED state machine; only a CV-style patent record |
| Student institutional-research participation | **MISSING (distinct from academic capstone)** | Placement's `student_projects` is an academic capstone/mini-project entity, no grant/PI linkage |
| Proposal approval | **MISSING** | No proposal entity anywhere |
| Funding agencies | **MISSING (as a master)** | Only free-text `fundingAgency` field inside CV JSON |
| Utilization/expenditure tracking | **MISSING** | No such concept anywhere; Finance has nothing to track it against |
| Project documents/evidence | **SHARED FOUNDATION AVAILABLE** | Document Engine (P0.4) generic entityType/entityId API, unused by facultyProfile (uses its own `faculty_record_evidence` table instead) but directly reusable for a new Grants entity |
| Institutional research reporting | **EXISTING BUT PARTIAL** | `faculty_records` can answer "who published/patented what," cannot answer "how much grant money sanctioned/utilized" |
| R&D/Research Web workspace | **MISSING** | No `/research`, `/grants`, `/ipr`, `/consultancy` route anywhere; only `/faculty-profile` self-service page |
| Workflow Engine (multi-step approval) | **SHARED FOUNDATION AVAILABLE, unused by facultyProfile** | Generic `definition`/`instance`/`performAction` API confirmed reusable for a PI→HOD→Research-Coordinator→Principal chain |
| Document Engine | **SHARED FOUNDATION AVAILABLE, unused by facultyProfile** | Generic entity-agnostic API confirmed reusable |
| RESEARCH_DIRECTOR/COORDINATOR/ADMIN roles | **MISSING** | Zero hits anywhere in RBAC |

---

## 3. Explicit Answers

**1. Does a Research module already exist?**
No dedicated module. Research-adjacent CV data lives inside the Faculty Academic
Record (`facultyProfile`) module.

**2. Does a Research Project entity already exist?**
As a CV entry only (`faculty_records` domain `PROJECT`, types SPONSORED/FUNDED/GRANT).
No structured, queryable, financially-trackable project entity exists.

**3. Does Faculty Academic Record already store research projects?**
Yes — see above. This is the correct source of truth for "faculty X ran project Y as
a professional achievement," and must not be duplicated.

**4. How are publications represented?**
`faculty_records` domain `PUBLICATION`, record types JOURNAL/CONFERENCE/BOOK/
BOOK_CHAPTER/EDITED_VOLUME/OTHER, deduped on DOI, verified single-hop.

**5. How are patents represented?**
`faculty_records` domain `PATENT`, record types PATENT/COPYRIGHT/DESIGN/TRADEMARK/
OTHER, deduped on application number. CV-shaped — no institutional prosecution
lifecycle (filed→examined→granted→commercialized).

**6. How are books/book chapters/articles represented?**
Same `PUBLICATION` domain as journals — distinguished only by `record_type`.

**7. How are conferences represented?**
Split: `PUBLICATION.CONFERENCE` (a paper presented, as an output) and
`CONFERENCE_ROLE` domain (participation role: presenter/chair/keynote/reviewer/etc.).

**8. How are funded projects represented?**
Same `faculty_records` `PROJECT` domain as #2/#3 — CV entry, not an administrative
grant record.

**9. Does Finance represent grants/project funds?**
No. Finance has zero non-student-fee financial concepts of any kind.

**10. Does Finance support project/cost-centre dimensions?**
No — confirmed absent from all 22 Finance tables.

**11. Is consultancy represented?**
As a CV entry (`faculty_records` domain `CONSULTANCY`) only — no client, agreement,
revenue-share, or closure entity.

**12. Is IPR represented?**
As a CV entry (`PATENT` domain, covering patents/copyright/design/trademark) only —
no institutional case-management lifecycle.

**13. Is student research represented?**
No — only an unrelated academic capstone/mini-project concept in Placement.

**14. Is proposal approval represented?**
No — no proposal entity exists at all.

**15. Are funding agencies represented?**
No — free-text field inside CV JSON only, no master table.

**16. Is utilization/expenditure tracking represented?**
No.

**17. Are project documents/evidence represented?**
Faculty Academic Record has its own bespoke evidence table
(`faculty_record_evidence`); the generic Document Engine (P0.4) is unused by it but
available for reuse by any new Phase 6 entity.

**18. Is institutional research reporting represented?**
Partially — CV-level publication/patent counts are queryable; financial/
administrative grant reporting (sanctioned amounts, utilization, active grant count)
is not possible today because no structured data exists for it.

**19. Is an R&D/Research Web workspace present?**
No — only the existing `/faculty-profile` self-service page, which is not a research-
office administrative workspace.

**20. What should remain in Faculty Academic Record?**
Everything it already owns: publications, patents (as achievements), books/chapters,
conferences, FDP, awards, consultancy (as achievement), research guidance. Phase 6
must not re-model or duplicate any of this.

**21. What should Phase 6 own (if built)?**
The institutional grants-*administration* layer that does not exist anywhere today:
proposal submission/approval, a funding-agency master, structured PI/Co-PI/
co-investigator linkage, sanction/budget/utilization tracking (explicitly
record-only, not a Finance ledger, since Finance itself has no institutional-ledger
dimension to plug into), milestones, and project closure — linking to (not
duplicating) Faculty Academic Record for the resulting CV projection.

**22. What exactly must Phase 6 add?**
This is where explicit scope confirmation is required (see §5) given the repository's
own prior classification of this entire domain as build-on-demand-only. Candidate
gaps, in decreasing order of evidenced necessity:
- A structured **Research Project** entity (title, type, PI/Co-PI as real
  faculty-user links, funding agency, sanctioned amount, dates, status), replacing
  nothing in Faculty Academic Record but giving the institution a queryable,
  reportable table instead of opaque JSON.
- **Proposal → approval → award → project** lifecycle, reusing the Workflow Engine.
- A minimal **funding agency** reference list.
- Record-only **sanction/utilization** tracking (explicitly not a Finance ledger).
- A link from a completed/awarded project back to a Faculty Academic Record `PROJECT`
  entry (projection, not duplication), so a faculty member's CV entry can optionally
  reference the canonical institutional record.
- Everything else (consultancy revenue distribution, IPR institutional lifecycle,
  student research participation, Procurement/Asset funding-source linkage, ethics
  approval, milestones/closure, a dedicated Web workspace) should be treated as
  candidate scope items requiring explicit selection, not assumed.

---

## 4. Architecture Decision (preliminary)

Given the repository's own governance docs already classify this domain as
build-on-demand, the responsible architecture decision is **Option C: a thin,
minimal orchestration layer** — if built at all — over Faculty Academic Record +
Workflow Engine + Document Engine, adding only the smallest structured entity set
needed to make grants administratively trackable (proposal → award → project,
funding agency, record-only sanction/utilization), explicitly NOT a full
Research/Grants/Consultancy/IPR/Innovation domain with a dedicated Web portal, unless
the user confirms otherwise.

Authoritative ownership (confirmed by audit, to be preserved regardless of scope
decision):
- **Faculty achievement/CV record** (publication, patent, project-as-achievement,
  consultancy-as-achievement, conference, FDP, award, research guidance): Faculty
  Academic Record — untouched, not duplicated.
- **Institutional research project** (if built): new, minimal, links to Faculty
  Academic Record rather than replacing it.
- **Funding/money**: Finance remains the only real ledger; since Finance has no
  institutional-ledger dimension at all, any Phase 6 sanction/utilization figures
  must be explicitly documented as record-only / non-authoritative-for-accounting,
  not integrated into Finance's student-fee ledger.
- **Procurement/Assets**: untouched; no funding-source hook exists or is proposed
  without explicit scope confirmation.
- **Student**: untouched; no institutional-research-participation entity exists or
  is proposed without explicit scope confirmation.

---

## 5. Next Step — scope confirmation required

Given (a) the scale of a full grants-administration build, and (b) the repository's
own prior audits explicitly recommending this domain be built only on confirmed
institutional demand, no implementation has started. Scope confirmation from the user
is needed before any code changes.
