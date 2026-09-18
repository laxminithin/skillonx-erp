# Assignment — Theory of Computation — Module 3 — Context-Free Grammars and Pushdown Automata

**Subject:** Theory of Computation  
**Module:** Module 3 — Context-Free Grammars and Pushdown Automata  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 314 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define CFG. Give a grammar for {a^n b^n | n≥0} and one leftmost derivation of aaabbb.

**Expected Key Points:**
- S⇒aSb⇒aaSbb⇒aaaSbbb⇒aaabbb.
- Identify V,T,P,S.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a parse tree? How is it related to leftmost derivations?

**Expected Key Points:**
- Ordered tree of productions; yield is the string.
- One parse tree ↔ one leftmost (and one rightmost) derivation.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define PDA. Explain push, pop and the role of Z0.

**Expected Key Points:**
- Finite control + stack.
- Push writes a string on top; pop reads top.
- Z0 is the initial stack symbol, often a bottom-of-stack marker.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define ambiguous grammar with the example E→E+E|id.

**Expected Key Points:**
- id+id+id has two trees (left vs right association).
- Two leftmost derivations.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO5
**Question:** Give a PDA (empty stack) for {a^n b^n | n≥0}. Show IDs on aabb.

**Expected Key Points:**
- Push A on a (or count on stack), pop on b, pop Z0 at end.
- Trace (q,aabb,Z) ⇒ … ⇒ (q,ε,ε).
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Compare acceptance by empty stack vs final state. Sketch the conversion one way.

**Expected Key Points:**
- N(P) vs L(P).
- To go empty→final: new bottom marker; when original stack empty, move to a new accept state.
- Reverse: from accept, drain the stack.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** NPDA vs DPDA. Give one CFL that is DCFL and one CFL that is not.

**Expected Key Points:**
- a^n b^n is DCFL.
- Palindromes ww^R (no centre) are CFL not DCFL.
- NFA/DFA equivalence does not lift.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO2
**Question:** From S→aSb|ε, describe the standard CFG-to-PDA moves.

**Expected Key Points:**
- Start push S.
- Expand S to aSb (push bSa so a on top) or to ε.
- Match terminals a,b against input.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is inherent ambiguity? Give the standard example {a^n b^n c^m} ∪ {a^n b^m c^m}.

**Expected Key Points:**
- Every grammar for this union is ambiguous; strings a^n b^n c^n have two ‘reasons’.
- Language is CFL (union of CFLs).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a CFG and a PDA for {a^i b^j c^k | i=j or j=k}. Discuss nondeterminism.

**Expected Key Points:**
- Union of a^n b^n c* and a* b^n c^n.
- PDA guesses which equality to check.
- Grammar is union of two CFGs.
- Ambiguous on a^n b^n c^n.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** Prove that if G is a CFG then L(G) is accepted by some PDA.

**Expected Key Points:**
- Standard construction: leftmost simulate; prove by induction that a derivation S⇒* w iff PDA can empty the stack on w.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** For E→E+T|T, T→T*F|F, F→(E)|id show a unique parse tree of id+id*id and argue unambiguity of this grammar (sketch).

**Expected Key Points:**
- Force precedence * over + and left associativity.
- One leftmost derivation.
- Contrast with E→E+E|E*E|id.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four differences between a PDA and a TM.

**Expected Key Points:**
- PDA: stack only, input typically one-way, halt on consume, CFL power.
- TM: read/write tape, two-way, may loop, RE power.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain instantaneous descriptions of a PDA with an example move.

**Expected Key Points:**
- (q, ay, Xβ) ⊢ (p, y, αβ) if δ(q,a,X) contains (p,α).
- Show one push and one pop.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Why do DFA and NFA have the same power, but DPDA and NPDA do not?

**Expected Key Points:**
- Subset construction fails for stacks: you cannot finitely encode all possible stacks.
- Palindromes separate NPDA from DPDA.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO4
**Question:** A student says ‘empty stack and final state at once is required to accept.’ Critique.

**Expected Key Points:**
- Standard models use one or the other.
- Requiring both still yields CFLs but is a different definition; many textbooks use one mode and convert.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO3
**Question:** Lab: implement a DPDA recogniser for a^n b^n and test n=0,3, and aab. Marking.

**Expected Key Points:**
- Stack API, reject on extra b’s or leftover a’s, accept empty input, report traces.
- Marks for IDs and edge cases.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a sentential form? Give left-sentential forms of a^n b^n grammar for n=2.

