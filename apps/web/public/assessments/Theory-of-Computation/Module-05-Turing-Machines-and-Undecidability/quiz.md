# Quiz — Theory of Computation — Module 5: Turing Machines and Undecidability

**Subject:** Theory of Computation  
**Module:** Module 5 — Turing Machines and Undecidability  
**Questions:** 73  
**Mix:** 12 Easy · 35 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A standard TM has:

- **A.** Only a stack
- **B.** A finite input that cannot be rewritten
- **C.** A finite control and an infinite read/write tape
- **D.** A regex

**Answer:** C
**Explanation:** Turing’s model.

### Q02  ·  Easy
**Question:** A universal TM’s input is typically:

- **A.** A parse tree
- **B.** An encoding ⟨M, w⟩
- **C.** A DFA product
- **D.** A CNF table

**Answer:** B
**Explanation:** Interpreter of TMs.

### Q03  ·  Easy
**Question:** An instantaneous description records:

- **A.** Only F
- **B.** Only a parse tree
- **C.** Only Γ
- **D.** Tape contents, head position and state

**Answer:** D
**Explanation:** αqβ notation.

### Q04  ·  Easy
**Question:** Recursive languages are those:

- **A.** Exactly {a^n b^n c^n}
- **B.** Exactly the CFLs
- **C.** Recognised with possible loops on no
- **D.** Decided by a TM that always halts

**Answer:** D
**Explanation:** Decidable = recursive.

### Q05  ·  Easy
**Question:** Which option best describes **Chomsky type-0**?

- **A.** CSGs only.
- **B.** CFGs.
- **C.** Unrestricted grammars; they generate the RE languages.
- **D.** Regular grammars.

**Answer:** C
**Explanation:** Chomsky type-0: Unrestricted grammars; they generate the RE languages.

### Q06  ·  Easy
**Question:** Which option best describes **Decidable problem**?

- **A.** Any CFL membership question that uses a TM loop.
- **B.** A problem a TM recognises but may loop.
- **C.** A yes/no question whose yes-set is recursive (algorithm always halts with the answer).
- **D.** HALT.

**Answer:** C
**Explanation:** Decidable problem: A yes/no question whose yes-set is recursive (algorithm always halts with the answer).

### Q07  ·  Easy
**Question:** Which option best describes **Multitape TM**?

- **A.** A DFA with many tracks.
- **B.** A TM with several tapes/heads; it recognises the same languages as a 1-tape TM.
- **C.** A strictly more powerful class than 1-tape TMs.
- **D.** A PDA with many stacks that stays CFL.

**Answer:** B
**Explanation:** Multitape TM: A TM with several tapes/heads; it recognises the same languages as a 1-tape TM.

### Q08  ·  Easy
**Question:** Which option best describes **Recursive language**?

- **A.** Exactly REG.
- **B.** A language decided by a TM that always halts (decidable / computable set).
- **C.** A language recognised by a TM that may loop on no-instances.
- **D.** Exactly the CFLs.

**Answer:** B
**Explanation:** Recursive language: A language decided by a TM that always halts (decidable / computable set).

### Q09  ·  Easy
**Question:** Which option best describes **Reduction**?

- **A.** A DFA product.
- **B.** A CNF conversion.
- **C.** A computable map showing ‘if I could solve B I could solve A’; used to transfer undecidability.
- **D.** A stack homomorphism.

**Answer:** C
**Explanation:** Reduction: A computable map showing ‘if I could solve B I could solve A’; used to transfer undecidability.

### Q10  ·  Easy
**Question:** Which option best describes **Turing machine**?

- **A.** A 7-tuple (Q, Σ, Γ, δ, q0, B, F) with a two-way read/write infinite tape.
- **B.** A regex matcher.
- **C.** A DFA with a stack.
- **D.** A PDA that cannot write.

**Answer:** A
**Explanation:** Turing machine: A 7-tuple (Q, Σ, Γ, δ, q0, B, F) with a two-way read/write infinite tape.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **TM acceptance (recogniser)**?

- **A.** Parse with CYK first always
- **B.** Start ID q0 w → apply δ, rewriting the scanned cell and moving the head → if an accept state is entered, halt-accept; may loop otherwise
- **C.** Accept only by emptying a stack
- **D.** Minimise the tape alphabet then reject

