# Quiz — Theory of Computation — Module 4: Properties of Context-Free Languages

**Subject:** Theory of Computation  
**Module:** Module 4 — Properties of Context-Free Languages  
**Questions:** 73  
**Mix:** 12 Easy · 35 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A unit production has the form:

- **A.** A → a
- **B.** A → BC
- **C.** A → ε
- **D.** A → B

**Answer:** D
**Explanation:** Single variable RHS.

### Q02  ·  Easy
**Question:** CFLs are closed under:

- **A.** Set difference in general
- **B.** Arbitrary homomorphism inverses of TMs
- **C.** Intersection and complement
- **D.** Union, concatenation and Kleene star

**Answer:** D
**Explanation:** The CFL ‘semiring’ operations.

### Q03  ·  Easy
**Question:** Chomsky normal form allows:

- **A.** A→aBC only
- **B.** Unrestricted α→β
- **C.** A→BC and A→a (and maybe S→ε)
- **D.** A→ε for every A

**Answer:** C
**Explanation:** Standard CNF.

### Q04  ·  Easy
**Question:** Greibach normal form productions look like:

- **A.** A → BC
- **B.** A → aα (a terminal, α variables)
- **C.** α → β unrestricted
- **D.** A → ε only

**Answer:** B
**Explanation:** GNF definition.

### Q05  ·  Easy
**Question:** Which option best describes **CNF**?

- **A.** Right-linear form.
- **B.** Chomsky normal form: A → BC or A → a (plus optional S→ε).
- **C.** A → aα with α variables only (that is GNF).
- **D.** Unrestricted productions.

**Answer:** B
**Explanation:** CNF: Chomsky normal form: A → BC or A → a (plus optional S→ε).

### Q06  ·  Easy
**Question:** Which option best describes **CYK algorithm**?

- **A.** Arden’s solver.
- **B.** A pumping split finder.
- **C.** A DP membership test for CNF grammars in O(n^3 |P|) time.
- **D.** A DFA minimisation.

**Answer:** C
**Explanation:** CYK algorithm: A DP membership test for CNF grammars in O(n^3 |P|) time.

### Q07  ·  Easy
**Question:** Which option best describes **Closure of CFL under union**?

- **A.** CFLs are not closed under union.
- **B.** Union requires a TM.
- **C.** If L1, L2 are CFLs then L1∪L2 is CFL (new start S→S1|S2).
- **D.** Union of CFLs is always regular.

**Answer:** C
**Explanation:** Closure of CFL under union: If L1, L2 are CFLs then L1∪L2 is CFL (new start S→S1|S2).

### Q08  ·  Easy
**Question:** Which option best describes **Non-closure under intersection**?

- **A.** Intersection of CFLs is always regular.
- **B.** CFLs are closed under intersection.
- **C.** CFL ∩ CFL need not be CFL (classic: a^n b^n c^n as intersection of two CFLs).
- **D.** Intersection is union.

**Answer:** C
**Explanation:** Non-closure under intersection: CFL ∩ CFL need not be CFL (classic: a^n b^n c^n as intersection of two CFLs).

### Q09  ·  Easy
**Question:** Which option best describes **Nullable variable**?

- **A.** A DPDA state.
- **B.** A variable A with A ⇒* ε.
- **C.** A terminal a.
- **D.** A pumping constant.

**Answer:** B
**Explanation:** Nullable variable: A variable A with A ⇒* ε.

### Q10  ·  Easy
**Question:** Which option best describes **Useless symbol**?

- **A.** A variable that is not generating or not reachable from S (or both).
- **B.** A DFA dead state only.
- **C.** A terminal that appears once.
- **D.** A TM blank.

**Answer:** A
**Explanation:** Useless symbol: A variable that is not generating or not reachable from S (or both).

### Q11  ·  Easy
**Question:** Which sequence correctly describes **CFG simplification (typical)**?

- **A.** Pump → minimise DFA → RE
- **B.** Remove non-generating → remove unreachable → remove ε-productions (keep S→ε if needed) → remove unit productions
- **C.** CNF → add ε → add units → add useless
- **D.** GNF → unrestricted grammar

