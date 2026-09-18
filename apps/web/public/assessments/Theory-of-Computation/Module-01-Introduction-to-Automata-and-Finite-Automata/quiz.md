# Quiz — Theory of Computation — Module 1: Introduction to Automata and Finite Automata

**Subject:** Theory of Computation  
**Module:** Module 1 — Introduction to Automata and Finite Automata  
**Questions:** 73  
**Mix:** 12 Easy · 35 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A DFA is formally a:

- **A.** 4-tuple with a stack
- **B.** CFG (V,T,P,S)
- **C.** 5-tuple (Q, Σ, δ, q0, F) with total δ: Q×Σ→Q
- **D.** 7-tuple with a blank symbol

**Answer:** C
**Explanation:** Standard Sipser/Hopcroft definition.

### Q02  ·  Easy
**Question:** The empty language ∅ is regular because:

- **A.** ∅ is not a language
- **B.** A DFA with F=∅ recognises it
- **C.** ∅ requires an infinite alphabet
- **D.** Only TMs recognise ∅

**Answer:** B
**Explanation:** No accepting states ⇒ nothing is accepted.

### Q03  ·  Easy
**Question:** Which option best describes **Alphabet**?

- **A.** A finite nonempty set of symbols used to build strings.
- **B.** A stack alphabet that must contain ε.
- **C.** An infinite set of Unicode sentences.
- **D.** A Turing-machine tape that is already infinite.

**Answer:** A
**Explanation:** Alphabet: A finite nonempty set of symbols used to build strings.

### Q04  ·  Easy
**Question:** Which option best describes **Empty string ε**?

- **A.** The same object as the empty language ∅.
- **B.** The unique string of length 0; it is not a symbol of Σ unless listed.
- **C.** A mandatory alphabet symbol in every DFA.
- **D.** A rejecting sink state.

**Answer:** B
**Explanation:** Empty string ε: The unique string of length 0; it is not a symbol of Σ unless listed.

### Q05  ·  Easy
**Question:** Which option best describes **Language of a DFA**?

- **A.** Only the strings that visit every state.
- **B.** The set of transition labels only.
- **C.** L(M) = { w ∈ Σ* | δ̂(q0, w) ∈ F }.
- **D.** The set of all state names.

**Answer:** C
**Explanation:** Language of a DFA: L(M) = { w ∈ Σ* | δ̂(q0, w) ∈ F }.

### Q06  ·  Easy
**Question:** Which option best describes **NFA**?

- **A.** A DFA with a stack.
- **B.** An automaton that must read two symbols per step.
- **C.** A finite automaton whose δ maps to a subset of Q, allowing 0, 1 or many moves.
- **D.** A machine that always has ε-moves.

**Answer:** C
**Explanation:** NFA: A finite automaton whose δ maps to a subset of Q, allowing 0, 1 or many moves.

### Q07  ·  Easy
**Question:** Which option best describes **Subset construction**?

- **A.** Minimising a TM tape alphabet.
- **B.** Converting a CFG to Greibach form.
- **C.** The powerset method that builds an equivalent DFA whose states are subsets of the NFA’s states.
- **D.** Arden’s lemma applied to a PDA.

**Answer:** C
**Explanation:** Subset construction: The powerset method that builds an equivalent DFA whose states are subsets of the NFA’s states.

### Q08  ·  Easy
**Question:** Which option best describes **Transition function δ**?

- **A.** A pumping decomposition.
- **B.** In a DFA, δ maps each state and input symbol to exactly one next state.
- **C.** A function from stacks to parse trees.
- **D.** A CFG production set.

**Answer:** B
**Explanation:** Transition function δ: In a DFA, δ maps each state and input symbol to exactly one next state.

### Q09  ·  Easy
**Question:** Which sequence correctly describes **DFA acceptance test**?

- **A.** Push every symbol then pop
- **B.** Scan the tape both ways like a TM
- **C.** Accept as soon as any state in F is visited mid-string only
- **D.** Start at q0 → apply δ on each symbol → accept iff the final state is in F

**Answer:** D
**Explanation:** Correct sequence for DFA acceptance test: Start at q0 → apply δ on each symbol → accept iff the final state is in F