**Answer:** B
**Explanation:** Correct sequence for TM acceptance (recogniser): Start ID q0 w → apply δ, rewriting the scanned cell and moving the head → if an accept state is entered, halt-accept; may loop otherwise

### Q12  ·  Easy
**Question:** Which sequence correctly describes **recognise A_TM (semi-decider)**?

- **A.** Convert M to a DFA
- **B.** Pump w
- **C.** Run M for n steps only, n=|Q|
- **D.** On ⟨M,w⟩, simulate M on w with a UTM; accept if that simulation accepts

**Answer:** D
**Explanation:** Correct sequence for recognise A_TM (semi-decider): On ⟨M,w⟩, simulate M on w with a UTM; accept if that simulation accepts

### Q13  ·  Intermediate
**Question:** A_TM is RE because:

- **A.** Pumping
- **B.** A UTM can simulate M on w and accept if M accepts
- **C.** CYK
- **D.** A DFA emptiness test

**Answer:** B
**Explanation:** Semi-decide by simulation.

### Q14  ·  Intermediate
**Question:** A_TM is not recursive because:

- **A.** It is finite
- **B.** UTMs cannot be encoded
- **C.** If it were decidable, a diagonal / classic proof yields contradiction (undecidable)
- **D.** It is regular

**Answer:** C
**Explanation:** Turing’s diagonalisation / reduction proofs.

### Q15  ·  Intermediate
**Question:** CSLs correspond (almost) to:

- **A.** REs
- **B.** Deterministic PDAs only
- **C.** Linear bounded automata
- **D.** DFAs

**Answer:** C
**Explanation:** Type-1 vs LBA.

### Q16  ·  Intermediate
**Question:** Emptiness of an arbitrary TM (does L(M)=∅?) is:

- **A.** Undecidable (Rice / reduction from A_TM)
- **B.** Regular
- **C.** Decidable by inspecting Q
- **D.** Linear-time in |Q|

**Answer:** A
**Explanation:** Nontrivial semantic property.

### Q17  ·  Intermediate
**Question:** Membership of a CFL is decidable because:

- **A.** PDAs may loop on all no-instances without bound in a way that forbids CYK
- **B.** You must solve HALT first
- **C.** Convert to CNF and run CYK (or parse with a TM that always halts)
- **D.** CFL membership is A_TM

**Answer:** C
**Explanation:** CYK is an algorithm.

### Q18  ·  Intermediate
**Question:** Rice’s theorem implies undecidable:

- **A.** CYK on a CNF grammar
- **B.** Whether the encoding has an even number of symbols (syntax)
- **C.** DFA minimisation
- **D.** Whether L(M) is empty / regular / Σ* (nontrivial semantic properties)

**Answer:** D
**Explanation:** Semantic properties of L(M).

### Q19  ·  Intermediate
**Question:** To prove ‘does this CFG generate Σ*?’ is undecidable, a typical course strategy is:

- **A.** Run CYK on all strings of length ≤10
- **B.** Reduce from a known undecidable problem (e.g. via computation histories / PCP-style ideas)
- **C.** Pump a regular language
- **D.** Minimise a DFA

**Answer:** B
**Explanation:** All-strings-from-CFG is a classic undecidable CFG problem.

### Q20  ·  Intermediate
**Question:** To show L is RE but not recursive, a standard example is:

- **A.** (0+1)*
- **B.** Any DFA language
- **C.** a^n b^n
- **D.** A_TM (or HALT)

**Answer:** D
**Explanation:** A_TM is RE (simulate) but undecidable.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **DTM** and **NTM**?

- **A.** DTMs cannot simulate NTMs even slowly.
- **B.** NTM languages are not RE.
- **C.** Same recognisable languages (RE); nondeterminism can change time, not RE vs RE.
- **D.** NTMs recognise {ww} only.

**Answer:** C
**Explanation:** Same recognisable languages (RE); nondeterminism can change time, not RE vs RE.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **HALT / A_TM** and **DFA emptiness**?

- **A.** A_TM is undecidable; DFA emptiness is decidable.
- **B.** DFA emptiness is RE-complete.
- **C.** Both decidable.
- **D.** Both undecidable.