**Answer:** B
**Explanation:** Correct sequence for CFG simplification (typical): Remove non-generating → remove unreachable → remove ε-productions (keep S→ε if needed) → remove unit productions

### Q12  ·  Easy
**Question:** Which sequence correctly describes **CNF conversion**?

- **A.** Apply CFL pumping
- **B.** Subset construction
- **C.** Write GNF first then add A→BCD
- **D.** Simplify → terminals in long productions get A→a via new variables → break long variable strings into binaries

**Answer:** D
**Explanation:** Correct sequence for CNF conversion: Simplify → terminals in long productions get A→a via new variables → break long variable strings into binaries

### Q13  ·  Intermediate
**Question:** A grammar still has B that never appears from S. Before converting to CNF you should:

- **A.** Add more unit productions
- **B.** Remove unreachable/useless symbols
- **C.** Pump B
- **D.** Convert to a TM

**Answer:** B
**Explanation:** Simplification first.

### Q14  ·  Intermediate
**Question:** CFL ∩ REG is CFL because:

- **A.** Regular languages destroy context-free structure
- **B.** You convert the CFL to a TM first
- **C.** A PDA and a DFA can run as a product finite-control, same stack
- **D.** A DFA stack is added

**Answer:** C
**Explanation:** Product construction.

### Q15  ·  Intermediate
**Question:** CYK requires the grammar in:

- **A.** Right-linear form only
- **B.** GNF only
- **C.** Unrestricted form
- **D.** CNF (typically)

**Answer:** D
**Explanation:** The DP recurrence uses binary branches.

### Q16  ·  Intermediate
**Question:** GNF is convenient because:

- **A.** It is CNF with three variables
- **B.** It is the same as a DFA table
- **C.** It forbids terminals
- **D.** The first terminal is explicit — good for PDA/recursive-descent intuition

**Answer:** D
**Explanation:** A→aα matches input a then stack α.

### Q17  ·  Intermediate
**Question:** S→A, A→B, B→a. After unit removal the useful production is:

- **A.** S→a (and A→a, B→a as kept if variables remain)
- **B.** S→ε
- **C.** Only S→A
- **D.** S→AA

**Answer:** A
**Explanation:** Unit chains A⇒*a become A→a.

### Q18  ·  Intermediate
**Question:** Useless symbols can be deleted because:

- **A.** They change L(G)
- **B.** They are terminals
- **C.** They never appear in any terminating derivation from S
- **D.** They are required for CNF

**Answer:** C
**Explanation:** L is generated only by useful symbols.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **CFL union** and **CFL intersection**?

- **A.** Closed under neither.
- **B.** Closed under both.
- **C.** Closed under union; not closed under intersection.
- **D.** Closed under intersection not union.

**Answer:** C
**Explanation:** Closed under union; not closed under intersection.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **CNF** and **GNF**?

- **A.** CNF is for TMs; GNF for DFAs.
- **B.** CNF uses A→BC|a; GNF uses A→aα. Both are normal forms for CFGs (almost).
- **C.** They are identical forms.
- **D.** GNF forbids terminals.

**Answer:** B
**Explanation:** CNF uses A→BC|a; GNF uses A→aα. Both are normal forms for CFGs (almost).

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **substitution of nullables** and **deletion of A→ε only**?

- **A.** Nullables cannot appear in other productions.
- **B.** Deleting A→ε is enough even if B→A C.
- **C.** You must also add versions of productions with nullable symbols dropped, not just delete A→ε.
- **D.** ε-removal preserves unit productions only.

**Answer:** C
**Explanation:** You must also add versions of productions with nullable symbols dropped, not just delete A→ε.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **useless generating** and **useless unreachable**?

- **A.** Generating: can produce a terminal string; reachable: appears from S. Useless if either fails.
- **B.** Generating implies reachable.
- **C.** Unreachable implies generating.
- **D.** They mean the same.

**Answer:** A
**Explanation:** Generating: can produce a terminal string; reachable: appears from S. Useless if either fails.

### Q23  ·  Intermediate
**Question:** Which option best describes **Chomsky hierarchy type-2**?

