# Assignment — Theory of Computation — Module 5 — Turing Machines and Undecidability

**Subject:** Theory of Computation  
**Module:** Module 5 — Turing Machines and Undecidability  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 316 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define a TM. Give a high-level TM that accepts {a^n b^n c^n | n≥0}.

**Expected Key Points:**
- 7-tuple; tape, head, δ.
- Strategy: match off a’s with b’s then c’s, checking order, using markers.
- Always halt here (decidable CSL).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is an ID? Write the start ID on input 01 for start state q0.

**Expected Key Points:**
- q0 01  (or Bq0 01 B depending on convention). Explain αqβ.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Distinguish recursive vs RE with one example each.

**Expected Key Points:**
- Recursive: any regular/CFL membership.
- RE-not-recursive: A_TM.
- Recogiser may loop; decider never does.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a universal Turing machine?

**Expected Key Points:**
- A TM U such that L(U)={⟨M,w⟩ | w∈L(M)} (or a variant that simulates steps).
- It is an interpreter.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Sketch why a multitape TM can be simulated by a 1-tape TM. Comment on time.

**Expected Key Points:**
- Tracks or end-markers store extra tapes; a step scans between heads.
- O(T^2) time is the usual bound.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO1
**Question:** DTM vs NTM: languages vs time. Why is SAT in NP related?

**Expected Key Points:**
- Same RE class.
- Time: NTM poly-time vs DTM exp (NP vs P question).
- ToC course: language power equal for unbounded time.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Why is A_TM RE but not recursive? Give both halves.

**Expected Key Points:**
- RE: simulate.
- Not recursive: diagonalisation or ‘if decidable, build M that does the opposite of U on ⟨M⟩’.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define mapping reduction. Show how A_TM ≤ HALT (or vice versa) at a high level.

**Expected Key Points:**
- From ⟨M,w⟩ build M' that accepts/halts iff M accepts w (e.g.
- loop instead of reject).
- Then HALT(M',w) iff A_TM(M,w).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** State Rice’s theorem in words and apply it to ‘L(M) is finite’.

**Expected Key Points:**
- Nontrivial semantic property: some M have finite L, some infinite.
- Hence finiteness of L(M) is undecidable.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** Prove that recursive languages are closed under complement, union and intersection.

**Expected Key Points:**
- Complement: swap answers of a decider.
- Union/intersection: run both deciders (they halt) and combine Booleans.
- Contrast with RE complement.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** Prove that if L and L-bar are both RE then L is recursive.

**Expected Key Points:**
- Dovetail recognisers for L and L-bar; one of them will accept.
- That is a decider.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a TM (high-level modules) for {ww | w∈{0,1}*}. Argue it always halts.

**Expected Key Points:**
- Find midpoint (even length), compare corresponding symbols with markers.
- Reject odd length.
- Decidable CSL; not CFL.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO3
**Question:** Place REG, CFL, CSL, recursive, RE in inclusion order with one witness of each proper gap.

**Expected Key Points:**
- REG⊂CFL⊂CSL⊂recursive⊂RE.
- Witnesses: a^n b^n; a^n b^n c^n; {⟨M⟩ | M halts on ε} etc.
- as taught; A_TM for last gap.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** What does the Church–Turing thesis claim, and what it is not?

**Expected Key Points:**
- Informal: TM = effective procedure.
- Not a theorem.
- Justifies calling HALT ‘algorithmically unsolvable’.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Why doesn’t ‘simulate for 1 million steps’ decide HALT?

**Expected Key Points:**
- Some machines halt at step 1,000,001.
- No computable uniform bound exists for all M,w.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO4
**Question:** Student says CFG emptiness is undecidable because TM emptiness is. Critique.

**Expected Key Points:**
- CFG emptiness is decidable (generating symbols).
- TM emptiness is undecidable.
- Do not transfer facts across models without a reduction.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO3
**Question:** Lab: implement a TM simulator for a 3-state {a^n b^n} machine; log IDs; detect a step cap. Rubric.

**Expected Key Points:**
- Encode δ, tape, head; print IDs; halt vs cap-loop; tests n=0,2 and abb.
- Discuss why a cap is not a HALT decider.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is an enumerator? Relation to RE languages.

**Expected Key Points:**
- L is RE iff some TM enumerates it.
- Recursive ⇔ enumerable in order (lex) with wait-until-next, equivalently a decider.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Write 250 words: ‘Undecidability is not about one program being hard — it is about there being no general algorithm.’ Use HALT and a compiler-analysis moral.

**Expected Key Points:**
- No tool can decide arbitrary halt/equivalence/malware-of-all-TMs.
- Special cases (DFAs, CFGs membership) remain decidable.
- Reductions explain why ‘just inspect the code’ fails uniformly.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define a decidable problem and give two decidable examples from earlier modules.

**Expected Key Points:**
- Yes/no set with a always-halting TM.
- Examples: DFA acceptance, DFA emptiness, CFL membership (CYK), minimality of DFA.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Turing Machines and Undecidability).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a TM that accepts {0^n 1^n | n≥0} (high-level cross-off).