### Q10  ·  Easy
**Question:** Which sequence correctly describes **subset construction**?

- **A.** Minimise a TM → add a stack → accept by empty stack
- **B.** ε-closure of start → for each subset and symbol, move then ε-close → mark F-subsets that meet NFA F → drop unreachable
- **C.** Write a CFG → convert to CNF → pump
- **D.** Apply Rice’s theorem to each state

**Answer:** B
**Explanation:** Correct sequence for subset construction: ε-closure of start → for each subset and symbol, move then ε-close → mark F-subsets that meet NFA F → drop unreachable

### Q11  ·  Easy
**Question:** Σ* denotes:

- **A.** The empty language
- **B.** Only infinite strings
- **C.** Only nonempty strings
- **D.** All finite strings over Σ, including ε

**Answer:** D
**Explanation:** Kleene star of the alphabet as a language of symbols.

### Q12  ·  Easy
**Question:** ε-closure of a state always contains:

- **A.** Every rejecting sink
- **B.** The entire Q
- **C.** No states
- **D.** The state itself

**Answer:** D
**Explanation:** Zero ε-moves stay put.

### Q13  ·  Intermediate
**Question:** A lexical scanner must accept identifiers [A-Za-z][A-Za-z0-9]* with no extra memory. The right model is a:

- **A.** PDA (needs a stack for identifiers)
- **B.** DFA / NFA (regular language)
- **C.** Unrestricted grammar only
- **D.** TM with two tapes

**Answer:** B
**Explanation:** Regular tokens are recognised by finite automata.

### Q14  ·  Intermediate
**Question:** An NFA accepts if some path ends in F. Two paths exist, one in F and one not. The string is:

- **A.** Sent to a TM
- **B.** Rejected because one path failed
- **C.** Declared undefined
- **D.** Accepted

**Answer:** D
**Explanation:** Existential acceptance: one successful path suffices.

### Q15  ·  Intermediate
**Question:** An NFA has a missing transition on digit ‘9’ from q. On input …9 that path:

- **A.** Pushes 9 on a stack
- **B.** Writes a blank on a tape
- **C.** Dies; that branch does not accept
- **D.** Goes to q0 automatically

**Answer:** C
**Explanation:** NFA paths with no move are discarded.

### Q16  ·  Intermediate
**Question:** An NFA may have δ(q,a)=∅. This means:

- **A.** It writes a on a stack
- **B.** The machine is invalid
- **C.** It accepts a immediately
- **D.** That branch dies on a

**Answer:** D
**Explanation:** Empty successor set: no continuation.

### Q17  ·  Intermediate
**Question:** If q0 is not accepting, a DFA:

- **A.** Has an empty language always
- **B.** Is not a legal DFA
- **C.** Rejects ε
- **D.** Accepts every string

**Answer:** C
**Explanation:** ε is accepted iff the start state is final.

### Q18  ·  Intermediate
**Question:** Language {ε} is recognised by a DFA that:

- **A.** Has q0 ∈ F and no need to read symbols
- **B.** Cannot exist because ε is not a string
- **C.** Must have an empty state set Q
- **D.** Needs a PDA stack of height 1

**Answer:** A
**Explanation:** Accepting start state recognises ε.

### Q19  ·  Intermediate
**Question:** NFAs and DFAs are equivalent because:

- **A.** DFAs can guess ε-moves
- **B.** Subset construction yields a DFA with ≤ 2^n states
- **C.** NFAs recognise only finite languages
- **D.** Every NFA already is a DFA

**Answer:** B
**Explanation:** Powerset construction is the proof.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **DFA** and **NFA**?

- **A.** DFAs may omit transitions; NFAs may not.
- **B.** DFA δ is a total single-valued function; NFA δ returns a set of states.
- **C.** NFAs recognise strictly more languages than DFAs.
- **D.** They differ only in alphabet size.

**Answer:** B
**Explanation:** DFA δ is a total single-valued function; NFA δ returns a set of states.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **extended δ̂** and **ordinary δ**?

- **A.** δ consumes one symbol; δ̂ consumes a whole string (including ε).
- **B.** They are the same arity.
- **C.** δ already takes strings of any length.
- **D.** δ̂ is only defined for NFAs.