- **A.** Type-2 is context-sensitive only.
- **B.** Type-2 grammars are CFGs; they generate CFLs, recognised by PDAs.
- **C.** Type-2 is regular.
- **D.** Type-2 is unrestricted.

**Answer:** B
**Explanation:** Chomsky hierarchy type-2: Type-2 grammars are CFGs; they generate CFLs, recognised by PDAs.

### Q24  ·  Intermediate
**Question:** Which option best describes **Closure under concatenation**?

- **A.** CFLs are closed under concat: S→S1 S2.
- **B.** Concat needs complement.
- **C.** Concat of CFLs is always regular.
- **D.** CFLs are not closed under concat.

**Answer:** A
**Explanation:** Closure under concatenation: CFLs are closed under concat: S→S1 S2.

### Q25  ·  Intermediate
**Question:** Which option best describes **Closure under star**?

- **A.** CFL star is always finite.
- **B.** Star requires a DFA.
- **C.** Star of a CFL may leave CFL.
- **D.** CFLs are closed under *: S→S1 S | ε.

**Answer:** D
**Explanation:** Closure under star: CFLs are closed under *: S→S1 S | ε.

### Q26  ·  Intermediate
**Question:** Which option best describes **GNF**?

- **A.** Greibach normal form: A → aα with a∈T and α∈V*.
- **B.** Regular expressions.
- **C.** A → ε only.
- **D.** A → BC only.

**Answer:** A
**Explanation:** GNF: Greibach normal form: A → aα with a∈T and α∈V*.

### Q27  ·  Intermediate
**Question:** Which option best describes **Generating symbol**?

- **A.** A stack symbol of a DFA.
- **B.** Only the start symbol.
- **C.** A variable A such that A ⇒* w for some w∈T*.
- **D.** A variable that never produces terminals.

**Answer:** C
**Explanation:** Generating symbol: A variable A such that A ⇒* w for some w∈T*.

### Q28  ·  Intermediate
**Question:** Which option best describes **Intersection with regular**?

- **A.** The product needs two stacks.
- **B.** CFL ∩ REG is always regular.
- **C.** CFL ∩ REG is CFL (product of PDA with DFA).
- **D.** CFL ∩ REG may be non-CFL.

**Answer:** C
**Explanation:** Intersection with regular: CFL ∩ REG is CFL (product of PDA with DFA).

### Q29  ·  Intermediate
**Question:** Which option best describes **Non-closure under complement**?

- **A.** Complement equals reverse.
- **B.** Complement of a CFL is always CFL.
- **C.** Complement is always regular.
- **D.** CFLs are not closed under complement (else they would be closed under intersection by De Morgan).

**Answer:** D
**Explanation:** Non-closure under complement: CFLs are not closed under complement (else they would be closed under intersection by De Morgan).

### Q30  ·  Intermediate
**Question:** Which option best describes **Pumping lemma (CFL)**?

- **A.** The regular pumping lemma with five pieces always.
- **B.** ∃p such that any z∈L, |z|≥p, splits uvxyz with |vxy|≤p, |vy|≥1, uv^i xy^i z ∈ L ∀i≥0.
- **C.** A CNF conversion.
- **D.** A lemma that proves a language is CFL.

**Answer:** B
**Explanation:** Pumping lemma (CFL): ∃p such that any z∈L, |z|≥p, splits uvxyz with |vxy|≤p, |vy|≥1, uv^i xy^i z ∈ L ∀i≥0.

### Q31  ·  Intermediate
**Question:** Which option best describes **Reachable symbol**?

- **A.** A symbol X for which S ⇒* αXβ for some α,β.
- **B.** A rejecting DFA state.
- **C.** Only terminals.
- **D.** A symbol never appearing in any sentential form.

**Answer:** A
**Explanation:** Reachable symbol: A symbol X for which S ⇒* αXβ for some α,β.

### Q32  ·  Intermediate
**Question:** Which option best describes **Simplification order**?

