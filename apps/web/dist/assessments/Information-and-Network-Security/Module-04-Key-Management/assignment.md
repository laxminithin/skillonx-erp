# Assignment — Information and Network Security — Module 4 — Key Management

**Subject:** Information and Network Security  
**Module:** Module 4 — Key Management  
**Questions:** 40  
**Mix:** 11 Easy · 17 Intermediate · 12 Difficult  
**Bank total:** 323 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Describe the cryptographic key lifecycle with a campus TLS key as the example.

**Expected Key Points:**
- Generate in HSM, create CSR, CA issues cert, install chain, use for TLS, monitor expiry, rotate before notAfter, revoke if leaked, destroy old key material, log who accessed the HSM.
- Skipping destruction leaves copies on retired servers.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define KDC and name one protocol that uses the idea.

**Expected Key Points:**
- A trusted third party that already shares keys with principals and helps them get session keys.
- Kerberos is the standard teaching example (AS/TGS).
- Contrast with a CA that signs public keys instead of holding everyone’s AES keys.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is an X.509 certificate? List five fields.

**Expected Key Points:**
- A signed binding of public key and subject.
- Fields: serial, issuer, validity (notBefore/notAfter), subject, subjectPublicKeyInfo, extensions (SAN, EKU, AKI), signatureAlgorithm, signature.
- It does not contain the private key.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Why must private keys stay out of Git and student laptops?

**Expected Key Points:**
- Anyone with the repo or disk image can impersonate the server (TLS) or forge results (signing).
- Use HSM or OS key stores, restrict ACL, audit.
- Rotation/revocation is the cleanup if it already leaked.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Easy  ·  5 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare CRL and OCSP for a college that has 20 public certs and 5,000 student Wi-Fi certs.

**Expected Key Points:**
- Tiny public CRL is easy to fetch.
- 5,000 client certs make CRLs large — OCSP or short-lived certs help.
- Staple OCSP on the ERP.
- Need responder availability or fail-open/fail-closed policy explicitly chosen.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four ways keys are distributed in practice.

**Expected Key Points:**
- Out-of-band (USB/HSM courier), public-key wrapping (encrypt session key to a cert), KDC/Kerberos, PAKE/TLS handshake derivation.
- Insecure: email, chat, slide decks.
- State which matches which use case.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a trust anchor? How does a lab machine get one for the campus CA?

**Expected Key Points:**
- A pre-trusted root.
- Install the campus root via MDM/Group Policy/IT image, not by clicking through a browser warning on the café Wi-Fi.
- Pin if possible.
- Document fingerprint out of band (notice board + HTTPS on a known host).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain certificate chain validation as an algorithm, including revocation.

**Expected Key Points:**
- From leaf, follow issuer to a trust anchor.
- Verify each signature, time, basicConstraints/pathlen, key usage, SAN vs hostname, and revocation.
- Fail closed on unknown critical extensions.
- Mention that fetching intermediates from AIA is common but the root is local.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare Kerberos (KDC) and TLS/X.509 for campus single sign-on.

**Expected Key Points:**
- Kerberos: central KDC, tickets, great on internal Windows/NFS, needs clock sync, harder across the open web.
- TLS+certs (and OIDC): works in browsers, CA ecosystem, revocation pain.
- Many campuses use both (AD + HTTPS).
- Discuss password exposure: both can avoid sending passwords to every service.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO5
**Question:** The ERP private key leaked on a public GitHub gist for 4 hours. Write an incident plan (first 24 hours).

**Expected Key Points:**
- Revoke cert immediately, OCSP/CRL, issue new key in HSM, deploy new cert, kill long-lived sessions, rotate any other secrets in the same repo, search logs for use of the key, force password resets if the gist had more, legal/IT notify, postmortem.
- Do not just ‘push a new commit deleting the file’ — Git history keeps it.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain UKPT and why payment terminals should not store one PIN-encryption key forever.

**Expected Key Points:**
- A derived unique key per transaction means a skimmer dump of one key does not decrypt all past/future PIN blocks.
- Base keys live in HSMs.
- Static keys plus a large recorded ciphertext corpus is a single compromise.
- PCI teaching point, even if we do not implement UKPT.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Intermediate  ·  10 marks  ·  RESEARCH_TASK  ·  CO1
**Question:** Draw a 3-level PKI: Root CA (offline), Intermediate, ERP leaf. Show what is installed on the Apache host vs the student laptop.

**Expected Key Points:**
- Laptop: public root (and maybe intermediates).
- Apache: leaf private key in HSM/keystore, leaf cert, intermediate cert (chain).
- Root private key stays offline.
- Students never get the intermediate private key.
- Include revocation URLs on the intermediate.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A vendor ships a 10-year self-signed cert and says ‘click Advanced → Proceed’ is the security model. Critique.