**Answer:** A
**Explanation:** δ consumes one symbol; δ̂ consumes a whole string (including ε).

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **reachable state** and **unreachable state**?

- **A.** Reachability does not matter for DFAs.
- **B.** Unreachable accepting states still accept ε.
- **C.** Only reachable states affect L(M); unreachable ones can be deleted.
- **D.** Unreachable states double the language.

**Answer:** C
**Explanation:** Only reachable states affect L(M); unreachable ones can be deleted.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **ε** and **empty language ∅**?

- **A.** ∅ contains ε.
- **B.** They are identical sets.
- **C.** ε is a string of length 0; ∅ is a language with no strings.
- **D.** {ε} equals ∅.

**Answer:** C
**Explanation:** ε is a string of length 0; ∅ is a language with no strings.

### Q24  ·  Intermediate
**Question:** Which option best describes **Accepting state**?

- **A.** The unique start state.
- **B.** A state in F; a DFA accepts w iff δ̂(q0, w) ∈ F.
- **C.** A dead sink with no outgoing edges.
- **D.** Any state that has a self-loop.

**Answer:** B
**Explanation:** Accepting state: A state in F; a DFA accepts w iff δ̂(q0, w) ∈ F.

### Q25  ·  Intermediate
**Question:** Which option best describes **DFA**?

- **A.** A 5-tuple (Q, Σ, δ, q0, F) with a total δ: Q × Σ → Q.
- **B.** A Turing machine with a blank tape.
- **C.** A machine whose δ may send a pair to several states.
- **D.** A pushdown automaton with an empty stack.

**Answer:** A
**Explanation:** DFA: A 5-tuple (Q, Σ, δ, q0, F) with a total δ: Q × Σ → Q.

### Q26  ·  Intermediate
**Question:** Which option best describes **Dead state**?

- **A.** A final state with a loop on ε.
- **B.** The start state of every NFA.
- **C.** A non-accepting sink that stays there on every symbol, used to make δ total.
- **D.** An ε-move target.

**Answer:** C
**Explanation:** Dead state: A non-accepting sink that stays there on every symbol, used to make δ total.

### Q27  ·  Intermediate
**Question:** Which option best describes **Extended transition δ̂**?

- **A.** δ̂(q, ε)=q and δ̂(q, wa)=δ(δ̂(q, w), a), so the DFA consumes a whole string.
- **B.** The product construction of two DFAs.
- **C.** ε-closure of an NFA only.
- **D.** A function that ignores the input and always returns q0.

**Answer:** A
**Explanation:** Extended transition δ̂: δ̂(q, ε)=q and δ̂(q, wa)=δ(δ̂(q, w), a), so the DFA consumes a whole string.

### Q28  ·  Intermediate
**Question:** Which option best describes **Finite automaton**?

- **A.** An abstract machine with finitely many states and no auxiliary unbounded memory.
- **B.** A TM with two infinite tapes.
- **C.** A PDA that must use an unbounded stack.
- **D.** A random-access RAM with infinite heap.

**Answer:** A
**Explanation:** Finite automaton: An abstract machine with finitely many states and no auxiliary unbounded memory.

### Q29  ·  Intermediate
**Question:** Which option best describes **Kleene star**?

- **A.** L* never contains ε.
- **B.** L* is all finite concatenations of strings from L, including ε.
- **C.** L* is the complement of L.
- **D.** L* is only L concatenated with itself once.

**Answer:** B
**Explanation:** Kleene star: L* is all finite concatenations of strings from L, including ε.

### Q30  ·  Intermediate
**Question:** Which option best describes **Language**?

- **A.** Any subset of Σ*, including ∅ and Σ* itself.
- **B.** A single DFA state.
- **C.** Only {ε}.
- **D.** Only the set of regular expressions.

**Answer:** A
**Explanation:** Language: Any subset of Σ*, including ∅ and Σ* itself.

### Q31  ·  Intermediate
**Question:** Which option best describes **Nondeterministic choice**?

- **A.** Acceptance requires the stack to be empty.
- **B.** An NFA accepts w if some path labelled w ends in an accepting state.
- **C.** The NFA accepts only if every path ends in F.
- **D.** The NFA flips a fair coin and ignores F.