- **A.** Typical order: useless (after generating/reachable) with care about ε, then ε-productions, then unit, then CNF.
- **B.** CNF first, then add useless symbols.
- **C.** GNF then add unit productions as required.
- **D.** Pump then minimise a DFA.

**Answer:** A
**Explanation:** Simplification order: Typical order: useless (after generating/reachable) with care about ε, then ε-productions, then unit, then CNF.

### Q33  ·  Intermediate
**Question:** Which option best describes **Unit production**?

- **A.** A production A → B with a single variable on the RHS.
- **B.** A → ε.
- **C.** A → a.
- **D.** A → BC.

**Answer:** A
**Explanation:** Unit production: A production A → B with a single variable on the RHS.

### Q34  ·  Intermediate
**Question:** Which option best describes **ε-production**?

- **A.** A production A → a.
- **B.** A production A → ε.
- **C.** A CNF production A→BC.
- **D.** A unit production.

**Answer:** B
**Explanation:** ε-production: A production A → ε.

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **CFL pumping attack**?

- **A.** Assume CFL with p → pick a long z (often a^p b^p c^p) → vxy short and local → pump i=0 or 2 to leave CFL form
- **B.** Minimise a parse tree to a DFA
- **C.** Build a PDA then complement it
- **D.** Convert z to an RE

**Answer:** A
**Explanation:** Correct sequence for CFL pumping attack: Assume CFL with p → pick a long z (often a^p b^p c^p) → vxy short and local → pump i=0 or 2 to leave CFL form

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **ε-production elimination**?

- **A.** Delete every production containing a variable
- **B.** Find nullable variables → for each production, add copies with nullable symbols dropped → delete A→ε except possibly S
- **C.** Swap with unit productions
- **D.** Convert to a DFA

**Answer:** B
**Explanation:** Correct sequence for ε-production elimination: Find nullable variables → for each production, add copies with nullable symbols dropped → delete A→ε except possibly S

### Q37  ·  Intermediate
**Question:** Which statement about **CNF** is FALSE?

- **A.** CNF is correctly understood as: chomsky normal form: A → BC or A → a (plus optional S→ε).
- **B.** A useful way to remember CNF is that it is not the same as “A → aα with α variables only (that is GNF)”.
- **C.** CNF productions may be A → BCD.
- **D.** In this module, CNF is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: CNF productions may be A → BCD.. CNF actually means: Chomsky normal form: A → BC or A → a (plus optional S→ε).

### Q38  ·  Intermediate
**Question:** Which statement about **Chomsky hierarchy type-2** is FALSE?

- **A.** In this module, Chomsky hierarchy type-2 is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Chomsky hierarchy type-2 is that it is not the same as “Type-2 is regular”.
- **C.** Type-2 languages are exactly the recursive languages.
- **D.** Chomsky hierarchy type-2 is correctly understood as: type-2 grammars are CFGs; they generate CFLs, recognised by PDAs.

**Answer:** C
**Explanation:** The false claim is: Type-2 languages are exactly the recursive languages.. Chomsky hierarchy type-2 actually means: Type-2 grammars are CFGs; they generate CFLs, recognised by PDAs.

### Q39  ·  Intermediate
**Question:** Which statement about **Closure under concatenation** is FALSE?

- **A.** Closure under concatenation is correctly understood as: cFLs are closed under concat: S→S1 S2.
- **B.** In this module, Closure under concatenation is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Closure under concatenation is that it is not the same as “CFLs are not closed under concat”.
- **D.** S→S1|S2 implements concatenation.

**Answer:** D
**Explanation:** The false claim is: S→S1|S2 implements concatenation.. Closure under concatenation actually means: CFLs are closed under concat: S→S1 S2.

### Q40  ·  Intermediate
**Question:** Which statement about **Intersection with regular** is FALSE?

- **A.** Intersecting a CFL with a DFA can require a TM.
- **B.** A useful way to remember Intersection with regular is that it is not the same as “CFL ∩ REG is always regular”.
- **C.** In this module, Intersection with regular is a core idea students must distinguish from nearby terms.
- **D.** Intersection with regular is correctly understood as: cFL ∩ REG is CFL (product of PDA with DFA).