**Answer:** A
**Explanation:** A_TM is undecidable; DFA emptiness is decidable.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **UTM** and **specific TM for {a^n b^n}**?

- **A.** Specific TMs are more general.
- **B.** A UTM is a DFA.
- **C.** A UTM simulates any machine; a^n b^n needs only a PDA/TM for one language.
- **D.** UTMs cannot simulate PDAs.

**Answer:** C
**Explanation:** A UTM simulates any machine; a^n b^n needs only a PDA/TM for one language.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **recursive** and **RE**?

- **A.** RE is a subset of regular.
- **B.** Recursive: always-halting decider. RE: recogniser that may loop on no.
- **C.** They are the same class.
- **D.** Recursive languages may loop.

**Answer:** B
**Explanation:** Recursive: always-halting decider. RE: recogniser that may loop on no.

### Q25  ·  Intermediate
**Question:** Which option best describes **Accepting computation**?

- **A.** A RE derivative.
- **B.** A finite sequence of IDs from the start ID to an accepting halt ID.
- **C.** An infinite loop.
- **D.** A parse tree of a DFA.

**Answer:** B
**Explanation:** Accepting computation: A finite sequence of IDs from the start ID to an accepting halt ID.

### Q26  ·  Intermediate
**Question:** Which option best describes **Church–Turing thesis**?

- **A.** A PDA normal form.
- **B.** A pumping lemma.
- **C.** A theorem that HALT is decidable.
- **D.** Informal claim: every effective procedure is realisable by a TM.

**Answer:** D
**Explanation:** Church–Turing thesis: Informal claim: every effective procedure is realisable by a TM.

### Q27  ·  Intermediate
**Question:** Which option best describes **Encoding ⟨M,w⟩**?

- **A.** A string that pairs a TM’s description with an input so a UTM can read it.
- **B.** A parse tree.
- **C.** A PDA stack.
- **D.** A CNF table.

**Answer:** A
**Explanation:** Encoding ⟨M,w⟩: A string that pairs a TM’s description with an input so a UTM can read it.

### Q28  ·  Intermediate
**Question:** Which option best describes **Enumerator**?

- **A.** A DPDA minimiser.
- **B.** A DFA complementor.
- **C.** A CNF converter.
- **D.** A TM that outputs all strings of an RE language (possibly with repeats, in some order).

**Answer:** D
**Explanation:** Enumerator: A TM that outputs all strings of an RE language (possibly with repeats, in some order).

### Q29  ·  Intermediate
**Question:** Which option best describes **Halt**?

- **A.** The TM enters a designated halt/accept (or reject) state and stops.
- **B.** Only PDAs halt.
- **C.** Halting is undefined for TMs.
- **D.** The TM must loop to accept.

**Answer:** A
**Explanation:** Halt: The TM enters a designated halt/accept (or reject) state and stops.

### Q30  ·  Intermediate
**Question:** Which option best describes **Halting problem**?

- **A.** A CYK table fill.
- **B.** A_TM / HALT: given ⟨M, w⟩, does M halt (or accept) on w? Undecidable.
- **C.** A regular pumping instance.
- **D.** A polynomial DFA problem.

**Answer:** B
**Explanation:** Halting problem: A_TM / HALT: given ⟨M, w⟩, does M halt (or accept) on w? Undecidable.

### Q31  ·  Intermediate
**Question:** Which option best describes **Instantaneous description (ID)**?

- **A.** A regular expression.
- **B.** A parse tree.
- **C.** A string αqβ showing tape left of the head, state, and head-right including the scanned symbol.
- **D.** Only the finite-control state.

**Answer:** C
**Explanation:** Instantaneous description (ID): A string αqβ showing tape left of the head, state, and head-right including the scanned symbol.

### Q32  ·  Intermediate
**Question:** Which option best describes **Linear bounded automaton**?

- **A.** A regex.
- **B.** A DFA.
- **C.** A TM restricted to the input portion of the tape (plus a constant); model for CSLs.
- **D.** A 2-stack PDA equal to a TM.

**Answer:** C
**Explanation:** Linear bounded automaton: A TM restricted to the input portion of the tape (plus a constant); model for CSLs.

