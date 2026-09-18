# Assignment — Information and Network Security — Module 2 — Hash Functions

**Subject:** Information and Network Security  
**Module:** Module 2 — Hash Functions  
**Questions:** 40  
**Mix:** 11 Easy · 17 Intermediate · 12 Difficult  
**Bank total:** 323 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define cryptographic hash and list preimage, second-preimage and collision resistance.

**Expected Key Points:**
- H maps {0,1}* to n-bit strings, is deterministic and easy to compute.
- Preimage: hard to invert y.
- Second-preimage: hard to find another message for a given m.
- Collision: hard to find any distinct pair with the same digest.
- These are different strengths.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain the birthday paradox and why collisions cost ~2^{n/2}.

**Expected Key Points:**
- In a room, ~23 people likely share a birthday because pairs scale as k^2.
- Similarly, k≈2^{n/2} random hashes likely collide among themselves.
- That is easier than hitting one prescribed value (~2^n).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare a hash and HMAC. When is each used on the student portal?

**Expected Key Points:**
- Hash: software download checksum posted on HTTPS.
- HMAC: API request authentication with a server secret.
- A public hash cannot stop an attacker who can also change the posted digest.
- HMAC tags cannot be forged without the key.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is hash-then-sign? Why hash at all?

**Expected Key Points:**
- Sign H(m) not m.
- Reasons: performance (RSA on 256 bits not megabytes), a uniform input length, and binding the signature to the whole message.
- Collision resistance becomes mandatory.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Why is CRC32 unsuitable for signing exam PDFs?

**Expected Key Points:**
- CRC is linear; adversaries craft collisions and even chosen CRCs easily.
- A signed CRC would verify a malicious PDF.
- Use SHA-256 (or stronger) under a real signature scheme.
- CRC remains fine for accidental disk errors.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four hash/MAC algorithms or constructions (SHA-256, SHA-3, HMAC, Tiger) and one fact each.

**Expected Key Points:**
- SHA-256: 256-bit MD construction.
- SHA-3: sponge, different structure.
- HMAC: nested keyed hash.
- Tiger: 192-bit, 64-bit oriented.
- Mention deprecation of MD5/SHA-1 for signatures.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain proof of work with a 8-zero-nibble toy example in words.

**Expected Key Points:**
- Find nonce so hex(H(challenge||nonce)) starts with 00000000.
- Each extra zero nibble costs about 16× more work.
- Anyone can verify in one hash.
- It does not hide the challenge; it proves computational effort.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** For n=128, 160, 256 bits, tabulate generic preimage and collision work. Which digest sizes are obsolete for collision-resistant signatures?

**Expected Key Points:**
- 128: preimage 2^128, collision 2^64 (too low).
- 160: 2^160 / 2^80 (SHA-1 collisions practical).
- 256: 2^256 / 2^128 (standard).
- Signatures need collision resistance ≥128-bit security ⇒ 256-bit hashes.
- Show the 2^{n/2} column clearly.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain length-extension and how HMAC’s nested construction addresses naive MACs.

**Expected Key Points:**
- From H(m) and length, MD hashes can continue the compression.
- If MAC=H(key||m), an attacker appends data and forges a tag.
- HMAC hashes the key in inner and outer pads so extension does not yield a valid outer tag.
- Use HMAC, not prefix hashes.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO1
**Question:** Registrar signs course lists with hash-then-sign using a weak hash. Describe a collision-based fraud against ‘honours list vs dummy’.

**Expected Key Points:**
- Attacker prepares two PDFs (innocent vs fraudulent) with the same digest (chosen-prefix techniques exist for broken hashes), gets the innocent one signed, swaps files.
- Verifiers see a valid signature.
- Mitigation: strong hash, inclusion of unpredictable nonces, and not signing attacker-controlled templates blindly.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare Shamir (3,5) with splitting a master backup key into 5 XOR shares needing all 5.

**Expected Key Points:**
- XOR n-of-n: any missing share loses the backup forever; one stolen share is useless, but there is no 3-person emergency.
- Shamir 3-of-5: any three reconstruct, two do not.
- Use authenticated shares and protect against fake-share injection (verifiable SS if needed).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Intermediate  ·  10 marks  ·  RESEARCH_TASK  ·  CO2
**Question:** Compute (by hand or small program) HMAC structure: show ipad/opad XOR on a 1-block key, inner hash input layout, outer hash. No need for a real SHA round.

**Expected Key Points:**
- Key k (block-padded).
- k_i = k ⊕ 0x36.., k_o = k ⊕ 0x5C...
- Inner = H(k_i || msg).
- Outer = H(k_o || inner).
- State block size (64 for SHA-256).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘SHA-256 is public, so HMAC-SHA256 cannot authenticate.’ Critique using Kerckhoffs.