**Answer:** A
**Explanation:** The false claim is: Intersecting a CFL with a DFA can require a TM.. Intersection with regular actually means: CFL ∩ REG is CFL (product of PDA with DFA).

### Q41  ·  Intermediate
**Question:** Which statement about **Non-closure under intersection** is FALSE?

- **A.** a^n b^n c^n is CFL.
- **B.** Non-closure under intersection is correctly understood as: cFL ∩ CFL need not be CFL (classic: a^n b^n c^n as intersection of two CFLs).
- **C.** In this module, Non-closure under intersection is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Non-closure under intersection is that it is not the same as “CFLs are closed under intersection”.

**Answer:** A
**Explanation:** The false claim is: a^n b^n c^n is CFL.. Non-closure under intersection actually means: CFL ∩ CFL need not be CFL (classic: a^n b^n c^n as intersection of two CFLs).

### Q42  ·  Intermediate
**Question:** Which statement about **Pumping lemma (CFL)** is FALSE?

- **A.** Pumping lemma (CFL) is correctly understood as: ∃p such that any z∈L, |z|≥p, splits uvxyz with |vxy|≤p, |vy|≥1, uv^i xy^i z ∈ L ∀i≥0.
- **B.** In this module, Pumping lemma (CFL) is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Pumping lemma (CFL) is that it is not the same as “A lemma that proves a language is CFL”.
- **D.** CFL pumping is sufficient for being context-free.

**Answer:** D
**Explanation:** The false claim is: CFL pumping is sufficient for being context-free.. Pumping lemma (CFL) actually means: ∃p such that any z∈L, |z|≥p, splits uvxyz with |vxy|≤p, |vy|≥1, uv^i xy^i z ∈ L ∀i≥0.

### Q43  ·  Intermediate
**Question:** Which statement about **Reachable symbol** is FALSE?

- **A.** Reachable symbol is correctly understood as: a symbol X for which S ⇒* αXβ for some α,β.
- **B.** Reachable means A⇒* ε.
- **C.** A useful way to remember Reachable symbol is that it is not the same as “A symbol never appearing in any sentential form”.
- **D.** In this module, Reachable symbol is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Reachable means A⇒* ε.. Reachable symbol actually means: A symbol X for which S ⇒* αXβ for some α,β.

### Q44  ·  Intermediate
**Question:** Which statement about **Useless symbol** is FALSE?

- **A.** In this module, Useless symbol is a core idea students must distinguish from nearby terms.
- **B.** Useless symbols are required in CNF.
- **C.** Useless symbol is correctly understood as: a variable that is not generating or not reachable from S (or both).
- **D.** A useful way to remember Useless symbol is that it is not the same as “A terminal that appears once”.

**Answer:** B
**Explanation:** The false claim is: Useless symbols are required in CNF.. Useless symbol actually means: A variable that is not generating or not reachable from S (or both).

### Q45  ·  Intermediate
**Question:** Which statement about **ε-production** is FALSE?

- **A.** ε-productions are the same as unit productions.
- **B.** A useful way to remember ε-production is that it is not the same as “A production A → a”.
- **C.** ε-production is correctly understood as: a production A → ε.
- **D.** In this module, ε-production is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: ε-productions are the same as unit productions.. ε-production actually means: A production A → ε.

### Q46  ·  Intermediate
**Question:** You need to show CFL is not closed under complement. A proof sketch is:

- **A.** CFLs are Boolean algebras
- **B.** PDAs always complement by swapping F
- **C.** If it were, intersection would follow by De Morgan with union, but intersection fails
- **D.** Complement of a^n b^n is regular

**Answer:** C
**Explanation:** Union closed + complement closed ⇒ intersection closed.

### Q47  ·  Intermediate
**Question:** a^n b^n c^n is not CFL because:

- **A.** It has an RE (abc)*
- **B.** CFL pumping (or Ogden) fails on a^p b^p c^p
- **C.** A DPDA accepts it
- **D.** It is regular

**Answer:** B
**Explanation:** Classic application of pumping.

### Q48  ·  Difficult
**Question:** After removing useless symbols, a grammar with S→A, A→a, B→b (B unreachable) has how many variables left if A is generating and reachable?

