# Assignment — Computer Networks-I — Unit 4 — Error Detection & Correction

**Subject:** Computer Networks-I  
**Module:** Unit 4 — Error Detection & Correction  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Distinguish single-bit and burst errors. Give a campus cause of each.

**Expected Key Points:**
- Single-bit: rare thermal flip.
- Burst: impulse/crosstalk wiping a span of bits on UTP during a motor start.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define Hamming distance and dmin. Why is dmin of {000,111} equal to 3?

**Expected Key Points:**
- Distance = differing positions.
- 000 vs 111 differs in 3 bits; only two codewords, so dmin = 3.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** State detection and correction rules in terms of dmin.

**Expected Key Points:**
- Detect s = dmin−1 errors.
- Correct t = floor((dmin−1)/2).
- Example: dmin=3 → detect 2, correct 1.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is redundancy in coding? Why must n > k for detection?

**Expected Key Points:**
- Extra bits. Without extra bits every word is legal and errors look like other datawords.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** Find dmin of code {00000, 01101, 10110, 11011}. How many errors can it detect and correct?

**Expected Key Points:**
- Distances: 00000–01101=3; 00000–10110=3; 00000–11011=4; 01101–10110=4; 01101–11011=3; 10110–11011=3.
- dmin=3 → detect 2, correct 1.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** Construct even-parity Hamming codeword for data 1011 (positions 3,5,6,7). Show p1,p2,p4.

**Expected Key Points:**
- p1 covers 1,3,5,7: p1⊕1⊕0⊕1=0 → p1=0.
- p2: 2,3,6,7 → p2⊕1⊕1⊕1=0 → p2=1.
- p4: 4,5,6,7 → p4⊕0⊕1⊕1=0 → p4=0.
- Codeword 0110011.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain CRC encoding with generator 1101 and data 10110. Give the codeword.

**Expected Key Points:**
- Append 3 zeros: 10110000.
- Mod-2 divide by 1101; remainder 101.
- Send 10110101.
- Receiver remainder should be 000 if error-free.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare parity, checksum and CRC for link frames.

**Expected Key Points:**
- Parity: cheap, weak.
- Checksum: good for headers, weak vs adjacent bursts.
- CRC: strong burst detection, standard on Ethernet/HDLC.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** A (15,11) Hamming code is used. Find r, dmin, correction capability, and rate k/n.

**Expected Key Points:**
- n=15, k=11, r=4.
- Rate = 11/15 ≈ 0.733.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** Words 10101001 and 00111001. Compute Internet checksum (8-bit analog of the 16-bit method) and verify the receiver sum.

**Expected Key Points:**
- Sum=11100010, checksum=00011101.
- 11100010+00011101=11111111, which complements to 00000000 → accept.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO4
**Question:** Choose detection vs correction for (i) Ethernet LAN (ii) a deep-space 1-bit-error-prone link. Justify.

**Expected Key Points:**
- (i) CRC detect + retransmission (ARQ) because RTT is tiny.
- (ii) FEC (Hamming/stronger codes) because RTT makes retransmission expensive.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define a linear block code. Why is the all-zero word always a codeword?

**Expected Key Points:**
- Closed under XOR.
- x⊕x = 0, so 0 is in the code.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain even and odd parity with the word 11011.

**Expected Key Points:**
- Four 1s (even).
- Even parity bit=0; odd parity bit=1.
- Either detects odd numbers of flips.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain Hamming encoding positions. Why are parities at powers of two?

**Expected Key Points:**
- Each parity i covers positions whose binary index has bit i set.
- The syndrome bits then form the binary position of a single error.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a cyclic code? Why are CRCs implemented with shift registers?

**Expected Key Points:**
- A cyclic shift of a codeword is a codeword.
- Polynomial multiplication/division maps to LFSR hardware.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO1
**Question:** A student says ‘CRC-32 corrects 32-bit errors.’ Correct this using Forouzan’s view of CRC.

**Expected Key Points:**
- CRC-32 detects many errors (all bursts up to 32 bits, and most longer) but does not identify which bits to flip.
- Correction is not what Ethernet CRC does.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four error types/impairments that coding must face, including burst vs isolated.

**Expected Key Points:**
- Isolated bit flips, bursts, erasures (known bad positions), and residual undetected errors.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain syndrome decoding in one paragraph.

**Expected Key Points:**
- Parity checks form a vector S.
- S=0 → accept.
- S≠0 → in Hamming SEC, S is the error location; flip that bit.
- Other codes map S to an error pattern via a table.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** For m = 8 data bits, find Hamming r, n, and code rate k/n.

**Expected Key Points:**
- Need 2^r ≥ 8+r+1 = 9+r.
- r=4 because 16 ≥ 13.
- Rate = 8/12 = 2/3.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write 200 words: ‘Redundancy is not waste if it saves retransmissions.’ Compare Hamming, CRC and checksum in a VTU answer.

**Expected Key Points:**
- Include dmin rules, hardware cost, and where each appears (RAM SEC, Ethernet, IPv4).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 04 Error Detection Correction).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Error and Detection in the context of Error Detection & Correction. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Computer Networks I scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Error as used in Error Detection & Correction. Include one precise example.

**Model answer:** Error is a foundational construct in Error Detection & Correction. Example should name entities/operations and relate to Detection. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Error and Detection. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Error Detection & Correction theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Correction to a realistic campus/industry scenario relevant to Error Detection & Correction. State assumptions.

**Model answer:** Describe scenario, map concepts (Error, Detection), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Detection and its role within Error Detection & Correction.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Error if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Error Detection within Error Detection & Correction; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Error while building a solution involving Error Detection. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Error Detection & Correction principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Correction in Computer Networks I.

**Model answer:** Provide four definitions: include Error, Detection, and two adjacent terms from Error Detection & Correction. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Error Detection & Correction that integrates Error, Detection, and Correction.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Detection in Error Detection & Correction.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Error.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Error and Detection Correction. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Error and Correction: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Error Detection & Correction, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Correction under constraints typical of Computer Networks I.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Error Detection depends on earlier ideas such as Error in Error Detection & Correction.

**Model answer:** Dependency chain with one counterexample showing what fails if Error is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Detection Correction measurably improves an outcome in Computer Networks I.

**Model answer:** Context, intervention using Detection Correction, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Detection in Error Detection & Correction. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Error in Error Detection & Correction: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Computer Networks I.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Correction for Error Detection & Correction.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Correction.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Detection in Error Detection & Correction. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Error in Error Detection & Correction, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