**Expected Key Points:**
- The algorithm is public; the MAC key is secret.
- Kerckhoffs says this is correct design.
- Forgery requires the key (or a cryptanalytic break).
- Publishing SHA-256 is not publishing the ERP’s HMAC key.
- Contrast with putting the key in a mobile APK.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Discuss Tiger’s place in a modern syllabus: historical 64-bit hash vs current defaults.

**Expected Key Points:**
- Tiger (1995) targeted 64-bit CPUs with 192-bit output.
- It is a valid hash-family example alongside MD/SHA.
- New systems should prefer SHA-256/512 or SHA-3 unless a standard requires Tiger.
- Teaching point: output length, software performance, and how algorithms age.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design an integrity architecture for VVIET: firmware, marks CSV, and API calls. Assign hash vs HMAC vs signatures.

**Expected Key Points:**
- Firmware: vendor signature (hash-then-sign) + HTTPS hash as extra.
- Marks CSV inside the institute: HMAC or internal signature with the exam-cell key, not a public SHA on the same USB.
- API: HMAC or TLS client certs.
- Publish algorithm, protect keys in HSM, rotate, log verification failures.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** PoW: 1e6 hashes/s. Target 24 leading zero bits. Expected time? How does +4 bits change it?

**Expected Key Points:**
- Prob 2^{-24} ≈ 5.96e-8.
- Expected hashes 2^24 ≈ 1.68e7.
- Time ≈ 17 s at 1e6/s.
- +4 bits ×16 ⇒ ~4.5 minutes.
- Show 2^{24}/10^6 and 2^{28}/10^6.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write an essay on why collision resistance is strictly stronger (as a generic requirement) than second-preimage resistance, with signature and password-hash asides.

**Expected Key Points:**
- Any collision-finder that can also hit a fixed m would break second-preimage, but birthday collisions do not need a fixed m.
- Hence we size n for 2^{n/2} when collisions matter (signatures).
- Password hashing cares about preimage of the stored hash plus salting/KDF, not collisions between users primarily.
- Do not mix the three properties in one slogan.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO3
**Question:** Five trustees store Shamir shares of the SSL private key. One trustee is abroad; two others are honest. Can the site start? What if a fourth is malicious and submits a junk share?

**Expected Key Points:**
- Need t=3 honest shares: yes if the three local/honest can meet.
- A junk share makes interpolation inconsistent — detect by checksum of the secret or verifiable secret sharing, do not output a wrong key.
- Plan a reshare after a suspected leak.
- Do not put all shares on one USB.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO2
**Question:** Show numerically the birthday bound: simulate or calculate k for 50% collision in a 16-bit toy hash. Compare to √(2 ln 2 * 2^{16}).

**Expected Key Points:**
- N=2^16=65536.
- k ≈ 1.177√N ≈ 301 for ~50%.
- Contrast with 256 for a rough √N.
- A short Python loop or Poisson approximation is acceptable.
- Conclude that 16-bit hashes are classroom toys, not integrity tools.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare proof of work with HMAC challenge-response as ways to ‘prove something’ to a server.

**Expected Key Points:**
- PoW proves spent CPU, not identity; anyone can compute it; used to throttle spam/blockchains.
- HMAC CR proves possession of a key (identity/auth).
- Do not replace login with PoW.
- Do not use HMAC as a lottery.
- Different goals: scarcity vs authentication.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Hash Functions).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Hash and Functions in the context of Hash Functions. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Information and Network Security scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Hash as used in Hash Functions. Include one precise example.

**Model answer:** Hash is a foundational construct in Hash Functions. Example should name entities/operations and relate to Functions. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Hash and Functions. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Hash Functions theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Hash Functions to a realistic campus/industry scenario relevant to Hash Functions. State assumptions.

**Model answer:** Describe scenario, map concepts (Hash, Functions), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Functions and its role within Hash Functions.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Hash if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within Hash Functions; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Hash while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Hash Functions principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Hash Functions in Information and Network Security.

**Model answer:** Provide four definitions: include Hash, Functions, and two adjacent terms from Hash Functions. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Hash Functions that integrates Hash, Functions, and Hash Functions.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Functions in Hash Functions.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Hash.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Hash and expected. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Hash and Hash Functions: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Hash Functions, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as Hash in Hash Functions.

**Model answer:** Dependency chain with one counterexample showing what fails if Hash is ignored.

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
**Question:** Interpret a hypothetical result/table/trace involving Functions in Hash Functions. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Hash in Hash Functions: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Information and Network Security.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Hash Functions for Hash Functions.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Hash Functions.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Hash Functions under constraints typical of Information and Network Security.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Functions in Hash Functions. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Hash in Hash Functions, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