**Expected Key Points:**
- Trains users to ignore warnings; any MITM can present another self-signed cert.
- No revocation story.
- Replace with a campus CA or public CA, automate renewal (90-day certs), and teach pinning for mobile apps.
- Self-signed is acceptable only with strict pinning in controlled apps.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** OCSP cache 1 hour, CRL 7 days. A key is stolen at t=0, revocation published at t=10 min. Bound the window of possible acceptance for a client using only CRL vs only OCSP (no staple).

**Expected Key Points:**
- OCSP: up to ~1 h after last good response, plus the 10 min publish delay.
- CRL: up to 7 days if the client just fetched before revocation.
- Stapling with a 1 h staple is similar to OCSP.
- This is why short-lived certs (hours/days) are trendy.
- State assumptions.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design key management for VVIET: TLS, Wi-Fi EAP, document signing, and student laptop disk encryption. Say where keys live and how they rotate.

**Expected Key Points:**
- TLS: HSM, 90-day automatable certs, stapling.
- EAP: campus CA for client certs or PEAP with server cert pinning.
- Document signing: offline/HSM code-sign with dual control.
- Disk: TPM-bound keys, BitLocker/FileVault escrow in IT KMS.
- Separate keys per purpose (no dual-use).
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Write an essay on ‘public-key cryptography does not remove trust — it relocates it to CAs and HSMs’.

**Expected Key Points:**
- Alice still needs an authentic public key.
- CAs, DNSSEC/DANE, pinning, and user training are the relocation.
- HSMs relocate trust to hardware vendors and procedures.
- Kerckhoffs still applies: algorithms public, roots and processes are the remaining secrets.
- Campus IT is a mini-CA whether it admits it or not.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO2
**Question:** Intermediate CA was compromised. What happens to existing leaves? How do you recover without replacing the root in 8,000 laptops?

**Expected Key Points:**
- Revoke the intermediate, publish CRL/OCSP for it (clients must check intermediates too).
- Issue a new intermediate from the still-safe offline root.
- Reissue all leaves.
- Roots on laptops unchanged.
- If path validation skipped intermediate revocation, this fails — so mandate it.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO1
**Question:** Specify OpenSSL-style command intent (not a dump of flags) to: generate a key in a software store, CSR, then list what a verifier checks on the resulting PEM. Contrast with doing this in an HSM.

**Expected Key Points:**
- Software: generate key, lock permissions, CSR with SAN erp.vviet.ac.in, CA signs.
- Verifier: chain, time, SAN, EKU serverAuth, revocation.
- HSM: key generated inside, CSR made via PKCS#11, private key never a PEM on disk.
- Marks for the contrast, not memorized CLI.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare key wrapping, KDC session-key delivery, and public-key transport of a session key (TLS handshake idea).

**Expected Key Points:**
- Wrapping: KEK at rest.
- KDC: Needham–Schroeder/Kerberos tickets carry keys under principal keys.
- TLS: (EC)DHE for forward secrecy plus certificates for authentication; RSA key transport is legacy.
- Discuss PFS: stolen long-term key should not decrypt old DH sessions.
- Pick mechanisms per threat.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘We disabled revocation checks because the OCSP server was slow during internals.’ Critique with a safer alternative.

**Expected Key Points:**
- Fail-open revocation is a gift after compromise.
- Alternatives: OCSP staple (server fetches), short-lived certificates (24–72 h) so revocation is less critical, local CRL caches with known update, hard-fail for high-value ERP.
- Fix OCSP capacity rather than teach browsers to skip security.
- Document residual risk.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Key Management).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Key and Management in the context of Key Management. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Information and Network Security scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Key as used in Key Management. Include one precise example.

**Model answer:** Key is a foundational construct in Key Management. Example should name entities/operations and relate to Management. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Key and Management. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Key Management theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Key Management to a realistic campus/industry scenario relevant to Key Management. State assumptions.

**Model answer:** Describe scenario, map concepts (Key, Management), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Management and its role within Key Management.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Key if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within Key Management; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Key while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Key Management principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Key Management in Information and Network Security.

**Model answer:** Provide four definitions: include Key, Management, and two adjacent terms from Key Management. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Key Management that integrates Key, Management, and Key Management.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Management in Key Management.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Key.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Key and expected. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Key and Key Management: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Key Management, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as Key in Key Management.

**Model answer:** Dependency chain with one counterexample showing what fails if Key is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where expected measurably improves an outcome in Information and Network Security.

**Model answer:** Context, intervention using expected, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Management in Key Management. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Key in Key Management: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Information and Network Security.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Key Management for Key Management.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Key Management.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Key Management under constraints typical of Information and Network Security.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Management in Key Management. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Key in Key Management, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