- **A.** 3 variables S,A,B
- **B.** 0
- **C.** 2 (S and A) plus terminal a
- **D.** Only B

**Answer:** C
**Explanation:** B is unreachable (and possibly still generating) hence useless; drop B.

### Q49  ·  Difficult
**Question:** CFG with productions S→AB, A→a, B→b already in CNF. |P| is:

- **A.** 3
- **B.** 5
- **C.** 2
- **D.** 1

**Answer:** A
**Explanation:** Three productions, all legal CNF.

### Q50  ·  Difficult
**Question:** CYK on a string of length 7 fills a triangular table with how many cells?

- **A.** 49
- **B.** 7
- **C.** 28
- **D.** 14

**Answer:** C
**Explanation:** n(n+1)/2 = 7·8/2 = 28.

### Q51  ·  Difficult
**Question:** If CFLs were closed under complement they would be closed under intersection because:

- **A.** De Morgan needs a DFA only
- **B.** De Morgan: L1∩L2 = complement(complement L1 ∪ complement L2) and union is CFL-closed
- **C.** Complement equals star
- **D.** Intersection is concatenation

**Answer:** B
**Explanation:** Boolean algebra argument.

### Q52  ·  Difficult
**Question:** If every production is A→BC or A→a, a string of length 4 has a CNF derivation of how many steps (productions used)?

- **A.** 8
- **B.** 7
- **C.** 3
- **D.** 4

**Answer:** B
**Explanation:** n terminal steps + (n−1) binary steps = 4+3=7.

### Q53  ·  Difficult
**Question:** In CNF, a parse tree for a string of length n (n≥1) has how many internal nodes that correspond to A→BC steps?

- **A.** n
- **B.** n−1
- **C.** 1
- **D.** 2n

**Answer:** B
**Explanation:** A binary branching tree with n leaves has n−1 binary nodes.

### Q54  ·  Difficult
**Question:** Intersect a CFL of well-formed HTML-like tags with a regular ‘at most 3 attributes’ filter. The result is:

- **A.** Still CFL (CFL ∩ REG)
- **B.** Always Σ*
- **C.** Always regular
- **D.** Possibly not CFL

**Answer:** A
**Explanation:** Product PDA×DFA.

### Q55  ·  Difficult
**Question:** L1={a^n b^n c^m}, L2={a^n b^m c^m}. |{a^k b^k c^k | k≥0}| as L1∩L2. Is that intersection a CFL?

- **A.** No
- **B.** Yes, it is regular
- **C.** Yes, it is DCFL
- **D.** Yes, it is finite

**Answer:** A
**Explanation:** Classic non-CFL intersection of two CFLs.

### Q56  ·  Difficult
**Question:** Pumping z=a^p b^p c^p, if vxy sits inside the b’s, i=0 yields:

- **A.** a^p b^{<p} c^p not in {a^n b^n c^n}
- **B.** A regular string only
- **C.** ε always
- **D.** Still a^p b^p c^p

**Answer:** A
**Explanation:** Deleting vy shortens only b’s.

### Q57  ·  Difficult
**Question:** Removing ε-productions: if A,B nullable and C→AB, you must add:

- **A.** C→a
- **B.** Only C→AB
- **C.** Only C→ε
- **D.** C→AB | A | B | ε (then drop C→ε unless C is start handling)

**Answer:** D
**Explanation:** All subsets of nullable symbols.

### Q58  ·  Difficult
**Question:** Student converts to CNF but leaves S→ABC. The fix is:

- **A.** Delete C
- **B.** Introduce a new variable, e.g. S→AD, D→BC
- **C.** Replace by S→a
- **D.** It is already CNF

**Answer:** B
**Explanation:** CNF binary branching only.

### Q59  ·  Difficult
**Question:** To prove {a^n b^n c^n | n≥0} not CFL, take z=a^p b^p c^p. |vxy|≤p so vxy cannot contain both a’s and c’s. Pumping i=2 changes at most two of the three counts, so the new length of a’s,b’s,c’s is not all equal. This uses pumping length:

