# Assignment — Theory of Computation — Module 4 — Properties of Context-Free Languages

**Subject:** Theory of Computation  
**Module:** Module 4 — Properties of Context-Free Languages  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 314 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain generating vs reachable vs useful symbols with a 4-production example.

**Expected Key Points:**
- A useful iff generating and reachable.
- Example: S→A, A→a, B→b, C→C.
- B unreachable; C non-generating.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define CNF and GNF. Give one production example of each.

**Expected Key Points:**
- CNF: A→BC or A→a.
- S→AB, A→a vs A→aBC.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** State the CFL pumping lemma carefully (all conditions).

**Expected Key Points:**
- ∃p such that any z∈L with |z|≥p writes z=uvxyz with |vxy|≤p, |vy|≥1, and uv^i xy^i z ∈ L for all i≥0.
- (Hopcroft’s uvwxy form is the same split with different letters.)
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List three CFL closure and two non-closure properties.

**Expected Key Points:**
- Closed: union, concat, star, homomorphism, reverse, ∩REG.
- Not: intersection, complement, difference.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO5
**Question:** Eliminate ε and unit productions from S→A, A→ε|aB, B→b|A.

**Expected Key Points:**
- Nullables {S,A}.
- Add S→ε if ε∈L, A→aB already, A→a (drop B if nullable—no).
- Units S→A, B→A ⇒ add S→aB|a, B→aB|a, etc.
- Show final set.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Convert S→aSb|ε to CNF (language {a^n b^n}).

**Expected Key Points:**
- New start if needed; S→ε kept; S→aSb becomes S→A T, T→S B or S→A S B broken to binaries; A→a, B→b.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Prove CFLs are closed under union and concatenation by grammar constructions.

**Expected Key Points:**
- S→S1|S2 disjointify variables.
- Concat S→S1 S2.
- Argue every string arises and nothing extra.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Prove {a^n b^n c^n | n≥0} is not CFL using pumping.

**Expected Key Points:**
- z=a^p b^p c^p; |vxy|≤p so it misses at least one letter type; pump i=2; three exponents cannot stay equal.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Why CFL ∩ CFL need not be CFL. Give L1, L2.

**Expected Key Points:**
- L1=a^n b^n c*, L2=a* b^n c^n, both CFL; intersection a^n b^n c^n not CFL.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** Prove CFL ∩ REG is CFL via PDA × DFA. Specify the product δ.

**Expected Key Points:**
- States Q_p×Q_d; stack of the PDA; input moves both; ε-moves of PDA keep DFA state.
- Accept if PDA accept mode and DFA in F (for final-state PDA).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain why ordinary pumping can be awkward on some CFLs and what Ogden’s lemma adds (intuition).

**Expected Key Points:**
- Ogden lets you mark positions so v,y must include marked symbols.
- Stronger necessary condition.
- Optional: one example sketch.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Run CYK (table) for grammar S→AB|BC, A→BA|a, B→CC|b, C→AB|a on string baaba (classic). Who sits in V_{1,5}?

**Expected Key Points:**
- Standard Hopcroft example: S is in the top cell; baaba ∈ L.
- Show all cells; marks for correctness of triples.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a nullable variable? How do you compute the set?

**Expected Key Points:**
- A⇒*ε. Iterate: all A with A→ε, then A→B1..Bk all nullable, until closure.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Why convert to CNF before some proofs (pumping tree height / CYK)?

**Expected Key Points:**
- Binary trees: a long yield forces a long path (pigeonhole on variables) giving the uvxyz split.
- CYK recurrence needs binary productions.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Give the grammar construction for L* when L=L(G1).

**Expected Key Points:**
- S→S1 S | ε (or S→S1 S | S1 | ε).
- Disjoint variables.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO4
**Question:** Student claims complement of a^n b^n is CFL therefore CFLs closed under complement. Critique.

**Expected Key Points:**
- That particular complement may be CFL (or even CFL∪REG mix) without the class being closed.
- Closure is a universal claim; one example of a CFL whose complement is CFL does not prove closure.
- Use a^n b^n c^n argument.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO5
**Question:** Lab: write a program that removes useless symbols then unit productions. Test on a 6-production grammar. Rubric.

**Expected Key Points:**
- Worklists for generating/reachable; unit graph closure; compare L on 10 strings vs original; report remaining P.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Show that REG ⊂ CFL ⊂ CSL (proper) with witness languages.

