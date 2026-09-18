# Assignment — Information and Network Security — Module 5 — Cryptographic Applications

**Subject:** Information and Network Security  
**Module:** Module 5 — Cryptographic Applications  
**Questions:** 40  
**Mix:** 11 Easy · 17 Intermediate · 12 Difficult  
**Bank total:** 323 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain what TLS provides to the ERP (CIA mapping) and what it does not (E2EE of mail stored on the server).

**Expected Key Points:**
- TLS authenticates the ERP (usually), encrypts the pipe, and protects integrity of records.
- The ERP still sees passwords/marks in memory.
- It does not encrypt data at rest by itself, nor authenticating the human beyond what the app does.
- Mis-issued certs and stripped TLS are residual risks.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Why was WEP abandoned? Mention IV size and RC4 misuse at teaching level.

**Expected Key Points:**
- 24-bit IVs reused, related-key RC4 attacks, weak integrity (CRC).
- Tools recovered keys from enough frames.
- WPA/WPA2 replaced it with TKIP then AES-CCMP.
- Do not enable WEP ‘for old printers’ on a production SSID.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare WPA2-PSK and WPA2-Enterprise for a 5,000-student campus.

**Expected Key Points:**
- PSK: easy, terrible offboarding, passphrase on posters, handshake+PSK decrypts.
- Enterprise: RADIUS, unique creds/certs, revoke one student, need PKI/IdP ops.
- Hostels often start with PSK and should migrate.
- Guest SSID isolation still needed.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define perfect forward secrecy with a stolen-server-key story.

**Expected Key Points:**
- Police seize last year’s server disk including the TLS private key.
- With RSA key transport they decrypt archived pcaps.
- With ECDHE they get future impersonation risk until revocation, but not past record keys.
- Rotate keys anyway.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain GSM SIM authentication in four steps.

**Expected Key Points:**
- AuC sends RAND.
- SIM uses Ki to compute SRES and Kc.
- Phone returns SRES.
- Network compares and turns on A5 with Kc.
- Weaknesses: historically one-way auth, export-grade algorithms, IMSI catchers.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four cryptographic applications in this module and one risk each.

**Expected Key Points:**
- TLS: fake certs/misconfig.
- WPA: shared PSK.
- GSM: rogue BTS on 2G.
- Cards: mag-stripe clones vs chip.
- Broadcast: insider decoder keys.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is HSTS and why should erp.vviet.ac.in send it?

**Expected Key Points:**
- A header that forces HTTPS for a host for max-age, with optional includeSubDomains/preload.
- Stops some SSL-strip and cookie-downgrade.
- Needs a stable HTTPS site first (or you lock users out).
- Combine with secure cookies.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Walk through a TLS 1.3 handshake at the message-name level and mark where authentication and key agreement happen.

**Expected Key Points:**
- ClientHello with key_share.
- ServerHello with its share (ECDHE), encrypted extensions, Certificate, CertificateVerify (signs the handshake — authentication), Finished.
- Client Finished.
- Traffic keys from HKDF.
- 0-RTT caveats (replay) if mentioned.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO3
**Question:** Design Wi-Fi for hostels vs faculty vs IoT cameras. Assign WPA modes and VLAN isolation.

**Expected Key Points:**
- Faculty/staff: WPA3-Enterprise/802.1X.
- Students: Enterprise if IdP exists, else WPA3-Personal with rotation and portal.
- IoT: separate SSID, no access to ERP, unique per-device passwords or MUD.
- Guest: isolation.
- Never one PSK for cameras+students.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare HTTPS to a webmail server with true E2EE mail. Who can read the body in each case?

**Expected Key Points:**
- HTTPS: the webmail operator reads and can be compelled.
- E2EE (keys on devices): operator sees metadata at best.
- Campus policies (DLP, e-discovery) may forbid E2EE for official mail.
- Students using personal E2EE chat is a different trust domain.
- Be precise about endpoints.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain the 4-way handshake’s purpose in WPA2 (without frame-field memorization).

**Expected Key Points:**
- Confirms both sides have the PMK/PSK, derives PTK, delivers GTK, and proves liveness with nonces.
- After it, data frames are encrypted with session keys, not with the passphrase directly.
- A captured handshake is dangerous if the PSK is guessable.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Intermediate  ·  10 marks  ·  RESEARCH_TASK  ·  CO1
**Question:** For a home camera: list a hardening checklist (passwords, firmware signatures, network placement, TLS). Mark which items are cryptographic.

**Expected Key Points:**
- Change unique password (KDF at vendor — crypto-ish).
- Signed firmware (signatures).
- Disable UPnP.
- Put on IoT VLAN.
- HTTPS/MQTT-TLS to the cloud.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** The radio club streams internals on HTTP ‘because it is public anyway’. Critique for session cookies of the nearby ERP on the same browser.

**Expected Key Points:**
- Mixed content and cookie scope bugs aside, users type ERP passwords on the same machine; SSL-strip and captive portals still matter.
- Public video can be HTTPS at low cost (Let’s Encrypt).
- HSTS on ERP, separate browsers/profiles.
- ‘Public’ ≠ ‘safe transport’.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** 26^8 PSK vs a 20-char diceware (7776^5). Compare brute-force orders. Which belongs on a hostel AP?

