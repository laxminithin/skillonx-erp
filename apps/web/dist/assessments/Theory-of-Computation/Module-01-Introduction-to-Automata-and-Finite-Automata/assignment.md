# Assignment — Theory of Computation — Module 1 — Introduction to Automata and Finite Automata

**Subject:** Theory of Computation  
**Module:** Module 1 — Introduction to Automata and Finite Automata  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 314 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define alphabet, string and language. Give one example of each over a campus ID alphabet {0,1}.

**Expected Key Points:**
- Alphabet: finite nonempty set, e.g.
- String: finite sequence, e.g.
- Language: any subset of Σ*, e.g.
- even-parity IDs.
- Mention ε and ∅ as distinct.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Give the 5-tuple of a DFA and explain each component with a 2-state even-parity machine.

**Expected Key Points:**
- Q={even,odd}, Σ={0,1}, δ flips on 1 and stays on 0, q0=even, F={even}.
- L = even number of 1s.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is ε? Distinguish {ε}, ∅ and {a}.

**Expected Key Points:**
- ε is the length-0 string.
- {ε} has one string.
- {a} has the one-symbol string a.
- |ε|=0; ε∉Σ unless listed.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain NFA acceptance. Why is ‘some path in F’ not ‘all paths in F’?

**Expected Key Points:**
- An NFA accepts w if at least one labelled path ends in F.
- Other paths may die or reject; existential, not universal, acceptance.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO2
**Question:** Convert the NFA: q0 -a→ {q0,q1}, q1 -b→ {q2}, q2 accepting, start q0, to a DFA by subset construction. Show reachable subsets.

**Expected Key Points:**
- On a: {q0,q1}; on b: ∅.
- From {q0,q1}: a→{q0,q1}, b→{q2}.
- From {q2}: a,b→∅.
- F = subsets containing q2.
- Draw the DFA.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define δ̂. Prove by induction that δ̂(q, xy)=δ̂(δ̂(q,x), y).

**Expected Key Points:**
- Base |y|=0: both sides δ̂(q,x).
- Inductive step add one symbol using δ̂(q,wa)=δ(δ̂(q,w),a).
- This is the associative run of a DFA.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare DFA and NFA. Prove they denote the same class of languages (sketch).

**Expected Key Points:**
- Every DFA is an NFA.
- Conversely subset construction builds DFA with ≤2^n states.
- Therefore L(NFA)=REG=L(DFA).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** Build a product DFA for even 0s AND ends-with-1 over {0,1}. List states and F.

**Expected Key Points:**
- Even/odd 0s × (last was 1 or not): 4 states.
- Accept (even, last=1).
- Show δ on 0 and 1.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is ε-closure? Compute it for q0 if q0-ε→q1, q1-a→q2, q1-ε→q3.

**Expected Key Points:**
- ε-closure(q0)={q0,q1,q3} (follow only ε).
- a-move from that set then ε-close to include q2 if needed for subset construction.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO2
**Question:** Design a DFA for identifiers: letter then letters/digits, and an NFA for the same. Compare state counts.

**Expected Key Points:**
- DFA: start, ID, dead.
- NFA can use the same or slightly different layout; subset construction will recover a DFA.
- Argue regularity and totality of δ via a dead state.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** Show that if L and M are regular then L∩M and L∪M are regular using products, not regex.

**Expected Key Points:**
- Product states Q_L×Q_M.
- Intersection F=F_L×F_M; union F=(F_L×Q_M)∪(Q_L×F_M).
- Start (qL,qM).
- Hence both regular.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** NFA with 4 states. Give the DFA state bound. Invent an NFA where all 16 subsets are reachable, or argue with the ‘nth from end’ family.

**Expected Key Points:**
- Bound 2^4=16.
- Language ‘4th bit from end is 1’ needs 16 DFA states (Myhill–Nerode: 4-bit suffixes distinguishable).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four differences between a finite automaton and a Turing machine.

**Expected Key Points:**
- FA: finite control only, one-way input, no write, no extra tape, halt after |w|.
- TM: two-way tape, write, unbounded work, may loop.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a dead/sink state? When do we add one?

**Expected Key Points:**
- Non-accepting state looping on all symbols.
- Added to complete a partial DFA so δ is total without changing the language.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Why can we delete unreachable states from a DFA without changing L(M)?

**Expected Key Points:**
- A run starts at q0 and only visits reachable states.
- Unreachable states never appear in δ̂(q0,w), so they do not affect membership.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO2
**Question:** A student claims {a^n b^n | n≥0} has a DFA that ‘counts n on states’. Refute.

**Expected Key Points:**
- A DFA has finitely many states so it cannot remember arbitrarily large n.
- After |Q| a’s, pigeonhole repeats a state; pumping would unbalance a’s and b’s.
- Needs a stack/PDA.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO2
**Question:** Specify a lab: implement subset construction for a 5-state ε-NFA and print the DFA table. Marking scheme.

**Expected Key Points:**
- Input δ including ε; compute ε-closure; iterate subsets; output δ_D, F_D.
- Marks: correctness of closure, reachable-only subsets, accept flags, a written trace on one string.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define concatenation of languages and Kleene star with examples {a}{b} and {a}*.

**Expected Key Points:**
- {a}*={ε,a,aa,…}.
- Star always contains ε.
- Concatenation of languages uses all pairwise concatenations.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** How does an NFA differ from ‘flipping a coin’? Why is NFA still a deterministic-language class?