**Expected Key Points:**
- a* regular; a^n b^n CFL not REG; a^n b^n c^n CSL not CFL.
- Inclusions from grammar restrictions.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write a structured note on CFL closure: constructions that work, counterexamples that fail, and the PDA×DFA exception.

**Expected Key Points:**
- Union/concat/star via grammars; homomorphism; reverse.
- Intersection/complement fail.
- ∩REG works because DFA is finite memory beside the stack.
- Mention substitution.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Describe unit-production elimination using the unit-pair graph.

**Expected Key Points:**
- Edge A→B if A→B is a unit.
- If A⇒*B and B→α is non-unit, add A→α.
- Then delete all units.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Properties of Context Free Languages).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Use pumping lemma to show {a^n b^n c^n} is not CFL.

**Model answer:** Pump v,y that cannot preserve all three counts simultaneously.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** State the pumping lemma for CFLs (informal statement).

**Model answer:** For CFL L, ∃p such that any s∈L, |s|≥p, can be split uvxyz with |vxy|≤p, |vy|≥1, uv^i xy^i z ∈L ∀i≥0.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Prove {a^i b^j c^k | i=j=k} not CFL using intersection with a regular language if helpful.

**Model answer:** Direct pumping or note CFL∩a*b*c* arguments; standard pumping on a^p b^p c^p.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A24  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Show {ww | w∈{0,1}*} is not CFL (sketch).

**Model answer:** Pumping/Ogden or intersect with regular language to get non-CFL.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** List four closure properties of CFLs.

**Model answer:** Closed under union, concat, star, homomorphism; not under intersection or complement.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case: two CFGs for fragments of a protocol; intersection needed. What automaton class helps?

**Model answer:** Intersection of CFL not CFL; may need CFL∩REG techniques or move to CSG/TM model.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare CFL∩REG vs CFL∩CFL.

**Model answer:** CFL∩REG is CFL; CFL∩CFL may leave CFL (e.g. a^n b^n c^n via two CFLs).

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** What is a inherently ambiguous CFL? Give the classic example name.

**Model answer:** Every grammar for the language is ambiguous. Classic: {a^n b^n c^m} ∪ {a^n b^m c^m}.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Survey decidable vs undecidable problems for CFGs; cite three each.

**Model answer:** Decidable: emptiness, membership (CYK), finiteness (advanced). Undecidable: equivalence, universality, ambiguity.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A30  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Why compilers still use CFGs if CFL∩CFL isn’t closed?

**Model answer:** Syntax approx CFG; semantic constraints (type agreement) handled in later phases, not pure CFG.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A31  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Justify Chomsky hierarchy placements: REG ⊂ CFL ⊂ CSL ⊂ RE.

**Model answer:** Strict inclusions via classic witness languages a^n b^n, a^n b^n c^n, halting-related RE-not-recursive.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Someone concludes CFLs closed under complement because DFAs are. Refute.

**Model answer:** CFL not closed under complement; if they were, intersection would follow via De Morgan and break known examples.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Algorithm
**Question:** High-level algorithm to test if a CFG generates any string (emptiness).

**Model answer:** Mark terminals productive; propagate productivity to variables; check if S productive.

**Evaluation scheme:**
- Correctness — 4 marks
- Complexity — 2 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret what Ogden’s lemma buys beyond ordinary pumping.

**Model answer:** Distinguished positions force pumpable parts into chosen regions — stronger for some proofs.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Is emptiness of CFGs decidable? Universality?

**Model answer:** Emptiness decidable (productive variables). Universality undecidable for CFGs.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a proof outline that CFLs are closed under union via grammars.

**Model answer:** New start S→S1|S2 with disjoint variables.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Use closure facts to quickly decide if L1∪L2 is CFL when both are.

**Model answer:** Yes — closed under union.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Explain
**Question:** Define deterministic CFL (DCFL) briefly and one property vs CFL.

**Model answer:** Accepted by DPDA. DCFLs closed under complement; CFLs not. DCFLs not closed under union.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 2 marks

### A39  ·  Easy  ·  4 marks  ·  Application
**Question:** Give one practical reason pumping lemmas are ‘negative tools’.

**Model answer:** They prove non-membership in a class; they do not prove a language is CFL.

**Evaluation scheme:**
- Concept mapping — 2 marks
- Realism — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Interpret a ‘proof’ that used pumping with |vy|=0. Where is the bug?

**Model answer:** Pumping lemma requires |vy|≥1; a split with empty pumpable part is invalid.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