- **A.** n only
- **B.** 3 always
- **C.** p (the lemma constant)
- **D.** |V| only, ignoring CNF height

**Answer:** C
**Explanation:** Standard CFL pumping attack.

### Q60  ·  Difficult
**Question:** To test if a^20 is in L(G) for a CNF grammar, a standard algorithm is:

- **A.** Banker’s algorithm
- **B.** CYK
- **C.** Dijkstra
- **D.** Subset construction

**Answer:** B
**Explanation:** CYK membership.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **CFL pumping** and **RL pumping**?

- **A.** CFL split has two pumpable parts v,y; RL has one y. Length conditions differ.
- **B.** CFL pumping uses three pieces xyz only.
- **C.** They are the same lemma.
- **D.** RL pumping uses uvxyz.

**Answer:** A
**Explanation:** CFL split has two pumpable parts v,y; RL has one y. Length conditions differ.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **CFL ∩ REG** and **CFL ∩ CFL**?

- **A.** First is CFL; second need not be.
- **B.** First is always regular.
- **C.** Both never CFL.
- **D.** Both always CFL.

**Answer:** A
**Explanation:** First is CFL; second need not be.

### Q63  ·  Difficult
**Question:** What is the most important distinction between **a^n b^n c^n** and **a^n b^n**?

- **A.** Both are regular.
- **B.** The first is CFL, the second is not.
- **C.** The first is not CFL (pumping); the second is CFL (and DCFL).
- **D.** Both are non-CFL.

**Answer:** C
**Explanation:** The first is not CFL (pumping); the second is CFL (and DCFL).

### Q64  ·  Difficult
**Question:** What is the most important distinction between **ε-production removal** and **unit-production removal**?

- **A.** Removing units introduces ε always.
- **B.** Nullable analysis vs A⇒*B chains; different substitutions.
- **C.** They are the same productions.
- **D.** Both are A→a.

**Answer:** B
**Explanation:** Nullable analysis vs A⇒*B chains; different substitutions.

### Q65  ·  Difficult
**Question:** Which statement about **CYK algorithm** is FALSE?

- **A.** CYK algorithm is correctly understood as: a DP membership test for CNF grammars in O(n^3 |P|) time.
- **B.** A useful way to remember CYK algorithm is that it is not the same as “A DFA minimisation”.
- **C.** CYK runs in linear time on CNF for all grammars.
- **D.** In this module, CYK algorithm is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: CYK runs in linear time on CNF for all grammars.. CYK algorithm actually means: A DP membership test for CNF grammars in O(n^3 |P|) time.

### Q66  ·  Difficult
**Question:** Which statement about **Closure of CFL under union** is FALSE?

- **A.** In this module, Closure of CFL under union is a core idea students must distinguish from nearby terms.
- **B.** Closure of CFL under union is correctly understood as: if L1, L2 are CFLs then L1∪L2 is CFL (new start S→S1|S2).
- **C.** A useful way to remember Closure of CFL under union is that it is not the same as “CFLs are not closed under union”.
- **D.** S→S1 S2 is the union construction.

**Answer:** D
**Explanation:** The false claim is: S→S1 S2 is the union construction.. Closure of CFL under union actually means: If L1, L2 are CFLs then L1∪L2 is CFL (new start S→S1|S2).

### Q67  ·  Difficult
**Question:** Which statement about **Closure under star** is FALSE?

- **A.** S→S1 S1 is Kleene star.
- **B.** A useful way to remember Closure under star is that it is not the same as “Star of a CFL may leave CFL”.
- **C.** Closure under star is correctly understood as: cFLs are closed under *: S→S1 S | ε.
- **D.** In this module, Closure under star is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: S→S1 S1 is Kleene star.. Closure under star actually means: CFLs are closed under *: S→S1 S | ε.

### Q68  ·  Difficult
**Question:** Which statement about **GNF** is FALSE?

- **A.** GNF is correctly understood as: greibach normal form: A → aα with a∈T and α∈V*.
- **B.** In this module, GNF is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember GNF is that it is not the same as “A → BC only”.
- **D.** GNF requires two terminals on every RHS.

