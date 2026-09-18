# Assignment — Information and Network Security — Module 3 — Entity Authentication

**Subject:** Information and Network Security  
**Module:** Module 3 — Entity Authentication  
**Questions:** 40  
**Mix:** 11 Easy · 17 Intermediate · 12 Difficult  
**Bank total:** 323 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define entity authentication and give three campus examples (ERP, Wi-Fi, hostel door).

**Expected Key Points:**
- Proving who is present for a session: ERP password+MFA, WPA-Enterprise (802.1X), RFID/smart-card door.
- Contrast with file integrity (hash of a PDF) which does not prove who is at the keyboard now.
- Liveness/freshness is part of the definition.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a replay attack? Give one defence.

**Expected Key Points:**
- Resend a previously valid authentication message.
- Defence: bind a nonce or timestamp into a MAC/signature so copies fail.
- Static RFID UIDs and HTTP Basic without TLS are classroom victims.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain salts with a two-user example both choosing ‘VVIET@123’.

**Expected Key Points:**
- Without salt both stored hashes match, revealing the shared password and enabling one rainbow table.
- With 16-byte random salts the hashes differ; an attacker must crack each row.
- Salt is stored in the clear next to the hash; it is not a pepper.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define nonce, challenge and freshness.

**Expected Key Points:**
- Nonce: value used once in a protocol.
- Challenge: a nonce (or more structured query) sent by a verifier.
- Freshness: assurance the message is of this run, not an old recording.
- Implementation may use randoms, counters or time.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List dictionary, brute-force, online and offline attacks on passwords with one mitigation each.

**Expected Key Points:**
- Dictionary: complexity policy + deny lists.
- Brute force: length/KDF.
- Online: lockout/rate limit/CAPTCHA.
- Offline: unique salts + slow memory-hard KDF (Argon2/bcrypt) + pepper.
- Do not store plaintext.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is multi-factor authentication? Why is password+security question weak?

**Expected Key Points:**
- Independent factors from different classes.
- Two knowledge factors (password + mother’s name) are still one class and both phishable.
- Prefer password + TOTP/WebAuthn.
- SMS OTP is better than nothing but SIM-swap vulnerable.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Easy  ·  5 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare sending a password with challenge-response at a high level.

**Expected Key Points:**
- Password-on-the-wire: sniffed credentials work until changed; TLS is mandatory.
- CR: the secret stays local; a sniffed response should not replay if the challenge is fresh.
- Still need to protect against phishing and weak hashes.
- PAKE/WebAuthn are modern evolutions.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** 4-digit PIN, 5 tries then 15-minute lock. Expected time for exhaustive online search in the worst lockout design (no permanent lock). Comment on whether this is acceptable for ATM vs hostel door.

**Expected Key Points:**
- 10000/5 = 2000 lockouts × 15 min = 30,000 min ≈ 21 days if completely automated and never banned.
- ATMs additionally eat the card; hostel doors may not.
- Add jitter, device identity, and alarms.
- Show the arithmetic.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain TOTP vs HOTP. What clock skew policy would you set for VVIET labs?

**Expected Key Points:**
- HOTP: HMAC of a counter; TOTP: HMAC of time steps (usually 30 s).
- Verifier accepts a small window (±1).
- Labs: NTP on clients, window ±1 or ±2, rate-limit, and resync if counters drift.
- Do not print TOTP seeds on notices.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO3
**Question:** Design login for the exam portal: storage, TLS, lockout, MFA, recovery.

**Expected Key Points:**
- TLS 1.2+ everywhere.
- Argon2id/bcrypt with unique salts, optional pepper in HSM.
- Rate-limit per account and IP.
- TOTP or WebAuthn for faculty.
- Recovery via in-person ID at exam cell, not email of a new password to an unchecked inbox.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare timestamp-based and nonce-based freshness for the library API.

**Expected Key Points:**
- Timestamps: easy audit, needs NTP, needs cache of seen IDs in the window.
- Nonces: server generates, client reflects, server remembers used nonces or signs them.
- For campus APIs, server nonces or authenticated timestamps with 2-minute windows are both viable.
- State replay-cache memory cost.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Intermediate  ·  10 marks  ·  RESEARCH_TASK  ·  CO1
**Question:** Write a protocol sketch: Server → N; Client → HMAC_K(N||user); Server verifies. List three attacks if N is constant, if HMAC is MD5(password), if K is in the JS of the page.

**Expected Key Points:**
- Constant N: replay.
- Fast hash of password: offline crack from a captured response.
- K in JavaScript: anyone is the client.
- Fixes: fresh N, slow KDF or better a PAKE/WebAuthn, keep K in hardware or OS keystore.
- Include message sequence numbering.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** The hostel uses static QR codes on ID cards as door tokens. Critique.