**Answer:** B
**Explanation:** Nondeterministic choice: An NFA accepts w if some path labelled w ends in an accepting state.

### Q32  ·  Intermediate
**Question:** Which option best describes **Product automaton**?

- **A.** A two-stack PDA.
- **B.** A machine that multiplies integers on a tape.
- **C.** A parser for ambiguous grammars.
- **D.** A DFA whose states are pairs (p, q) used to recognise intersection or union of two regular languages.

**Answer:** D
**Explanation:** Product automaton: A DFA whose states are pairs (p, q) used to recognise intersection or union of two regular languages.

### Q33  ·  Intermediate
**Question:** Which option best describes **String**?

- **A.** A transition table.
- **B.** A set of accepting states.
- **C.** A finite sequence of symbols drawn from an alphabet.
- **D.** An infinite stream of tape cells.

**Answer:** C
**Explanation:** String: A finite sequence of symbols drawn from an alphabet.

### Q34  ·  Intermediate
**Question:** Which option best describes **ε-NFA**?

- **A.** An NFA that may also move on ε without consuming input.
- **B.** A TM that cannot print blanks.
- **C.** A PDA that forbids ε-transitions.
- **D.** A DFA that deletes symbols.

**Answer:** A
**Explanation:** ε-NFA: An NFA that may also move on ε without consuming input.

### Q35  ·  Intermediate
**Question:** Which option best describes **ε-closure**?

- **A.** The product of two state sets.
- **B.** The complement of F.
- **C.** The set of all rejecting sinks.
- **D.** The set of states reachable from a state (or set) using only ε-moves, including itself.

**Answer:** D
**Explanation:** ε-closure: The set of states reachable from a state (or set) using only ε-moves, including itself.

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **product automaton (intersection)**?

- **A.** Union the alphabets and discard Q2
- **B.** States Q1×Q2 → δ((p,q),a)=(δ1(p,a),δ2(q,a)) → start (q01,q02) → accept F1×F2
- **C.** Push p then pop q on a PDA
- **D.** Take 2^{Q1∪Q2} always

**Answer:** B
**Explanation:** Correct sequence for product automaton (intersection): States Q1×Q2 → δ((p,q),a)=(δ1(p,a),δ2(q,a)) → start (q01,q02) → accept F1×F2

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **ε-closure computation**?

- **A.** Put q in the set → repeatedly add states reached by ε-edges until none remain
- **B.** Run the pumping lemma
- **C.** Follow only consuming symbols
- **D.** Complement F

**Answer:** A
**Explanation:** Correct sequence for ε-closure computation: Put q in the set → repeatedly add states reached by ε-edges until none remain

### Q38  ·  Intermediate
**Question:** Which statement about **Accepting state** is FALSE?

- **A.** Accepting state is correctly understood as: a state in F; a DFA accepts w iff δ̂(q0, w) ∈ F.
- **B.** In this module, Accepting state is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Accepting state is that it is not the same as “Any state that has a self-loop”.
- **D.** Acceptance depends only on visiting F in the middle of w, not at the end.

**Answer:** D
**Explanation:** The false claim is: Acceptance depends only on visiting F in the middle of w, not at the end.. Accepting state actually means: A state in F; a DFA accepts w iff δ̂(q0, w) ∈ F.

### Q39  ·  Intermediate
**Question:** Which statement about **Alphabet** is FALSE?

- **A.** In this module, Alphabet is a core idea students must distinguish from nearby terms.
- **B.** An alphabet may be infinite as long as strings stay finite.
- **C.** Alphabet is correctly understood as: a finite nonempty set of symbols used to build strings.
- **D.** A useful way to remember Alphabet is that it is not the same as “An infinite set of Unicode sentences”.

**Answer:** B
**Explanation:** The false claim is: An alphabet may be infinite as long as strings stay finite.. Alphabet actually means: A finite nonempty set of symbols used to build strings.

### Q40  ·  Intermediate
**Question:** Which statement about **Dead state** is FALSE?

- **A.** A complete DFA is forbidden from having a dead state.
- **B.** A useful way to remember Dead state is that it is not the same as “The start state of every NFA”.
- **C.** In this module, Dead state is a core idea students must distinguish from nearby terms.
- **D.** Dead state is correctly understood as: a non-accepting sink that stays there on every symbol, used to make δ total.