### Q33  ·  Intermediate
**Question:** Which option best describes **Nondeterministic TM**?

- **A.** A model that recognises CSLs only.
- **B.** A TM whose δ returns a set of possible actions; language class equals deterministic TMs (RE).
- **C.** A PDA.
- **D.** Strictly more languages than a DTM.

**Answer:** B
**Explanation:** Nondeterministic TM: A TM whose δ returns a set of possible actions; language class equals deterministic TMs (RE).

### Q34  ·  Intermediate
**Question:** Which option best describes **RE language**?

- **A.** A language recognised by a TM (accepts yes-instances; may loop on no).
- **B.** Exactly DCFL.
- **C.** Exactly the regular languages.
- **D.** A language with a total always-halting decider only.

**Answer:** A
**Explanation:** RE language: A language recognised by a TM (accepts yes-instances; may loop on no).

### Q35  ·  Intermediate
**Question:** Which option best describes **Rice’s theorem (intuition)**?

- **A.** Any nontrivial semantic property of RE languages is undecidable.
- **B.** DFA emptiness is undecidable.
- **C.** Syntax of a TM encoding is undecidable.
- **D.** Every property of TMs is decidable.

**Answer:** A
**Explanation:** Rice’s theorem (intuition): Any nontrivial semantic property of RE languages is undecidable.

### Q36  ·  Intermediate
**Question:** Which option best describes **Universal TM**?

- **A.** A TM that takes ⟨M, w⟩ and simulates M on w.
- **B.** A regex compiler.
- **C.** A DFA that stores all TMs.
- **D.** A minimised PDA.

**Answer:** A
**Explanation:** Universal TM: A TM that takes ⟨M, w⟩ and simulates M on w.

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **simulate multitape on one tape**?

- **A.** Push each tape on a PDA
- **B.** Store tapes as tracks / delimited regions → to simulate one move, scan all head positions, then update
- **C.** Reduce to a DFA
- **D.** Use pumping on IDs

**Answer:** B
**Explanation:** Correct sequence for simulate multitape on one tape: Store tapes as tracks / delimited regions → to simulate one move, scan all head positions, then update

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **undecidability via reduction**?

- **A.** Assume a decider for B → computably transform instances of A into instances of B → contradict known undecidability of A
- **B.** Apply Arden’s lemma to TMs
- **C.** Minimise both languages as DFAs
- **D.** Show A is regular

**Answer:** A
**Explanation:** Correct sequence for undecidability via reduction: Assume a decider for B → computably transform instances of A into instances of B → contradict known undecidability of A

### Q39  ·  Intermediate
**Question:** Which statement about **Accepting computation** is FALSE?

- **A.** In this module, Accepting computation is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Accepting computation is that it is not the same as “An infinite loop”.
- **C.** Acceptance requires looping forever.
- **D.** Accepting computation is correctly understood as: a finite sequence of IDs from the start ID to an accepting halt ID.

**Answer:** C
**Explanation:** The false claim is: Acceptance requires looping forever.. Accepting computation actually means: A finite sequence of IDs from the start ID to an accepting halt ID.

### Q40  ·  Intermediate
**Question:** Which statement about **Decidable problem** is FALSE?

- **A.** Decidable means RE but not recursive.
- **B.** Decidable problem is correctly understood as: a yes/no question whose yes-set is recursive (algorithm always halts with the answer).
- **C.** In this module, Decidable problem is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Decidable problem is that it is not the same as “A problem a TM recognises but may loop”.

**Answer:** A
**Explanation:** The false claim is: Decidable means RE but not recursive.. Decidable problem actually means: A yes/no question whose yes-set is recursive (algorithm always halts with the answer).

### Q41  ·  Intermediate
**Question:** Which statement about **Halt** is FALSE?

- **A.** Halt is correctly understood as: the TM enters a designated halt/accept (or reject) state and stops.
- **B.** A TM that loops still accepts by definition.
- **C.** A useful way to remember Halt is that it is not the same as “The TM must loop to accept”.
- **D.** In this module, Halt is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A TM that loops still accepts by definition.. Halt actually means: The TM enters a designated halt/accept (or reject) state and stops.

### Q42  ·  Intermediate
**Question:** Which statement about **Halting problem** is FALSE?

