# Assignment — Information and Network Security — Module 1 — Crypto Basics

**Subject:** Information and Network Security  
**Module:** Module 1 — Crypto Basics  
**Questions:** 40  
**Mix:** 11 Easy · 17 Intermediate · 12 Difficult  
**Bank total:** 323 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain CIA with one campus example each.

**Expected Key Points:**
- Confidentiality: TLS on the fee portal so packet sniffers cannot read card data.
- Integrity: hashed/signed marks files so a USB copy cannot be silently edited.
- Availability: exam form server stays up during last-hour load; DDoS would violate availability.
- Note that encryption without MAC may not give integrity.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** State Kerckhoffs’ principle and contrast it with security through obscurity.

**Expected Key Points:**
- The system should be secure even if the enemy knows the method; only keys are secret.
- Obscurity hides algorithms and collapses on leaks (decompiled APK).
- Modern crypto publishes AES/TLS and protects keys.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Differentiate substitution and transposition with one toy encryption of VVIET.

**Expected Key Points:**
- Substitution: VVIET → YYLHW with Caesar+3 (letters change).
- Transposition: VVIET → VIEVT by a simple rearrangement (letters same, order changes).
- Product ciphers combine both (Shannon).
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a monoalphabetic cipher? Why does frequency analysis work on English?

**Expected Key Points:**
- A fixed permutation of letters.
- English has stable frequencies (E, T, A, …) and n-grams (TH, THE).
- The ciphertext inherits a permuted histogram, revealing the map.
- Homophones and polyalphabetic methods try to flatten this.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Easy  ·  5 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare symmetric and asymmetric encryption on keys, speed, and typical use.

**Expected Key Points:**
- Symmetric: one secret, fast, used for bulk (TLS record).
- Asymmetric: key pair, slow, used to wrap keys or sign.
- Hybrid: RSA/ECDHE establishes a symmetric session key.
- Never encrypt megabytes directly with raw RSA in production.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four classical techniques (Caesar, monoalphabetic, Vigenère, transposition) and the usual attack on each.

**Expected Key Points:**
- Caesar: 25 shifts.
- Monoalphabetic: frequencies.
- Vigenère: Kasiski/Friedman for period then frequency per alphabet.
- Transposition: anagramming/column permutations.
- None of these is modern security.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain one-time pad rules for perfect secrecy in classroom terms.

**Expected Key Points:**
- Key random, uniform, independent of plaintext, length ≥ message, used once, kept secret.
- Then ciphertext is independent of plaintext.
- Reuse, low-entropy keys, or key = password of 8 letters destroy the proof.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** Compute |key space| for (i) Caesar (ii) monoalphabetic 26-letter (iii) Vigenère length 5. Comment which is still weak.

**Expected Key Points:**
- (i) 26 or 25 non-trivial.
- (ii) 26! ≈ 4×10^26, still weak vs frequency.
- (iii) 26^5 ≈ 1.2×10^7, brute-force easy and Kasiski applies.
- Key-space size ≠ security if structure remains.
- Show arithmetic.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain Shannon confusion and diffusion. Map them onto substitution and permutation layers.

**Expected Key Points:**
- Confusion hides key-ciphertext statistics (S-boxes).
- Diffusion spreads bits (P-layer, MixColumns).
- Rounds iterate the product.
- A single Caesar has almost no diffusion of a block structure; AES is the teaching contrast.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO5
**Question:** Two departments encrypted circulars with Word ‘XOR a repeating password’. Show why this is a two-time pad if the password is shorter than the file.

**Expected Key Points:**
- Repeating password is Vigenère/XOR-with-period.
- Aligning ciphertexts or using known headers (PK\x03\x04 for zip) recovers keystream.
- If two files share the password, C1⊕C2 = P1⊕P2.
- Recommend a real AEAD with a random key, not XOR.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare a codebook system with a cipher for hostel emergency phrases.

**Expected Key Points:**
- Codebook: fast, needs physical book updates, catastrophic if copied, poor for novel sentences.
- Cipher: algorithmic, can encrypt arbitrary text with a daily key.
- Military history mixed both.
- For campus, authenticated encryption over a managed key is preferable to a leaked PDF codebook.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Intermediate  ·  10 marks  ·  RESEARCH_TASK  ·  CO2
**Question:** Encrypt VVIET with Caesar shift 5 and with a columnar transposition of keyword LOCK (show grid). Decrypt both.

**Expected Key Points:**
- VVIET → AANJY (V+5=A, etc.—verify: V(21)+5=0 → A, V→A, I→N, E→J, T→Y so AANJY).
- Columnar: write into columns ordered by LOCK’s letter order.
- Show fill row-wise, read by sorted key.
- Reverse the grid to decrypt.
- Marks for correct grids, not just the word.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A student says ‘26! is huge, so substitution is as good as AES-128’. Critique.

