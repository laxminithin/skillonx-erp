# Assignment — Theory of Computation — Module 2 — Regular Expressions and Finite Automata

**Subject:** Theory of Computation  
**Module:** Module 2 — Regular Expressions and Finite Automata  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 314 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define regular expressions inductively and give REs for ∅, {ε}, {a}, and (a+b)*abb.

**Expected Key Points:**
- ∅; ε; a; (a+b)*abb.
- Operators: +, ·, *.
- Precedence: * then · then +.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** State Kleene’s theorem.

**Expected Key Points:**
- A language is regular iff some DFA (NFA, ε-NFA) accepts it iff some RE denotes it.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Write REs for: strings ending in 01; strings with at least one 1; even number of 0s (sketch).

**Expected Key Points:**
- (0+1)*01 ; (0+1)*1(0+1)* ; (1*01*01*)*1* or DFA-based RE.
- Explain reading.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List five closure properties of regular languages.

**Expected Key Points:**
- Union, concat, star, complement, intersection, reverse, homomorphism, inverse homomorphism, difference, prefix-closure (any five with one-line why).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO2
**Question:** Convert (a+b)*ab to an ε-NFA (Thompson) then to a DFA. Show subsets.

**Expected Key Points:**
- Thompson: union fragment, star, concat ab.
- Subset construction from ε-closure(start).
- Minimise if asked.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Use the pumping lemma to prove {ww | w∈{0,1}*} is not regular.

**Expected Key Points:**
- Take 0^p 1 0^p 1 (or 0^p 1^p 0^p 1^p).
- Pumping in the first block breaks the ww pattern.
- Handle all legal xyz splits with |xy|≤p.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** State Arden’s lemma and solve R = a + Rb for R.

**Expected Key Points:**
- ε∉{b} so R=a b*.
- Language: a followed by any number of b’s.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Minimise the DFA for (0+1)*0 using the table-filling method. Show the partition.

**Expected Key Points:**
- Typically 2 states: last symbol 0 (accept) vs last 1/start.
- Mark F vs non-F, no further splits needed if start is non-F unless ε… actually start rejects unless we have seen 0.
- 2-state min DFA.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO4
**Question:** Pumping lemma vs Myhill–Nerode for proving non-regularity. When is MN easier?

**Expected Key Points:**
- Pumping: pick one long w, fight all splits.
- MN: exhibit infinitely many pairwise distinguishable prefixes (often a^i).
- MN is iff; pumping is only necessary.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** Prove that regular languages are closed under reversal. Give FA construction.

**Expected Key Points:**
- Reverse all edges of an NFA; make old F into starts via a new ε-start; old start becomes the unique accept.
- Or reverse the RE inductively.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** Prove {a^{n^2} | n≥0} is not regular using pumping.

**Expected Key Points:**
- For large n^2, pumping y of length k, 1≤k≤p, yields a length n^2+k not a perfect square when n>p.
- Gaps between squares exceed p.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO2
**Question:** Give REs and a minimal DFA for the language of strings over {0,1} whose number of 0s is a multiple of 3.

**Expected Key Points:**
- DFA: 3 remainder states, F={r0}.
- RE via elimination: (1*01*01*01*)*1* or equivalent.
- Argue minimality: remainders distinguishable by 0^{3-i}.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** What does it mean for two regular expressions to be equivalent?

**Expected Key Points:**
- They denote the same language.
- Example: (a*)(a*) and a*; (a+b)* and (b+a)*.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain DFA minimisation intuitively: why merge indistinguishable states?

**Expected Key Points:**
- They agree on every continuation, so keeping both is redundant memory.
- The quotient DFA still accepts L and is smallest.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Why is the pumping lemma not a test that ‘proves regularity’?

**Expected Key Points:**
- Satisfying pumping does not imply regular (some non-regular languages can be pumped).
- It is necessary, not sufficient.
- Use FA/RE/MN to prove regular.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO4
**Question:** A student writes complement of (0+1)*1 as (0+1)*0. Critique.

**Expected Key Points:**
- Misses ε and strings that are all 0s? Actually complement is strings that do not end in 1, i.e.
- The student dropped ε.
- Also NFA F-swap would be wrong.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO2
**Question:** Lab: given a DFA, compute the minimised DFA and an RE by state elimination. Deliverables.

**Expected Key Points:**
- Table-filling marks, merged diagram, elimination order, final RE, two tests: a string in L and a string not in L.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Show (0+1)*01(0+1)* + (0+1)* = (0+1)*. Why can the first summand be dropped?

