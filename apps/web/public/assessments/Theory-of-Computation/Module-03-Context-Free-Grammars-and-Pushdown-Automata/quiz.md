# Quiz — Theory of Computation — Module 3: Context-Free Grammars and Pushdown Automata

**Subject:** Theory of Computation  
**Module:** Module 3 — Context-Free Grammars and Pushdown Automata  
**Questions:** 73  
**Mix:** 12 Easy · 35 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A context-free grammar is a:

- **A.** 5-tuple DFA
- **B.** 7-tuple TM
- **C.** 4-tuple (V, T, P, S)
- **D.** Regular expression

**Answer:** C
**Explanation:** Hopcroft/Ullman/Sipser CFG definition.

### Q02  ·  Easy
**Question:** A right-linear grammar generates:

- **A.** All CFLs
- **B.** A regular language
- **C.** Only {ε}
- **D.** {a^n b^n c^n}

**Answer:** B
**Explanation:** Regular grammars ≡ REG.

### Q03  ·  Easy
**Question:** Ambiguity of a CFG means:

- **A.** The language is not CFL
- **B.** The grammar has ε
- **C.** The PDA is deterministic
- **D.** Some string has two parse trees

**Answer:** D
**Explanation:** Definition via trees/leftmost derivations.

### Q04  ·  Easy
**Question:** PDAs add which memory to finite control?

- **A.** Nothing
- **B.** Two unbounded queues only
- **C.** A random-access array
- **D.** A stack

**Answer:** D
**Explanation:** Pushdown store.

### Q05  ·  Easy
**Question:** Which option best describes **Acceptance by final state**?

- **A.** Stack must be empty and state in F always in the definition of L(P).
- **B.** Only DFAs have final-state acceptance.
- **C.** PDA accepts w if some run on w ends in F, stack contents ignored (L(P)).
- **D.** Final-state PDAs cannot accept ε.

**Answer:** C
**Explanation:** Acceptance by final state: PDA accepts w if some run on w ends in F, stack contents ignored (L(P)).

### Q06  ·  Easy
**Question:** Which option best describes **CFG**?

- **A.** A 4-tuple (V, T, P, S) with productions A → α, α∈(V∪T)*.
- **B.** A regular expression only.
- **C.** A 5-tuple DFA.
- **D.** A TM 7-tuple.

**Answer:** A
**Explanation:** CFG: A 4-tuple (V, T, P, S) with productions A → α, α∈(V∪T)*.

### Q07  ·  Easy
**Question:** Which option best describes **DPDA**?

- **A.** A TM with one tape.
- **B.** A DFA with a stack that is never used.
- **C.** A PDA whose δ has at most one legal move for each (q,a/ε,X).
- **D.** An NFA.

**Answer:** C
**Explanation:** DPDA: A PDA whose δ has at most one legal move for each (q,a/ε,X).

### Q08  ·  Easy
**Question:** Which option best describes **Parse tree**?

- **A.** A TM ID sequence.
- **B.** A tree whose yield is the derived string and whose internal nodes are productions.
- **C.** A DFA state diagram.
- **D.** A product automaton.

**Answer:** B
**Explanation:** Parse tree: A tree whose yield is the derived string and whose internal nodes are productions.

### Q09  ·  Easy
**Question:** Which option best describes **Sentential form**?

- **A.** A DFA word.
- **B.** Only the start symbol forever.
- **C.** Any string in (V∪T)* derived from S.
- **D.** Only terminal strings.

**Answer:** C
**Explanation:** Sentential form: Any string in (V∪T)* derived from S.

### Q10  ·  Easy
**Question:** Which option best describes **Yield of a parse tree**?

- **A.** The start symbol only.
- **B.** The left-to-right concatenation of the frontier terminals.
- **C.** The set of variables.
- **D.** The stack alphabet.

**Answer:** B
**Explanation:** Yield of a parse tree: The left-to-right concatenation of the frontier terminals.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **PDA empty-stack ↔ final-state**?