**Expected Key Points:**
- 26^8 ≈ 2e11 (weak against offline handshake dictionary).
- 7776^5 ≈ 2.8e19 (~64 bits, still not great for high-value; use WPA3-SAE and longer).
- Faculty should not use PSK.
- Show logs and conclude Enterprise > long PSK > short PSK > WEP.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a layered security story for a student laptop on café Wi-Fi accessing ERP and a bank app: WPA, VPN, TLS, pinning, HSTS.

**Expected Key Points:**
- Café WPA is hop protection against casual neighbours, not the café owner.
- VPN can hide destinations from the café and protect non-TLS.
- ERP/bank must use TLS 1.3, HSTS, and the bank app may pin.
- Do not double-count: VPN to a malicious operator is a new MITM.
- Prefer always-HTTPS and a trusted VPN if required by policy.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Write an essay: ‘Every wireless hop is a broadcast medium pretending to be a cable.’ Use WEP, WPA, GSM, and home IoT.

**Expected Key Points:**
- Radio is promiscuous; crypto creates virtual cables.
- WEP failed at that.
- WPA2/3 is the campus Wi-Fi cable.
- GSM tried to protect the air to the BTS, not the core.
- IoT often skips crypto or uses one key.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO2
**Question:** Convocation live stream: 20,000 alumni, 200 revoked for non-payment, one CDN. Propose a crypto architecture (tokenized HLS vs broadcast encryption vs per-user TLS).

**Expected Key Points:**
- CDN + HTTPS with short-lived per-user tokens (JWT) is practical; not classical subset-cover unless a closed set-top ecosystem.
- Revoke by token expiry/blocklist at the packager.
- Widevine-style DRM is a form of broadcast encryption with licensed players.
- Discuss insider screen-recording as a non-crypto leak.
- Pick a design and justify scale.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Difficult  ·  15 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare EMV chip authentication with campus RFID attendance. What would ‘dynamic cryptogram’ mean for a hostel door?

**Expected Key Points:**
- EMV: card proves a transaction with a unique ARQC.
- Static RFID UID is a replayable name.
- A door should challenge the card and get a MAC under a diversified key (MIFARE DESFire-class), with revocation.
- Photographing a UID should not open the gate.
- Mention privacy (don’t broadcast USN).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO1
**Question:** Sketch message flow: student ↔ AP ↔ RADIUS for EAP-TLS. Who has which certificates/keys? What is revoked when a laptop is stolen?

**Expected Key Points:**
- Student: client cert+key (TPM).
- AP: pass-through.
- RADIUS: server cert, trusts campus CA.
- Stolen laptop: revoke client cert on CA/OCSP, wipe via MDM if possible, do not change everyone’s PSK because there is no global PSK.
- Contrast with PSK hostel.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A vendor says ‘our CCTV is encrypted’ but the phone app uses HTTP and a hardcoded AES key in the APK. Critique with Kerckhoffs and key management.

**Expected Key Points:**
- Hardcoded keys are public after one decompile (Kerckhoffs).
- HTTP on the control path leaks credentials.
- Link encryption to the vendor cloud is not E2E if they can view streams.
- Demand unique per-device keys, TLS with a real CA or pinned cert, signed firmware, and a published algorithm.
- ‘Encrypted’ is a claim, not an architecture.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Cryptographic Applications).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Cryptographic and Applications in the context of Cryptographic Applications. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Information and Network Security scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Cryptographic as used in Cryptographic Applications. Include one precise example.

**Model answer:** Cryptographic is a foundational construct in Cryptographic Applications. Example should name entities/operations and relate to Applications. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Cryptographic and Applications. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Cryptographic Applications theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Cryptographic Applications to a realistic campus/industry scenario relevant to Cryptographic Applications. State assumptions.

**Model answer:** Describe scenario, map concepts (Cryptographic, Applications), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Applications and its role within Cryptographic Applications.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Cryptographic if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within Cryptographic Applications; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Cryptographic while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Cryptographic Applications principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Cryptographic Applications in Information and Network Security.

**Model answer:** Provide four definitions: include Cryptographic, Applications, and two adjacent terms from Cryptographic Applications. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Cryptographic Applications that integrates Cryptographic, Applications, and Cryptographic Applications.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Applications in Cryptographic Applications.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Cryptographic.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Cryptographic and expected. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Cryptographic and Cryptographic Applications: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Cryptographic Applications, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as Cryptographic in Cryptographic Applications.

**Model answer:** Dependency chain with one counterexample showing what fails if Cryptographic is ignored.

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
**Question:** Interpret a hypothetical result/table/trace involving Applications in Cryptographic Applications. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Cryptographic in Cryptographic Applications: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Information and Network Security.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Cryptographic Applications for Cryptographic Applications.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Cryptographic Applications.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Cryptographic Applications under constraints typical of Information and Network Security.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Applications in Cryptographic Applications. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Cryptographic in Cryptographic Applications, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