**Answer:** A
**Explanation:** The false claim is: A complete DFA is forbidden from having a dead state.. Dead state actually means: A non-accepting sink that stays there on every symbol, used to make δ total.

### Q41  ·  Intermediate
**Question:** Which statement about **Kleene star** is FALSE?

- **A.** L* excludes ε whenever L is nonempty.
- **B.** A useful way to remember Kleene star is that it is not the same as “L* never contains ε”.
- **C.** Kleene star is correctly understood as: l* is all finite concatenations of strings from L, including ε.
- **D.** In this module, Kleene star is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: L* excludes ε whenever L is nonempty.. Kleene star actually means: L* is all finite concatenations of strings from L, including ε.

### Q42  ·  Intermediate
**Question:** Which statement about **Language** is FALSE?

- **A.** Language is correctly understood as: any subset of Σ*, including ∅ and Σ* itself.
- **B.** A language cannot contain the empty string.
- **C.** A useful way to remember Language is that it is not the same as “Only the set of regular expressions”.
- **D.** In this module, Language is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A language cannot contain the empty string.. Language actually means: Any subset of Σ*, including ∅ and Σ* itself.

### Q43  ·  Intermediate
**Question:** Which statement about **Nondeterministic choice** is FALSE?

- **A.** In this module, Nondeterministic choice is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Nondeterministic choice is that it is not the same as “The NFA accepts only if every path ends in F”.
- **C.** An NFA rejects whenever two paths exist.
- **D.** Nondeterministic choice is correctly understood as: an NFA accepts w if some path labelled w ends in an accepting state.

**Answer:** C
**Explanation:** The false claim is: An NFA rejects whenever two paths exist.. Nondeterministic choice actually means: An NFA accepts w if some path labelled w ends in an accepting state.

### Q44  ·  Intermediate
**Question:** Which statement about **Subset construction** is FALSE?

- **A.** Subset construction can produce more than 2^|Q| DFA states.
- **B.** Subset construction is correctly understood as: the powerset method that builds an equivalent DFA whose states are subsets of the NFA’s states.
- **C.** In this module, Subset construction is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Subset construction is that it is not the same as “Converting a CFG to Greibach form”.

**Answer:** A
**Explanation:** The false claim is: Subset construction can produce more than 2^|Q| DFA states.. Subset construction actually means: The powerset method that builds an equivalent DFA whose states are subsets of the NFA’s states.

### Q45  ·  Intermediate
**Question:** Which statement about **Transition function δ** is FALSE?

- **A.** Transition function δ is correctly understood as: in a DFA, δ maps each state and input symbol to exactly one next state.
- **B.** A useful way to remember Transition function δ is that it is not the same as “A function from stacks to parse trees”.
- **C.** DFA δ is allowed to be a partial function.
- **D.** In this module, Transition function δ is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: DFA δ is allowed to be a partial function.. Transition function δ actually means: In a DFA, δ maps each state and input symbol to exactly one next state.

### Q46  ·  Intermediate
**Question:** Which statement about **ε-NFA** is FALSE?

- **A.** ε-NFA is correctly understood as: an NFA that may also move on ε without consuming input.
- **B.** In this module, ε-NFA is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember ε-NFA is that it is not the same as “A DFA that deletes symbols”.
- **D.** ε-moves consume one input symbol each.

**Answer:** D
**Explanation:** The false claim is: ε-moves consume one input symbol each.. ε-NFA actually means: An NFA that may also move on ε without consuming input.

### Q47  ·  Intermediate
**Question:** Why must a DFA’s δ be total in the classical definition?

- **A.** TMs require total FA transitions
- **B.** Partial δ is allowed and equivalent to ε-moves
- **C.** Every (state, symbol) needs exactly one successor so the run is unique
- **D.** Otherwise the language would not be recursive

**Answer:** C
**Explanation:** Determinism + totality ⇒ unique path.

### Q48  ·  Difficult
**Question:** A 4-state NFA might need 16 DFA states because:

- **A.** Subset construction squares the state set
- **B.** DFA states must equal NFA states
- **C.** 16 is |Q|+|Σ|
- **D.** All 2^4 subsets can be distinguishable/reachable for some languages

**Answer:** D
**Explanation:** The powerset bound is tight for some NFAs.

### Q49  ·  Difficult
**Question:** A complete DFA has 6 states and |Σ|=2. How many entries are in the δ-table?

- **A.** 64
- **B.** 12
- **C.** 8
- **D.** 6

**Answer:** B
**Explanation:** A total function has |Q| × |Σ| = 12 transitions.

### Q50  ·  Difficult
**Question:** An NFA has 3 states. What is the maximum number of states in an equivalent DFA via subset construction?

- **A.** 3
- **B.** 8
- **C.** 9
- **D.** 6

**Answer:** B
**Explanation:** At most 2^3 = 8 subsets, each a DFA state.

### Q51  ·  Difficult
**Question:** Campus IDs are bits; you need strings with even parity of 1s. Minimum DFA states?

- **A.** 2
- **B.** 8
- **C.** ∞
- **D.** 1

**Answer:** A
**Explanation:** Even/odd parity is a 2-state DFA.

### Q52  ·  Difficult
**Question:** DFA M1 has 5 states and DFA M2 has 4 states. How many states has the standard product automaton?

- **A.** 4
- **B.** 9
- **C.** 20
- **D.** 5

**Answer:** C
**Explanation:** Product states are Q1 × Q2, so 5 × 4 = 20.

### Q53  ·  Difficult
**Question:** How many strings over {a,b} have length at most 2 (including ε)?

- **A.** 7
- **B.** 4
- **C.** 6
- **D.** 8

**Answer:** A
**Explanation:** 1 (ε) + 2 (len 1) + 4 (len 2) = 7.

### Q54  ·  Difficult
**Question:** In an ε-NFA, q0 -ε→ q1 -ε→ q2 and there are no other ε-edges. |ε-closure(q0)| is:

- **A.** 1
- **B.** 0
- **C.** 3
- **D.** 2

**Answer:** C
**Explanation:** ε-closure includes q0 and all ε-reachable states: {q0,q1,q2}.

### Q55  ·  Difficult
**Question:** The NFA for ‘the 3rd symbol from the end is 1’ over {0,1} needs a DFA with how many states (standard construction, all subsets reachable)?

- **A.** 3
- **B.** 4
- **C.** 8
- **D.** 9

**Answer:** C
**Explanation:** Classic lower bound: 2^3 = 8 DFA states.

### Q56  ·  Difficult
**Question:** To simulate an ε-NFA on a DFA, the first DFA start state must be:

- **A.** ε-closure of the NFA start state
- **B.** The set of all rejecting states
- **C.** Only the NFA start, ignoring ε
- **D.** The empty set always

**Answer:** A
**Explanation:** Subset construction starts from ε-closure(q0).

### Q57  ·  Difficult
**Question:** What is the most important distinction between **NFA** and **ε-NFA**?

- **A.** They have different Chomsky types.
- **B.** An ε-NFA may change state without reading a symbol; a plain NFA cannot.
- **C.** ε-NFAs recognise CSLs that NFAs cannot.
- **D.** NFAs already include ε as an input letter of Σ.

**Answer:** B
**Explanation:** An ε-NFA may change state without reading a symbol; a plain NFA cannot.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **accept by final state (FA)** and **reject by missing transition (incomplete NFA)**?

- **A.** A DFA always has a next state; an NFA may have none and that path dies.
- **B.** Missing transitions equal accepting sinks.
- **C.** NFAs cannot reject.
- **D.** DFAs crash on missing δ.

**Answer:** A
**Explanation:** A DFA always has a next state; an NFA may have none and that path dies.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **product for intersection** and **product for union**?

- **A.** Intersection accepts iff both components accept; union iff at least one does.
- **B.** They require a PDA stack.
- **C.** Union uses 2^{mn} states; intersection uses m+n.
- **D.** Final-state rules are the same.

**Answer:** A
**Explanation:** Intersection accepts iff both components accept; union iff at least one does.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **string concatenation** and **language concatenation**?