**Expected Key Points:**
- The second summand already is Σ*.
- Union with a subset does not change Σ*.
- Algebra of languages.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** ‘Every regex has a DFA, but the DFA may be exponentially larger.’ Explain with the nth-from-end language.

**Expected Key Points:**
- RE/NFA of size O(n) for ‘nth from end is 1’; DFA must remember n bits ⇒ 2^n states.
- Lexer generators live with this blow-up or keep NFAs.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Give examples of operations REG is closed under and one it shares with CFL (union) vs one CFL lacks (complement).

**Expected Key Points:**
- REG: complement and intersection.
- CFL: union yes, complement/intersection no in general.
- Contrast with product DFA.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Regular Expressions and Finite Automata).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Outline Thompson’s construction from regex to ε-NFA. Complexity intuition.

**Model answer:** Each operator builds a small ε-NFA fragment; glue with ε. Linear in regex size.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the syntax of regular expressions over Σ including ε, ∅, union, concat, star.

**Model answer:** Atomic: a∈Σ, ε, ∅. Inductive: (r+s), (rs), r*. Parentheses for grouping.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Prove REG closed under complement using DFAs, then derive closure under intersection.

**Model answer:** Complement flip F; intersection via De Morgan or product. Hence Boolean algebra.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A24  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Outline state-elimination (Arden) method from DFA to regex.

**Model answer:** Label edges by regex; eliminate states solving R=Q+RP ⇒ R=QP*; combine until start→accept expression.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Give regexes for: (i) strings ending in 01 (ii) even length (iii) at least one a.

**Model answer:** (0+1)*01; ((0+1)(0+1))*; (0+1)*a(0+1)*.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Design
**Question:** Build an FA for the regex (0+1)*011 and minimize informally.

**Model answer:** String matcher for 011 with failure links; minimize by merging indistinguishable.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A27  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare GNFA and ordinary NFA. Why do textbooks use GNFAs for regex conversion?

**Model answer:** GNFA edges carry regexes; state elimination is cleaner. Same power as NFA.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** State Kleene’s theorem in one sentence.

**Model answer:** A language is regular iff it is denoted by some regular expression iff it is accepted by some FA.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case: input validation for emails with regex. Discuss correctness limits.

**Model answer:** Full RFC email is messy; regex approximates. Over-restriction vs under-restriction; prefer library validators.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A30  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Convert (0+1)*1(0+1) to an NFA with ≤6 states (sketch).

**Model answer:** Star loop, then must-read 1, then one arbitrary symbol; accept.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Lab: implement regex→NFA→DFA→minimized DFA pipeline; grading rubric.

**Model answer:** Correct Thompson, subset, Hopcroft/Brzozowski; tests on identities like (r*)*=r*.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A32  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a regex and a DFA for identifiers: letter followed by letters/digits.

**Model answer:** Regex: l(l+d)*. DFA: start → ID → ID; other → dead.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Algorithm
**Question:** Describe Brzozowski minimization at high level.

**Model answer:** Determinize reverse(determinize(reverse(DFA))). Yields minimal DFA.

**Evaluation scheme:**
- Correctness — 4 marks
- Complexity — 2 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Application
**Question:** How do regex engines in practice differ from theoretical regex (backrefs)?

**Model answer:** Backreferences take you beyond REG. Theoretical regex = REG; Perl-like features may be non-regular.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A35  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** A teammate writes (0*)(1*) for ‘equal 0s and 1s’. Diagnose.

**Model answer:** That is 0*1*, not {0^n1^n}. Equal counts need CFG/PDA, not regex.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret L((0+ε)(1+ε)). List all strings.

**Model answer:** {ε,0,1,01}.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Why is ∅* = {ε}? Why is ε*={ε}?

**Model answer:** Star is union of concatenations of length n≥0; n=0 gives ε. ε concatenated is still ε.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A38  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Use Arden’s lemma to solve R = 0R + 1 for R.

**Model answer:** R = 0*1.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A39  ·  Easy  ·  4 marks  ·  Compare
**Question:** Justify preferring DFA over regex for a high-speed packet filter.

**Model answer:** DFA: O(1) per byte, no backtracking. Regex engines may backtrack catastrophically.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 0 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given DFA↔regex round-trip produced a huge expression, interpret what went wrong and how to simplify.

**Model answer:** State elimination order matters; algebraic simplifications (distributivity, idempotence) needed; minimize DFA first.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