- **A.** Halting problem is correctly understood as: a_TM / HALT: given ⟨M, w⟩, does M halt (or accept) on w? Undecidable.
- **B.** In this module, Halting problem is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Halting problem is that it is not the same as “A polynomial DFA problem”.
- **D.** The halting problem is decidable by running M for |w| steps.

**Answer:** D
**Explanation:** The false claim is: The halting problem is decidable by running M for |w| steps.. Halting problem actually means: A_TM / HALT: given ⟨M, w⟩, does M halt (or accept) on w? Undecidable.

### Q43  ·  Intermediate
**Question:** Which statement about **Linear bounded automaton** is FALSE?

- **A.** LBAs decide the halting problem.
- **B.** A useful way to remember Linear bounded automaton is that it is not the same as “A DFA”.
- **C.** In this module, Linear bounded automaton is a core idea students must distinguish from nearby terms.
- **D.** Linear bounded automaton is correctly understood as: a TM restricted to the input portion of the tape (plus a constant); model for CSLs.

**Answer:** A
**Explanation:** The false claim is: LBAs decide the halting problem.. Linear bounded automaton actually means: A TM restricted to the input portion of the tape (plus a constant); model for CSLs.

### Q44  ·  Intermediate
**Question:** Which statement about **Nondeterministic TM** is FALSE?

- **A.** NTMs recognise languages no DTM can recognise.
- **B.** A useful way to remember Nondeterministic TM is that it is not the same as “A model that recognises CSLs only”.
- **C.** Nondeterministic TM is correctly understood as: a TM whose δ returns a set of possible actions; language class equals deterministic TMs (RE).
- **D.** In this module, Nondeterministic TM is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: NTMs recognise languages no DTM can recognise.. Nondeterministic TM actually means: A TM whose δ returns a set of possible actions; language class equals deterministic TMs (RE).

### Q45  ·  Intermediate
**Question:** Which statement about **Recursive language** is FALSE?

- **A.** Recursive language is correctly understood as: a language decided by a TM that always halts (decidable / computable set).
- **B.** A useful way to remember Recursive language is that it is not the same as “A language recognised by a TM that may loop on no-instances”.
- **C.** Recursive languages are not closed under complement.
- **D.** In this module, Recursive language is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Recursive languages are not closed under complement.. Recursive language actually means: A language decided by a TM that always halts (decidable / computable set).

### Q46  ·  Intermediate
**Question:** Which statement about **Rice’s theorem (intuition)** is FALSE?

- **A.** Rice’s theorem (intuition) is correctly understood as: any nontrivial semantic property of RE languages is undecidable.
- **B.** In this module, Rice’s theorem (intuition) is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Rice’s theorem (intuition) is that it is not the same as “Every property of TMs is decidable”.
- **D.** Rice says DFA minimisation is undecidable.

**Answer:** D
**Explanation:** The false claim is: Rice says DFA minimisation is undecidable.. Rice’s theorem (intuition) actually means: Any nontrivial semantic property of RE languages is undecidable.

### Q47  ·  Intermediate
**Question:** Which statement about **Turing machine** is FALSE?

- **A.** In this module, Turing machine is a core idea students must distinguish from nearby terms.
- **B.** A TM tape is finite and read-only like a DFA input.
- **C.** Turing machine is correctly understood as: a 7-tuple (Q, Σ, Γ, δ, q0, B, F) with a two-way read/write infinite tape.
- **D.** A useful way to remember Turing machine is that it is not the same as “A DFA with a stack”.

**Answer:** B
**Explanation:** The false claim is: A TM tape is finite and read-only like a DFA input.. Turing machine actually means: A 7-tuple (Q, Σ, Γ, δ, q0, B, F) with a two-way read/write infinite tape.

### Q48  ·  Difficult
**Question:** A 2-tape TM is simulated on a 1-tape TM with two tracks. A standard textbook simulation costs about how much extra time relative to T(n) steps?

- **A.** Constant O(1) always
- **B.** Quadratic: O(T(n)^2)
- **C.** Zero overhead
- **D.** Exponential 2^{T(n)} necessarily

**Answer:** B
**Explanation:** Each simulated step may scan O(T(n)) cells; T(n)·T(n).