**Expected Key Points:**
- Attacks need not enumerate 26!.
- Frequency, probable words (‘THE’, ‘VVIET’), and cribs recover keys in minutes.
- AES-128 is designed so the best known attack is near brute force on a structureless key.
- Security is about the best attack, not the naïve one.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Describe Enigma at a block-diagram level: keyboard, rotors, reflector, plugboard, stepping. Why is it not an OTP?

**Expected Key Points:**
- Each keypress permutes the alphabet via plugboard–rotors–reflector–rotors–plugboard, then rotors step (odometer).
- The daily setting is a short key, reused for many letters, with group properties (no letter encrypts to itself, etc.).
- An OTP would need a random stream as long as traffic; Enigma’s state is tiny.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO2
**Question:** Design a (toy, not production) product-cipher teaching round: 8-bit S-box + permutation, 4 rounds, key mixing. Explain confusion/diffusion and what still makes it non-AES.

**Expected Key Points:**
- Each round: XOR subkey, substitute nibbles via an S-box, permute bit positions.
- After a few rounds a 1-bit plaintext change should flip many ciphertext bits (avalanche).
- Still missing: proven S-box design vs differential/linear cryptanalysis, key schedule, block size, modes, integrity.
- Label it a pedagogical SPN, not a standard.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** OTP reuse: P1=‘ON’, P2=‘NO’ as 0/1 bits of your 5-bit encoding, same K. Show C1⊕C2 = P1⊕P2 and argue what an analyst learns.

**Expected Key Points:**
- Pick a 5-bit code per letter or use ASCII.
- Compute P1⊕P2 bitwisely; it equals C1⊕C2 independent of K.
- The analyst gets the XOR of two English strings, which is often enough with cribs.
- Numerical working must be explicit.
- Conclude: never reuse K.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write a short essay: ‘Classical ciphers fail for two different reasons — small keys and leftover statistics.’ Use Caesar, Vigenère, substitution, and OTP as poles.

**Expected Key Points:**
- Caesar: tiny key.
- Substitution: huge key but statistics.
- Vigenère: medium key plus period.
- OTP: large random key, no leftover statistics if used correctly, but fatal key logistics.
- Modern ciphers aim for large unstructured keys and statistical flatness (confusion/diffusion) plus Kerckhoffs.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO3
**Question:** The college radio club wants to ‘encrypt’ Morse with a daily Caesar. Propose a professional alternative path (without implementing a new primitive).

**Expected Key Points:**
- Do not invent ciphers.
- Use TLS or an AEAD library (AES-GCM) with a key from a password KDF (Argon2) for files, or an institutional PKI.
- Train operators not to reuse IVs.
- If they only need obfuscation from casual listeners, say so — that is not CIA-grade confidentiality.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO4
**Question:** Perform frequency analysis on a 200-letter monoalphabetic ciphertext of a campus notice (invent a consistent ciphertext from a known plaintext, then ‘solve’ it as if unknown). Show a frequency table and partial map.

**Expected Key Points:**
- Count letters, map the peak to E, next to T/A, recover THE, confirm VVIET as a crib.
- Fill the 26-letter map.
- Discuss why 200 letters are usually enough for English but not for a short OTP.
- Include the table, not only the punchline.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare known-plaintext, ciphertext-only, and chosen-plaintext attacks on classical vs modern ciphers.

**Expected Key Points:**
- Classical: ciphertext-only often suffices (frequencies).
- Known-plaintext recovers Caesar immediately (subtract).
- Chosen-plaintext would be overkill.
- Modern: we assume Kerckhoffs plus chosen-plaintext in the threat model (AES still stands).
- Exam answers should classify the attacker’s access, not just ‘hacking’.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Crypto Basics).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Crypto and Basics in the context of Crypto Basics. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Information and Network Security scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Crypto as used in Crypto Basics. Include one precise example.

**Model answer:** Crypto is a foundational construct in Crypto Basics. Example should name entities/operations and relate to Basics. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Crypto and Basics. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Crypto Basics theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Crypto Basics to a realistic campus/industry scenario relevant to Crypto Basics. State assumptions.

**Model answer:** Describe scenario, map concepts (Crypto, Basics), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Basics and its role within Crypto Basics.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Crypto if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within Crypto Basics; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Crypto while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Crypto Basics principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Crypto Basics in Information and Network Security.

**Model answer:** Provide four definitions: include Crypto, Basics, and two adjacent terms from Crypto Basics. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Crypto Basics that integrates Crypto, Basics, and Crypto Basics.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Basics in Crypto Basics.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Crypto.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Crypto and analysis. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Crypto and Crypto Basics: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Crypto Basics, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as Crypto in Crypto Basics.

**Model answer:** Dependency chain with one counterexample showing what fails if Crypto is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where analysis measurably improves an outcome in Information and Network Security.

**Model answer:** Context, intervention using analysis, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Basics in Crypto Basics. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Crypto in Crypto Basics: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Information and Network Security.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Crypto Basics for Crypto Basics.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Crypto Basics.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Crypto Basics under constraints typical of Information and Network Security.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Basics in Crypto Basics. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Crypto in Crypto Basics, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