**Answer:** D
**Explanation:** The false claim is: GNF requires two terminals on every RHS.. GNF actually means: Greibach normal form: A → aα with a∈T and α∈V*.

### Q69  ·  Difficult
**Question:** Which statement about **Generating symbol** is FALSE?

- **A.** A useful way to remember Generating symbol is that it is not the same as “A variable that never produces terminals”.
- **B.** A generating symbol cannot be reachable.
- **C.** Generating symbol is correctly understood as: a variable A such that A ⇒* w for some w∈T*.
- **D.** In this module, Generating symbol is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A generating symbol cannot be reachable.. Generating symbol actually means: A variable A such that A ⇒* w for some w∈T*.

### Q70  ·  Difficult
**Question:** Which statement about **Non-closure under complement** is FALSE?

- **A.** Non-closure under complement is correctly understood as: cFLs are not closed under complement (else they would be closed under intersection by De Morgan).
- **B.** In this module, Non-closure under complement is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Non-closure under complement is that it is not the same as “Complement of a CFL is always CFL”.
- **D.** De Morgan does not apply to CFL because union fails.

**Answer:** D
**Explanation:** The false claim is: De Morgan does not apply to CFL because union fails.. Non-closure under complement actually means: CFLs are not closed under complement (else they would be closed under intersection by De Morgan).

### Q71  ·  Difficult
**Question:** Which statement about **Nullable variable** is FALSE?

- **A.** Nullable variable is correctly understood as: a variable A with A ⇒* ε.
- **B.** In this module, Nullable variable is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Nullable variable is that it is not the same as “A terminal a”.
- **D.** Nullable variables are forbidden in every CFG.

**Answer:** D
**Explanation:** The false claim is: Nullable variables are forbidden in every CFG.. Nullable variable actually means: A variable A with A ⇒* ε.

### Q72  ·  Difficult
**Question:** Which statement about **Simplification order** is FALSE?

- **A.** You must introduce new useless symbols after CNF.
- **B.** In this module, Simplification order is a core idea students must distinguish from nearby terms.
- **C.** Simplification order is correctly understood as: typical order: useless (after generating/reachable) with care about ε, then ε-productions, then unit, then CNF.
- **D.** A useful way to remember Simplification order is that it is not the same as “CNF first, then add useless symbols”.

**Answer:** A
**Explanation:** The false claim is: You must introduce new useless symbols after CNF.. Simplification order actually means: Typical order: useless (after generating/reachable) with care about ε, then ε-productions, then unit, then CNF.

### Q73  ·  Difficult
**Question:** Which statement about **Unit production** is FALSE?

- **A.** A useful way to remember Unit production is that it is not the same as “A → a”.
- **B.** Unit productions are necessary in CNF.
- **C.** Unit production is correctly understood as: a production A → B with a single variable on the RHS.
- **D.** In this module, Unit production is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Unit productions are necessary in CNF.. Unit production actually means: A production A → B with a single variable on the RHS.

---

## Quick answer key

Q01–D | Q02–D | Q03–C | Q04–B | Q05–B | Q06–C | Q07–C | Q08–C | Q09–B | Q10–A | Q11–B | Q12–D | Q13–B | Q14–C | Q15–D | Q16–D | Q17–A | Q18–C | Q19–C | Q20–B | Q21–C | Q22–A | Q23–B | Q24–A | Q25–D | Q26–A | Q27–C | Q28–C | Q29–D | Q30–B | Q31–A | Q32–A | Q33–A | Q34–B | Q35–A | Q36–B | Q37–C | Q38–C | Q39–D | Q40–A | Q41–A | Q42–D | Q43–B | Q44–B | Q45–A | Q46–C | Q47–B | Q48–C | Q49–A | Q50–C | Q51–B | Q52–B | Q53–B | Q54–A | Q55–A | Q56–A | Q57–D | Q58–B | Q59–C | Q60–B | Q61–A | Q62–A | Q63–C | Q64–B | Q65–C | Q66–D | Q67–A | Q68–D | Q69–B | Q70–D | Q71–D | Q72–A | Q73–B