### Q49  ·  Difficult
**Question:** A TM with |Q|=3, |Γ|=4 (including blank). Ignoring tape contents, how many (state, scanned-symbol) pairs can δ be defined on?

- **A.** 7
- **B.** 3
- **C.** 12
- **D.** 4

**Answer:** C
**Explanation:** 3×4=12 domain pairs for a deterministic TM.

### Q50  ·  Difficult
**Question:** A UTM simulating M that takes 5 steps on w of length 4 performs a simulation whose length is finite. The halting problem is still undecidable because:

- **A.** No algorithm works for all ⟨M,w⟩, even though each single finite run is finite
- **B.** Every simulation is infinite
- **C.** UTMs cannot halt
- **D.** 5 steps exceed |Q|

**Answer:** A
**Explanation:** Undecidability is about a uniform decider, not a single instance.

### Q51  ·  Difficult
**Question:** A multitape TM that uses a work tape as a stack can:

- **A.** Simulate a PDA, hence recognise every CFL
- **B.** Decide HALT
- **C.** Avoid encodings ⟨M,w⟩
- **D.** Only recognise regular languages

**Answer:** A
**Explanation:** TM ⊃ PDA power.

### Q52  ·  Difficult
**Question:** A student ‘solves’ HALT by saying humans can inspect code. The mathematical issue is:

- **A.** Only CFGs halt
- **B.** There is no single algorithm that works for every TM encoding
- **C.** TMs cannot be encoded
- **D.** HALT is actually decidable

**Answer:** B
**Explanation:** Undecidability is about algorithms, not one informal look.

### Q53  ·  Difficult
**Question:** Chomsky hierarchy: type-3 ⊂ type-2 ⊂ type-1 ⊂ type-0. How many of these inclusions are proper?

- **A.** Only type-0⊂type-1 (false direction)
- **B.** All three inclusions are proper
- **C.** Only type-3⊂type-2
- **D.** None

**Answer:** B
**Explanation:** REG ⊂ CFL ⊂ CSL ⊂ RE, all proper.

### Q54  ·  Difficult
**Question:** Emptiness of a DFA is decidable by:

- **A.** Graph reachability from q0 to some state in F
- **B.** Running a UTM forever
- **C.** Rice’s theorem
- **D.** Reducing from HALT

**Answer:** A
**Explanation:** Finite directed graph.

### Q55  ·  Difficult
**Question:** If L is recursive then L-bar is recursive because:

- **A.** You convert to a PDA
- **B.** RE is not closed under complement, so recursive isn’t either
- **C.** You simulate until timeout
- **D.** Swap the decider’s accept and reject (both halt)

**Answer:** D
**Explanation:** Deciders halt on every input.

### Q56  ·  Difficult
**Question:** If a decider for a language exists, the language and its complement are both:

- **A.** Recursive (decidable)
- **B.** Finite only
- **C.** Non-RE
- **D.** CFL but not RE

**Answer:** A
**Explanation:** Run the decider; swap yes/no for the complement.

### Q57  ·  Difficult
**Question:** Number of strings a TM enumerator must eventually print if L is infinite RE:

- **A.** Exactly |Q|
- **B.** At most 2^{|Γ|}
- **C.** Infinitely many (all of L)
- **D.** Zero

**Answer:** C
**Explanation:** An enumerator lists L; infinite L ⇒ infinite output over time.

### Q58  ·  Difficult
**Question:** Rice’s theorem does not apply to which kind of question?

- **A.** ‘Is L(M)=∅?’
- **B.** ‘Is L(M) regular?’
- **C.** Syntactic questions such as ‘does this encoding have more than 10 states?’
- **D.** ‘Does M accept ε?’

**Answer:** C
**Explanation:** Rice is about nontrivial semantic properties of L(M).

### Q59  ·  Difficult
**Question:** What is the most important distinction between **1-tape TM** and **multitape TM**?

- **A.** They differ in Chomsky type.
- **B.** Same language power; multitape can be faster (often quadratic simulation).
- **C.** Multitape decides HALT.
- **D.** 1-tape is more powerful.

**Answer:** B
**Explanation:** Same language power; multitape can be faster (often quadratic simulation).