**Model answer:** Zig-zag crossing off matching 0/1; accept if all gone; reject mismatch.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Give the 7-tuple of a deterministic TM and explain the tape alphabet.

**Model answer:** Q,Σ,Γ,δ,q0,B,F (variants). Γ⊃Σ∪{B}; tape symbols include blank.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Prove ATM (acceptance problem) undecidable by diagonalization sketch.

**Model answer:** Assume decider H; build D that diagonalizes on 〈M〉; contradiction.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A24  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Sketch a TM for addition of two unary numbers separated by +.

**Model answer:** Move across, rewrite + as 1 or shift; standard unary add.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** List three differences between FA and TM.

**Model answer:** TM read/write, two-way head, unbounded tape, may loop; FA one-way read-only finite control.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Reduce ATM to HALT to show HALT undecidable (sketch).

**Model answer:** On 〈M,w〉 build M' that accepts if M accepts else loops; halt-decider would decide ATM.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A27  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare multi-tape and single-tape TMs for language recognition power.

**Model answer:** Same languages (RE); multi-tape can be faster asymptotically.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define recognizer vs decider.

**Model answer:** Recognizer: accept if in L, may loop if not. Decider: always halt, accept/reject correctly.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case: equivalence of two arbitrary TMs. Classify decidability and justify.

**Model answer:** Undecidable (and worse). Classic via reductions from emptiness/universality.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A30  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Describe dovetailing at a high level for enumerating RE languages.

**Model answer:** Simulate all machines/inputs in round-robin time slices; list accepts.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Write a mini-survey: RE vs recursive languages with two example problems each.

**Model answer:** Recursive: decidable problems (A_DFA). RE-not-recursive: ATM. Co-RE examples: complement ATM.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A32  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Why is undecidability relevant to program analysis / antivirus idealizations?

**Model answer:** Halting/virus detection related problems are undecidable in general; practical tools approximate.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A33  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design a nondeterministic TM view of guessing a witness for an RE language.

**Model answer:** NTM guesses certificate then verifies; equivalent power to DTM via BFS of configurations.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** A student says ‘infinite tape means TM can decide everything’. Correct them.

**Model answer:** Power ≠ decidability of all problems; diagonalization/reduction show undecidable languages.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a reduction A ≤ B. If B is decidable, what about A?

**Model answer:** A is decidable. Contrapositively, if A undecidable, B is.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** State the Church–Turing thesis informally.

**Model answer:** Intuitive effective procedures ≡ TM-computable functions.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Use a TM high-level description to recognize { ww | w∈{0,1}* }.

**Model answer:** Find midpoint nondeterministically or by marking; compare halves.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A38  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Compare decidable, RE, and non-RE languages with the semantic picture of halting.

**Model answer:** Decidable always halt; RE enumerate accepts; some languages neither RE nor co-RE.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A39  ·  Easy  ·  4 marks  ·  Application
**Question:** Give one example of a decidable language about automata.

**Model answer:** A_DFA, E_DFA, EQ_DFA are decidable.

**Evaluation scheme:**
- Concept mapping — 2 marks
- Realism — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Algorithm
**Question:** Explain the universal TM idea: input 〈M,w〉 simulates M on w.

**Model answer:** Encode transitions; single TM interprets encoding — foundation of undecidability proofs.

**Evaluation scheme:**
- Correctness — 4 marks
- Complexity — 2 marks
- Clarity — 2 marks