**Expected Key Points:**
- Nondeterminism is a mathematical exists-path, not randomness.
- The language is still a definite set; a DFA can compile the paths into subsets.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write a 200-word note: ‘Finite memory is why DFAs cannot count arbitrarily.’ Use a campus turnstile example.

**Expected Key Points:**
- A turnstile that must match n entries with n exits needs unbounded count.
- Finite states ⇒ eventually two prefixes a^i, a^j share a state ⇒ same continuation ⇒ cannot enforce i=j for all i.
- Contrast with a PDA stack or a counter.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Introduction to Automata and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare ε-NFA and NFA without ε. Which conversions preserve the language?

**Model answer:** ε-NFA allows ε-moves; removing ε via ε-closure yields an equivalent NFA; subset construction then yields a DFA. All three denote REG.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define a configuration of a DFA and explain how a run on a string is a sequence of configurations.

**Model answer:** A configuration is (q, w) with remaining input w. Start (q0,x). One step applies δ. Accept if a configuration (f,ε) with f∈F is reachable.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design a product DFA that accepts binary strings with an odd number of 0s and even number of 1s. List F.

**Model answer:** States (parity0, parity1). Start (even,even). Accept (odd,even). Define δ for 0/1 flips.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A24  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithm to compute ε-closure(S) for a set of states S. State time complexity in terms of |Q| and |δ_ε|.

**Model answer:** DFS/BFS from S following only ε-edges; O(|Q|+|δ_ε|). Mark visited to avoid cycles.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** List three reasons finite automata are still useful despite being weaker than TMs.

**Model answer:** Lexical analysis, protocol/controller modelling, pattern matching with guaranteed linear-time recognition; simplicity and decidable emptiness/equivalence.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Prove by induction that δ̂(q, xy) = δ̂(δ̂(q,x), y) for a DFA. State the inductive parameter clearly.

**Model answer:** Induct on |y|. Base y=ε. Step: y=za; use definition δ̂(p,za)=δ(δ̂(p,z),a).

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A27  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Build a DFA for binary strings whose third symbol from the start is 1. How many states suffice?

**Model answer:** Remember position 1 and 2 then branch; after reading ≥3 symbols stay in accept/reject sinks. About 5–6 states with sinks.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** What does it mean for δ to be a total function in a DFA? Why do textbooks add a dead state?

**Model answer:** Every (q,a) has exactly one next state. Dead/sink completes partial transition tables without changing the language.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case: a login filter must accept IDs matching letter(letter|digit)*. Argue DFA vs regex implementation trade-offs.

**Model answer:** Both regular. DFA: explicit states start/ID/dead. Regex: concise. DFA better for streaming hardware; regex for maintainability.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design an NFA for strings over {0,1} containing 101 as a substring. Then sketch the DFA idea.

**Model answer:** NFA tracks progress 1,10,101 with self-loops. DFA is the classic string-matcher automaton for pattern 101.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Lab brief: implement NFA→DFA subset construction; list four graded deliverables and an acceptance test suite.

**Model answer:** Deliverables: ε-closure, reachable subsets only, transition table, accept flags. Tests: known NFAs, exponential case, empty language.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A32  ·  Intermediate  ·  6 marks  ·  Application
**Question:** A campus gate opens on badge IDs that are binary strings of even parity. Model the checker as a DFA and justify minimality.

**Model answer:** Two states even/odd; accept even. Myhill–Nerode: ε and 1 are distinguishable; two classes ⇒ minimal.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A33  ·  Difficult  ·  8 marks  ·  Algorithm
**Question:** Describe an algorithm to decide whether L(M)=∅ for DFA M. Correctness sketch.

**Model answer:** BFS/DFS from q0; accept if any state in F reachable. Correct because only reachable states affect L.

**Evaluation scheme:**
- Correctness — 4 marks
- Complexity — 2 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** A student claims every NFA with n states has an equivalent DFA with at most n states. Refute with a concrete language family.

**Model answer:** Language of strings whose nth symbol from the end is 1 needs ~2^n DFA states; NFA uses n+1. Exponential blow-up is necessary.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret the transition table: q0-a→q0,q1; q1-b→q2; F={q2}. Which strings of length ≤3 are accepted?

**Model answer:** Must end with ...ab reaching q2. Length≤3: ab, aab, abb? Check reachable paths; list accepted ones ending in ab with possible leading a* before last ab.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Why is the empty language regular? Why is Σ* regular?

**Model answer:** ∅: DFA with no accepting states (or unreachable F). Σ*: DFA with one accepting state looping on all symbols.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Justify whether DFAs can implement ‘look-ahead’ like NFAs appear to. What is the right mental model?

**Model answer:** NFA look-ahead is existential branching, compiled away by subset construction. DFAs encode the set of possible NFA states.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A38  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Use case: detect binary strings ending with 00 using an NFA with as few states as you can, then convert insight to DFA.

**Model answer:** NFA: guess start of final 00. DFA remembers trailing 0-count (0,1,2+) with 3 states.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A39  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define Myhill–Nerode equivalence roughly and say how it relates to the number of DFA states.

**Model answer:** x≡y if no continuation distinguishes them. Number of classes = size of minimal DFA.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A40  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Compare automata as language recognizers vs. generators. Where do NFAs fit in compilers?

**Model answer:** Recognizers decide membership; generators produce strings. Lexer NFAs/DFAs recognize tokens; grammar CFGs generate structure.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