### Q60  ·  Difficult
**Question:** What is the most important distinction between **LBA / CSL** and **TM / RE**?

- **A.** They are identical models.
- **B.** TMs cannot use more than |w| cells.
- **C.** LBA uses only O(|w|) tape and captures CSL; general TMs use unbounded tape and capture RE.
- **D.** LBAs are DFAs.

**Answer:** C
**Explanation:** LBA uses only O(|w|) tape and captures CSL; general TMs use unbounded tape and capture RE.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **decider** and **recogniser**?

- **A.** A decider always halts; a recogniser may loop on strings not in L.
- **B.** Deciders may loop on yes.
- **C.** Recognisers always halt.
- **D.** They are PDA modes.

**Answer:** A
**Explanation:** A decider always halts; a recogniser may loop on strings not in L.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **reduction A≤B** and **language equivalence of DFAs**?

- **A.** Reduction transfers hardness; DFA equivalence is a decidable algorithm, not a hardness proof.
- **B.** Reductions are only pumping.
- **C.** DFA equivalence is undecidable.
- **D.** They are the same technique.

**Answer:** A
**Explanation:** Reduction transfers hardness; DFA equivalence is a decidable algorithm, not a hardness proof.

### Q63  ·  Difficult
**Question:** Which statement about **Chomsky type-0** is FALSE?

- **A.** Chomsky type-0 is correctly understood as: unrestricted grammars; they generate the RE languages.
- **B.** A useful way to remember Chomsky type-0 is that it is not the same as “Regular grammars”.
- **C.** Type-0 languages are exactly the recursive ones.
- **D.** In this module, Chomsky type-0 is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Type-0 languages are exactly the recursive ones.. Chomsky type-0 actually means: Unrestricted grammars; they generate the RE languages.

### Q64  ·  Difficult
**Question:** Which statement about **Church–Turing thesis** is FALSE?

- **A.** The thesis is a formal proof inside ZFC that TMs equal C++.
- **B.** A useful way to remember Church–Turing thesis is that it is not the same as “A theorem that HALT is decidable”.
- **C.** Church–Turing thesis is correctly understood as: informal claim: every effective procedure is realisable by a TM.
- **D.** In this module, Church–Turing thesis is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: The thesis is a formal proof inside ZFC that TMs equal C++.. Church–Turing thesis actually means: Informal claim: every effective procedure is realisable by a TM.

### Q65  ·  Difficult
**Question:** Which statement about **Encoding ⟨M,w⟩** is FALSE?

- **A.** TMs cannot be encoded as strings.
- **B.** In this module, Encoding ⟨M,w⟩ is a core idea students must distinguish from nearby terms.
- **C.** Encoding ⟨M,w⟩ is correctly understood as: a string that pairs a TM’s description with an input so a UTM can read it.
- **D.** A useful way to remember Encoding ⟨M,w⟩ is that it is not the same as “A parse tree”.

**Answer:** A
**Explanation:** The false claim is: TMs cannot be encoded as strings.. Encoding ⟨M,w⟩ actually means: A string that pairs a TM’s description with an input so a UTM can read it.

### Q66  ·  Difficult
**Question:** Which statement about **Enumerator** is FALSE?

- **A.** Enumerator is correctly understood as: a TM that outputs all strings of an RE language (possibly with repeats, in some order).
- **B.** In this module, Enumerator is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Enumerator is that it is not the same as “A DFA complementor”.
- **D.** Only recursive languages can be enumerated.

**Answer:** D
**Explanation:** The false claim is: Only recursive languages can be enumerated.. Enumerator actually means: A TM that outputs all strings of an RE language (possibly with repeats, in some order).

### Q67  ·  Difficult
**Question:** Which statement about **Instantaneous description (ID)** is FALSE?

- **A.** A useful way to remember Instantaneous description (ID) is that it is not the same as “Only the finite-control state”.
- **B.** IDs do not record the tape.
- **C.** Instantaneous description (ID) is correctly understood as: a string αqβ showing tape left of the head, state, and head-right including the scanned symbol.
- **D.** In this module, Instantaneous description (ID) is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: IDs do not record the tape.. Instantaneous description (ID) actually means: A string αqβ showing tape left of the head, state, and head-right including the scanned symbol.