**Expected Key Points:**
- S, aSb, aaSbb, aabb.
- Left-sentential: always expand leftmost variable (here only one).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘CFGs are the right model for programming-language syntax, with limits.’ Discuss ambiguity, DPDA parsers, and {w w}.

**Expected Key Points:**
- Algol-like syntax is CFL-ish; ambiguous expr grammars need disambiguation.
- Deterministic parsers ≈ DCFL.
- {w w} copy language is not CFL (needs two stacks / TM).
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define yield of a parse tree and give it for a 3-node tree S(a, S(a,b), b) wait — for S→aSb with child ε: yield ab for n=1.

**Expected Key Points:**
- Frontier terminals left to right.
- For S→aSb→aεb, yield ab.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Context Free Grammars and Pushdown Automata).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a PDA for palindromes over {0,1} (odd and even length).

**Model answer:** Guess middle; push then pop matching. Nondeterministic guess of center.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define a CFG as a 4-tuple and give a grammar for {a^n b^n | n≥0}.

**Model answer:** G=(V,Σ,R,S). S→aSb|ε.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Design
**Question:** Construct CFG and PDA for {a^i b^j c^k | i=j or j=k}.

**Model answer:** Union of i=j (c* free) and j=k (a* free). PDA nondeterministically chooses which equality.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A24  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Give a CFG for balanced parentheses and the corresponding PDA idea.

**Model answer:** S→(S)|SS|ε. PDA pushes on ‘(’, pops on ‘)’.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** What is a leftmost derivation? Why care in parsing?

**Model answer:** Always expand leftmost variable. Parsers often correspond to leftmost/rightmost derivations / parse trees.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Convert CFG S→aB|bA; A→a|aS|bAA; B→b|bS|aBB to Chomsky form sketch.

**Model answer:** Eliminate ε/unit if any; replace long RHS with binaries; terminals isolated.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A27  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare DPDA and NPDA. Name a CFL that needs nondeterminism.

**Model answer:** DPDA properly weaker. Palindromes / {ww^R} typical NPDA language.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define acceptance by empty stack vs final state for PDAs.

**Model answer:** Empty stack: accept when input consumed and stack empty. Final state: accept in F regardless of stack (variants exist). Convertible.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case: ambiguous grammar for dangling else. Risks and fixes.

**Model answer:** Two parse trees ⇒ semantic bugs. Fix: revise grammar / require braces / parser precedence.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A30  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Explain how to eliminate ε-productions from a CFG (high level).

**Model answer:** Find nullable variables; replace productions omitting nullable symbols; carefully handle S→ε if ε∈L.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Lab: implement CYK for CNF grammars; complexity and test plan.

**Model answer:** O(n^3|G|); tests on a^n b^n, ambiguous grammars, rejection cases.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A32  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Explain elimination of unit productions.

**Model answer:** Compute unit pairs A⇒*B; add B’s non-unit productions to A; delete units.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Justify PDA empty-stack vs final-state acceptance equivalence (sketch).

**Model answer:** Add bottom marker / ε-transitions to clear stack or enter accept; constructions preserve L.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Show a parse tree and leftmost derivation for aabbb from S→aSb|b.

**Model answer:** Wait language a^n b^{n+1}? Adjust: for S→aSb|ab derive aabb: S⇒aSb⇒a ab b = aabb.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Where do CFGs appear in programming language syntax?

**Model answer:** Expressions, blocks, declarations — typically CFG (often LALR/LL fragments).

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A36  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Student writes CFG for {a^n b^n c^n}. Correct them.

**Model answer:** Not context-free (pumping/Ogden). Needs CSG or TM.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret stack operations: push A, push B, pop B, pop A on input ε. What changed?

**Model answer:** Net identity if order matches; illustrates LIFO discipline.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A38  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Use a CFG to generate simple arithmetic expressions with + and ×.

**Model answer:** E→E+T|T; T→T×F|F; F→(E)|id — classic ambiguous-avoiding form.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A39  ·  Easy  ·  4 marks  ·  Compare
**Question:** Compare regular grammar vs general CFG.

**Model answer:** Regular: productions A→aB|a|ε (right/left linear). CFG: unrestricted RHS in variables/terminals.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 0 marks

### A40  ·  Difficult  ·  8 marks  ·  Algorithm
**Question:** Describe CYK membership testing steps on a short string.

**Model answer:** Fill triangular DP table with variables deriving substrings; accept if S in [1,n].

**Evaluation scheme:**
- Correctness — 4 marks
- Complexity — 2 marks
- Clarity — 2 marks