- **A.** They are the same because languages are strings.
- **B.** Concatenation is not associative.
- **C.** String xy is one word; language AB = {ab | a∈A, b∈B}.
- **D.** AB never contains ε even if A and B do.

**Answer:** C
**Explanation:** String xy is one word; language AB = {ab | a∈A, b∈B}.

### Q61  ·  Difficult
**Question:** Which statement about **DFA** is FALSE?

- **A.** A useful way to remember DFA is that it is not the same as “A machine whose δ may send a pair to several states”.
- **B.** A DFA may leave some (state, symbol) pairs undefined.
- **C.** DFA is correctly understood as: a 5-tuple (Q, Σ, δ, q0, F) with a total δ: Q × Σ → Q.
- **D.** In this module, DFA is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A DFA may leave some (state, symbol) pairs undefined.. DFA actually means: A 5-tuple (Q, Σ, δ, q0, F) with a total δ: Q × Σ → Q.

### Q62  ·  Difficult
**Question:** Which statement about **Empty string ε** is FALSE?

- **A.** Empty string ε is correctly understood as: the unique string of length 0; it is not a symbol of Σ unless listed.
- **B.** In this module, Empty string ε is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Empty string ε is that it is not the same as “A mandatory alphabet symbol in every DFA”.
- **D.** ε and ∅ are the same mathematical object.

**Answer:** D
**Explanation:** The false claim is: ε and ∅ are the same mathematical object.. Empty string ε actually means: The unique string of length 0; it is not a symbol of Σ unless listed.

### Q63  ·  Difficult
**Question:** Which statement about **Extended transition δ̂** is FALSE?

- **A.** Extended transition δ̂ is correctly understood as: δ̂(q, ε)=q and δ̂(q, wa)=δ(δ̂(q, w), a), so the DFA consumes a whole string.
- **B.** In this module, Extended transition δ̂ is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Extended transition δ̂ is that it is not the same as “A function that ignores the input and always returns q0”.
- **D.** δ̂(q, ε) is undefined in every DFA.

**Answer:** D
**Explanation:** The false claim is: δ̂(q, ε) is undefined in every DFA.. Extended transition δ̂ actually means: δ̂(q, ε)=q and δ̂(q, wa)=δ(δ̂(q, w), a), so the DFA consumes a whole string.

### Q64  ·  Difficult
**Question:** Which statement about **Finite automaton** is FALSE?

- **A.** Finite automata have an unbounded work tape besides the input.
- **B.** In this module, Finite automaton is a core idea students must distinguish from nearby terms.
- **C.** Finite automaton is correctly understood as: an abstract machine with finitely many states and no auxiliary unbounded memory.
- **D.** A useful way to remember Finite automaton is that it is not the same as “A TM with two infinite tapes”.

**Answer:** A
**Explanation:** The false claim is: Finite automata have an unbounded work tape besides the input.. Finite automaton actually means: An abstract machine with finitely many states and no auxiliary unbounded memory.

### Q65  ·  Difficult
**Question:** Which statement about **Language of a DFA** is FALSE?

- **A.** Language of a DFA is correctly understood as: l(M) = { w ∈ Σ* | δ̂(q0, w) ∈ F }.
- **B.** A useful way to remember Language of a DFA is that it is not the same as “The set of all state names”.
- **C.** L(M) cannot be empty if M has at least one state.
- **D.** In this module, Language of a DFA is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: L(M) cannot be empty if M has at least one state.. Language of a DFA actually means: L(M) = { w ∈ Σ* | δ̂(q0, w) ∈ F }.

### Q66  ·  Difficult
**Question:** Which statement about **NFA** is FALSE?

- **A.** In this module, NFA is a core idea students must distinguish from nearby terms.
- **B.** NFA is correctly understood as: a finite automaton whose δ maps to a subset of Q, allowing 0, 1 or many moves.
- **C.** A useful way to remember NFA is that it is not the same as “A DFA with a stack”.
- **D.** An NFA must have exactly one successor for every symbol.

**Answer:** D
**Explanation:** The false claim is: An NFA must have exactly one successor for every symbol.. NFA actually means: A finite automaton whose δ maps to a subset of Q, allowing 0, 1 or many moves.