### Q68  ·  Difficult
**Question:** Which statement about **Multitape TM** is FALSE?

- **A.** Multitape TM is correctly understood as: a TM with several tapes/heads; it recognises the same languages as a 1-tape TM.
- **B.** In this module, Multitape TM is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Multitape TM is that it is not the same as “A strictly more powerful class than 1-tape TMs”.
- **D.** Multitape TMs can decide the halting problem.

**Answer:** D
**Explanation:** The false claim is: Multitape TMs can decide the halting problem.. Multitape TM actually means: A TM with several tapes/heads; it recognises the same languages as a 1-tape TM.

### Q69  ·  Difficult
**Question:** Which statement about **RE language** is FALSE?

- **A.** RE language is correctly understood as: a language recognised by a TM (accepts yes-instances; may loop on no).
- **B.** In this module, RE language is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember RE language is that it is not the same as “A language with a total always-halting decider only”.
- **D.** RE means the TM always rejects by looping.

**Answer:** D
**Explanation:** The false claim is: RE means the TM always rejects by looping.. RE language actually means: A language recognised by a TM (accepts yes-instances; may loop on no).

### Q70  ·  Difficult
**Question:** Which statement about **Reduction** is FALSE?

- **A.** In this module, Reduction is a core idea students must distinguish from nearby terms.
- **B.** Reduction is correctly understood as: a computable map showing ‘if I could solve B I could solve A’; used to transfer undecidability.
- **C.** A useful way to remember Reduction is that it is not the same as “A DFA product”.
- **D.** Reductions are only for regular languages.

**Answer:** D
**Explanation:** The false claim is: Reductions are only for regular languages.. Reduction actually means: A computable map showing ‘if I could solve B I could solve A’; used to transfer undecidability.

### Q71  ·  Difficult
**Question:** Which statement about **Universal TM** is FALSE?

- **A.** A useful way to remember Universal TM is that it is not the same as “A DFA that stores all TMs”.
- **B.** No single TM can simulate arbitrary other TMs.
- **C.** Universal TM is correctly understood as: a TM that takes ⟨M, w⟩ and simulates M on w.
- **D.** In this module, Universal TM is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: No single TM can simulate arbitrary other TMs.. Universal TM actually means: A TM that takes ⟨M, w⟩ and simulates M on w.

### Q72  ·  Difficult
**Question:** Why do NTMs not enlarge the RE class?

- **A.** NTMs equal PDAs
- **B.** A DTM can dovetail/BFS simulate all nondeterministic branches
- **C.** Nondeterminism is unimplementable even slowly
- **D.** NTMs decide HALT

**Answer:** B
**Explanation:** Classic simulation.

### Q73  ·  Difficult
**Question:** You have a candidate algorithm: simulate M for 2^|w| steps and reject if not done. This:

- **A.** Equals CYK
- **B.** Is not a decider for A_TM (M may need more steps, or loop)
- **C.** Works because TMs run in exponential time
- **D.** Solves the halting problem

**Answer:** B
**Explanation:** No computable time bound exists for all TMs.

---

## Quick answer key

Q01–C | Q02–B | Q03–D | Q04–D | Q05–C | Q06–C | Q07–B | Q08–B | Q09–C | Q10–A | Q11–B | Q12–D | Q13–B | Q14–C | Q15–C | Q16–A | Q17–C | Q18–D | Q19–B | Q20–D | Q21–C | Q22–A | Q23–C | Q24–B | Q25–B | Q26–D | Q27–A | Q28–D | Q29–A | Q30–B | Q31–C | Q32–C | Q33–B | Q34–A | Q35–A | Q36–A | Q37–B | Q38–A | Q39–C | Q40–A | Q41–B | Q42–D | Q43–A | Q44–A | Q45–C | Q46–D | Q47–B | Q48–B | Q49–C | Q50–A | Q51–A | Q52–B | Q53–B | Q54–A | Q55–D | Q56–A | Q57–C | Q58–C | Q59–B | Q60–C | Q61–A | Q62–A | Q63–C | Q64–A | Q65–A | Q66–D | Q67–B | Q68–D | Q69–D | Q70–D | Q71–B | Q72–B | Q73–B