- **A.** Apply pumping for RL
- **B.** Encode as a regular expression
- **C.** Swap F of a DFA
- **D.** Add a new bottom marker and a final-popping state (or vice versa) so N(P) and L(P') denote the same CFL class

**Answer:** D
**Explanation:** Correct sequence for PDA empty-stack ↔ final-state: Add a new bottom marker and a final-popping state (or vice versa) so N(P) and L(P') denote the same CFL class

### Q12  ·  Easy
**Question:** Which sequence correctly describes **leftmost derivation**?

- **A.** Run a DFA on variables
- **B.** Start from S → repeatedly replace the leftmost variable using a production until only terminals remain
- **C.** Rewrite the rightmost terminal
- **D.** Pump the start symbol

**Answer:** B
**Explanation:** Correct sequence for leftmost derivation: Start from S → repeatedly replace the leftmost variable using a production until only terminals remain

### Q13  ·  Intermediate
**Question:** A DPDA language is always:

- **A.** Exactly REG
- **B.** Exactly RE
- **C.** A CFL, but not necessarily every CFL
- **D.** A non-CFL

**Answer:** C
**Explanation:** DCFL ⊂ CFL (proper).

### Q14  ·  Intermediate
**Question:** A compiler parse of  id + id * id  with two trees is:

- **A.** A DFA minimisation bug
- **B.** Ambiguity (precedence not enforced)
- **C.** A TM loop
- **D.** Inherent RE ambiguity

**Answer:** B
**Explanation:** Two parse trees for one string: ambiguous grammar.

### Q15  ·  Intermediate
**Question:** A student uses empty-stack acceptance but never pops Z0. Then ε is:

- **A.** Not accepted by N(P) unless Z0 is popped
- **B.** Accepted iff q0∈F
- **C.** Always accepted
- **D.** A regular string

**Answer:** A
**Explanation:** N(P) needs empty stack.

### Q16  ·  Intermediate
**Question:** Every CFL is accepted by:

- **A.** Only a universal TM
- **B.** Some NPDA (empty stack or final state)
- **C.** Some DPDA
- **D.** Some DFA

**Answer:** B
**Explanation:** CFG↔NPDA equivalence.

### Q17  ·  Intermediate
**Question:** Expression grammar E→E+E|E*E|id is a teaching example of:

- **A.** A DPDA language that is regular
- **B.** A regular grammar
- **C.** GNF already
- **D.** Ambiguity (plus associativity/precedence)

**Answer:** D
**Explanation:** id+id*id has two trees.

### Q18  ·  Intermediate
**Question:** In a parse tree, the yield is:

- **A.** The stack alphabet
- **B.** The set P
- **C.** The left-to-right terminals on the frontier
- **D.** The start symbol repeated

**Answer:** C
**Explanation:** Yield = derived string.

### Q19  ·  Intermediate
**Question:** N(P)=L(P') for some constructions shows:

- **A.** CFGs equal REs
- **B.** PDAs equal DFAs
- **C.** DPDAs equal NPDAs
- **D.** Empty-stack and final-state PDAs define the same class CFL

**Answer:** D
**Explanation:** Two acceptance modes, one family.

### Q20  ·  Intermediate
**Question:** Palindromes over {0,1} without a centre marker are typically:

- **A.** Not CFL
- **B.** Recursive but not RE
- **C.** CFL but not DCFL
- **D.** Regular

**Answer:** C
**Explanation:** Need to guess the middle: NPDA.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **CFG** and **regular grammar**?

- **A.** CFGs cannot generate regular languages.
- **B.** CFGs allow A→α with arbitrary α; regular grammars restrict to tail/head linear form.
- **C.** Regular grammars generate all CFLs.
- **D.** They have the same productions.

**Answer:** B
**Explanation:** CFGs allow A→α with arbitrary α; regular grammars restrict to tail/head linear form.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **PDA** and **DFA**?

- **A.** A PDA has an unbounded stack; a DFA has finite memory only.
- **B.** A DFA is a PDA that must use an infinite stack.
- **C.** PDAs cannot recognise regular languages.
- **D.** DFAs recognise all CFLs.

**Answer:** A
**Explanation:** A PDA has an unbounded stack; a DFA has finite memory only.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **ambiguous grammar** and **inherently ambiguous language**?

- **A.** Unambiguous languages cannot have an ambiguous CFG.
- **B.** Ambiguous grammar ⇒ inherent ambiguity.
- **C.** A language may have both ambiguous and unambiguous grammars; inherent means every grammar is ambiguous.
- **D.** They are synonyms.

**Answer:** C
**Explanation:** A language may have both ambiguous and unambiguous grammars; inherent means every grammar is ambiguous.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **parse tree** and **derivation sequence**?

- **A.** Parse trees exist only for regular grammars.
- **B.** They are unrelated.
- **C.** A tree abstracts the order of independent rewrites; a derivation is a linear order.
- **D.** A derivation cannot be recovered from a tree.

**Answer:** C
**Explanation:** A tree abstracts the order of independent rewrites; a derivation is a linear order.

### Q25  ·  Intermediate
**Question:** Which option best describes **Acceptance by empty stack**?

- **A.** Empty-stack acceptance is only for TMs.
- **B.** PDA accepts w if some run on w ends with empty stack (N(P)).
- **C.** The stack must contain Z0 at the end.
- **D.** The PDA must also be in q0.

**Answer:** B
**Explanation:** Acceptance by empty stack: PDA accepts w if some run on w ends with empty stack (N(P)).

### Q26  ·  Intermediate
**Question:** Which option best describes **Ambiguous grammar**?

- **A.** A grammar with two start symbols only.
- **B.** A CFG that has some string with two different parse trees (equivalently two leftmost derivations).
- **C.** A grammar without ε.
- **D.** A regular grammar.

**Answer:** B
**Explanation:** Ambiguous grammar: A CFG that has some string with two different parse trees (equivalently two leftmost derivations).

### Q27  ·  Intermediate
**Question:** Which option best describes **CFG to PDA**?

- **A.** A PDA can guess leftmost derivations, pushing RHS and matching terminals.
- **B.** GNF is forbidden in the construction.
- **C.** The construction uses a DFA product only.
- **D.** Every CFG needs a TM, not a PDA.

**Answer:** A
**Explanation:** CFG to PDA: A PDA can guess leftmost derivations, pushing RHS and matching terminals.

### Q28  ·  Intermediate
**Question:** Which option best describes **DCFL**?

- **A.** Equal to recursive languages.
- **B.** Equal to all CFLs.
- **C.** Equal to REG.
- **D.** Languages accepted by deterministic PDAs (final-state model); a proper subset of CFL.

**Answer:** D
**Explanation:** DCFL: Languages accepted by deterministic PDAs (final-state model); a proper subset of CFL.

### Q29  ·  Intermediate
**Question:** Which option best describes **Derivation**?

- **A.** An ε-closure.
- **B.** A homomorphism of tapes.
- **C.** A sequence of replacements of variables by right-hand sides, written ⇒.
- **D.** A DFA transition on one symbol.

**Answer:** C
**Explanation:** Derivation: A sequence of replacements of variables by right-hand sides, written ⇒.

### Q30  ·  Intermediate
**Question:** Which option best describes **Inherent ambiguity**?

- **A.** A CFL whose every CFG is ambiguous.
- **B.** A TM that loops.
- **C.** A DFA with two final states.
- **D.** A language with two REs.

**Answer:** A
**Explanation:** Inherent ambiguity: A CFL whose every CFG is ambiguous.

### Q31  ·  Intermediate
**Question:** Which option best describes **Instantaneous description of a PDA**?

- **A.** A RE.
- **B.** Only the current DFA state.
- **C.** A triple (q, remaining input, stack string).
- **D.** A parse tree.

**Answer:** C
**Explanation:** Instantaneous description of a PDA: A triple (q, remaining input, stack string).

### Q32  ·  Intermediate
**Question:** Which option best describes **Leftmost derivation**?

- **A.** A derivation that always rewrites the leftmost variable.
- **B.** A stack pop only.
- **C.** A right-to-left TM scan.
- **D.** A derivation that rewrites all variables at once.

**Answer:** A
**Explanation:** Leftmost derivation: A derivation that always rewrites the leftmost variable.

### Q33  ·  Intermediate
**Question:** Which option best describes **Match a terminal in a PDA-from-CFG**?

- **A.** When top of stack is terminal a and input is a, pop a and consume a.
- **B.** Push a second a.
- **C.** Ignore the input.
- **D.** Halt as a TM.

**Answer:** A
**Explanation:** Match a terminal in a PDA-from-CFG: When top of stack is terminal a and input is a, pop a and consume a.

### Q34  ·  Intermediate
**Question:** Which option best describes **PDA to CFG**?

- **A.** Only DPDAs convert to CFGs.
- **B.** The construction yields a regular expression.
- **C.** PDAs generate regular languages only.
- **D.** From a PDA one can build a CFG whose variables are triples [pXq] recording stack-symbol net pops.

**Answer:** D
**Explanation:** PDA to CFG: From a PDA one can build a CFG whose variables are triples [pXq] recording stack-symbol net pops.

### Q35  ·  Intermediate
**Question:** Which option best describes **PDA**?

- **A.** A finite control plus a stack; 6-tuple (Q, Σ, Γ, δ, q0, Z0) with optional F.
- **B.** An NFA with no stack.
- **C.** A TM without a tape.
- **D.** A DFA with two tapes.

**Answer:** A
**Explanation:** PDA: A finite control plus a stack; 6-tuple (Q, Σ, Γ, δ, q0, Z0) with optional F.

### Q36  ·  Intermediate
**Question:** Which option best describes **Right-linear grammar**?

- **A.** An unrestricted grammar.
- **B.** A CFG with productions A→wB or A→w, generating exactly the regular languages.
- **C.** A grammar for {a^n b^n}.
- **D.** A non-contracting CSG.

**Answer:** B
**Explanation:** Right-linear grammar: A CFG with productions A→wB or A→w, generating exactly the regular languages.

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **CFG → NPDA (empty stack)**?

- **A.** Build a product DFA
- **B.** Start with S on the stack → if top is variable, replace by RHS (nondeterministically, reversed) → if top is terminal, match input → accept when stack empty and input consumed
- **C.** Convert to a TM first
- **D.** Minimise the grammar to a RE

**Answer:** B
**Explanation:** Correct sequence for CFG → NPDA (empty stack): Start with S on the stack → if top is variable, replace by RHS (nondeterministically, reversed) → if top is terminal, match input → accept when stack empty and input consumed

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **building a parse tree from a derivation**?

- **A.** Each production becomes a parent with RHS children in order; yield is the terminal frontier
- **B.** ε-closures label the leaves
- **C.** Each DFA edge is a tree node
- **D.** Stack pops become terminals in reverse always

**Answer:** A
**Explanation:** Correct sequence for building a parse tree from a derivation: Each production becomes a parent with RHS children in order; yield is the terminal frontier

### Q39  ·  Intermediate
**Question:** Which statement about **Acceptance by empty stack** is FALSE?

- **A.** Acceptance by empty stack is correctly understood as: pDA accepts w if some run on w ends with empty stack (N(P)).
- **B.** In this module, Acceptance by empty stack is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Acceptance by empty stack is that it is not the same as “The PDA must also be in q0”.
- **D.** Empty stack at the end rejects by definition.

**Answer:** D
**Explanation:** The false claim is: Empty stack at the end rejects by definition.. Acceptance by empty stack actually means: PDA accepts w if some run on w ends with empty stack (N(P)).

### Q40  ·  Intermediate
**Question:** Which statement about **Ambiguous grammar** is FALSE?

- **A.** Every ambiguous grammar generates a non-CFL.
- **B.** A useful way to remember Ambiguous grammar is that it is not the same as “A grammar with two start symbols only”.
- **C.** Ambiguous grammar is correctly understood as: a CFG that has some string with two different parse trees (equivalently two leftmost derivations).
- **D.** In this module, Ambiguous grammar is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Every ambiguous grammar generates a non-CFL.. Ambiguous grammar actually means: A CFG that has some string with two different parse trees (equivalently two leftmost derivations).

### Q41  ·  Intermediate
**Question:** Which statement about **CFG to PDA** is FALSE?

- **A.** CFG to PDA is correctly understood as: a PDA can guess leftmost derivations, pushing RHS and matching terminals.
- **B.** In this module, CFG to PDA is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember CFG to PDA is that it is not the same as “Every CFG needs a TM, not a PDA”.
- **D.** CFGs are strictly more powerful than PDAs.

**Answer:** D
**Explanation:** The false claim is: CFGs are strictly more powerful than PDAs.. CFG to PDA actually means: A PDA can guess leftmost derivations, pushing RHS and matching terminals.

### Q42  ·  Intermediate
**Question:** Which statement about **CFG** is FALSE?

- **A.** In this module, CFG is a core idea students must distinguish from nearby terms.
- **B.** CFG productions must be A → aB (right-linear only).
- **C.** CFG is correctly understood as: a 4-tuple (V, T, P, S) with productions A → α, α∈(V∪T)*.
- **D.** A useful way to remember CFG is that it is not the same as “A 5-tuple DFA”.

**Answer:** B
**Explanation:** The false claim is: CFG productions must be A → aB (right-linear only).. CFG actually means: A 4-tuple (V, T, P, S) with productions A → α, α∈(V∪T)*.

### Q43  ·  Intermediate
**Question:** Which statement about **DPDA** is FALSE?

- **A.** Every CFL has a DPDA.
- **B.** DPDA is correctly understood as: a PDA whose δ has at most one legal move for each (q,a/ε,X).
- **C.** In this module, DPDA is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember DPDA is that it is not the same as “A DFA with a stack that is never used”.

**Answer:** A
**Explanation:** The false claim is: Every CFL has a DPDA.. DPDA actually means: A PDA whose δ has at most one legal move for each (q,a/ε,X).

### Q44  ·  Intermediate
**Question:** Which statement about **Instantaneous description of a PDA** is FALSE?

- **A.** IDs of a PDA ignore the stack.
- **B.** A useful way to remember Instantaneous description of a PDA is that it is not the same as “Only the current DFA state”.
- **C.** In this module, Instantaneous description of a PDA is a core idea students must distinguish from nearby terms.
- **D.** Instantaneous description of a PDA is correctly understood as: a triple (q, remaining input, stack string).

**Answer:** A
**Explanation:** The false claim is: IDs of a PDA ignore the stack.. Instantaneous description of a PDA actually means: A triple (q, remaining input, stack string).

### Q45  ·  Intermediate
**Question:** Which statement about **Leftmost derivation** is FALSE?

- **A.** Leftmost derivation is correctly understood as: a derivation that always rewrites the leftmost variable.
- **B.** Leftmost and rightmost derivations always look identical as sequences.
- **C.** A useful way to remember Leftmost derivation is that it is not the same as “A derivation that rewrites all variables at once”.
- **D.** In this module, Leftmost derivation is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Leftmost and rightmost derivations always look identical as sequences.. Leftmost derivation actually means: A derivation that always rewrites the leftmost variable.

### Q46  ·  Intermediate
**Question:** Which statement about **Right-linear grammar** is FALSE?

- **A.** In this module, Right-linear grammar is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Right-linear grammar is that it is not the same as “A grammar for {a^n b^n}”.
- **C.** Right-linear grammars can generate {ww}.
- **D.** Right-linear grammar is correctly understood as: a CFG with productions A→wB or A→w, generating exactly the regular languages.

**Answer:** C
**Explanation:** The false claim is: Right-linear grammars can generate {ww}.. Right-linear grammar actually means: A CFG with productions A→wB or A→w, generating exactly the regular languages.

### Q47  ·  Intermediate
**Question:** Which statement about **Yield of a parse tree** is FALSE?

- **A.** Yield of a parse tree is correctly understood as: the left-to-right concatenation of the frontier terminals.
- **B.** A useful way to remember Yield of a parse tree is that it is not the same as “The set of variables”.
- **C.** Yield ignores left-to-right order.
- **D.** In this module, Yield of a parse tree is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Yield ignores left-to-right order.. Yield of a parse tree actually means: The left-to-right concatenation of the frontier terminals.

### Q48  ·  Difficult
**Question:** A DPDA cannot generally convert to an equivalent DFA. For L={a^n b^n | n≥0}, a DFA would need how many states?

- **A.** 2
- **B.** 3
- **C.** Infinitely many (not a DFA language)
- **D.** n

**Answer:** C
**Explanation:** Non-regular CFL: no finite DFA exists.

### Q49  ·  Difficult
**Question:** A PDA stack alphabet has 3 symbols and |Q|=4. A single move is determined by (q, input/ε, top). This is a count of possible contexts, not languages. How many (q, top) pairs exist?

- **A.** 12
- **B.** 7
- **C.** 3
- **D.** 4

**Answer:** A
**Explanation:** 4 states × 3 stack symbols = 12.

### Q50  ·  Difficult
**Question:** CFG S → SS | (S) | ε (balanced parentheses). Number of strings with exactly 2 pairs of parentheses (Catalan C_2)?

- **A.** 4
- **B.** 1
- **C.** 2
- **D.** 5

**Answer:** C
**Explanation:** C_2=2: ()() and (()).

### Q51  ·  Difficult
**Question:** CFG S → aSb | ε. How many terminal strings of length 4 are in L(G)?

- **A.** 2
- **B.** 1
- **C.** 8
- **D.** 4

**Answer:** B
**Explanation:** Only aabb (n=2). Length 4 forces n=2, one string.

### Q52  ·  Difficult
**Question:** CFG→PDA simulation reads a terminal when:

- **A.** A TM writes a blank
- **B.** The stack top is that terminal
- **C.** The state is a DFA sink
- **D.** The stack is empty always

**Answer:** B
**Explanation:** Match and pop terminals; expand variables.

### Q53  ·  Difficult
**Question:** From CFG to PDA, a production A → XYZ pushes how many symbols (in reverse) when A is replaced?

- **A.** 3
- **B.** 1
- **C.** 0
- **D.** 6

**Answer:** A
**Explanation:** Pop A, push Z then Y then X so X is on top for leftmost simulation.

### Q54  ·  Difficult
**Question:** Right-linear grammar with variables {S,A} and terminals {0,1}. Maximum RHS variable count per production in a regular grammar is:

- **A.** 2
- **B.** unbounded
- **C.** 1
- **D.** 0 always

**Answer:** C
**Explanation:** A→wB or A→w: at most one variable, at the end.

### Q55  ·  Difficult
**Question:** S → aB | bA, A → a | aS | bAA, B → b | bS | aBB (classic ambiguous grammar for equal a,b). The string aabb has how many leftmost derivations in the famous textbook example? (typical count)

- **A.** 4
- **B.** 2
- **C.** 0
- **D.** 1

**Answer:** B
**Explanation:** Classic grammar for equal number of a’s and b’s is ambiguous; aabb has two leftmost derivations.

### Q56  ·  Difficult
**Question:** The grammar S→SS|(S)|ε is:

- **A.** Right-linear
- **B.** Unambiguous regular
- **C.** Not context-free
- **D.** Ambiguous (and generates Dyck/parentheses)

**Answer:** D
**Explanation:** Multiple associations of concatenation of balanced strings.

### Q57  ·  Difficult
**Question:** To recognise {a^n b^n | n≥0} at runtime you should use a:

- **A.** Regular grammar only
- **B.** PDA (push a’s, pop on b’s)
- **C.** RE (a+b)*
- **D.** DFA with 2 states

**Answer:** B
**Explanation:** Classic DCFL needing a stack.

### Q58  ·  Difficult
**Question:** To show two parse trees, it is enough to exhibit:

- **A.** Two different leftmost derivations
- **B.** Two DFA start states
- **C.** A pumping length
- **D.** Two REs

**Answer:** A
**Explanation:** Different leftmost derivations ⇔ different trees.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **DPDA** and **NPDA**?

- **A.** Nondeterministic PDAs accept all CFLs; DPDAs miss some CFLs (e.g. palindromes ww^R).
- **B.** They are equivalent like NFA/DFA.
- **C.** NPDAs accept only REG.
- **D.** DPDAs accept every CFL.

**Answer:** A
**Explanation:** Nondeterministic PDAs accept all CFLs; DPDAs miss some CFLs (e.g. palindromes ww^R).

### Q60  ·  Difficult
**Question:** What is the most important distinction between **empty-stack acceptance** and **final-state acceptance**?

- **A.** They define the same CFL family (with constructions), but a given PDA’s N(P) and L(P) may differ.
- **B.** Empty stack is only for DFA.
- **C.** They always give identical languages for the same PDA.
- **D.** Final-state PDAs are TMs.

**Answer:** A
**Explanation:** They define the same CFL family (with constructions), but a given PDA’s N(P) and L(P) may differ.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **leftmost derivation** and **rightmost derivation**?

- **A.** Rightmost needs a TM.
- **B.** They rewrite different variables first; both can correspond to the same or different trees.
- **C.** They always yield different strings.
- **D.** Only leftmost is legal in a CFG.

**Answer:** B
**Explanation:** They rewrite different variables first; both can correspond to the same or different trees.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **{a^n b^n}** and **{ww^R}**?

- **A.** Neither is CFL.
- **B.** {ww^R} is DCFL but {a^n b^n} is not.
- **C.** Both are CFLs; the first is DCFL, the second typically not DCFL.
- **D.** Both are regular.

**Answer:** C
**Explanation:** Both are CFLs; the first is DCFL, the second typically not DCFL.

### Q63  ·  Difficult
**Question:** Which statement about **Acceptance by final state** is FALSE?

- **A.** In this module, Acceptance by final state is a core idea students must distinguish from nearby terms.
- **B.** Acceptance by final state is correctly understood as: pDA accepts w if some run on w ends in F, stack contents ignored (L(P)).
- **C.** A useful way to remember Acceptance by final state is that it is not the same as “Stack must be empty and state in F always in the definition of L(P)”.
- **D.** L(P) requires the stack to spell w.

**Answer:** D
**Explanation:** The false claim is: L(P) requires the stack to spell w.. Acceptance by final state actually means: PDA accepts w if some run on w ends in F, stack contents ignored (L(P)).

### Q64  ·  Difficult
**Question:** Which statement about **DCFL** is FALSE?

- **A.** DCFL is correctly understood as: languages accepted by deterministic PDAs (final-state model); a proper subset of CFL.
- **B.** In this module, DCFL is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember DCFL is that it is not the same as “Equal to all CFLs”.
- **D.** DCFLs are closed under complement and under union.

**Answer:** D
**Explanation:** The false claim is: DCFLs are closed under complement and under union.. DCFL actually means: Languages accepted by deterministic PDAs (final-state model); a proper subset of CFL.

### Q65  ·  Difficult
**Question:** Which statement about **Derivation** is FALSE?

- **A.** A useful way to remember Derivation is that it is not the same as “A DFA transition on one symbol”.
- **B.** A derivation may replace terminals.
- **C.** Derivation is correctly understood as: a sequence of replacements of variables by right-hand sides, written ⇒.
- **D.** In this module, Derivation is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A derivation may replace terminals.. Derivation actually means: A sequence of replacements of variables by right-hand sides, written ⇒.

### Q66  ·  Difficult
**Question:** Which statement about **Inherent ambiguity** is FALSE?

- **A.** A useful way to remember Inherent ambiguity is that it is not the same as “A DFA with two final states”.
- **B.** If one CFG is ambiguous, the language is inherently ambiguous.
- **C.** Inherent ambiguity is correctly understood as: a CFL whose every CFG is ambiguous.
- **D.** In this module, Inherent ambiguity is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: If one CFG is ambiguous, the language is inherently ambiguous.. Inherent ambiguity actually means: A CFL whose every CFG is ambiguous.

### Q67  ·  Difficult
**Question:** Which statement about **Match a terminal in a PDA-from-CFG** is FALSE?

- **A.** The PDA from a CFG never reads input symbols.
- **B.** In this module, Match a terminal in a PDA-from-CFG is a core idea students must distinguish from nearby terms.
- **C.** Match a terminal in a PDA-from-CFG is correctly understood as: when top of stack is terminal a and input is a, pop a and consume a.
- **D.** A useful way to remember Match a terminal in a PDA-from-CFG is that it is not the same as “Push a second a”.

**Answer:** A
**Explanation:** The false claim is: The PDA from a CFG never reads input symbols.. Match a terminal in a PDA-from-CFG actually means: When top of stack is terminal a and input is a, pop a and consume a.

### Q68  ·  Difficult
**Question:** Which statement about **PDA to CFG** is FALSE?

- **A.** Some PDAs accept non-CFLs.
- **B.** A useful way to remember PDA to CFG is that it is not the same as “PDAs generate regular languages only”.
- **C.** PDA to CFG is correctly understood as: from a PDA one can build a CFG whose variables are triples [pXq] recording stack-symbol net pops.
- **D.** In this module, PDA to CFG is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Some PDAs accept non-CFLs.. PDA to CFG actually means: From a PDA one can build a CFG whose variables are triples [pXq] recording stack-symbol net pops.

### Q69  ·  Difficult
**Question:** Which statement about **PDA** is FALSE?

- **A.** PDA is correctly understood as: a finite control plus a stack; 6-tuple (Q, Σ, Γ, δ, q0, Z0) with optional F.
- **B.** In this module, PDA is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember PDA is that it is not the same as “A DFA with two tapes”.
- **D.** A PDA’s stack is finite-bounded like a DFA state.

**Answer:** D
**Explanation:** The false claim is: A PDA’s stack is finite-bounded like a DFA state.. PDA actually means: A finite control plus a stack; 6-tuple (Q, Σ, Γ, δ, q0, Z0) with optional F.

### Q70  ·  Difficult
**Question:** Which statement about **Parse tree** is FALSE?

- **A.** Parse tree is correctly understood as: a tree whose yield is the derived string and whose internal nodes are productions.
- **B.** In this module, Parse tree is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Parse tree is that it is not the same as “A DFA state diagram”.
- **D.** A parse tree’s yield can include unexpanded variables as terminals.

**Answer:** D
**Explanation:** The false claim is: A parse tree’s yield can include unexpanded variables as terminals.. Parse tree actually means: A tree whose yield is the derived string and whose internal nodes are productions.

### Q71  ·  Difficult
**Question:** Which statement about **Sentential form** is FALSE?

- **A.** Sentential form is correctly understood as: any string in (V∪T)* derived from S.
- **B.** A useful way to remember Sentential form is that it is not the same as “Only terminal strings”.
- **C.** Sentential forms cannot contain variables.
- **D.** In this module, Sentential form is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Sentential forms cannot contain variables.. Sentential form actually means: Any string in (V∪T)* derived from S.

### Q72  ·  Difficult
**Question:** Why is {ww^R} not a DCFL in the usual sense?

- **A.** A DPDA cannot push
- **B.** The machine must guess the middle; a DPDA cannot look ahead for the turn
- **C.** It is regular
- **D.** It is not context-free

**Answer:** B
**Explanation:** Without a centre marker, the turn is nondeterministic.

### Q73  ·  Difficult
**Question:** {wcw^R | w∈{a,b}*} with centre c is:

- **A.** DCFL (deterministic palindrome)
- **B.** CSL only, not CFL
- **C.** Regular
- **D.** Not CFL

**Answer:** A
**Explanation:** c tells the DPDA when to start popping.

---

## Quick answer key

Q01–C | Q02–B | Q03–D | Q04–D | Q05–C | Q06–A | Q07–C | Q08–B | Q09–C | Q10–B | Q11–D | Q12–B | Q13–C | Q14–B | Q15–A | Q16–B | Q17–D | Q18–C | Q19–D | Q20–C | Q21–B | Q22–A | Q23–C | Q24–C | Q25–B | Q26–B | Q27–A | Q28–D | Q29–C | Q30–A | Q31–C | Q32–A | Q33–A | Q34–D | Q35–A | Q36–B | Q37–B | Q38–A | Q39–D | Q40–A | Q41–D | Q42–B | Q43–A | Q44–A | Q45–B | Q46–C | Q47–C | Q48–C | Q49–A | Q50–C | Q51–B | Q52–B | Q53–A | Q54–C | Q55–B | Q56–D | Q57–B | Q58–A | Q59–A | Q60–A | Q61–B | Q62–C | Q63–D | Q64–D | Q65–B | Q66–B | Q67–A | Q68–A | Q69–D | Q70–D | Q71–C | Q72–B | Q73–A