### Q67  ·  Difficult
**Question:** Which statement about **Product automaton** is FALSE?

- **A.** Product automaton is correctly understood as: a DFA whose states are pairs (p, q) used to recognise intersection or union of two regular languages.
- **B.** In this module, Product automaton is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Product automaton is that it is not the same as “A machine that multiplies integers on a tape”.
- **D.** The product of an m-state DFA and an n-state DFA has m+n states.

**Answer:** D
**Explanation:** The false claim is: The product of an m-state DFA and an n-state DFA has m+n states.. Product automaton actually means: A DFA whose states are pairs (p, q) used to recognise intersection or union of two regular languages.

### Q68  ·  Difficult
**Question:** Which statement about **String** is FALSE?

- **A.** A useful way to remember String is that it is not the same as “An infinite stream of tape cells”.
- **B.** A string over Σ can be infinitely long if Σ is finite.
- **C.** String is correctly understood as: a finite sequence of symbols drawn from an alphabet.
- **D.** In this module, String is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A string over Σ can be infinitely long if Σ is finite.. String actually means: A finite sequence of symbols drawn from an alphabet.

### Q69  ·  Difficult
**Question:** Which statement about **ε-closure** is FALSE?

- **A.** ε-closure(q) never contains q.
- **B.** A useful way to remember ε-closure is that it is not the same as “The set of all rejecting sinks”.
- **C.** ε-closure is correctly understood as: the set of states reachable from a state (or set) using only ε-moves, including itself.
- **D.** In this module, ε-closure is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: ε-closure(q) never contains q.. ε-closure actually means: The set of states reachable from a state (or set) using only ε-moves, including itself.

### Q70  ·  Difficult
**Question:** Why can the product of two DFAs recognise L1 ∩ L2?

- **A.** It uses ε-moves to switch machines
- **B.** It tracks both states at once and accepts only in F1×F2
- **C.** It concatenates the two input tapes
- **D.** Intersection of regular languages needs a PDA

**Answer:** B
**Explanation:** Paired state is the memory of both runs.

### Q71  ·  Difficult
**Question:** You convert an NFA with unreachable state r. In the DFA, subsets containing only unreachable NFA states:

- **A.** Become PDA stack symbols
- **B.** Can be omitted if not reachable from ε-closure(q0)
- **C.** Increase the language
- **D.** Must all be accepting

**Answer:** B
**Explanation:** Only DFA states reachable from the start subset matter.

### Q72  ·  Difficult
**Question:** You have DFAs for ‘even number of 0s’ and ‘ends with 1’. To accept strings that satisfy both, build a:

- **A.** Universal TM
- **B.** Product automaton with F = F1 × F2
- **C.** Two-stack PDA
- **D.** CFG intersection gadget

**Answer:** B
**Explanation:** Regular languages are closed under intersection via the product.

### Q73  ·  Difficult
**Question:** Σ = {0,1}. How many strings of length exactly 4 exist?

- **A.** 16
- **B.** 32
- **C.** 4
- **D.** 8

**Answer:** A
**Explanation:** |Σ|^4 = 2^4 = 16.

---

## Quick answer key

Q01–C | Q02–B | Q03–A | Q04–B | Q05–C | Q06–C | Q07–C | Q08–B | Q09–D | Q10–B | Q11–D | Q12–D | Q13–B | Q14–D | Q15–C | Q16–D | Q17–C | Q18–A | Q19–B | Q20–B | Q21–A | Q22–C | Q23–C | Q24–B | Q25–A | Q26–C | Q27–A | Q28–A | Q29–B | Q30–A | Q31–B | Q32–D | Q33–C | Q34–A | Q35–D | Q36–B | Q37–A | Q38–D | Q39–B | Q40–A | Q41–A | Q42–B | Q43–C | Q44–A | Q45–C | Q46–D | Q47–C | Q48–D | Q49–B | Q50–B | Q51–A | Q52–C | Q53–A | Q54–C | Q55–C | Q56–A | Q57–B | Q58–A | Q59–A | Q60–C | Q61–B | Q62–D | Q63–D | Q64–A | Q65–C | Q66–D | Q67–D | Q68–B | Q69–A | Q70–B | Q71–B | Q72–B | Q73–A