**Expected Key Points:**
- Photocopy/photograph is a replayable bearer token.
- A lost ID is a lost door.
- Prefer challenge-response cards, rotating TOTP, or online validity checks with revocation.
- At least bind to a PIN and log anomalies.
- QR on plastic is identification, not strong authentication.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain the Ali Baba cave as ZK intuition, then state one way real ZK is stronger than ‘hash the password’.

**Expected Key Points:**
- Peggy randomly takes a path; Victor challenges; she always emerges if she knows the secret.
- Simulator shows transcripts prove little.
- Real ZK (or password-authenticated key exchange) avoids giving the server a hash to crack.
- Hash-at-server still gives an offline verifier.
- Teaching vs protocol.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a mutual-authentication story for campus Wi-Fi (WPA2/3-Enterprise intuition): what the student proves, what the AP/RADIUS proves, and replay defences.

**Expected Key Points:**
- Student: credentials or cert via EAP.
- Server: RADIUS/IdP certificate so a rogue AP cannot harvest passwords (server auth).
- TLS tunnel inside EAP provides freshness and integrity.
- Session keys derived, not the password on the air.
- Certificates revocable.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Write an essay: ‘Randomness is a security primitive.’ Cover keys, nonces, salts, and what fails with a bad RNG.

**Expected Key Points:**
- Low-entropy keys are brute-forced.
- Repeating nonces break GCM.
- Constant salts restore rainbow tables.
- Predictable TCP/session IDs enable hijack.
- Use OS CSPRNG, not rand()%100.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO2
**Question:** A leaked ERP dump has bcrypt hashes with salts. Faculty used ‘College@2024’. Estimate risk and prescribe an incident response.

**Expected Key Points:**
- bcrypt with a decent cost still yields to targeted dictionary including college-themed passwords.
- Force reset, check pepper (if any), look for reuse on email.
- Add deny-list of campus words.
- Communicate without confirming individual cracks.
- Rotate session secrets and API keys that sat beside the hashes.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** 62^8 ≈ 2.2e14. GPU 1e10 guesses/s on a fast hash. Time to exhaust? How does bcrypt at 0.1 s/guess on CPU change the story for online vs stolen hashes?

**Expected Key Points:**
- Fast hash: 2.2e14/1e10 = 2.2e4 s ≈ 6 hours (order-of-magnitude; actual GPUs vary).
- Uniform 8-char is still too weak for unsalted SHA.
- bcrypt 0.1 s/guess: 2.2e14 × 0.1 s is millennia on one CPU; GPUs help less on bcrypt.
- Online rate limits dominate for live login.
- Show both calculations.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO4
**Question:** Specify database columns for users (username, salt, hash, kdf params, totp_secret_encrypted, failed_count, lock_until). Justify each; mark secrets.

**Expected Key Points:**
- username unique.
- salt 16+ bytes.
- params: algorithm, cost, memory.
- totp_secret encrypted with a server key (pepper/HSM), not plaintext.
- failed_count/lock_until for online attacks.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare cookies, bearer tokens, and smart cards for exam-day authentication. Include theft and replay.

**Expected Key Points:**
- Cookies: browser-stored, set flags, CSRF issues.
- Bearer tokens: easy for APIs, dangerous in logs/URLs.
- Smart cards: possession + PIN, harder to copy, need readers and revocation.
- Exam day: invigilators + short-lived QR/WebAuthn beat long-lived URL tokens.
- State a recommended mix.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Entity Authentication).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Entity and Authentication in the context of Entity Authentication. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Information and Network Security scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Entity as used in Entity Authentication. Include one precise example.

**Model answer:** Entity is a foundational construct in Entity Authentication. Example should name entities/operations and relate to Authentication. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Entity and Authentication. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Entity Authentication theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Entity Authentication to a realistic campus/industry scenario relevant to Entity Authentication. State assumptions.

**Model answer:** Describe scenario, map concepts (Entity, Authentication), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Authentication and its role within Entity Authentication.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Entity if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within Entity Authentication; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Entity while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Entity Authentication principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Entity Authentication in Information and Network Security.

**Model answer:** Provide four definitions: include Entity, Authentication, and two adjacent terms from Entity Authentication. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Entity Authentication that integrates Entity, Authentication, and Entity Authentication.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Authentication in Entity Authentication.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Entity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Entity and expected. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Entity and Entity Authentication: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Entity Authentication, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as Entity in Entity Authentication.

**Model answer:** Dependency chain with one counterexample showing what fails if Entity is ignored.

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
**Question:** Interpret a hypothetical result/table/trace involving Authentication in Entity Authentication. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Entity in Entity Authentication: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Information and Network Security.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Entity Authentication for Entity Authentication.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Entity Authentication.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Entity Authentication under constraints typical of Information and Network Security.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Authentication in Entity Authentication. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Entity in Entity Authentication, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

